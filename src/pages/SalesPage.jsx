// src/pages/SalesPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { Plus, Calendar, Share2, Pencil, Trash2, ClipboardList, FileText, FileSearch, Printer, CheckCircle2, Truck, BarChart3, Download, Search, Filter, XCircle, Building, User, Phone, Mail, Calculator } from 'lucide-react';
import JobOrderModal from '../components/common/JobOrderModal';
import SelectJobOrderModal from '../components/common/SelectJobOrderModal';
import QuotePrintModal from '../components/common/QuotePrintModal';
import JobOrderPrintModal from '../components/common/JobOrderPrintModal';
import EstimateModal from '../components/common/EstimateModal';

export default function SalesPage() {
  const { sales, customers, jobOrders, payments, addSales, updateSales, deleteSales, addJobOrder, addPayment, addCustomer, selectedTeamGroup } = useData();
  const { user } = useGoogleAuth();
  const loggedInUserName = user?.userName || '김광일';

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

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showJobOrderModal, setShowJobOrderModal] = useState(false);
  const [jobOrderInitialData, setJobOrderInitialData] = useState(null);
  const [showSelectJobModal, setShowSelectJobModal] = useState(false);

  const [printingQuote, setPrintingQuote] = useState(null);
  const [printingJobOrder, setPrintingJobOrder] = useState(null);

  // 💡 견적서 작성/산출 모달 상태
  const [estimatingSale, setEstimatingSale] = useState(null);


  const today = new Date().toISOString().split('T')[0];

  // 탭 상태: 'list' (매출/견적 목록) | 'erp' (ERP 매출조회 및 미수관리 현황)
  const [reportTab, setReportTab] = useState('list');
  const [reportType, setReportType] = useState('all'); // 'all' | 'customer' | 'manager'
  const [timeResolution, setTimeResolution] = useState('month'); // 'day' | 'month' | 'year'
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7)); // e.g. "2026-08"
  const [selectedYear, setSelectedYear] = useState(today.slice(0, 4)); // e.g. "2026"
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('ALL'); // 💡 특정 거래처 지정 검색
  const [listSearchText, setListSearchText] = useState('');
  const [listCustomerFilter, setListCustomerFilter] = useState('ALL');
  const [listStatusFilter, setListStatusFilter] = useState('ALL');
  const [listStartDate, setListStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [listEndDate, setListEndDate] = useState(today);

  function normalizeDateStr(rawDate) {
    if (!rawDate) return '';
    const s = String(rawDate).trim().replace(/\./g, '-').replace(/\//g, '-').replace(/\s+/g, '');
    const parts = s.split('T')[0].split('-');
    if (parts.length >= 3) {
      const y = parts[0];
      const m = String(parts[1]).padStart(2, '0');
      const d = String(parts[2]).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (parts.length === 2) {
      const y = parts[0];
      const m = String(parts[1]).padStart(2, '0');
      return `${y}-${m}`;
    }
    return s;
  }

  // 팀 그룹 필터링 적용
  const filteredSales = sales.filter(s => {
    if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return true;
    if (s.dept && s.dept === selectedTeamGroup) return true;
    const cust = customers.find(c => c.id === s.customer_id);
    if (cust && cust.dept === selectedTeamGroup) return true;
    return false;
  }).filter(item => {
    const cust = customers.find(c => c.id === item.customer_id);
    const customerLabel = cust ? cust.name : (item.customer_name || item.customer_id || '');
    const text = `${item.title || ''} ${customerLabel} ${item.content || ''} ${item.note || ''}`.toLowerCase();

    if (listSearchText.trim() && !text.includes(listSearchText.trim().toLowerCase())) {
      return false;
    }

    if (listCustomerFilter !== 'ALL') {
      const matchesCustomer = customerLabel === listCustomerFilter || item.customer_id === listCustomerFilter;
      if (!matchesCustomer) return false;
    }

    if (listStatusFilter !== 'ALL' && (item.billing_schedule || '진행중') !== listStatusFilter) {
      return false;
    }

    const regDate = normalizeDateStr(item.reg_date || item.receipt_date || item.delivery_date);
    if (regDate && listStartDate && regDate < listStartDate) {
      return false;
    }
    if (regDate && listEndDate && regDate > listEndDate) {
      return false;
    }

    return true;
  });

  // 💡 미청구 건 목록 (청구완료 제외: 진행중, 납품완료 건)
  const unbilledSales = filteredSales.filter(s => s.billing_schedule !== '청구완료');
  const totalUnbilledAmount = unbilledSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);

  // 미청구 건 CSV 다운로드
  const handleExportUnbilledCSV = () => {
    if (unbilledSales.length === 0) return alert('다운로드할 미청구 데이터가 없습니다.');
    const headers = ['등록일', '발주처', '부서', '작업명', '진행상태', '공급가액', '부가세', '총청구금액(VAT포함)', '납품예정일', '상세내용'];
    const rows = unbilledSales.map(s => {
      const cust = customers.find(c => c.id === s.customer_id);
      return [
        s.reg_date || s.receipt_date || '',
        cust ? cust.name : (s.customer_name || s.customer_id || ''),
        cust ? cust.dept : (s.dept || ''),
        s.title || '',
        s.billing_schedule || '진행중',
        s.supply_price || 0,
        s.tax || 0,
        s.total_price || 0,
        s.delivery_date || '',
        s.content || s.note || '',
      ];
    });
    const todayStr = new Date().toISOString().split('T')[0];
    const csv = '\uFEFF' + [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `경성문화사_미청구목록_${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  const defaultForm = {
    reg_date: today,
    receipt_date: today,
    delivery_date: today,
    delivery_time: '',
    customer_id: '',

    customer_name: '',
    dept: '',
    contact_person: '',
    phone: '',
    email: '',
    sales_manager: loggedInUserName,
    title: '',
    content: '',
    note: '',
    billing_schedule: '진행중',
    type: '매출',
    supply_price: '',
    tax: 0,
    total_price: 0,
    calendar_synced: false,
    superthread_synced: false,
  };

  const [formData, setFormData] = useState(defaultForm);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // 실시간 고객 검색 결과 (고객사명, 부서, 담당자명, 연락처, 영업담당자 통합 검색)
  const customerSearchResults = customers.filter(c => {
    if (!customerNameInput.trim()) return false;
    const q = customerNameInput.trim().toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.dept || '').toLowerCase().includes(q) ||
      (c.contact_person || '').toLowerCase().includes(q) ||
      (c.sales_manager || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  });

  // 고객 검색 목록에서 선택 시 일괄 자동 채우기
  const handleSelectCustomer = (cust) => {
    setCustomerNameInput(cust.name || '');
    setFormData(prev => ({
      ...prev,
      customer_id: cust.id,
      customer_name: cust.name || '',
      dept: cust.dept || '',
      contact_person: cust.contact_person || '',
      phone: cust.phone || '',
      email: cust.email || '',
      sales_manager: cust.sales_manager || loggedInUserName,
    }));
    setShowCustomerDropdown(false);
  };

  // 신규 작업전표 저장
  const handleSaveJobOrder = async (newOrder) => {
    await addJobOrder(newOrder);
    alert('작업전표가 정상 등록되었습니다!');
    setShowJobOrderModal(false);
    setJobOrderInitialData(null);
  };

  // 💡 매출 건 정보를 바탕으로 작업전표 작성 모달 열기
  const handleCreateJobOrderFromSale = (item) => {
    const cust = customers.find(c => c.id === item.customer_id);
    const cName = cust ? cust.name : (item.customer_name || item.customer_id || '');
    const cDept = cust ? cust.dept : (item.dept || '');

    setJobOrderInitialData({
      customer_id: item.customer_id || (cust ? cust.id : ''),
      customer_name: cName,
      dept: cDept,
      title: item.title || '',
      estimated_price: item.supply_price || item.total_price || '',
      delivery_date: item.delivery_date || today,
      delivery_time: item.delivery_time || '',
      receipt_date: item.receipt_date || item.reg_date || today,
      request_note: item.content || item.note || '',
      client_contact_person: cust ? (cust.contact_person || '') : (item.contact_person || ''),
      client_phone: cust ? (cust.phone || '') : (item.phone || ''),
      client_email: cust ? (cust.email || '') : (item.email || ''),
      manager_name: item.sales_manager || (cust ? cust.sales_manager : loggedInUserName),
    });
    setShowJobOrderModal(true);
  };


  // 작업전표 불러오기 (자동채우기)
  const handleSelectJobOrder = (order) => {
    const supply = order.estimated_price || 0;
    const tax = Math.round(supply * 0.1);
    
    const cust = customers.find(c => c.id === order.customer_id);
    const cName = cust ? cust.name : (order.customer_name || order.customer_id || '');
    const cDept = cust ? cust.dept : (order.dept || '');

    setCustomerNameInput(cName);
    setFormData(prev => ({
      ...prev,
      customer_id: order.customer_id || (cust ? cust.id : ''),
      customer_name: cName,
      dept: cDept,
      contact_person: order.client_contact_person || (cust ? cust.contact_person : ''),
      phone: order.client_phone || (cust ? cust.phone : ''),
      email: order.client_email || (cust ? cust.email : ''),
      sales_manager: order.manager_name || (cust ? cust.sales_manager : loggedInUserName),
      title: order.title,
      content: `[코드: ${order.code_number || order.id}] ${order.cover_job || ''} / ${order.binding || ''}`,
      note: `담당: ${order.manager_name} (코드: ${order.code_number})`,
      delivery_date: order.delivery_date || today,
      delivery_time: order.delivery_time || '',
      supply_price: supply,
      tax: tax,
      total_price: supply + tax,
    }));
    setShowSelectJobModal(false);
    alert(`[${order.code_number}] ${order.title} 전표 정보가 매출 폼에 자동 입력되었습니다!`);
  };

  const openNewModal = () => {
    setEditingId(null);
    setCustomerNameInput('');
    setShowCustomerDropdown(false);
    setFormData({
      ...defaultForm,
      sales_manager: loggedInUserName,
    });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    const cust = customers.find(c => c.id === item.customer_id);
    const cName = cust ? cust.name : (item.customer_name || item.customer_id || '');
    const cDept = cust ? cust.dept : (item.dept || '');
    setCustomerNameInput(cName);
    setShowCustomerDropdown(false);

    setFormData({
      reg_date: item.reg_date || today,
      receipt_date: item.receipt_date || today,
      delivery_date: item.delivery_date || today,
      delivery_time: item.delivery_time || '',

      customer_id: item.customer_id || '',
      customer_name: cName,
      dept: cDept,
      contact_person: cust ? (cust.contact_person || '') : '',
      phone: cust ? (cust.phone || '') : '',
      email: cust ? (cust.email || '') : '',
      sales_manager: cust ? (cust.sales_manager || loggedInUserName) : loggedInUserName,
      title: item.title || '',
      content: item.content || '',
      note: item.note || '',
      billing_schedule: item.billing_schedule || '진행중',
      type: item.type || '매출',
      supply_price: item.supply_price || '',
      tax: item.tax || 0,
      total_price: item.total_price || 0,
      calendar_synced: !!item.calendar_synced,
      superthread_synced: !!item.superthread_synced,
    });
    setShowModal(true);
  };

  // 납품 완료 처리
  const handleMarkDelivered = async (item) => {
    try {
      await updateSales(item.id, {
        ...item,
        billing_schedule: '납품완료',
      });
      alert(`[${item.title}] 항목이 [납품완료] 상태로 변경되었습니다.`);
    } catch (err) {
      alert('상태 변경 에러: ' + err.message);
    }
  };

  // 수금 완료 연동
  const handleCollectPayment = async (item) => {
    const cust = customers.find(c => c.id === item.customer_id);
    const custName = cust ? `${cust.name}` : (item.customer_name || item.customer_id);
    const amountStr = (item.total_price || 0).toLocaleString();

    if (!window.confirm(`[${custName}] 의 매출 건 (${amountStr}원)에 대해 수금 처리를 진행하시겠습니까?\n\n진행 내용:\n1) [03_수금관리] DB에 입금 데이터 자동 기록\n2) 해당 매출 건 상태를 [청구완료]로 최종 전환`)) return;

    try {
      await addPayment({
        payment_date: today,
        customer_id: item.customer_id,
        amount: item.total_price || 0,
        method: '계좌이체',
      });

      await updateSales(item.id, {
        ...item,
        billing_schedule: '청구완료',
      });

      alert(`[${custName}] 수금 처리 (${amountStr}원) 및 [청구완료] 최종 전환이 완료되었습니다!`);
    } catch (err) {
      alert('수금 처리 에러: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 이 매출/견적 항목을 시트에서 삭제하시겠습니까?')) return;
    try {
      await deleteSales(id);
      alert('성공적으로 삭제되었습니다.');
    } catch (err) {
      alert('삭제 에러: ' + err.message);
    }
  };

  // 💡 공급가액 입력 시 -> 부가세(10%) 및 총 청구금액 자동 계산
  const handlePriceChange = (val) => {
    if (val === '') {
      setFormData(prev => ({
        ...prev,
        supply_price: '',
        tax: 0,
        total_price: '',
      }));
      return;
    }
    const supply = Number(val) || 0;
    const tax = Math.round(supply * 0.1);
    setFormData(prev => ({
      ...prev,
      supply_price: supply,
      tax: tax,
      total_price: supply + tax,
    }));
  };

  // 💡 총 청구금액(VAT 포함) 입력 시 -> 공급가액 및 부가세(10%) 자동 역산
  const handleTotalPriceChange = (val) => {
    if (val === '') {
      setFormData(prev => ({
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
    setFormData(prev => ({
      ...prev,
      total_price: total,
      supply_price: supply,
      tax: tax,
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const custName = (customerNameInput || formData.customer_name || '').trim();
    if (!custName) return alert('고객사명을 입력하거나 선택해 주세요.');
    if (!formData.title) return alert('작업명을 입력해 주세요.');

    try {
      setSubmitting(true);

      let targetCustomerId = '';

      // 1. 기존 고객 목록에서 동일한 고객사명 + 부서 + 담당자 성명이 모두 일치하는지 확인
      const inputName = custName.toLowerCase();
      const inputDept = (formData.dept || '').trim().toLowerCase();
      const inputContact = (formData.contact_person || '').trim().toLowerCase();

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
          dept: formData.dept || '',
          contact_person: formData.contact_person || '',
          phone: formData.phone || '',
          email: formData.email || '',
          sales_manager: formData.sales_manager || loggedInUserName,
        };
        const savedCust = await addCustomer(newCustData);
        targetCustomerId = savedCust?.id || `CUST-${Date.now()}`;
      } else {
        targetCustomerId = matchedCust.id;
      }



      const salePayload = {
        ...formData,
        customer_id: targetCustomerId,
        customer_name: custName,
      };

      if (editingId) {
        await updateSales(editingId, salePayload);
        alert('매출/견적 항목이 수정 완료되었습니다!');
      } else {
        await addSales(salePayload);
        alert(!matchedCust ? '신규 고객 정보가 함께 저장되고, 매출이 등록되었습니다!' : '신규 매출이 등록 완료되었습니다!');
      }
      setShowModal(false);
    } catch (err) {
      alert('저장 에러: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };


  // --- 📊 ERP 매출 조회 및 미수 보고서 생성 로직 ---
  const getFilteredByTime = () => {
    return filteredSales.filter(item => {
      // 1. 특정 거래처 지정 필터링
      if (selectedCustomerFilter !== 'ALL') {
        const cust = customers.find(c => c.id === item.customer_id);
        const cName = cust ? cust.name : (item.customer_name || item.customer_id);
        if (item.customer_id !== selectedCustomerFilter && cName !== selectedCustomerFilter) {
          return false;
        }
      }

      // 2. 일/월/년 날짜 기간 필터링
      const rawDate = item.reg_date || item.receipt_date || item.delivery_date;
      if (!rawDate) return true; // 날짜 미지정 건 포함

      const normDate = normalizeDateStr(rawDate);

      if (timeResolution === 'day') {
        if (startDate && endDate) {
          return normDate >= startDate && normDate <= endDate;
        }
        return true;
      }
      if (timeResolution === 'month') {
        return normDate.startsWith(selectedMonth);
      }
      if (timeResolution === 'year') {
        return normDate.startsWith(selectedYear);
      }
      return true;
    });
  };

  const currentReportSales = getFilteredByTime();

  const getReportSummaryAndData = () => {
    const summary = {
      totalCount: currentReportSales.length,
      totalSales: 0,
      totalCollected: 0,
      totalOutstanding: 0
    };

    currentReportSales.forEach(s => {
      const price = Number(s.total_price) || 0;
      summary.totalSales += price;
      if (s.billing_schedule === '청구완료') {
        summary.totalCollected += price;
      } else {
        summary.totalOutstanding += price;
      }
    });

    if (reportType === 'customer') {
      const map = {};
      currentReportSales.forEach(s => {
        const cust = customers.find(c => c.id === s.customer_id);
        const name = cust ? cust.name : (s.customer_name || s.customer_id || '미지정 거래처');
        if (!map[name]) {
          map[name] = { name, count: 0, sales: 0, collected: 0, outstanding: 0 };
        }
        const price = Number(s.total_price) || 0;
        map[name].count += 1;
        map[name].sales += price;
        if (s.billing_schedule === '청구완료') {
          map[name].collected += price;
        } else {
          map[name].outstanding += price;
        }
      });
      return { summary, list: Object.values(map) };
    }

    if (reportType === 'manager') {
      const map = {};
      currentReportSales.forEach(s => {
        const cust = customers.find(c => c.id === s.customer_id);
        const manager = cust ? (cust.sales_manager || '담당자 미지정') : '담당자 미지정';
        if (!map[manager]) {
          map[manager] = { name: manager, count: 0, sales: 0, collected: 0, outstanding: 0 };
        }
        const price = Number(s.total_price) || 0;
        map[manager].count += 1;
        map[manager].sales += price;
        if (s.billing_schedule === '청구완료') {
          map[manager].collected += price;
        } else {
          map[manager].outstanding += price;
        }
      });
      return { summary, list: Object.values(map) };
    }

    return { summary, list: currentReportSales };
  };

  const { summary: reportSummary, list: reportList } = getReportSummaryAndData();

  // ERP 엑셀 추출 (CSV)
  const handleExportCSV = () => {
    let title = `경성문화사_ERP_매출보고서_${timeResolution}별_${reportType}별`;
    if (selectedCustomerFilter !== 'ALL') {
      title += `_${selectedCustomerFilter}`;
    }

    let headers = [];
    let rows = [];

    if (reportType === 'all') {
      headers = ['등록일', '거래처명', '작업명', '진행상태', '공급가액', '합계금액(VAT포함)', '수금액', '미수금'];
      reportList.forEach(s => {
        const cust = customers.find(c => c.id === s.customer_id);
        const cName = cust ? cust.name : (s.customer_name || s.customer_id);
        const isCollected = s.billing_schedule === '청구완료';
        rows.push([
          s.reg_date || s.receipt_date || '',
          cName,
          s.title || '',
          s.billing_schedule || '',
          s.supply_price || 0,
          s.total_price || 0,
          isCollected ? s.total_price : 0,
          isCollected ? 0 : s.total_price
        ]);
      });
    } else {
      const typeLabel = reportType === 'customer' ? '거래처명' : '영업담당자';
      headers = [typeLabel, '매출 건수', '총 매출액', '총 수금액', '총 미수금 잔액'];
      reportList.forEach(item => {
        rows.push([
          item.name,
          item.count,
          item.sales,
          item.collected,
          item.outstanding
        ]);
      });
    }

    let csvContent = "\uFEFF" + headers.join(',') + '\n';
    rows.forEach(r => {
      csvContent += r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buildLedgerEntries = () => {
    const filteredLedgerSales = sales.filter((sale) => {
      const cust = customers.find((c) => c.id === sale.customer_id);
      const customerName = cust ? cust.name : (sale.customer_name || sale.customer_id || '');

      if (selectedCustomerFilter !== 'ALL' && customerName !== selectedCustomerFilter && sale.customer_id !== selectedCustomerFilter) {
        return false;
      }

      const dateValue = normalizeDateStr(sale.reg_date || sale.receipt_date || sale.delivery_date);
      if (!dateValue) return true;
      if (startDate && dateValue < startDate) return false;
      if (endDate && dateValue > endDate) return false;
      return true;
    });

    const filteredLedgerPayments = payments.filter((payment) => {
      const cust = customers.find((c) => c.id === payment.customer_id);
      const customerName = cust ? cust.name : (payment.customer_name || payment.customer_id || '');

      if (selectedCustomerFilter !== 'ALL' && customerName !== selectedCustomerFilter && payment.customer_id !== selectedCustomerFilter) {
        return false;
      }

      const dateValue = normalizeDateStr(payment.payment_date);
      if (!dateValue) return true;
      if (startDate && dateValue < startDate) return false;
      if (endDate && dateValue > endDate) return false;
      return true;
    });

    const entries = [];

    filteredLedgerSales.forEach((sale) => {
      const cust = customers.find((c) => c.id === sale.customer_id);
      const customerName = cust ? cust.name : (sale.customer_name || sale.customer_id || '미지정 거래처');
      entries.push({
        date: normalizeDateStr(sale.reg_date || sale.receipt_date || sale.delivery_date),
        customer: customerName,
        kind: '매출',
        description: sale.title || '매출 건',
        sales: Number(sale.total_price || 0),
        payment: 0,
        balance: 0,
      });
    });

    filteredLedgerPayments.forEach((payment) => {
      const cust = customers.find((c) => c.id === payment.customer_id);
      const customerName = cust ? cust.name : (payment.customer_name || payment.customer_id || '미지정 거래처');
      entries.push({
        date: normalizeDateStr(payment.payment_date),
        customer: customerName,
        kind: '수금',
        description: '수금 처리',
        sales: 0,
        payment: Number(payment.amount || 0),
        balance: 0,
      });
    });

    entries.sort((a, b) => (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31'));

    let runningBalance = 0;
    const finalEntries = entries.map((entry) => {
      runningBalance += entry.kind === '매출' ? entry.sales : -entry.payment;
      return {
        ...entry,
        balance: runningBalance,
      };
    });

    return finalEntries;
  };

  const handleExportLedgerCSV = () => {
    const ledgerEntries = buildLedgerEntries();
    const selectedLabel = selectedCustomerFilter === 'ALL' ? '전체거래처' : selectedCustomerFilter;
    const fileName = `경성문화사_거래원장_${selectedLabel}_${startDate || 'ALL'}_~_${endDate || 'ALL'}.csv`;

    const headers = ['거래일', '거래처', '구분', '적요', '매출금액', '수금금액', '잔액'];
    const rows = ledgerEntries.map((entry) => [
      entry.date,
      entry.customer,
      entry.kind,
      entry.description,
      entry.sales,
      entry.payment,
      entry.balance,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const ledgerEntries = buildLedgerEntries();

  const renderStatusBadge = (status) => {
    if (status === '청구완료') {
      return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-1 rounded-lg font-extrabold flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span>청구완료 (수금완료)</span></span>;
    }
    if (status === '납품완료') {
      return <span className="bg-sky-100 text-sky-800 border border-sky-300 text-xs px-2.5 py-1 rounded-lg font-extrabold flex items-center space-x-1"><Truck className="w-3.5 h-3.5 text-sky-600" /><span>납품완료</span></span>;
    }
    return <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded-lg font-extrabold flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span><span>진행중</span></span>;
  };

  return (
    <div className="space-y-5">
      
      {/* 타이틀 및 버튼 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">매출 관리</h2>
          <p className="text-xs text-slate-500 mt-0.5">수주 · 미수 · 기간별 조회</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPrintingJobOrder(jobOrders[0])}
            className="flex items-center justify-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>전표 출력</span>
          </button>

          <button
            onClick={() => {
              setJobOrderInitialData(null);
              setShowJobOrderModal(true);
            }}
            className="flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <ClipboardList className="w-4 h-4 text-sky-400" />
            <span>전표 등록</span>
          </button>

          <button
            onClick={openNewModal}
            className="flex items-center justify-center space-x-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>신규 등록</span>
          </button>
        </div>
      </div>

      {/* 상세 조회 필터: 거래처 / 기간 / 상태 / 검색어 */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
          <Filter className="w-4 h-4 text-sky-600" />
          <span>조회 조건</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={listSearchText}
              onChange={(e) => setListSearchText(e.target.value)}
              placeholder="거래처명, 작업명, 내용, 비고 검색"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:border-sky-500 focus:outline-none"
            />
          </div>

          <select
            value={listCustomerFilter}
            onChange={(e) => setListCustomerFilter(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">전체 거래처</option>
            {customers.map((cust) => (
              <option key={cust.id} value={cust.name}>{cust.name}</option>
            ))}
          </select>

          <select
            value={listStatusFilter}
            onChange={(e) => setListStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:border-sky-500 focus:outline-none"
          >
            <option value="ALL">전체 상태</option>
            <option value="진행중">진행중</option>
            <option value="납품완료">납품완료</option>
            <option value="청구완료">청구완료</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setListSearchText('');
              setListCustomerFilter('ALL');
              setListStatusFilter('ALL');
              setListStartDate(() => {
                const d = new Date();
                d.setMonth(d.getMonth() - 1);
                return d.toISOString().split('T')[0];
              });
              setListEndDate(today);
            }}
            className="flex items-center justify-center gap-1 px-3 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            초기화
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>시작일</span>
            <input
              type="date"
              value={listStartDate}
              onChange={(e) => setListStartDate(e.target.value)}
              className="flex-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Calendar className="w-4 h-4 text-sky-600" />
            <span>종료일</span>
            <input
              type="date"
              value={listEndDate}
              onChange={(e) => setListEndDate(e.target.value)}
              className="flex-1 px-2.5 py-2 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </label>
        </div>
      </div>

      {/* 탭 네비게이션: [전체 목록] vs [🚨 미청구 관리] vs [📊 ERP 분석 및 원장] */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setReportTab('list')}
          className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 ${
            reportTab === 'list' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          전체 목록 ({filteredSales.length})
        </button>

        <button
          onClick={() => setReportTab('unbilled')}
          className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center space-x-1.5 ${
            reportTab === 'unbilled' ? 'border-rose-600 text-rose-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>미청구 관리</span>
          {unbilledSales.length > 0 && (
            <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-black animate-pulse">
              {unbilledSales.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setReportTab('erp')}
          className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 ${
            reportTab === 'erp' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          분석 및 원장
        </button>
      </div>


      {/* ----------------- 탭 1: 매출 기록 목록 ----------------- */}
      {reportTab === 'list' && (
        <div className="space-y-3">
          {filteredSales.length === 0 ? (
            <div className="bg-white text-center py-12 border border-slate-200 rounded-2xl text-slate-400 text-xs font-bold">
              현재 필터링된 소속 그룹의 매출/견적 내역이 없습니다.
            </div>
          ) : (
            filteredSales.map((item, idx) => {
              const cust = customers.find(c => c.id === item.customer_id);
              return (
                <div key={item.id || idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          item.type === '매출' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.type}
                        </span>
                        <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
                        {renderStatusBadge(item.billing_schedule)}
                      </div>
                      <p className="text-xs font-bold text-sky-700 mt-1">
                        발주처: {cust ? `${cust.name}${cust.dept ? ` (${cust.dept})` : ''}` : (item.customer_name || '미지정')}
                      </p>
                      {/* 💡 발주처 밑 담당자 이름, 연락처, 이메일, 영업담당자 표시 */}
                      {(() => {
                        const contactPerson = cust?.contact_person || item.contact_person || '';
                        const phone = cust?.phone || item.phone || '';
                        const email = cust?.email || item.email || '';
                        const manager = item.sales_manager || cust?.sales_manager || '';
                        if (!contactPerson && !phone && !email && !manager) return null;
                        return (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600 mt-0.5 font-medium">
                            {contactPerson && <span>👤 담당: <strong className="text-slate-800">{contactPerson}</strong></span>}
                            {phone && <span>📞 {phone}</span>}
                            {email && <span>✉️ {email}</span>}
                            {manager && <span className="text-rose-600 font-semibold">💼 영업: {manager}</span>}
                          </div>
                        );
                      })()}
                    </div>


                    <div className="flex flex-col items-end space-y-1">
                      <span className="text-lg font-black text-slate-900">₩ {(item.total_price || 0).toLocaleString()} 원</span>
                      <p className="text-[11px] text-slate-400 font-bold">공급가: ₩ {(item.supply_price || 0).toLocaleString()}원</p>
                      
                      <div className="flex items-center space-x-1 pt-1">
                        {item.billing_schedule !== '청구완료' && (
                          <>
                            {item.billing_schedule !== '납품완료' && (
                              <button
                                onClick={() => handleMarkDelivered(item)}
                                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition mr-1"
                                title="납품완료 처리"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>납품 처리</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleCollectPayment(item)}
                              className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition mr-1"
                              title="수금 등록 및 청구완료 전환"
                            >
                              <span>₩ 수금 처리</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setEstimatingSale({ sale: item, customer: cust })}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-lg text-xs font-bold transition mr-1"
                          title="견적서 작성 및 세부 단가 산출 (매출액 자동 반영)"
                        >
                          <Calculator className="w-3.5 h-3.5 text-sky-600" />
                          <span>견적서 작성</span>
                        </button>

                        <button
                          onClick={() => setPrintingQuote({ quote: item, customer: cust })}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition mr-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          <span>인쇄</span>
                        </button>


                        <button
                          onClick={() => handleCreateJobOrderFromSale(item)}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition mr-1 shadow-sm"
                          title="이 매출 건의 정보로 신규 작업전표 작성"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                          <span>작업전표 작성</span>
                        </button>

                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {item.content && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {item.content}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-medium">
                    <span>매출 등록일: {item.reg_date || item.receipt_date || '-'}</span>
                    <span>{item.note}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ----------------- 탭 2: 🚨 미청구 건 집중 관리 ----------------- */}
      {reportTab === 'unbilled' && (
        <div className="space-y-4">
          {/* 미청구 현황 통계 요약 카드 */}
          <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-sky-500/10 p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                  미청구 관리 모드
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  (납품완료 및 진행중인 청구/수금 대상 건)
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                총 <span className="text-rose-600">{unbilledSales.length}</span>건 / ₩ {totalUnbilledAmount.toLocaleString()} 원
              </h3>
              <p className="text-xs text-slate-600">
                납품완료(청구대기): <strong className="text-amber-700">{unbilledSales.filter(s => s.billing_schedule === '납품완료').length}건</strong> | 
                제작/진행중: <strong className="text-sky-700">{unbilledSales.filter(s => s.billing_schedule === '진행중').length}건</strong>
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportUnbilledCSV}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                <span>미청구 목록 CSV 다운로드</span>
              </button>
            </div>
          </div>

          {/* 미청구 건 카드 목록 */}
          <div className="space-y-3">
            {unbilledSales.length === 0 ? (
              <div className="bg-white text-center py-16 border border-slate-200 rounded-2xl text-slate-400 text-xs font-bold space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700">현재 미청구 상태인 매출 건이 없습니다!</p>
                <p className="text-slate-400 text-xs">모든 매출 건이 청구 및 수금 완료 처리되었습니다.</p>
              </div>
            ) : (
              unbilledSales.map((item, idx) => {
                const cust = customers.find(c => c.id === item.customer_id);
                const isDelivered = item.billing_schedule === '납품완료';
                return (
                  <div key={item.id || idx} className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-sm space-y-3 relative group transition ${
                    isDelivered ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            item.type === '매출' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.type}
                          </span>
                          <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
                          {renderStatusBadge(item.billing_schedule)}
                        </div>
                        <p className="text-xs font-bold text-sky-700 mt-1">
                          발주처: {cust ? `${cust.name}${cust.dept ? ` (${cust.dept})` : ''}` : (item.customer_name || '미지정')}
                        </p>
                        {/* 💡 발주처 밑 담당자 이름, 연락처, 이메일, 영업담당자 표시 */}
                        {(() => {
                          const contactPerson = cust?.contact_person || item.contact_person || '';
                          const phone = cust?.phone || item.phone || '';
                          const email = cust?.email || item.email || '';
                          const manager = item.sales_manager || cust?.sales_manager || '';
                          if (!contactPerson && !phone && !email && !manager) return null;
                          return (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600 mt-0.5 font-medium">
                              {contactPerson && <span>👤 담당: <strong className="text-slate-800">{contactPerson}</strong></span>}
                              {phone && <span>📞 {phone}</span>}
                              {email && <span>✉️ {email}</span>}
                              {manager && <span className="text-rose-600 font-semibold">💼 영업: {manager}</span>}
                            </div>
                          );
                        })()}
                      </div>


                      <div className="flex flex-col items-end space-y-1">
                        <span className="text-lg font-black text-rose-600">₩ {(item.total_price || 0).toLocaleString()} 원</span>
                        <p className="text-[11px] text-slate-400 font-bold">공급가: ₩ {(item.supply_price || 0).toLocaleString()}원</p>
                        
                        <div className="flex items-center space-x-1 pt-1">
                          {!isDelivered && (
                            <button
                              onClick={() => handleMarkDelivered(item)}
                              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition mr-1"
                              title="납품완료 처리"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>납품 처리</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleCollectPayment(item)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition mr-1"
                            title="수금 등록 및 청구완료 전환"
                          >
                            <span>₩ 수금/청구 완료</span>
                          </button>

                          <button
                            onClick={() => setEstimatingSale({ sale: item, customer: cust })}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-lg text-xs font-bold transition mr-1"
                            title="견적서 작성 및 세부 단가 산출 (매출액 자동 반영)"
                          >
                            <Calculator className="w-3.5 h-3.5 text-sky-600" />
                            <span>견적서 작성</span>
                          </button>

                          <button
                            onClick={() => setPrintingQuote({ quote: item, customer: cust })}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition mr-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-sky-600" />
                            <span>인쇄</span>
                          </button>


                          <button
                            onClick={() => handleCreateJobOrderFromSale(item)}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition mr-1 shadow-sm"
                            title="이 매출 건의 정보로 신규 작업전표 작성"
                          >
                            <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                            <span>작업전표 작성</span>
                          </button>

                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {item.content && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {item.content}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-medium">
                      <span>매출 등록일: {item.reg_date || item.receipt_date || '-'} | 납품 예정일: {item.delivery_date || '-'}</span>
                      <span>{item.note}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ----------------- 탭 3: 📊 ERP 매출 및 미수 통계 보고서 ----------------- */}
      {reportTab === 'erp' && (

        <div className="space-y-4">
          
          {/* ERP 보고서 필터링 카드 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
              <BarChart3 className="w-4.5 h-4.5 text-sky-600" />
              <span>분석 조건</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-xs font-bold">
              {/* 1. 보고서 유형 */}
              <div>
                <label className="block text-slate-600 mb-1.5">1. 보고서 현황 구분</label>
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setReportType('all')}
                    className={`flex-1 py-1.5 rounded-lg transition ${reportType === 'all' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    전체 매출현황
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('customer')}
                    className={`flex-1 py-1.5 rounded-lg transition ${reportType === 'customer' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    거래처별
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('manager')}
                    className={`flex-1 py-1.5 rounded-lg transition ${reportType === 'manager' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    영업담당자별
                  </button>
                </div>
              </div>

              {/* 2. 조회 기간 기준 */}
              <div>
                <label className="block text-slate-600 mb-1.5">2. 조회 기간 기준</label>
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTimeResolution('day')}
                    className={`flex-1 py-1.5 rounded-lg transition ${timeResolution === 'day' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    일별
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeResolution('month')}
                    className={`flex-1 py-1.5 rounded-lg transition ${timeResolution === 'month' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    월별
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeResolution('year')}
                    className={`flex-1 py-1.5 rounded-lg transition ${timeResolution === 'year' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    연별
                  </button>
                </div>
              </div>

              {/* 3. 기간 조건부 입력 창 */}
              <div>
                <label className="block text-slate-600 mb-1.5">3. 조회 대상 일/월/년 선택</label>
                
                {timeResolution === 'day' && (
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="p-1.5 border border-slate-200 rounded-xl w-full text-center"
                    />
                    <span className="text-slate-400">~</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="p-1.5 border border-slate-200 rounded-xl w-full text-center"
                    />
                  </div>
                )}

                {timeResolution === 'month' && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="p-1.5 border border-slate-200 rounded-xl w-full text-center font-bold text-sky-700"
                  />
                )}

                {timeResolution === 'year' && (
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(e.target.value)}
                    className="p-1.5 border border-slate-200 rounded-xl w-full text-center font-bold text-sky-700"
                  >
                    <option value="2026">2026 년</option>
                    <option value="2025">2025 년</option>
                    <option value="2024">2024 년</option>
                  </select>
                )}
              </div>

              {/* 4. 특정 거래처 지정 조회 필터 */}
              <div>
                <label className="block text-slate-600 mb-1.5">4. 특정 거래처 지정 조회</label>
                <select
                  value={selectedCustomerFilter}
                  onChange={e => setSelectedCustomerFilter(e.target.value)}
                  className="p-1.5 border border-slate-200 rounded-xl w-full font-bold text-slate-800 focus:border-sky-500"
                >
                  <option value="ALL">🏢 전체 거래처 보기</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>
                      🏢 {c.name} {c.dept ? `(${c.dept})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 조회 다운로드 조작 구역 */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">
                필터 결과: 총 <strong className="text-sky-600 font-bold">{currentReportSales.length}</strong> 건의 데이터가 검색되었습니다.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportLedgerCSV}
                  className="flex items-center space-x-1.5 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  <span>📒 거래원장 추출 (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Download className="w-4 h-4" />
                  <span>📥 엑셀 보고서 다운로드 (CSV)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 거래원장 상세 테이블 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-700">거래원장</h4>
              <span className="text-[10px] text-slate-500">{selectedCustomerFilter === 'ALL' ? '전체 거래처' : selectedCustomerFilter} / {startDate || '시작일'} ~ {endDate || '종료일'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-left">거래일</th>
                    <th className="p-3 text-left">거래처</th>
                    <th className="p-3 text-left">구분</th>
                    <th className="p-3 text-left">적요</th>
                    <th className="p-3 text-right">매출금액</th>
                    <th className="p-3 text-right">수금금액</th>
                    <th className="p-3 text-right">잔액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400 font-bold">선택한 조건에 해당하는 거래원장 내역이 없습니다.</td>
                    </tr>
                  ) : (
                    ledgerEntries.map((entry, idx) => (
                      <tr key={`${entry.date}-${entry.customer}-${entry.kind}-${idx}`} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono text-slate-500">{entry.date || '-'}</td>
                        <td className="p-3 font-bold">{entry.customer}</td>
                        <td className={`p-3 font-bold ${entry.kind === '매출' ? 'text-blue-700' : 'text-emerald-700'}`}>{entry.kind}</td>
                        <td className="p-3">{entry.description}</td>
                        <td className="p-3 text-right font-mono">{entry.sales ? `₩ ${entry.sales.toLocaleString()}` : '-'}</td>
                        <td className="p-3 text-right font-mono text-emerald-700">{entry.payment ? `₩ ${entry.payment.toLocaleString()}` : '-'}</td>
                        <td className={`p-3 text-right font-mono font-bold ${entry.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                          ₩ {Math.abs(entry.balance).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ERP 요약 통계 카드 */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="bg-slate-900 text-white p-4.5 rounded-2xl shadow-sm border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">조회 기간 총 매출 건수</p>
              <h4 className="text-xl font-black text-white">{reportSummary.totalCount} 건</h4>
            </div>
            <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">총 매출액 (VAT 포함)</p>
              <h4 className="text-xl font-black text-slate-900">₩ {reportSummary.totalSales.toLocaleString()} 원</h4>
            </div>
            <div className="bg-white p-4.5 rounded-2xl shadow-sm border border-slate-200 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-emerald-600">총 수금 완료액</p>
              <h4 className="text-xl font-black text-emerald-600">₩ {reportSummary.totalCollected.toLocaleString()} 원</h4>
            </div>
            <div className="bg-rose-50 p-4.5 rounded-2xl shadow-sm border border-rose-200 space-y-1">
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">미수금 잔액 (미회수금)</p>
              <h4 className="text-xl font-black text-rose-600">₩ {reportSummary.totalOutstanding.toLocaleString()} 원</h4>
            </div>
          </div>

          {/* ERP 데이터 집계 테이블 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 uppercase font-extrabold border-b border-slate-200">
                  {reportType === 'all' ? (
                    <tr>
                      <th className="p-3.5">등록일</th>
                      <th className="p-3.5">거래처명</th>
                      <th className="p-3.5">작업명 (제목)</th>
                      <th className="p-3.5 text-center">진행 상태</th>
                      <th className="p-3.5 text-right">공급가액</th>
                      <th className="p-3.5 text-right">합계액 (VAT포함)</th>
                      <th className="p-3.5 text-right text-emerald-700">수금액</th>
                      <th className="p-3.5 text-right text-rose-600">미수금</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="p-3.5">{reportType === 'customer' ? '거래처명' : '영업담당자'}</th>
                      <th className="p-3.5 text-center">매출 건수</th>
                      <th className="p-3.5 text-right">총 매출액 (VAT포함)</th>
                      <th className="p-3.5 text-right text-emerald-700">총 수금액</th>
                      <th className="p-3.5 text-right text-rose-600">총 미수금 잔액</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {reportList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-10 text-center text-slate-400 font-bold">
                        선택하신 조건(기간 및 거래처)에 해당하는 매출 데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    reportType === 'all' ? (
                      reportList.map((s, idx) => {
                        const cust = customers.find(c => c.id === s.customer_id);
                        const cName = cust ? cust.name : (s.customer_name || s.customer_id);
                        const isCollected = s.billing_schedule === '청구완료';
                        return (
                          <tr key={s.id || idx} className="hover:bg-slate-50 transition">
                            <td className="p-3.5 font-mono text-slate-500">{s.reg_date || s.receipt_date || '-'}</td>
                            <td className="p-3.5 font-bold text-slate-900">{cName}</td>
                            <td className="p-3.5 font-semibold">{s.title}</td>
                            <td className="p-3.5 text-center">{renderStatusBadge(s.billing_schedule)}</td>
                            <td className="p-3.5 text-right font-mono">₩ {Number(s.supply_price || 0).toLocaleString()}</td>
                            <td className="p-3.5 text-right font-mono font-bold text-slate-900">₩ {Number(s.total_price || 0).toLocaleString()}</td>
                            <td className="p-3.5 text-right font-mono font-bold text-emerald-700">₩ {isCollected ? Number(s.total_price || 0).toLocaleString() : '0'}</td>
                            <td className="p-3.5 text-right font-mono font-bold text-rose-600">₩ {!isCollected ? Number(s.total_price || 0).toLocaleString() : '0'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      reportList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                          <td className="p-3.5 text-center font-mono font-bold">{item.count} 건</td>
                          <td className="p-3.5 text-right font-mono font-bold text-slate-900">₩ {item.sales.toLocaleString()}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-emerald-700">₩ {item.collected.toLocaleString()}</td>
                          <td className="p-3.5 text-right font-mono font-bold text-rose-600">₩ {item.outstanding.toLocaleString()}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ----------------- 모달 레이어 ----------------- */}
      
      {/* 1. 매출 등록/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? '매출/견적 세부 내역 수정' : '신규 매출/견적 수동 등록'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <div className="flex space-x-3 text-xs font-bold">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sales_type"
                      checked={formData.type === '매출'}
                      onChange={() => setFormData({ ...formData, type: '매출' })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>매출 건</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sales_type"
                      checked={formData.type === '견적'}
                      onChange={() => setFormData({ ...formData, type: '견적' })}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>견적 건</span>
                  </label>
                </div>

                {!editingId && (
                  <button
                    type="button"
                    onClick={() => setShowSelectJobModal(true)}
                    className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  >
                    <FileSearch className="w-3.5 h-3.5 text-amber-600" />
                    <span>작업전표 불러오기</span>
                  </button>
                )}
              </div>

              {/* ── 🏢 고객 정보 (검색 자동완성 및 신규 고객 동시 등록 영역) ── */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-sky-600" />
                    고객(거래처) 정보
                  </span>
                  {(() => {
                    const inputName = (customerNameInput || formData.customer_name || '').trim().toLowerCase();
                    const inputDept = (formData.dept || '').trim().toLowerCase();
                    const inputContact = (formData.contact_person || '').trim().toLowerCase();
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                  {/* 고객사명 (통합 검색 및 직접 입력) */}
                  <div ref={customerDropdownRef} className="relative">
                    <label className="block text-xs font-bold text-slate-700 mb-1">고객사명 *</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="고객사명 검색 또는 직접 입력"
                        value={customerNameInput}
                        onChange={e => {
                          const val = e.target.value;
                          setCustomerNameInput(val);
                          setFormData(prev => ({ ...prev, customer_name: val, customer_id: '' }));
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => {
                          if (customerNameInput.trim()) setShowCustomerDropdown(true);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Escape' || e.key === 'Enter') setShowCustomerDropdown(false);
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                      />
                      {customerNameInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerNameInput('');
                            setFormData(prev => ({
                              ...prev,
                              customer_id: '',
                              customer_name: '',
                              dept: '',
                              contact_person: '',
                              phone: '',
                              email: '',
                            }));
                            setShowCustomerDropdown(false);
                          }}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* 실시간 고객 검색 자동완성 팝오버 */}
                    {showCustomerDropdown && customerSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
                        <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                          <span>등록 고객 검색 결과 ({customerSearchResults.length}건)</span>
                          <button
                            type="button"
                            onClick={() => setShowCustomerDropdown(false)}
                            className="text-slate-500 hover:text-slate-800 font-bold px-1.5 py-0.5 rounded hover:bg-slate-100 text-[11px]"
                          >
                            ✕ 닫기
                          </button>
                        </div>
                        {customerSearchResults.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full text-left p-2.5 hover:bg-sky-50 transition flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-800">{c.name}</span>
                              {c.dept && (
                                <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {c.dept}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              {c.contact_person && <span>담당: <strong className="text-slate-700">{c.contact_person}</strong></span>}
                              {c.phone && <span>연락처: {c.phone}</span>}
                              {c.sales_manager && <span className="text-rose-500 font-medium">영업: {c.sales_manager}</span>}
                            </div>
                          </button>
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

                  {/* 과/부서명 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">과/부서명</label>
                    <input
                      type="text"
                      placeholder="예: 해상풍력발전위원회"
                      value={formData.dept}
                      onFocus={() => setShowCustomerDropdown(false)}
                      onChange={e => setFormData({ ...formData, dept: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>


                {/* 고객 상세 정보 (담당자, 연락처, 이메일, 영업담당자) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">담당자 성명</label>
                    <input
                      type="text"
                      placeholder="예: 채선경 주무관"
                      value={formData.contact_person}
                      onFocus={() => setShowCustomerDropdown(false)}
                      onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">담당자 연락처</label>
                    <input
                      type="text"
                      placeholder="예: 010-1234-5678"
                      value={formData.phone}
                      onFocus={() => setShowCustomerDropdown(false)}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">담당자 이메일</label>
                    <input
                      type="email"
                      placeholder="예: contact@example.com"
                      value={formData.email}
                      onFocus={() => setShowCustomerDropdown(false)}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">영업담당자</label>
                    <input
                      type="text"
                      placeholder="영업담당자 이름"
                      value={formData.sales_manager}
                      onFocus={() => setShowCustomerDropdown(false)}
                      onChange={e => setFormData({ ...formData, sales_manager: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">작업명 (제목) *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 8월 소프트웨어 납품"
                    value={formData.title}
                    onFocus={() => setShowCustomerDropdown(false)}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>


                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">진행 상태</label>
                  <select
                    value={formData.billing_schedule}
                    onChange={e => setFormData({ ...formData, billing_schedule: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="진행중">⏳ 진행중</option>
                    <option value="납품완료">🚚 납품완료</option>
                    <option value="청구완료">✅ 청구완료 (수금완료)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">공급가액 (원)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.supply_price}
                      onChange={e => handlePriceChange(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">총 청구금액 (VAT포함)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.total_price}
                      onChange={e => handleTotalPriceChange(e.target.value)}
                      className="w-full p-2.5 bg-sky-50/40 border border-sky-200 rounded-xl font-bold text-sky-800 text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
                  <span>💡 공급가액 또는 총 청구금액 중 하나만 입력해도 자동 계산</span>
                  {Number(formData.tax) > 0 && (
                    <span className="font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      부가세(VAT 10%): ₩{Number(formData.tax).toLocaleString()}원
                    </span>
                  )}
                </div>
              </div>


              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">납품 예정일</label>
                  <input
                    type="date"
                    value={formData.delivery_date}
                    onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-600">납품 시간</label>
                    {formData.delivery_time ? (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, delivery_time: '' })}
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
                    value={formData.delivery_time || ''}
                    onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>


              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">작업 상세 내용</label>
                <textarea
                  rows={2}
                  placeholder="작업 상세 내용 입력"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-700">외부 자동화 연동 선택</p>
                <div className="flex space-x-4 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.calendar_synced}
                      onChange={e => setFormData({ ...formData, calendar_synced: e.target.checked })}
                      className="rounded text-sky-600"
                    />
                    <span>구글 캘린더 자동 등록</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.superthread_synced}
                      onChange={e => setFormData({ ...formData, superthread_synced: e.target.checked })}
                      className="rounded text-sky-600"
                    />
                    <span>슈퍼스레드 Webhook 알림</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : (editingId ? '수정 내용 저장' : '저장하기')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. 신규 작업전표 접수 모달 */}
      {showJobOrderModal && (
        <JobOrderModal
          customers={customers}
          initialData={jobOrderInitialData}
          onSave={handleSaveJobOrder}
          onClose={() => {
            setShowJobOrderModal(false);
            setJobOrderInitialData(null);
          }}
        />
      )}


      {/* 3. 작업전표 불러오기 (선택) 모달 */}
      {showSelectJobModal && (
        <SelectJobOrderModal
          jobOrders={jobOrders}
          customers={customers}
          onSelect={handleSelectJobOrder}
          onClose={() => setShowSelectJobModal(false)}
        />
      )}

      {/* 4. 견적서 / 비교견적서 문서 출력 모달 */}
      {printingQuote && (
        <QuotePrintModal
          quote={printingQuote.quote}
          customer={printingQuote.customer}
          onClose={() => setPrintingQuote(null)}
        />
      )}

      {/* 4-1. 견적서 작성/산출 및 매출액 자동 연동 모달 */}
      {estimatingSale && (
        <EstimateModal
          sale={estimatingSale.sale}
          customer={estimatingSale.customer}
          onClose={() => setEstimatingSale(null)}
          onSave={async (updatedItem) => {
            await updateSales(updatedItem.id, {
              supply_price: updatedItem.supply_price,
              tax: updatedItem.tax,
              total_price: updatedItem.total_price,
              estimate_items: updatedItem.estimate_items,
              estimate_note: updatedItem.estimate_note,
            });
            alert(`[${updatedItem.title}] 매출 건의 견적 금액(₩${Number(updatedItem.total_price).toLocaleString()}원)이 매출액으로 자동 반영되었습니다!`);
          }}
          onPrint={(quoteData, custData) => {
            setPrintingQuote({ quote: quoteData, customer: custData });
          }}
        />
      )}

      {/* 5. 경성문화사 실물 작업전표 1:1 출력 모달 */}

      {printingJobOrder && (
        <JobOrderPrintModal
          order={printingJobOrder}
          customer={customers.find(c => c.id === printingJobOrder.customer_id)}
          onClose={() => setPrintingJobOrder(null)}
        />
      )}
    </div>
  );
}