-- workers/migrations/0002_update_job_order_3390.sql
-- 작업전표 44-261022-3390 (자원순환기본계획) 담당자 정정 및 마스터 데이터 정규화

UPDATE job_orders
SET
  client_contact_person = '박윤균 주무관',
  client_phone = '010-5622-3779',
  dept = '자원순환국',
  title = '자원순환기본계획',
  updated_at = datetime('now', '+9 hours')
WHERE id = '44-261022-3390' OR code_number = '44-261022-3390' OR title LIKE '%자원순환기본계획%';

-- 매출 데이터 매칭 확인 및 정정
UPDATE sales
SET
  contact_person = '박윤균 주무관',
  phone = '010-5622-3779',
  updated_at = datetime('now', '+9 hours')
WHERE title LIKE '%자원순환기본계획%';
