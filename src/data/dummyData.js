// src/data/dummyData.js

export const initialCustomers = [
  { id: 'CUST-001', name: '(주)테크솔루션', dept: '구매팀', contact_person: '김철수 부장', phone: '010-1234-5678' },
  { id: 'CUST-002', name: '한빛디자인', dept: '기획부', contact_person: '이영희 팀장', phone: '010-9876-5432' },
  { id: 'CUST-003', name: '미래글로벌', dept: '영업본부', contact_person: '박민수 과장', phone: '010-5555-4444' },
];

export const initialSales = [
  {
    id: 'SALE-101',
    reg_date: '2026-08-01',
    receipt_date: '2026-08-01',
    delivery_date: '2026-08-05',
    delivery_time: '14:00',
    customer_id: 'CUST-001',
    title: '웹사이트 개발 1차 납품',
    content: '반응형 UI 템플릿 개발 및 구글 연동',
    note: '특이사항 없음',
    billing_schedule: '청구완료',
    type: '매출',
    supply_price: 3000000,
    tax: 300000,
    total_price: 3300000,
    calendar_synced: true,
    superthread_synced: true
  },
  {
    id: 'SALE-102',
    reg_date: '2026-08-03',
    receipt_date: '2026-08-03',
    delivery_date: '2026-08-10',
    delivery_time: '10:00',
    customer_id: 'CUST-002',
    title: '브랜드 로고 디자인',
    content: 'CI/BI 시안 3종 제작',
    note: '수정요청 접수중',
    billing_schedule: '청구대기',
    type: '견적',
    supply_price: 1500000,
    tax: 150000,
    total_price: 1650000,
    calendar_synced: true,
    superthread_synced: false
  },
  {
    id: 'SALE-103',
    reg_date: '2026-08-05',
    receipt_date: '2026-08-05',
    delivery_date: '2026-08-12',
    delivery_time: '17:00',
    customer_id: 'CUST-003',
    title: '서버 구축 시스템',
    content: '클라우드 인프라 세팅',
    note: '납품 예정',
    billing_schedule: '청구완료',
    type: '매출',
    supply_price: 5000000,
    tax: 500000,
    total_price: 5500000,
    calendar_synced: false,
    superthread_synced: false
  }
];

export const initialPayments = [
  { id: 'PAY-201', payment_date: '2026-08-07', customer_id: 'CUST-001', amount: 2000000, method: '계좌이체' },
  { id: 'PAY-202', payment_date: '2026-08-09', customer_id: 'CUST-003', amount: 1500000, method: '카드결제' },
];