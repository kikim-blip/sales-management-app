-- Cloudflare D1 Schema for Sales Management App
-- 경성문화사 영업미수관리 PWA

-- 1. 고객(거래처) 관리
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dept TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  sales_manager TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 2. 매출/견적 관리
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  reg_date TEXT DEFAULT '',
  receipt_date TEXT DEFAULT '',
  delivery_date TEXT DEFAULT '',
  delivery_time TEXT DEFAULT '',
  customer_id TEXT DEFAULT '',
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  note TEXT DEFAULT '',
  billing_schedule TEXT DEFAULT '청구완료',
  type TEXT DEFAULT '매출',
  supply_price REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  total_price REAL DEFAULT 0,
  calendar_synced INTEGER DEFAULT 0,
  superthread_synced INTEGER DEFAULT 0,
  dept TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 3. 수금 관리
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  payment_date TEXT DEFAULT '',
  customer_id TEXT DEFAULT '',
  amount REAL DEFAULT 0,
  method TEXT DEFAULT '계좌이체',
  dept TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 4. 작업전표 관리
CREATE TABLE IF NOT EXISTS job_orders (
  id TEXT PRIMARY KEY,
  code_number TEXT UNIQUE,
  manager_name TEXT DEFAULT '',
  receipt_date TEXT DEFAULT '',
  delivery_date TEXT DEFAULT '',
  delivery_time TEXT DEFAULT '',
  customer_id TEXT DEFAULT '',
  dept TEXT DEFAULT '',
  title TEXT DEFAULT '',
  spec TEXT DEFAULT '',
  pages TEXT DEFAULT '',
  duplex TEXT DEFAULT '',
  quantity REAL DEFAULT 0,
  estimated_price REAL DEFAULT 0,
  client_contact_person TEXT DEFAULT '',
  client_phone TEXT DEFAULT '',
  client_email TEXT DEFAULT '',
  email_receipt_time TEXT DEFAULT '',
  cover_job TEXT DEFAULT '',
  cover_paper TEXT DEFAULT '',
  cover_print TEXT DEFAULT '',
  coating TEXT DEFAULT '',
  inner_job TEXT DEFAULT '',
  inner_paper TEXT DEFAULT '',
  inner_print TEXT DEFAULT '',
  interleaf_paper TEXT DEFAULT '',
  binding TEXT DEFAULT '',
  draft_email TEXT DEFAULT '',
  draft_group TEXT DEFAULT '',
  mail_sender TEXT DEFAULT '',
  cover_proof_date TEXT DEFAULT '',
  inner_proof_date TEXT DEFAULT '',
  proof_method TEXT DEFAULT '',
  planning TEXT DEFAULT '',
  photography TEXT DEFAULT '',
  illustration TEXT DEFAULT '',
  copyright_web TEXT DEFAULT '',
  production_progress TEXT DEFAULT '',
  delivery_destination TEXT DEFAULT '',
  cover_related TEXT DEFAULT '',
  inner_related TEXT DEFAULT '',
  request_note TEXT DEFAULT '',
  editor_name TEXT DEFAULT '',
  designer_name TEXT DEFAULT '',
  status TEXT DEFAULT '의뢰접수',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 5. 사원 관리 (이메일 및 성명 기준 식별, 사원번호 팀내 공유 가능)
CREATE TABLE IF NOT EXISTS staffs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_code TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  company_code TEXT DEFAULT '3',
  email TEXT UNIQUE,
  dept TEXT DEFAULT '',
  position TEXT DEFAULT '담당자',
  team TEXT DEFAULT '',
  role TEXT DEFAULT '일반사원',
  status TEXT DEFAULT '승인완료',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 6. 부서 목록
CREATE TABLE IF NOT EXISTS departments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 7. 팀 목록
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 기본 부서 데이터 삽입
INSERT OR IGNORE INTO departments (name) VALUES
  ('세종영업본부'),
  ('기획예산부'),
  ('생산관리부'),
  ('영업본부');

-- 기본 팀 데이터 삽입
INSERT OR IGNORE INTO teams (name) VALUES
  ('영업1조'),
  ('영업2조'),
  ('영업3조'),
  ('영업4조'),
  ('영업1팀'),
  ('영업2팀'),
  ('기획팀'),
  ('생산팀');

-- 기본 관리자 및 샘플 데이터 삽입
INSERT OR IGNORE INTO staffs (user_code, user_name, company_code, email, dept, position, team, role, status, updated_at)
VALUES ('44', '김광일', '3', 'richkikim@gmail.com', '세종영업본부', '담당자', '영업1조', '관리자', '승인완료', datetime('now', 'localtime'));

INSERT OR IGNORE INTO customers (id, name, dept, contact_person, phone, email, sales_manager, updated_at)
VALUES ('CUST-001', '(주)테크솔루션', '영업본부', '김철수 부장', '010-1234-5678', 'tech@sample.com', '김광일', datetime('now', 'localtime'));
INSERT OR IGNORE INTO customers (id, name, dept, contact_person, phone, email, sales_manager, updated_at)
VALUES ('CUST-002', '한빛디자인', '기획부', '이영희 팀장', '010-9876-5432', 'design@sample.com', '김광일', datetime('now', 'localtime'));
INSERT OR IGNORE INTO customers (id, name, dept, contact_person, phone, email, sales_manager, updated_at)
VALUES ('CUST-003', '미래글로벌', '영업본부', '박민수 과장', '010-5555-4444', 'future@sample.com', '김광일', datetime('now', 'localtime'));

INSERT OR IGNORE INTO sales (id, reg_date, receipt_date, delivery_date, delivery_time, customer_id, title, content, note, billing_schedule, type, supply_price, tax, total_price, calendar_synced, superthread_synced, dept, updated_at)
VALUES ('SALE-101', '2026-08-01', '2026-08-01', '2026-08-05', '14:00', 'CUST-001', '웹사이트 개발 1차 납품', '반응형 UI 템플릿 개발 및 구글 연동', '특이사항 없음', '청구완료', '매출', 3000000, 300000, 3300000, 1, 1, '영업본부', datetime('now', 'localtime'));
INSERT OR IGNORE INTO sales (id, reg_date, receipt_date, delivery_date, delivery_time, customer_id, title, content, note, billing_schedule, type, supply_price, tax, total_price, calendar_synced, superthread_synced, dept, updated_at)
VALUES ('SALE-102', '2026-08-03', '2026-08-03', '2026-08-10', '10:00', 'CUST-002', '브랜드 로고 디자인', 'CI/BI 시안 3종 제작', '수정요청 접수중', '청구대기', '견적', 1500000, 150000, 1650000, 1, 0, '기획부', datetime('now', 'localtime'));
INSERT OR IGNORE INTO sales (id, reg_date, receipt_date, delivery_date, delivery_time, customer_id, title, content, note, billing_schedule, type, supply_price, tax, total_price, calendar_synced, superthread_synced, dept, updated_at)
VALUES ('SALE-103', '2026-08-05', '2026-08-05', '2026-08-12', '17:00', 'CUST-003', '서버 구축 시스템', '클라우드 인프라 세팅', '납품 예정', '청구완료', '매출', 5000000, 500000, 5500000, 0, 0, '영업본부', datetime('now', 'localtime'));

INSERT OR IGNORE INTO payments (id, payment_date, customer_id, amount, method, dept, updated_at)
VALUES ('PAY-201', '2026-08-07', 'CUST-001', 2000000, '계좌이체', '영업본부', datetime('now', 'localtime'));
INSERT OR IGNORE INTO payments (id, payment_date, customer_id, amount, method, dept, updated_at)
VALUES ('PAY-202', '2026-08-09', 'CUST-003', 1500000, '카드결제', '영업본부', datetime('now', 'localtime'));
