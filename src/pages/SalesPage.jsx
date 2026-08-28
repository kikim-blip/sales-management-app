// src/pages/SalesPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useGoogleAuth } from '../context/GoogleAuthContext';
import { Plus, Calendar, Clock, Share2, Pencil, Trash2, ClipboardList, FileText, FileSearch, Printer, CheckCircle2, Truck, BarChart3, Download, Search, Filter, XCircle, Building, Building2, User, Phone, Mail, Calculator } from 'lucide-react';
import * as XLSX from 'xlsx';
import JobOrderModal from '../components/common/JobOrderModal';
import SelectJobOrderModal from '../components/common/SelectJobOrderModal';
import QuotePrintModal from '../components/common/QuotePrintModal';
import JobOrderPrintModal from '../components/common/JobOrderPrintModal';
import EstimateModal from '../components/common/EstimateModal';
import CustomerDetailModal from '../components/common/CustomerDetailModal';
import { getLocalDateStr } from '../utils/dateUtils';
import { normalizeStaffName } from '../utils/nameUtils';



export default function SalesPage() {
  const { sales, customers, contacts = [], jobOrders, payments, staffs = [], addSales, updateSales, deleteSales, addJobOrder, addPayment, addCustomer, addContact, selectedTeamGroup, showCalc, toggleCalc } = useData();
  const { user } = useGoogleAuth();
  const loggedInUserName = user?.userName || user?.name || (user?.email ? user.email.split('@')[0] : '');

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

  // 💡 탭 상태: 'list' (전체 목록) | 'unbilled' (미청구 건) | 'erp' (ERP 보고서)
  const [reportTab, setReportTab] = useState('list');

  // ERP 보고서 상태: 조회 구분 ('company' | 'dept' | 'contact' | 'ledger')
  const [reportType, setReportType] = useState('company'); 
  const [analysisPeriodMode, setAnalysisPeriodMode] = useState('all'); // 'all' | 'month' | 'range'
  const today = getLocalDateStr();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return getLocalDateStr(d);
  });
  const [endDate, setEndDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7)); // e.g. "2026-08"
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState('ALL'); // 특정 거래처 지정 검색
  const [analysisSearchText, setAnalysisSearchText] = useState(''); // 분석 탭 검색어
  const [selectedAnalysisCustomer, setSelectedAnalysisCustomer] = useState(null); // 분석 탭에서 클릭한 고객 상세 모달

  const [listSearchText, setListSearchText] = useState('');
  const [listSortBy, setListSortBy] = useState('date_desc');
  const [listCustomerFilter, setListCustomerFilter] = useState('ALL');
  const [listStatusFilter, setListStatusFilter] = useState('ALL');
  const [listPeriodMode, setListPeriodMode] = useState('all'); // 'all' | 'month' | 'range'
  const [listSelectedMonth, setListSelectedMonth] = useState(today.slice(0, 7));
  const [listStartDate, setListStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return getLocalDateStr(d);
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

  // 💡 선택된 팀/부서에 소속된 사원 이름 목록
  const teamStaffNames = useMemo(() => {
    if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return [];
    return (staffs || [])
      .filter(st => st.team === selectedTeamGroup || st.dept === selectedTeamGroup || st.userName === selectedTeamGroup)
      .map(st => st.userName)
      .filter(Boolean);
  }, [staffs, selectedTeamGroup]);

  // 💡 팀/부서 필터링 매칭 헬퍼
  const isTeamMatch = (item, custId) => {
    if (!selectedTeamGroup || selectedTeamGroup === 'ALL') return true;

    // 0) 본인이 작성/등록한 건이면 어떤 이름 명의든 100% 무조건 노출
    const mgrRaw = String(item?.sales_manager || item?.manager_name || '');
    const normMgr = normalizeStaffName(mgrRaw, staffs);
    const normUser = normalizeStaffName(user?.userName || user?.name || '', staffs);
    const userEmailPrefix = user?.email ? user.email.split('@')[0] : '';

    if (normUser && normMgr && (normMgr === normUser || (userEmailPrefix && mgrRaw.includes(userEmailPrefix)))) {
      return true;
    }
    
    if (item?.dept === selectedTeamGroup || item?.team === selectedTeamGroup) return true;

    if (normMgr) {
      if (normMgr === selectedTeamGroup) return true;
      if (teamStaffNames.some(tn => normalizeStaffName(tn, staffs) === normMgr)) return true;
    }

    const cust = custId ? customers.find(c => c.id === custId) : null;
    if (cust) {
      const custMgr = normalizeStaffName(cust.sales_manager, staffs);
      if (cust.dept === selectedTeamGroup || cust.team === selectedTeamGroup) return true;
      if (custMgr === selectedTeamGroup) return true;
      if (custMgr && teamStaffNames.some(tn => normalizeStaffName(tn, staffs) === custMgr)) return true;
    }

    if (!item?.dept && !item?.team && !mgrRaw) return true;

    return false;
  };

  // 💡 전체 목록 및 미청구 관리용 정밀 필터링 (발주처, 과, 담당자, 작업명, 기간 전체 지원)
  const filteredSales = sales.filter(s => isTeamMatch(s, s.customer_id)).filter(item => {
    const cust = customers.find(c => c.id === item.customer_id);
    const orgName = cust?.name || item.customer_name || '';
    const deptName = item.dept || cust?.dept || '';
    const contactPerson = item.contact_person || cust?.contact_person || item.client_contact_person || '';
    const salesManager = item.sales_manager || cust?.sales_manager || item.manager_name || '';
    const title = item.title || '';
    const content = item.content || '';
    const note = item.note || '';

    // 1. 발주처, 과, 담당자, 작업명 통합 텍스트 검색
    if (listSearchText.trim()) {
      const q = listSearchText.trim().toLowerCase();
      const searchableText = `${orgName} ${deptName} ${contactPerson} ${salesManager} ${title} ${content} ${note}`.toLowerCase();
      if (!searchableText.includes(q)) {
        return false;
      }
    }

    // 2. 발주처 / 거래처 지정 드롭다운 필터
    if (listCustomerFilter !== 'ALL') {
      const matchById = item.customer_id === listCustomerFilter;
      const matchByName = (cust && cust.name === listCustomerFilter) || (item.customer_name === listCustomerFilter);
      if (!matchById && !matchByName) return false;
    }

    // 3. 진행 상태 필터 (진행중 / 납품완료 / 청구완료)
    if (listStatusFilter !== 'ALL' && (item.billing_schedule || '진행중') !== listStatusFilter) {
      return false;
    }

    // 4. 기간 필터 (전체 / 월별 / 직접지정)
    if (listPeriodMode !== 'all') {
      const regDate = normalizeDateStr(item.reg_date || item.receipt_date || item.delivery_date);
      if (regDate) {
        if (listPeriodMode === 'month') {
          if (!regDate.startsWith(listSelectedMonth)) return false;
        } else if (listPeriodMode === 'range') {
          if (listStartDate && regDate < listStartDate) return false;
          if (listEndDate && regDate > listEndDate) return false;
        }
      }
    }

    return true;
  }).sort((a, b) => {
    if (listSortBy === 'date_desc') {
      const dateA = a.reg_date || a.receipt_date || a.delivery_date || '';
      const dateB = b.reg_date || b.receipt_date || b.delivery_date || '';
      return dateB.localeCompare(dateA);
    } else if (listSortBy === 'date_asc') {
      const dateA = a.reg_date || a.receipt_date || a.delivery_date || '';
      const dateB = b.reg_date || b.receipt_date || b.delivery_date || '';
      return dateA.localeCompare(dateB);
    } else if (listSortBy === 'amount_desc') {
      return (Number(b.total_price) || 0) - (Number(a.total_price) || 0);
    } else if (listSortBy === 'amount_asc') {
      return (Number(a.total_price) || 0) - (Number(b.total_price) || 0);
    }
    return 0;
  });


  // 💡 미청구 건 목록 (청구완료 제외: 진행중, 납품완료 건)
  const unbilledSales = filteredSales.filter(s => s.billing_schedule !== '청구완료');
  const totalUnbilledAmount = unbilledSales.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);

  // 💡 진행중 건 목록 (진행중)
  const inProgressSales = filteredSales.filter(s => !s.billing_schedule || s.billing_schedule === '진행중');

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
    const todayStr = getLocalDateStr();
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
    dept: user?.dept || '세종영업본부',
    team: user?.team || '영업2조',
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
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const isComposingRef = useRef(false); // 한글 IME 조합 중 여부 추적

  // 실시간 고객 검색 결과 (고객사명, 부서, 담당자명, 연락처, 영업담당자 통합 검색 - 1:N 연락처 대응)
  const customerSearchResults = (() => {
    if (!customerSearchInput.trim()) return [];
    const q = customerSearchInput.trim().toLowerCase();
    const results = [];

    customers.forEach(c => {
      const cMatch = 
        (c.name || '').toLowerCase().includes(q) ||
        (c.dept || '').toLowerCase().includes(q) ||
        (c.sales_manager || '').toLowerCase().includes(q) ||
        (c.contact_person || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.mobile || '').includes(q) ||
        (c.email || '').toLowerCase().includes(q);

      const custContacts = contacts.filter(ct => ct.customer_id === c.id);

      if (cMatch) {
        if (custContacts.length === 0) {
          results.push({ ...c }); // fallback for legacy or no-contact customers
        } else {
          custContacts.forEach(ct => {
            results.push({
              ...c,
              contact_person: ct.name,
              phone: ct.phone,
              mobile: ct.mobile,
              email: ct.email,
              contact_id: ct.id
            });
          });
        }
      } else {
        // Customer name didn't match, but maybe a specific contact matched
        const matchedContacts = custContacts.filter(ct => 
          (ct.name || '').toLowerCase().includes(q) ||
          (ct.phone || '').includes(q) ||
          (ct.mobile || '').includes(q) ||
          (ct.email || '').toLowerCase().includes(q)
        );
        matchedContacts.forEach(ct => {
          results.push({
            ...c,
            contact_person: ct.name,
            phone: ct.phone,
            mobile: ct.mobile,
            email: ct.email,
            contact_id: ct.id
          });
        });
      }
    });
    return results;
  })();

  const handleSelectCustomer = (cust) => {
    setCustomerNameInput(cust.name || '');
    setFormData(prev => ({
      ...prev,
      customer_id: cust.id,
      customer_name: cust.name || '',
      dept: cust.dept || '',
      contact_person: cust.contact_person || '',
      phone: cust.phone || '',
      mobile: cust.mobile || '',
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
    setCustomerSearchInput('');
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
    setCustomerSearchInput('');
    setShowCustomerDropdown(false);

    setFormData({
      reg_date: item.reg_date || today,
      receipt_date: item.receipt_date || today,
      delivery_date: item.delivery_date || today,
      delivery_time: item.delivery_time || '',

      customer_id: item.customer_id || '',
      customer_name: cName,
      dept: cDept,
      contact_person: item.contact_person || cust?.contact_person || '',
      phone: item.phone || cust?.phone || '',
      email: item.email || cust?.email || '',
      sales_manager: item.sales_manager || cust?.sales_manager || loggedInUserName,
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
        billing_date: today,
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
    const numericStr = String(val).replace(/[^0-9]/g, '');
    if (!numericStr) {
      setFormData(prev => ({
        ...prev,
        supply_price: '',
        tax: 0,
        total_price: '',
      }));
      return;
    }
    const supply = Number(numericStr);
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
    const numericStr = String(val).replace(/[^0-9]/g, '');
    if (!numericStr) {
      setFormData(prev => ({
        ...prev,
        total_price: '',
        supply_price: '',
        tax: 0,
      }));
      return;
    }
    const total = Number(numericStr);
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

      // 1. 고객 매칭: [기관명 + 부서명] 완전 일치 매칭
      const inputName = custName.toLowerCase();
      const inputDept = (formData.dept || '').trim().toLowerCase();

      const matchedCust = customers.find(c => {
        const cName = (c.name || '').trim().toLowerCase();
        const cDept = (c.dept || '').trim().toLowerCase();
        // 기관명과 부서명이 모두 일치해야만 동일 거래처로 판정
        return cName === inputName && cDept === inputDept;
      });

      // 2. 미등록 고객이거나 부서가 다른 경우 독립된 신규 고객으로 등록
      if (!matchedCust) {
        const newCustData = {
          name: custName,
          dept: formData.dept || '',
          // ✅ 고객사(customers)에는 조직정보만 저장 — 담당자/연락처 저장 안 함
        };
        const savedCust = await addCustomer(newCustData);
        targetCustomerId = savedCust?.id || `CUST-${Date.now()}`;
      } else {
        targetCustomerId = matchedCust.id;
      }

      // 3. 담당자가 입력되었고 contacts DB에 없으면 자동 등록
      if (formData.contact_person && formData.contact_person.trim()) {
        const contactNameLow = formData.contact_person.trim().toLowerCase();
        const existingContact = contacts.find(c =>
          c.customer_id === targetCustomerId &&
          (c.name || '').trim().toLowerCase() === contactNameLow
        );
        if (!existingContact) {
          await addContact({
            customer_id: targetCustomerId,
            name: formData.contact_person.trim(),
            phone: formData.phone || '',
            mobile: formData.mobile || '',
            email: formData.email || '',
          });
        }
      }

      const salePayload = {
        ...formData,
        customer_id: targetCustomerId,
        customer_name: custName,
        dept: formData.dept || '',
        contact_person: formData.contact_person || '',
        phone: formData.phone || '',
        mobile: formData.mobile || '',
        email: formData.email || '',
        team: formData.team || user?.team || '영업2조',
        sales_manager: formData.sales_manager || loggedInUserName,
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

  // ── 📊 ERP 다차원 분석 및 거래원장 집계 로직 ──
  const [onlyUnpaidAnalysis, setOnlyUnpaidAnalysis] = useState(false);

  // 1. 기간 및 검색어 필터링된 매출/수금 데이터 추출
  const { periodSales, periodPayments } = useMemo(() => {
    const isMatchedCustomer = (itemCustomerId, itemCustomerName) => {
      if (selectedCustomerFilter === 'ALL') return true;
      const cust = customers.find(c => c.id === itemCustomerId);
      const matchById = itemCustomerId === selectedCustomerFilter;
      const matchByName = (cust && cust.name === selectedCustomerFilter) || (itemCustomerName === selectedCustomerFilter);
      const matchByFull = cust && `${cust.name} (${cust.dept})` === selectedCustomerFilter;
      return matchById || matchByName || matchByFull;
    };

    const isMatchedSearch = (item, cust) => {
      if (!analysisSearchText.trim()) return true;
      const q = analysisSearchText.toLowerCase();
      const text = `${cust?.name || ''} ${cust?.dept || ''} ${item.contact_person || ''} ${item.sales_manager || ''} ${item.title || ''} ${item.customer_name || ''} ${item.content || ''}`.toLowerCase();
      return text.includes(q);
    };

    const isMatchedDate = (rawDate) => {
      if (!rawDate) return true; // 날짜 없는 건 포함
      const normDate = normalizeDateStr(rawDate);
      if (analysisPeriodMode === 'month') {
        return normDate.startsWith(selectedMonth);
      }
      if (analysisPeriodMode === 'range') {
        if (startDate && normDate < startDate) return false;
        if (endDate && normDate > endDate) return false;
        return true;
      }
      return true; // 'all'
    };

    const pSales = sales.filter(s => isTeamMatch(s, s.customer_id)).filter(s => {
      const cust = customers.find(c => c.id === s.customer_id);
      if (!isMatchedCustomer(s.customer_id, s.customer_name)) return false;
      if (!isMatchedSearch(s, cust)) return false;
      const rawDate = s.reg_date || s.receipt_date || s.delivery_date;
      return isMatchedDate(rawDate);
    });

    const pPayments = payments.filter(p => isTeamMatch(p, p.customer_id)).filter(p => {
      const cust = customers.find(c => c.id === p.customer_id);
      if (!isMatchedCustomer(p.customer_id, p.customer_name)) return false;
      if (!isMatchedSearch(p, cust)) return false;
      return isMatchedDate(p.payment_date);
    });

    return { periodSales: pSales, periodPayments: pPayments };
  }, [sales, payments, customers, selectedCustomerFilter, analysisSearchText, analysisPeriodMode, selectedMonth, startDate, endDate, selectedTeamGroup, teamStaffNames]);


  // 2. 다차원 집계 (회사별 / 과별 / 담당자별 / 상세거래원장)
  const { analysisList, analysisSummary, ledgerList } = useMemo(() => {
    let totalSales = 0;
    let totalPayment = 0;

    // 상세 거래원장 항목 산출
    const rawLedger = [];
    periodSales.forEach(s => {
      const cust = customers.find(c => c.id === s.customer_id);
      const orgName = cust ? cust.name : (s.customer_name || '미지정 고객');
      const deptName = s.dept || cust?.dept || '';
      // ✅ 담당자/연락처/영업담당은 매출 건 자체 필드 우선 사용 (customers 참조 안 함)
      const contactPerson = s.contact_person || s.client_contact_person || '';
      const phone = s.phone || '';
      const email = s.email || '';
      const salesManager = s.sales_manager || s.manager_name || '';
      const amount = Number(s.total_price || 0);
      totalSales += amount;
      rawLedger.push({
        id: s.id,
        date: normalizeDateStr(s.reg_date || s.receipt_date || s.delivery_date),
        customerKey: `${orgName}___${deptName}`,
        orgName,
        deptName,
        contactPerson,
        phone,
        email,
        salesManager,
        kind: '매출',
        title: s.title || '매출 건',
        note: s.note || '',
        content: s.content || '',
        billing_schedule: s.billing_schedule || '',
        sales: amount,
        payment: 0,
        customerObj: cust || { id: s.customer_id, name: orgName, dept: deptName },
      });
    });

    periodPayments.forEach(p => {
      const cust = customers.find(c => c.id === p.customer_id);
      const orgName = cust ? cust.name : (p.customer_name || '미지정 고객');
      const deptName = p.dept || cust?.dept || '';
      const amount = Number(p.amount || 0);
      totalPayment += amount;
      rawLedger.push({
        id: p.id,
        date: normalizeDateStr(p.payment_date),
        customerKey: `${orgName}___${deptName}`,
        orgName,
        deptName,
        contactPerson: '',
        phone: '',
        email: '',
        salesManager: '',
        kind: '수금',
        title: p.note || `수금 입금 (${p.method || '계좌이체'})`,
        note: p.note || '',
        method: p.method || '계좌이체',
        sales: 0,
        payment: amount,
        customerObj: cust || { id: p.customer_id, name: orgName, dept: deptName },
      });
    });

    rawLedger.sort((a, b) => (a.date || '9999-12-31').localeCompare(b.date || '9999-12-31'));

    // 거래처별 누적 잔액 계산
    const balanceTracker = {};
    const finalLedger = rawLedger.map(item => {
      if (balanceTracker[item.customerKey] === undefined) {
        balanceTracker[item.customerKey] = 0;
      }
      balanceTracker[item.customerKey] += (item.sales - item.payment);
      return {
        ...item,
        balance: balanceTracker[item.customerKey],
      };
    });

    // ── 그룹핑 (회사별 / 과별 / 담당자별) ──
    const groupMap = {};

    finalLedger.forEach(item => {
      let groupKey = '';
      if (reportType === 'company') {
        groupKey = item.orgName;
      } else if (reportType === 'dept') {
        groupKey = `${item.orgName}___${item.deptName || '부서미지정'}`;
      } else { // contact
        groupKey = `${item.orgName}___${item.deptName || ''}___${item.contactPerson || '담당자미지정'}`;
      }

      if (!groupMap[groupKey]) {
        groupMap[groupKey] = {
          id: groupKey,
          reportType: reportType,
          viewLevel: reportType,
          name: item.orgName,
          orgName: item.orgName,
          dept: reportType === 'company' ? '' : item.deptName,
          deptName: reportType === 'company' ? '' : item.deptName,
          contact_person: reportType === 'contact' ? item.contactPerson : '',
          contactPerson: reportType === 'contact' ? item.contactPerson : '',
          phone: reportType === 'contact' ? item.phone : '',
          email: reportType === 'contact' ? item.email : '',
          sales_manager: item.salesManager,
          salesManager: item.salesManager,
          count: 0,
          sales: 0,
          totalSales: 0,
          payment: 0,
          totalPayment: 0,
          lastTradeDate: '',
          salesList: [],
          paymentList: [],
          custIds: new Set(),
          customerObj: item.customerObj,
        };
      }


      const g = groupMap[groupKey];
      if (item.kind === '매출') {
        g.count += 1;
        g.sales += item.sales;
        g.totalSales += item.sales;
        g.salesList.push(item);
      } else {
        g.payment += item.payment;
        g.totalPayment += item.payment;
        g.paymentList.push(item);
      }
      if (item.customerObj?.id) g.custIds.add(item.customerObj.id);
      if (item.date && (!g.lastTradeDate || item.date > g.lastTradeDate)) {
        g.lastTradeDate = item.date;
      }
    });

    let groupedList = Object.values(groupMap).map(g => ({
      ...g,
      unpaid: g.sales - g.payment,
      custIds: Array.from(g.custIds),
    }));

    // 미수금 발생건만 필터
    if (onlyUnpaidAnalysis) {
      groupedList = groupedList.filter(g => g.unpaid > 0);
    }

    // 매출액 내림차순 정렬
    groupedList.sort((a, b) => b.sales - a.sales || b.unpaid - a.unpaid);

    const summary = {
      totalCount: periodSales.length,
      totalSales,
      totalPayment,
      totalUnpaid: totalSales - totalPayment,
    };

    return { analysisList: groupedList, analysisSummary: summary, ledgerList: finalLedger };
  }, [periodSales, periodPayments, customers, reportType, onlyUnpaidAnalysis]);

  // 💡 통합 엑셀 다운로드 (.xlsx)
  const handleExportAnalysisExcel = () => {
    const todayStr = getLocalDateStr();
    const typeLabel = reportType === 'company' ? '회사별' : reportType === 'dept' ? '과·부서별' : reportType === 'contact' ? '담당자별' : '상세거래원장';
    const periodLabel = analysisPeriodMode === 'month' ? selectedMonth : analysisPeriodMode === 'range' ? `${startDate}~${endDate}` : '전체기간';

    let excelData = [];
    if (reportType === 'ledger') {
      excelData = [
        [`경성문화사 ERP 거래원장 리포트 [${periodLabel}]`, `구분: ${typeLabel}`, `추출일자: ${todayStr}`],
        [],
        ['거래일자', '회사명(고객사)', '부서 / 과', '담당자', '구분', '적요 / 작업내용', '매출금액', '수금금액', '거래처 누적잔액'],
        ...ledgerList.map((entry) => [
          entry.date || '-',
          entry.orgName,
          entry.deptName || '-',
          entry.contactPerson || '-',
          entry.kind,
          entry.title,
          entry.sales,
          entry.payment,
          entry.balance,
        ]),
        [],
        [
          '합계', '', '', '', '', '',
          analysisSummary.totalSales,
          analysisSummary.totalPayment,
          analysisSummary.totalUnpaid,
        ]
      ];
    } else if (reportType === 'company') {
      excelData = [
        [`경성문화사 ERP 회사별 매출·수금·미수 분석보고서 [${periodLabel}]`, '', `추출일자: ${todayStr}`],
        [],
        ['회사명(고객사)', '거래건수', '총 매출액(VAT포함)', '총 수금액', '미수금 잔액', '최근 거래일'],
        ...analysisList.map(item => [
          item.orgName,
          item.count,
          item.sales,
          item.payment,
          item.unpaid,
          item.lastTradeDate || '-',
        ]),
        [],
        [
          '합계',
          analysisSummary.totalCount,
          analysisSummary.totalSales,
          analysisSummary.totalPayment,
          analysisSummary.totalUnpaid,
          '-'
        ]
      ];
    } else if (reportType === 'dept') {
      excelData = [
        [`경성문화사 ERP 과·부서별 매출·수금·미수 분석보고서 [${periodLabel}]`, '', `추출일자: ${todayStr}`],
        [],
        ['회사명(고객사)', '부서 / 과', '거래건수', '총 매출액(VAT포함)', '총 수금액', '미수금 잔액', '최근 거래일'],
        ...analysisList.map(item => [
          item.orgName,
          item.deptName || '-',
          item.count,
          item.sales,
          item.payment,
          item.unpaid,
          item.lastTradeDate || '-',
        ]),
        [],
        [
          '합계', '',
          analysisSummary.totalCount,
          analysisSummary.totalSales,
          analysisSummary.totalPayment,
          analysisSummary.totalUnpaid,
          '-'
        ]
      ];
    } else { // contact
      excelData = [
        [`경성문화사 ERP 담당자별 매출·수금·미수 분석보고서 [${periodLabel}]`, '', `추출일자: ${todayStr}`],
        [],
        ['회사명(고객사)', '부서 / 과', '담당자명', '연락처', '이메일', '담당영업', '거래건수', '총 매출액(VAT포함)', '총 수금액', '미수금 잔액', '최근 거래일'],
        ...analysisList.map(item => [
          item.orgName,
          item.deptName || '-',
          item.contactPerson || '-',
          item.phone || '-',
          item.email || '-',
          item.salesManager || '-',
          item.count,
          item.sales,
          item.payment,
          item.unpaid,
          item.lastTradeDate || '-',
        ]),
        [],
        [
          '합계', '', '', '', '', '',
          analysisSummary.totalCount,
          analysisSummary.totalSales,
          analysisSummary.totalPayment,
          analysisSummary.totalUnpaid,
          '-'
        ]
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${typeLabel}_분석`);
    XLSX.writeFile(wb, `경성문화사_${typeLabel}_매출미수보고서_${periodLabel}_${todayStr}.xlsx`);
  };


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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
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

      {/* 탭 네비게이션: [전체 목록] vs [🚨 미청구 관리] vs [📊 분석 및 원장] */}
      <div className="flex border-b border-slate-200 print:hidden">
        <button
          onClick={() => setReportTab('list')}
          className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 ${
            reportTab === 'list' ? 'border-sky-600 text-sky-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          전체 목록 ({filteredSales.length})
        </button>

        <button
          onClick={() => setReportTab('in_progress')}
          className={`px-5 py-3 font-extrabold text-xs transition-all border-b-2 flex items-center space-x-1.5 ${
            reportTab === 'in_progress' ? 'border-amber-500 text-amber-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>진행중</span>
          {inProgressSales.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black">
              {inProgressSales.length}
            </span>
          )}
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

      {/* 목록/미청구 관리 탭 전용 상세 조회 필터: 발주처 / 과 / 담당자 / 작업명 / 기간(전체/월별/직접지정) / 상태 */}
      {reportTab !== 'erp' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3.5 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Filter className="w-4 h-4 text-sky-600" />
              <span>조회 필터</span>
              <span className="text-xs font-normal text-slate-500">
                (검색 결과: <strong className="text-sky-600 font-bold">{filteredSales.length}</strong>건)
              </span>
            </div>

            {/* 우측 컨트롤 (정렬 및 기간) */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              
              {/* 정렬 셀렉트 */}
              <div className="flex items-center">
                <span className="text-xs font-bold text-slate-500 mr-2">정렬:</span>
                <select
                  value={listSortBy}
                  onChange={(e) => setListSortBy(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="date_desc">▼ 접수일자 최신순</option>
                  <option value="date_asc">▲ 접수일자 과거순</option>
                  <option value="amount_desc">▼ 금액 높은순</option>
                  <option value="amount_asc">▲ 금액 낮은순</option>
                </select>
              </div>

              {/* 기간 모드 프리셋: [전체] / [당월] / [직접지정] */}
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-500 mr-1">기간:</span>
                <div className="inline-flex p-0.5 bg-slate-100 rounded-xl text-xs font-bold mr-1.5">
                  <button
                    type="button"
                    onClick={() => setListPeriodMode('all')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      listPeriodMode === 'all' ? 'bg-white text-sky-700 font-black shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    전체 기간
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setListPeriodMode('month');
                      setListSelectedMonth(today.slice(0, 7));
                    }}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      listPeriodMode === 'month' ? 'bg-white text-sky-700 font-black shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    당월
                  </button>
                  <button
                    type="button"
                    onClick={() => setListPeriodMode('range')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      listPeriodMode === 'range' ? 'bg-white text-sky-700 font-black shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    직접지정
                  </button>
                </div>
                
                {/* 초기화 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    setListSearchText('');
                    setListCustomerFilter('ALL');
                    setListStatusFilter('ALL');
                    setListSortBy('date_desc');
                    setListPeriodMode('all');
                    setListStartDate(() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - 1);
                      return getLocalDateStr(d);
                    });
                    setListEndDate(today);
                  }}
                  className="flex items-center justify-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition"
                  title="모든 검색 조건을 초기화합니다."
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">초기화</span>
                </button>
              </div>
            </div>
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
            {/* 1. 발주처/과/담당자/작업명 통합 검색 (5열) */}
            <div className="lg:col-span-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={listSearchText}
                onChange={(e) => setListSearchText(e.target.value)}
                placeholder="발주처, 과, 담당자, 작업명 검색..."
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:border-sky-500 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* 2. 발주처(고객사) 지정 드롭다운 (3열) */}
            <div className="lg:col-span-3">
              <select
                value={listCustomerFilter}
                onChange={(e) => setListCustomerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:border-sky-500 focus:outline-none bg-white"
              >
                <option value="ALL">🏢 전체 발주처(고객사)</option>
                {customers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    🏢 {cust.name} {cust.dept ? `(${cust.dept})` : ''} {cust.contact_person ? `- ${cust.contact_person}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. 진행 상태 (2열) */}
            <div className="lg:col-span-2">
              <select
                value={listStatusFilter}
                onChange={(e) => setListStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:border-sky-500 focus:outline-none bg-white"
              >
                <option value="ALL">전체 상태</option>
                <option value="진행중">진행중</option>
                <option value="납품완료">납품완료</option>
                <option value="청구완료">청구완료</option>
              </select>
            </div>

            {/* 4. 기간 입력창 (2열 또는 3열) */}
            <div className="lg:col-span-3">
              {listPeriodMode === 'month' && (
                <input
                  type="month"
                  value={listSelectedMonth}
                  onChange={(e) => setListSelectedMonth(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs font-bold text-sky-700 text-center bg-white"
                />
              )}
              {listPeriodMode === 'range' && (
                <div className="flex items-center space-x-1">
                  <input
                    type="date"
                    value={listStartDate}
                    onChange={(e) => setListStartDate(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 rounded-xl text-[11px] text-center bg-white"
                  />
                  <span className="text-slate-400 text-xs">~</span>
                  <input
                    type="date"
                    value={listEndDate}
                    onChange={(e) => setListEndDate(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 rounded-xl text-[11px] text-center bg-white"
                  />
                </div>
              )}
              {listPeriodMode === 'all' && (
                <div className="w-full py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-semibold text-slate-500">
                  전체 누적 기간
                </div>
              )}
            </div>

          </div>
        </div>
      )}


      {/* ----------------- 탭 1 & 1-2: 매출 기록 목록 & 진행중 목록 ----------------- */}

      {(reportTab === 'list' || reportTab === 'in_progress') && (
        <div className="space-y-3 print:hidden">
          {(reportTab === 'list' ? filteredSales : inProgressSales).length === 0 ? (
            <div className="bg-white text-center py-12 border border-slate-200 rounded-2xl text-slate-400 text-xs font-bold">
              {reportTab === 'list' ? '현재 필터링된 소속 그룹의 매출/견적 내역이 없습니다.' : '현재 진행중인 매출/견적 내역이 없습니다.'}
            </div>
          ) : (
            (reportTab === 'list' ? filteredSales : inProgressSales).map((item, idx) => {
              const cust = customers.find(c => c.id === item.customer_id);
              return (
                <div key={item.id || idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative group">
                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                    
                    {/* ── 좌측: 작업명, 발주처, 담당자, 접수일/납품일 뱃지 ── */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                          item.type === '매출' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.type}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-base break-words">{item.title}</h3>
                        {renderStatusBadge(item.billing_schedule)}
                      </div>

                      <p className="text-xs font-bold text-sky-700">
                        발주처: {cust ? `${cust.name}${cust.dept ? ` (${cust.dept})` : ''}` : (item.customer_name || '미지정')}
                      </p>

                      {/* 발주처 밑 담당자 이름, 연락처, 이메일, 영업담당자 */}
                      {(() => {
                        // ✅ 매출 건 자체 필드 최우선 사용 -> 수정됨
                        const contactPerson = item.contact_person || cust?.contact_person || item.client_contact_person || '';
                        const phone = item.phone || cust?.phone || '';
                        const email = item.email || cust?.email || '';
                        const manager = item.sales_manager || cust?.sales_manager || '';
                        if (!contactPerson && !phone && !email && !manager) return null;
                        return (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600 font-medium">
                            {contactPerson && <span>👤 담당: <strong className="text-slate-800">{contactPerson}</strong></span>}
                            {phone && <span>📞 {phone}</span>}
                            {email && <span>✉️ {email}</span>}
                            {manager && <span className="text-rose-600 font-semibold">💼 영업: {manager}</span>}
                          </div>
                        );
                      })()}

                      {/* 💡 📅 접수일자 & 🚚 납품예정일 직관적 뱃지 */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                          <Calendar className="w-3 h-3 text-sky-600" />
                          <span>접수일: <strong>{item.receipt_date || item.reg_date || '-'}</strong></span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                          <Truck className="w-3 h-3 text-emerald-600" />
                          <span>납품일: <strong>{item.delivery_date || '-'}</strong> {item.delivery_time ? `(${item.delivery_time})` : ''}</span>
                        </span>
                      </div>
                    </div>

                    {/* ── 우측: 금액 & 버튼 (줄바꿈 없이 깔끔한 nowrap 툴바) ── */}
                    <div className="flex flex-col lg:items-end space-y-2 flex-shrink-0">
                      <div className="flex lg:flex-col items-baseline lg:items-end justify-between gap-2">
                        <span className="text-lg font-black text-slate-900">₩ {(item.total_price || 0).toLocaleString()} 원</span>
                        <p className="text-[11px] text-slate-400 font-bold">공급가: ₩ {(item.supply_price || 0).toLocaleString()}원</p>
                      </div>
                      
                      <div className="flex flex-wrap items-center lg:justify-end gap-1.5">
                        {item.billing_schedule !== '청구완료' && (
                          <>
                            {item.billing_schedule !== '납품완료' && (
                              <button
                                onClick={() => handleMarkDelivered(item)}
                                className="whitespace-nowrap inline-flex items-center space-x-1 px-2.5 py-1.5 bg-sky-50 hover:bg-emerald-600 hover:text-white text-sky-800 border border-sky-300 rounded-xl text-xs font-bold transition shadow-sm group"
                                title="현재 진행중 상태입니다. 클릭 시 [납품완료]로 변경됩니다."
                              >
                                <Truck className="w-3.5 h-3.5 text-sky-600 group-hover:text-white" />
                                <span className="group-hover:hidden">진행중</span>
                                <span className="hidden group-hover:inline">납품완료</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleCollectPayment(item)}
                              className="whitespace-nowrap inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-sm"
                              title="수금 등록 및 청구완료 전환"
                            >
                              <span>₩ 수금 처리</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setEstimatingSale({ sale: item, customer: cust })}
                          className="whitespace-nowrap inline-flex items-center space-x-1 px-2.5 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 rounded-xl text-xs font-bold transition"
                          title="견적서 작성 및 세부 단가 산출 (매출액 자동 반영)"
                        >
                          <Calculator className="w-3.5 h-3.5 text-sky-600" />
                          <span>견적서 작성</span>
                        </button>

                        <button
                          onClick={() => setPrintingQuote({ quote: item, customer: cust })}
                          className="whitespace-nowrap inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600" />
                          <span>인쇄</span>
                        </button>

                        <button
                          onClick={() => handleCreateJobOrderFromSale(item)}
                          className="whitespace-nowrap inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold transition shadow-sm"
                          title="이 매출 건의 정보로 신규 작업전표 작성"
                        >
                          <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                          <span>작업전표 작성</span>
                        </button>

                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl border border-slate-200 transition"
                          title="수정"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition"
                          title="삭제"
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

                  {item.note && (
                    <div className="text-[11px] text-slate-500 bg-slate-50/60 px-3 py-1.5 rounded-lg border border-slate-100">
                      비고: {item.note}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ----------------- 탭 2: 🚨 미청구 건 집중 관리 ----------------- */}
      {reportTab === 'unbilled' && (
        <div className="space-y-4 print:hidden">
          
          {/* 미청구 핵심 통계 카드 */}
          <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white to-rose-50/30">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-full text-xs font-black">
                  🚨 긴급 미청구 알림
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  (납품 완료되었으나 아직 청구서/수금이 완료되지 않은 매출 건)
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
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3">
                      
                      {/* ── 좌측: 작업명, 발주처, 담당자, 접수일/납품일 ── */}
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                            item.type === '매출' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.type}
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-base break-words">{item.title}</h3>
                          {renderStatusBadge(item.billing_schedule)}
                        </div>

                        <p className="text-xs font-bold text-sky-700">
                          발주처: {cust ? `${cust.name}${cust.dept ? ` (${cust.dept})` : ''}` : (item.customer_name || '미지정')}
                        </p>

                        {/* 발주처 밑 담당자 이름, 연락처, 이메일, 영업담당자 */}
                        {(() => {
                          // ✅ 매출 건 자체 필드 최우선 사용 — customers 필드 참조 안 함
                          const contactPerson = item.contact_person || item.client_contact_person || '';
                          const phone = item.phone || '';
                          const email = item.email || '';
                          const manager = item.sales_manager || '';
                          if (!contactPerson && !phone && !email && !manager) return null;
                          return (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-600 font-medium">
                              {contactPerson && <span>👤 담당: <strong className="text-slate-800">{contactPerson}</strong></span>}
                              {phone && <span>📞 {phone}</span>}
                              {email && <span>✉️ {email}</span>}
                              {manager && <span className="text-rose-600 font-semibold">💼 영업: {manager}</span>}
                            </div>
                          );
                        })()}

                        {/* 💡 📅 접수일자 & 🚚 납품예정일 직관적 뱃지 */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            <Calendar className="w-3 h-3 text-sky-600" />
                            <span>접수일: <strong>{item.receipt_date || item.reg_date || '-'}</strong></span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                            <Truck className="w-3 h-3 text-emerald-600" />
                            <span>납품일: <strong>{item.delivery_date || '-'}</strong> {item.delivery_time ? `(${item.delivery_time})` : ''}</span>
                          </span>
                        </div>
                      </div>

                      {/* ── 우측: 금액 & 버튼 (줄바꿈 없이 깔끔한 nowrap 툴바) ── */}
                      <div className="flex flex-col lg:items-end space-y-2 flex-shrink-0">
                        <div className="flex lg:flex-col items-baseline lg:items-end justify-between gap-2">
                          <span className="text-lg font-black text-rose-600">₩ {(item.total_price || 0).toLocaleString()} 원</span>
                          <p className="text-[11px] text-slate-400 font-bold">공급가: ₩ {(item.supply_price || 0).toLocaleString()}원</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center lg:justify-end gap-1.5">
                          {!isDelivered && (
                            <button
                              onClick={() => handleMarkDelivered(item)}
                              className="whitespace-nowrap inline-flex items-center space-x-1 px-2.5 py-1.5 bg-sky-50 hover:bg-emerald-600 hover:text-white text-sky-800 border border-sky-300 rounded-xl text-xs font-bold transition shadow-sm group"
                              title="현재 진행중 상태입니다. 클릭 시 [납품완료]로 변경됩니다."
                            >
                              <Truck className="w-3.5 h-3.5 text-sky-600 group-hover:text-white" />
                              <span className="group-hover:hidden">진행중</span>
                              <span className="hidden group-hover:inline">납품완료</span>
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
        /* ── 📊 혁신적인 ERP 매출/수금/미수 분석 및 거래원장 통합 뷰 ── */
        <div className="space-y-4 print:hidden">

          
          {/* 1. 상단 컨트롤 패널: 조회 구분 탭, 기간 설정, 거래처 필터, 검색, 엑셀 다운로드 */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              
              {/* (1) 조회 구분 탭: 회사별 / 과별 / 담당자별 / 상세거래원장 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  1. 분석 및 원장 조회 구분
                </label>
                <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setReportType('company')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      reportType === 'company'
                        ? 'bg-white text-sky-700 shadow-sm font-black'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    🏢 회사별
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('dept')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      reportType === 'dept'
                        ? 'bg-white text-sky-700 shadow-sm font-black'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    🏛️ 과·부서별
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('contact')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      reportType === 'contact'
                        ? 'bg-white text-sky-700 shadow-sm font-black'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    👤 담당자별
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType('ledger')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      reportType === 'ledger'
                        ? 'bg-white text-violet-700 shadow-sm font-black'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    📒 상세 거래원장
                  </button>
                </div>
              </div>

              {/* (2) 엑셀 다운로드 버튼 */}
              <div className="flex items-center gap-2 self-start lg:self-end">
                <button
                  type="button"
                  onClick={handleExportAnalysisExcel}
                  className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition active:scale-95 whitespace-nowrap"
                  title="현재 조회된 분석/원장 데이터를 엑셀(.xlsx) 파일로 내보냅니다."
                >
                  <Download className="w-4 h-4" />
                  <span>📊 엑셀 다운로드 (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* 2단 필터 컨트롤: 기간 기준, 거래처 지정, 검색창, 미수 필터 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
              
              {/* 기간 모드 선택 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  2. 조회 기간 기준
                </label>
                <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setAnalysisPeriodMode('all')}
                    className={`flex-1 py-1 rounded-lg transition ${
                      analysisPeriodMode === 'all' ? 'bg-white text-sky-700 font-bold shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAnalysisPeriodMode('month');
                      setSelectedMonth(today.slice(0, 7));
                    }}
                    className={`flex-1 py-1 rounded-lg transition ${
                      analysisPeriodMode === 'month' ? 'bg-white text-sky-700 font-bold shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    월별
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalysisPeriodMode('range')}
                    className={`flex-1 py-1 rounded-lg transition ${
                      analysisPeriodMode === 'range' ? 'bg-white text-sky-700 font-bold shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    직접지정
                  </button>
                </div>
              </div>

              {/* 대상 일/월 선택 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  3. 기간 범위
                </label>
                {analysisPeriodMode === 'month' && (
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="p-1.5 border border-slate-200 rounded-xl w-full text-xs font-bold text-sky-700 text-center bg-white"
                  />
                )}
                {analysisPeriodMode === 'range' && (
                  <div className="flex items-center space-x-1">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="p-1 border border-slate-200 rounded-xl w-full text-[11px] text-center bg-white"
                    />
                    <span className="text-slate-400 text-xs">~</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="p-1 border border-slate-200 rounded-xl w-full text-[11px] text-center bg-white"
                    />
                  </div>
                )}
                {analysisPeriodMode === 'all' && (
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs font-medium text-slate-500">
                    전체 누적 기간
                  </div>
                )}
              </div>

              {/* 특정 거래처 지정 조회 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  4. 특정 거래처 지정
                </label>
                <select
                  value={selectedCustomerFilter}
                  onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                  className="p-1.5 border border-slate-200 rounded-xl w-full text-xs font-bold text-slate-800 bg-white focus:border-sky-500"
                >
                  <option value="ALL">🏢 전체 거래처 보기</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏢 {c.name} {c.dept ? `(${c.dept})` : ''} {c.contact_person ? `- ${c.contact_person}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 검색 및 미수 잔액 필터 */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  5. 실시간 검색 & 필터
                </label>
                <div className="flex items-center space-x-1.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="회사/과/담당자 검색..."
                      value={analysisSearchText}
                      onChange={(e) => setAnalysisSearchText(e.target.value)}
                      className="pl-7 pr-2 py-1.5 border border-slate-200 rounded-xl w-full text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  {reportType !== 'ledger' && (
                    <label className="flex items-center space-x-1 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-50 px-2 py-1.5 border border-slate-200 rounded-xl whitespace-nowrap hover:bg-slate-100">
                      <input
                        type="checkbox"
                        checked={onlyUnpaidAnalysis}
                        onChange={(e) => setOnlyUnpaidAnalysis(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                      />
                      <span>미수만</span>
                    </label>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 2. ERP 핵심 요약 통계 카드 4종 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">조회 기간 매출 건수</p>
              <h4 className="text-xl font-black text-white">{analysisSummary.totalCount} 건</h4>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">총 매출액 (VAT 포함)</p>
              <h4 className="text-xl font-black text-slate-900">₩ {analysisSummary.totalSales.toLocaleString()} 원</h4>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-1">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">총 수금 완료액</p>
              <h4 className="text-xl font-black text-emerald-600">₩ {analysisSummary.totalPayment.toLocaleString()} 원</h4>
            </div>
            <div className="bg-rose-50 p-4 rounded-2xl shadow-sm border border-rose-200 space-y-1">
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">총 미수금 잔액</p>
              <h4 className="text-xl font-black text-rose-600">₩ {analysisSummary.totalUnpaid.toLocaleString()} 원</h4>
            </div>
          </div>

          {/* 3. ERP 통합 고밀도 데이터 테이블 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                <h4 className="font-extrabold text-sm text-slate-800">
                  {reportType === 'company' && '🏢 회사(기관)별 매출·수금·미수 정산표'}
                  {reportType === 'dept' && '🏛️ 과·부서별 매출·수금·미수 정산표'}
                  {reportType === 'contact' && '👤 담당자별 매출·수금·미수 정산표'}
                  {reportType === 'ledger' && '📒 일자별 상세 거래원장'}
                </h4>
                <span className="text-xs text-slate-500 font-normal">
                  (총 {reportType === 'ledger' ? ledgerList.length : analysisList.length}건)
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                행을 클릭하면 일자별 거래 장부가 열립니다.
              </span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              
              {/* ── (A) 상세 거래원장 테이블 ── */}
              {reportType === 'ledger' ? (
                ledgerList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">조회 조건에 일치하는 거래원장 내역이 없습니다.</div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">거래일자</th>
                        <th className="p-3">회사명 (고객사)</th>
                        <th className="p-3">부서 / 과</th>
                        <th className="p-3">담당자</th>
                        <th className="p-3 text-center">구분</th>
                        <th className="p-3">작업명 / 적요</th>
                        <th className="p-3 text-right">매출금액</th>
                        <th className="p-3 text-right">수금금액</th>
                        <th className="p-3 pr-4 text-right">해당 거래처 잔액</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {ledgerList.map((entry, idx) => (
                        <tr
                          key={`${entry.id || idx}`}
                          onClick={() => setSelectedAnalysisCustomer(entry.customerObj)}
                          className="hover:bg-sky-50/60 transition cursor-pointer group"
                        >
                          <td className="p-3 pl-4 font-mono text-slate-500">{entry.date || '-'}</td>
                          <td className="p-3 font-bold text-slate-900 group-hover:text-sky-700">{entry.orgName}</td>
                          <td className="p-3 text-slate-600">{entry.deptName || '-'}</td>
                          <td className="p-3 text-slate-600">{entry.contactPerson || '-'}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                              entry.kind === '매출'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {entry.kind}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">{entry.title}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {entry.sales > 0 ? `₩ ${entry.sales.toLocaleString()} 원` : '-'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600">
                            {entry.payment > 0 ? `₩ ${entry.payment.toLocaleString()} 원` : '-'}
                          </td>
                          <td className="p-3 pr-4 text-right font-mono font-black">
                            <span className={entry.balance > 0 ? 'text-rose-600' : 'text-slate-700'}>
                              ₩ {entry.balance.toLocaleString()} 원
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-200 sticky bottom-0 z-10">
                      <tr>
                        <td className="p-3 pl-4" colSpan={6}>
                          합계 ({ledgerList.length}건)
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900">
                          ₩ {analysisSummary.totalSales.toLocaleString()} 원
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-700">
                          ₩ {analysisSummary.totalPayment.toLocaleString()} 원
                        </td>
                        <td className="p-3 pr-4 text-right font-mono text-rose-700 font-black">
                          ₩ {analysisSummary.totalUnpaid.toLocaleString()} 원
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )
              ) : (
                /* ── (B) 회사별 / 과별 / 담당자별 분석 집계 테이블 ── */
                analysisList.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">조회 조건에 일치하는 분석 내역이 없습니다.</div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/90 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">회사명 (고객사)</th>
                        {reportType !== 'company' && <th className="p-3">부서 / 과</th>}
                        {reportType === 'contact' && <th className="p-3">담당자 (연락처/이메일)</th>}
                        {reportType === 'contact' && <th className="p-3">담당영업</th>}
                        <th className="p-3 text-center">건수</th>
                        <th className="p-3 text-right">총 매출액 (청구)</th>
                        <th className="p-3 text-right">총 수금액</th>
                        <th className="p-3 text-right font-black text-rose-700">미수금 잔액</th>
                        <th className="p-3 text-center">최근거래일</th>
                        <th className="p-3 text-center pr-4">상세보기</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {analysisList.map((item) => {
                        const hasUnpaid = item.unpaid > 0;
                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedAnalysisCustomer(item)}
                            className="hover:bg-sky-50/60 transition cursor-pointer group"
                          >
                            <td className="p-3 pl-4 font-bold text-slate-900 group-hover:text-sky-700">
                              <div className="flex items-center space-x-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600" />
                                <span>{item.orgName}</span>
                              </div>
                            </td>
                            {reportType !== 'company' && (
                              <td className="p-3 text-slate-600 font-medium">
                                {item.deptName || '-'}
                              </td>
                            )}
                            {reportType === 'contact' && (
                              <td className="p-3 text-slate-600">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-slate-800">{item.contactPerson || '-'}</span>
                                  {(item.phone || item.email) && (
                                    <span className="text-[11px] text-slate-400">
                                      {item.phone} {item.email ? `| ${item.email}` : ''}
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}
                            {reportType === 'contact' && (
                              <td className="p-3 text-slate-600">
                                {item.salesManager ? (
                                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200 text-[11px] font-semibold">
                                    {item.salesManager}
                                  </span>
                                ) : '-'}
                              </td>
                            )}
                            <td className="p-3 text-center font-mono font-semibold text-slate-700">
                              {item.count} 건
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              ₩ {item.sales.toLocaleString()} 원
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-600">
                              ₩ {item.payment.toLocaleString()} 원
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
                              {item.lastTradeDate || '-'}
                            </td>
                            <td className="p-3 text-center pr-4" onClick={(e) => { e.stopPropagation(); setSelectedAnalysisCustomer(item); }}>
                              <button
                                type="button"
                                className="px-2.5 py-1 bg-white hover:bg-sky-600 text-sky-700 hover:text-white border border-sky-300 rounded-lg text-[11px] font-bold shadow-xs transition"
                              >
                                일자별 장부
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-200 sticky bottom-0 z-10">
                      <tr>
                        <td
                          className="p-3 pl-4"
                          colSpan={reportType === 'contact' ? 4 : reportType === 'dept' ? 2 : 1}
                        >
                          합계 ({analysisList.length}개 대상)
                        </td>
                        <td className="p-3 text-center font-mono">
                          {analysisSummary.totalCount} 건
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900">
                          ₩ {analysisSummary.totalSales.toLocaleString()} 원
                        </td>
                        <td className="p-3 text-right font-mono text-emerald-700">
                          ₩ {analysisSummary.totalPayment.toLocaleString()} 원
                        </td>
                        <td className="p-3 text-right font-mono text-rose-700 font-black">
                          ₩ {analysisSummary.totalUnpaid.toLocaleString()} 원
                        </td>
                        <td className="p-3" colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                )
              )}
            </div>
          </div>

        </div>
      )}

      {/* ----------------- 모달 레이어 ----------------- */}

      {/* 0. 분석 탭 전용 일자별 고객 상세 장부 모달 */}
      {selectedAnalysisCustomer && (
        <CustomerDetailModal
          customer={selectedAnalysisCustomer}
          sales={sales}
          payments={payments}
          onClose={() => setSelectedAnalysisCustomer(null)}
        />
      )}

      {/* 1. 매출 등록/수정 모달 */}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingId ? '매출/견적 세부 내역 수정' : '신규 매출/견적 수동 등록'}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={toggleCalc}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-bold transition shadow-sm ${
                    showCalc ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="팝업 계산기 열기/닫기"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>계산기</span>
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
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

              {/* 검색 필드 추가 */}
              <div ref={customerDropdownRef} className="relative mb-2">
                <label className="block text-[11px] font-bold text-sky-700 mb-1">🔍 기존 등록 고객 검색하여 정보 불러오기</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="고객사명, 부서명, 담당자명으로 검색..."
                    value={customerSearchInput}
                    onChange={e => {
                      setCustomerSearchInput(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => {
                      if (customerSearchInput.trim()) setShowCustomerDropdown(true);
                    }}
                    className="w-full pl-8 pr-2.5 py-2 bg-white border border-sky-200 rounded-xl text-xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                  {customerSearchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchInput('');
                        setShowCustomerDropdown(false);
                      }}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {showCustomerDropdown && customerSearchInput.trim() && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
                    <div className="p-2 bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                      <span>검색 결과 ({customerSearchResults.length}건)</span>
                      <button
                        type="button"
                        onClick={() => setShowCustomerDropdown(false)}
                        className="text-slate-500 hover:text-slate-800 font-bold px-1.5 py-0.5 rounded hover:bg-slate-100 text-[11px]"
                      >
                        ✕ 닫기
                      </button>
                    </div>
                    {customerSearchResults.length > 0 ? (
                      customerSearchResults.map((c, idx) => (
                        <button
                          key={`${c.id}-${c.contact_id || idx}`}
                          type="button"
                          onClick={() => {
                            handleSelectCustomer(c);
                            setCustomerSearchInput('');
                          }}
                          className="w-full text-left p-2.5 hover:bg-sky-50 cursor-pointer flex flex-col transition"
                        >
                          <span className="font-bold text-slate-800">{c.name} {c.dept ? `(${c.dept})` : ''}</span>
                          <span className="text-[11px] text-slate-400">
                            {c.contact_person ? `담당: ${c.contact_person}` : ''} {c.phone ? `| ${c.phone}` : ''}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-500 text-[11px]">
                        검색 결과가 없습니다. 아래에 직접 기입해 주세요.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/50 relative">
                {/* 1. 고객사명 직접 입력 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">고객사명 *</label>
                  <input
                    type="text"
                    required
                    placeholder="고객사명 직접 입력"
                    value={formData.customer_name}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomerNameInput(val);
                      setFormData(prev => ({ ...prev, customer_name: val, customer_id: '' }));
                    }}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">일반번호</label>
                      <input
                        type="text"
                        placeholder="예: 033-123-4567"
                        value={formData.phone}
                        onFocus={() => setShowCustomerDropdown(false)}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">휴대전화</label>
                      <input
                        type="text"
                        placeholder="예: 010-1234-5678"
                        value={formData.mobile || ''}
                        onFocus={() => setShowCustomerDropdown(false)}
                        onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
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


              {/* ── 📅 일정 정보 (접수일 / 납품 예정일 / 납품 시간) : 작업명 위쪽에 배치 ── */}
              <div className="bg-slate-50/60 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 1. 접수일자 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" />
                      <span>접수일자 *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.receipt_date || formData.reg_date || today}
                      onChange={e => setFormData({ 
                        ...formData, 
                        receipt_date: e.target.value,
                        reg_date: e.target.value 
                      })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  {/* 2. 납품 예정일 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>납품 예정일 *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.delivery_date || today}
                      onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 3. 납품 시간 */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>납품 시간</span>
                      </label>
                      {formData.delivery_time ? (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, delivery_time: '' })}
                          className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold"
                        >
                          ✕ 시간미지정
                        </button>
                      ) : (
                        <span className="text-[10px] text-sky-600 font-bold">종일</span>
                      )}
                    </div>
                    <input
                      type="time"
                      value={formData.delivery_time || ''}
                      onChange={e => setFormData({ ...formData, delivery_time: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* ── 작업명 및 진행 상태 ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">작업명 (제목) *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 8월 소프트웨어 납품"
                    value={formData.title}
                    onFocus={() => setShowCustomerDropdown(false)}
                    onCompositionStart={() => { isComposingRef.current = true; }}
                    onCompositionEnd={e => { isComposingRef.current = false; setFormData(prev => ({ ...prev, title: e.target.value })); }}
                    onChange={e => { setFormData(prev => ({ ...prev, title: e.target.value })); }}
                    onBlur={() => { isComposingRef.current = false; }}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">진행 상태</label>
                  <select
                    value={formData.billing_schedule}
                    onChange={e => setFormData({ ...formData, billing_schedule: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="진행중">⏳ 진행중</option>
                    <option value="납품완료">🚚 납품완료</option>
                    <option value="청구완료">✅ 청구완료 (수금완료)</option>
                  </select>
                </div>
              </div>

              {/* ── 금액 정보 ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">금액 산출 및 입력</span>
                  <button
                    type="button"
                    onClick={toggleCalc}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>계산기로 계산하기</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">공급가액 (원)</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={formData.supply_price ? Number(formData.supply_price).toLocaleString() : ''}
                      onChange={e => handlePriceChange(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">총 청구금액 (VAT포함)</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={formData.total_price ? Number(formData.total_price).toLocaleString() : ''}
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



              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">작업 상세 내용</label>
                <textarea
                  rows={2}
                  placeholder="작업 상세 내용 입력"
                  value={formData.content}
                  onCompositionStart={() => { isComposingRef.current = true; }}
                  onCompositionEnd={e => { isComposingRef.current = false; setFormData(prev => ({ ...prev, content: e.target.value })); }}
                  onChange={e => { setFormData(prev => ({ ...prev, content: e.target.value })); }}
                  onBlur={() => { isComposingRef.current = false; }}
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
            await updateSales(updatedItem.id, updatedItem);
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