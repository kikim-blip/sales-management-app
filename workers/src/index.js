/**
 * Cloudflare Workers API Server
 * 경성문화사 영업미수관리 PWA - D1 Database REST API
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

function error(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: CORS_HEADERS,
  });
}

// ─── ID 생성 헬퍼 ───────────────────────────────────────────────
function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

// ─── 라우터 ─────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      // ── CUSTOMERS ──────────────────────────────────────────────
      if (path === '/api/customers') {
        if (method === 'GET') return await getCustomers(env.DB);
        if (method === 'POST') return await createCustomer(env.DB, request);
      }
      const custMatch = path.match(/^\/api\/customers\/(.+)$/);
      if (custMatch) {
        const id = decodeURIComponent(custMatch[1]);
        if (method === 'PUT') return await updateCustomer(env.DB, id, request);
        if (method === 'DELETE') return await deleteCustomer(env.DB, id);
      }

      // ── SALES ──────────────────────────────────────────────────
      if (path === '/api/sales') {
        if (method === 'GET') return await getSales(env.DB, url);
        if (method === 'POST') return await createSale(env.DB, request);
      }
      const saleMatch = path.match(/^\/api\/sales\/(.+)$/);
      if (saleMatch) {
        const id = decodeURIComponent(saleMatch[1]);
        if (method === 'PUT') return await updateSale(env.DB, id, request);
        if (method === 'DELETE') return await deleteSale(env.DB, id);
      }

      // ── PAYMENTS ───────────────────────────────────────────────
      if (path === '/api/payments') {
        if (method === 'GET') return await getPayments(env.DB, url);
        if (method === 'POST') return await createPayment(env.DB, request);
      }
      const payMatch = path.match(/^\/api\/payments\/(.+)$/);
      if (payMatch) {
        const id = decodeURIComponent(payMatch[1]);
        if (method === 'PUT') return await updatePayment(env.DB, id, request);
        if (method === 'DELETE') return await deletePayment(env.DB, id);
      }

      // ── JOB ORDERS ─────────────────────────────────────────────
      if (path === '/api/job-orders') {
        if (method === 'GET') return await getJobOrders(env.DB, url);
        if (method === 'POST') return await createJobOrder(env.DB, request);
      }
      const joMatch = path.match(/^\/api\/job-orders\/(.+)$/);
      if (joMatch) {
        const id = decodeURIComponent(joMatch[1]);
        if (method === 'PUT') return await updateJobOrder(env.DB, id, request);
        if (method === 'DELETE') return await deleteJobOrder(env.DB, id);
      }

      // ── STAFFS ─────────────────────────────────────────────────
      if (path === '/api/staffs') {
        if (method === 'GET') return await getStaffs(env.DB);
        if (method === 'POST') return await upsertStaff(env.DB, request);
      }
      const staffMatch = path.match(/^\/api\/staffs\/(.+)$/);
      if (staffMatch) {
        const id = decodeURIComponent(staffMatch[1]);
        if (method === 'DELETE') return await deleteStaff(env.DB, id);
      }

      // ── DEPARTMENTS ────────────────────────────────────────────
      if (path === '/api/departments') {
        if (method === 'GET') return await getDepartments(env.DB);
        if (method === 'POST') return await createDepartment(env.DB, request);
      }
      const deptMatch = path.match(/^\/api\/departments\/(.+)$/);
      if (deptMatch) {
        const name = decodeURIComponent(deptMatch[1]);
        if (method === 'PUT') return await updateDepartment(env.DB, name, request);
        if (method === 'DELETE') return await deleteDepartment(env.DB, name);
      }

      // ── TEAMS ──────────────────────────────────────────────────
      if (path === '/api/teams') {
        if (method === 'GET') return await getTeams(env.DB);
        if (method === 'POST') return await createTeam(env.DB, request);
      }
      const teamMatch = path.match(/^\/api\/teams\/(.+)$/);
      if (teamMatch) {
        const name = decodeURIComponent(teamMatch[1]);
        if (method === 'PUT') return await updateTeam(env.DB, name, request);
        if (method === 'DELETE') return await deleteTeam(env.DB, name);
      }

      // ── BATCH FETCH (전체 데이터 1회 조회) ─────────────────────
      if (path === '/api/batch' && method === 'GET') {
        return await batchFetch(env.DB);
      }

      return error('Not Found', 404);
    } catch (err) {
      console.error('API Error:', err);
      return error(err.message || 'Internal Server Error', 500);
    }
  },
};

// ════════════════════════════════════════════════════════════════
// CUSTOMERS
// ════════════════════════════════════════════════════════════════
async function getCustomers(db) {
  const { results } = await db.prepare('SELECT * FROM customers ORDER BY name').all();
  return json(results);
}

async function createCustomer(db, request) {
  const body = await request.json();
  const id = body.id || generateId('CUST');
  await db.prepare(
    `INSERT OR REPLACE INTO customers (id, name, dept, contact_person, phone, email, sales_manager, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`
  ).bind(id, body.name || '', body.dept || '', body.contact_person || '',
         body.phone || '', body.email || '', body.sales_manager || '').run();
  const row = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
  return json(row, 201);
}

async function updateCustomer(db, id, request) {
  const body = await request.json();
  await db.prepare(
    `UPDATE customers SET name=?, dept=?, contact_person=?, phone=?, email=?, sales_manager=?, updated_at=datetime('now','localtime')
     WHERE id=?`
  ).bind(body.name || '', body.dept || '', body.contact_person || '',
         body.phone || '', body.email || '', body.sales_manager || '', id).run();
  const row = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first();
  return json(row);
}

async function deleteCustomer(db, id) {
  await db.prepare('DELETE FROM customers WHERE id = ?').bind(id).run();
  return json({ success: true });
}

// ════════════════════════════════════════════════════════════════
// SALES
// ════════════════════════════════════════════════════════════════
async function getSales(db, url) {
  const customerId = url.searchParams.get('customer_id');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let query = 'SELECT * FROM sales WHERE 1=1';
  const params = [];
  if (customerId) { query += ' AND customer_id = ?'; params.push(customerId); }
  if (from) { query += ' AND delivery_date >= ?'; params.push(from); }
  if (to) { query += ' AND delivery_date <= ?'; params.push(to); }
  query += ' ORDER BY reg_date DESC';

  const stmt = db.prepare(query);
  const { results } = await stmt.bind(...params).all();
  return json(results);
}

async function createSale(db, request) {
  const body = await request.json();
  const id = body.id || generateId('SALE');
  await db.prepare(
    `INSERT OR REPLACE INTO sales
     (id, reg_date, receipt_date, delivery_date, delivery_time, customer_id, title, content, note,
      billing_schedule, type, supply_price, tax, total_price, calendar_synced, superthread_synced, dept, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now','localtime'))`
  ).bind(id, body.reg_date||'', body.receipt_date||'', body.delivery_date||'',
         body.delivery_time||'', body.customer_id||'', body.title||'', body.content||'',
         body.note||'', body.billing_schedule||'청구완료', body.type||'매출',
         body.supply_price||0, body.tax||0, body.total_price||0,
         body.calendar_synced?1:0, body.superthread_synced?1:0, body.dept||'').run();
  const row = await db.prepare('SELECT * FROM sales WHERE id = ?').bind(id).first();
  return json(row, 201);
}

async function updateSale(db, id, request) {
  const body = await request.json();
  await db.prepare(
    `UPDATE sales SET reg_date=?, receipt_date=?, delivery_date=?, delivery_time=?, customer_id=?,
     title=?, content=?, note=?, billing_schedule=?, type=?, supply_price=?, tax=?, total_price=?,
     calendar_synced=?, superthread_synced=?, dept=?, updated_at=datetime('now','localtime') WHERE id=?`
  ).bind(body.reg_date||'', body.receipt_date||'', body.delivery_date||'', body.delivery_time||'',
         body.customer_id||'', body.title||'', body.content||'', body.note||'',
         body.billing_schedule||'청구완료', body.type||'매출', body.supply_price||0,
         body.tax||0, body.total_price||0, body.calendar_synced?1:0,
         body.superthread_synced?1:0, body.dept||'', id).run();
  const row = await db.prepare('SELECT * FROM sales WHERE id = ?').bind(id).first();
  return json(row);
}

async function deleteSale(db, id) {
  await db.prepare('DELETE FROM sales WHERE id = ?').bind(id).run();
  return json({ success: true });
}

// ════════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════════
async function getPayments(db, url) {
  const customerId = url.searchParams.get('customer_id');
  let query = 'SELECT * FROM payments WHERE 1=1';
  const params = [];
  if (customerId) { query += ' AND customer_id = ?'; params.push(customerId); }
  query += ' ORDER BY payment_date DESC';
  const { results } = await db.prepare(query).bind(...params).all();
  return json(results);
}

async function createPayment(db, request) {
  const body = await request.json();
  const id = body.id || generateId('PAY');
  await db.prepare(
    `INSERT OR REPLACE INTO payments (id, payment_date, customer_id, amount, method, dept, updated_at)
     VALUES (?,?,?,?,?,?,datetime('now','localtime'))`
  ).bind(id, body.payment_date||'', body.customer_id||'', body.amount||0,
         body.method||'계좌이체', body.dept||'').run();
  const row = await db.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first();
  return json(row, 201);
}

async function updatePayment(db, id, request) {
  const body = await request.json();
  await db.prepare(
    `UPDATE payments SET payment_date=?, customer_id=?, amount=?, method=?, dept=?, updated_at=datetime('now','localtime') WHERE id=?`
  ).bind(body.payment_date||'', body.customer_id||'', body.amount||0,
         body.method||'계좌이체', body.dept||'', id).run();
  const row = await db.prepare('SELECT * FROM payments WHERE id = ?').bind(id).first();
  return json(row);
}

async function deletePayment(db, id) {
  await db.prepare('DELETE FROM payments WHERE id = ?').bind(id).run();
  return json({ success: true });
}

// ════════════════════════════════════════════════════════════════
// JOB ORDERS (작업전표)
// ════════════════════════════════════════════════════════════════
async function getJobOrders(db, url) {
  const dept = url.searchParams.get('dept');
  let query = 'SELECT * FROM job_orders WHERE 1=1';
  const params = [];
  if (dept && dept !== 'ALL') { query += ' AND dept = ?'; params.push(dept); }
  query += ' ORDER BY receipt_date DESC';
  const { results } = await db.prepare(query).bind(...params).all();
  return json(results);
}

async function createJobOrder(db, request) {
  const body = await request.json();
  const id = body.code_number || body.id || generateId('JO');
  await db.prepare(
    `INSERT OR REPLACE INTO job_orders
     (id, code_number, manager_name, receipt_date, delivery_date, delivery_time,
      customer_id, dept, title, spec, pages, duplex, quantity, estimated_price,
      client_contact_person, client_phone, client_email, email_receipt_time,
      cover_job, cover_paper, cover_print, coating, inner_job, inner_paper, inner_print,
      interleaf_paper, binding, draft_email, draft_group, mail_sender,
      cover_proof_date, inner_proof_date, proof_method, planning, photography,
      illustration, copyright_web, production_progress, delivery_destination,
      cover_related, inner_related, request_note, editor_name, designer_name, status, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now','localtime'))`
  ).bind(id, id, body.manager_name||'', body.receipt_date||'', body.delivery_date||'',
         body.delivery_time||'', body.customer_id||'', body.dept||'', body.title||'',
         body.spec||'', body.pages||'', body.duplex||'', body.quantity||0, body.estimated_price||0,
         body.client_contact_person||'', body.client_phone||'', body.client_email||'',
         body.email_receipt_time||'', body.cover_job||'', body.cover_paper||'',
         body.cover_print||'', body.coating||'', body.inner_job||'', body.inner_paper||'',
         body.inner_print||'', body.interleaf_paper||'', body.binding||'',
         body.draft_email||'', body.draft_group||'', body.mail_sender||'',
         body.cover_proof_date||'', body.inner_proof_date||'', body.proof_method||'',
         body.planning||'', body.photography||'', body.illustration||'',
         body.copyright_web||'', body.production_progress||'', body.delivery_destination||'',
         body.cover_related||'', body.inner_related||'', body.request_note||'',
         body.editor_name||'', body.designer_name||'', body.status||'의뢰접수').run();
  const row = await db.prepare('SELECT * FROM job_orders WHERE id = ?').bind(id).first();
  return json(row, 201);
}

async function updateJobOrder(db, id, request) {
  const body = await request.json();
  await db.prepare(
    `UPDATE job_orders SET
     manager_name=?, receipt_date=?, delivery_date=?, delivery_time=?, customer_id=?, dept=?,
     title=?, spec=?, pages=?, duplex=?, quantity=?, estimated_price=?,
     client_contact_person=?, client_phone=?, client_email=?, email_receipt_time=?,
     cover_job=?, cover_paper=?, cover_print=?, coating=?, inner_job=?, inner_paper=?,
     inner_print=?, interleaf_paper=?, binding=?, draft_email=?, draft_group=?, mail_sender=?,
     cover_proof_date=?, inner_proof_date=?, proof_method=?, planning=?, photography=?,
     illustration=?, copyright_web=?, production_progress=?, delivery_destination=?,
     cover_related=?, inner_related=?, request_note=?, editor_name=?, designer_name=?,
     status=?, updated_at=datetime('now','localtime') WHERE id=? OR code_number=?`
  ).bind(body.manager_name||'', body.receipt_date||'', body.delivery_date||'',
         body.delivery_time||'', body.customer_id||'', body.dept||'', body.title||'',
         body.spec||'', body.pages||'', body.duplex||'', body.quantity||0, body.estimated_price||0,
         body.client_contact_person||'', body.client_phone||'', body.client_email||'',
         body.email_receipt_time||'', body.cover_job||'', body.cover_paper||'',
         body.cover_print||'', body.coating||'', body.inner_job||'', body.inner_paper||'',
         body.inner_print||'', body.interleaf_paper||'', body.binding||'',
         body.draft_email||'', body.draft_group||'', body.mail_sender||'',
         body.cover_proof_date||'', body.inner_proof_date||'', body.proof_method||'',
         body.planning||'', body.photography||'', body.illustration||'',
         body.copyright_web||'', body.production_progress||'', body.delivery_destination||'',
         body.cover_related||'', body.inner_related||'', body.request_note||'',
         body.editor_name||'', body.designer_name||'', body.status||'의뢰접수', id, id).run();
  const row = await db.prepare('SELECT * FROM job_orders WHERE id = ?').bind(id).first();
  return json(row);
}

async function deleteJobOrder(db, id) {
  await db.prepare('DELETE FROM job_orders WHERE id = ? OR code_number = ?').bind(id, id).run();
  return json({ success: true });
}

// ════════════════════════════════════════════════════════════════
// STAFFS (사원 관리)
// ════════════════════════════════════════════════════════════════
async function getStaffs(db) {
  const { results } = await db.prepare(
    "SELECT * FROM staffs WHERE (user_name != '' OR user_code != '' OR email != '') ORDER BY user_name"
  ).all();
  // 프론트엔드 호환 형태로 변환
  return json(results.map(s => ({
    userCode: s.user_code,
    userName: s.user_name,
    companyCode: s.company_code,
    email: s.email,
    dept: s.dept,
    position: s.position,
    team: s.team,
    role: s.role,
    status: s.status,
  })));
}

async function upsertStaff(db, request) {
  const body = await request.json();
  // email 또는 userCode 기준으로 upsert
  await db.prepare(
    `INSERT INTO staffs (user_code, user_name, company_code, email, dept, position, team, role, status, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,datetime('now','localtime'))
     ON CONFLICT(email) DO UPDATE SET
       user_code=excluded.user_code, user_name=excluded.user_name,
       company_code=excluded.company_code, dept=excluded.dept,
       position=excluded.position, team=excluded.team,
       role=excluded.role, status=excluded.status,
       updated_at=datetime('now','localtime')`
  ).bind(
    body.userCode||'', body.userName||'', body.companyCode||'3',
    (body.email||'').toLowerCase().trim(), body.dept||'', body.position||'담당자',
    body.team||body.dept||'', body.role||'일반사원', body.status||'승인완료'
  ).run();
  return json({ success: true }, 201);
}

async function deleteStaff(db, identifier) {
  await db.prepare(
    'DELETE FROM staffs WHERE user_code = ? OR email = ? OR user_name = ?'
  ).bind(identifier, identifier, identifier).run();
  return json({ success: true });
}

// ════════════════════════════════════════════════════════════════
// DEPARTMENTS & TEAMS
// ════════════════════════════════════════════════════════════════
async function getDepartments(db) {
  const { results } = await db.prepare('SELECT name FROM departments ORDER BY id').all();
  return json(results.map(r => r.name));
}

async function createDepartment(db, request) {
  const { name } = await request.json();
  await db.prepare('INSERT OR IGNORE INTO departments (name) VALUES (?)').bind(name).run();
  return json({ success: true }, 201);
}

async function updateDepartment(db, oldName, request) {
  const { newName } = await request.json();
  await db.prepare('UPDATE departments SET name=? WHERE name=?').bind(newName, oldName).run();
  await db.prepare("UPDATE staffs SET dept=? WHERE dept=?").bind(newName, oldName).run();
  return json({ success: true });
}

async function deleteDepartment(db, name) {
  await db.prepare('DELETE FROM departments WHERE name=?').bind(name).run();
  return json({ success: true });
}

async function getTeams(db) {
  const { results } = await db.prepare('SELECT name FROM teams ORDER BY id').all();
  return json(results.map(r => r.name));
}

async function createTeam(db, request) {
  const { name } = await request.json();
  await db.prepare('INSERT OR IGNORE INTO teams (name) VALUES (?)').bind(name).run();
  return json({ success: true }, 201);
}

async function updateTeam(db, oldName, request) {
  const { newName } = await request.json();
  await db.prepare('UPDATE teams SET name=? WHERE name=?').bind(newName, oldName).run();
  await db.prepare("UPDATE staffs SET team=? WHERE team=?").bind(newName, oldName).run();
  return json({ success: true });
}

async function deleteTeam(db, name) {
  await db.prepare('DELETE FROM teams WHERE name=?').bind(name).run();
  return json({ success: true });
}

// ════════════════════════════════════════════════════════════════
// BATCH FETCH (프론트엔드 초기 로딩 - 1회 요청으로 전체 조회)
// ════════════════════════════════════════════════════════════════
async function batchFetch(db) {
  const [customers, sales, payments, jobOrders, staffsRaw, departments, teams] = await Promise.all([
    db.prepare('SELECT * FROM customers ORDER BY name').all(),
    db.prepare('SELECT * FROM sales ORDER BY reg_date DESC').all(),
    db.prepare('SELECT * FROM payments ORDER BY payment_date DESC').all(),
    db.prepare('SELECT * FROM job_orders ORDER BY receipt_date DESC').all(),
    db.prepare("SELECT * FROM staffs WHERE user_name != '' OR user_code != '' OR email != '' ORDER BY user_name").all(),
    db.prepare('SELECT name FROM departments ORDER BY id').all(),
    db.prepare('SELECT name FROM teams ORDER BY id').all(),
  ]);

  return json({
    customers: customers.results,
    sales: sales.results.map(s => ({
      ...s,
      calendar_synced: s.calendar_synced === 1,
      superthread_synced: s.superthread_synced === 1,
    })),
    payments: payments.results,
    jobOrders: jobOrders.results,
    staffs: staffsRaw.results.map(s => ({
      userCode: s.user_code,
      userName: s.user_name,
      companyCode: s.company_code,
      email: s.email,
      dept: s.dept,
      position: s.position,
      team: s.team,
      role: s.role,
      status: s.status,
    })),
    departments: departments.results.map(r => r.name),
    teams: teams.results.map(r => r.name),
  });
}
