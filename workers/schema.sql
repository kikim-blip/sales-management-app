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

-- 5. 사원 관리
CREATE TABLE IF NOT EXISTS staffs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_code TEXT UNIQUE,
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
