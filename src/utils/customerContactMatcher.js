/**
 * src/utils/customerContactMatcher.js
 * 
 * 고객사 및 담당자 지능형 매칭 & 최신 소속 자동 갱신 유틸리티
 * 
 * 1. 담당자명 + 연락처(일반전화/휴대폰 숫자 7자리 이상)가 동일한 경우:
 *    - 기존 등록된 담당자 및 고객사(기관)로 자동 판정 (중복 고객 등록 방지)
 *    - 고객사의 마스터 DB 소속(과명)을 이번에 새로 입력한 최신 과명으로 자동 갱신(UPDATE)
 *    - 담당자의 연락처/이메일 정보도 최신화
 * 
 * 2. 담당자가 없거나 연락처가 일치하지 않더라도 고객사명(기관명)이 일치하는 경우:
 *    - 동일 고객사로 판정
 *    - 새로 입력된 소속(과명)이 있으면 최신 과명으로 마스터 정보 갱신(UPDATE)
 *    - 담당자 정보 추가 또는 업데이트
 * 
 * 3. 완전 신규 고객사인 경우에만:
 *    - addCustomer()로 신규 고객사 등록
 *    - 담당자 정보가 있으면 addContact()로 등록
 * 
 * 4. 과거 납품 완료 및 기존 전표/매출 데이터:
 *    - 매출(sales)과 전표(job_orders) 테이블 자체에 저장된 'dept' 스냅샷을 100% 보존
 */

export const cleanPhoneDigits = (phone) => {
  if (!phone) return '';
  return String(phone).replace(/[^0-9]/g, '');
};

export async function resolveCustomerAndContact({
  customerName,
  dept,
  contactPerson,
  phone,
  mobile,
  email,
  salesManager,
  customers = [],
  contacts = [],
  addCustomer,
  updateCustomer,
  addContact,
  updateContact,
}) {
  const custName = (customerName || '').trim();
  const inputDept = (dept || '').trim();
  const inputContact = (contactPerson || '').trim();
  const inputPhoneClean = cleanPhoneDigits(phone);
  const inputMobileClean = cleanPhoneDigits(mobile);

  let matchedContact = null;
  let matchedCustomer = null;

  // 1단계: 담당자명 + 연락처(7자리 이상 일치) 기준 매칭 (최우선)
  if (inputContact && (inputPhoneClean.length >= 7 || inputMobileClean.length >= 7)) {
    matchedContact = (contacts || []).find(ct => {
      const ctName = (ct.name || '').trim().toLowerCase();
      if (ctName !== inputContact.toLowerCase()) return false;
      const ctPhoneClean = cleanPhoneDigits(ct.phone);
      const ctMobileClean = cleanPhoneDigits(ct.mobile);
      return (
        (inputPhoneClean.length >= 7 && (ctPhoneClean === inputPhoneClean || ctMobileClean === inputPhoneClean)) ||
        (inputMobileClean.length >= 7 && (ctPhoneClean === inputMobileClean || ctMobileClean === inputMobileClean))
      );
    });

    if (matchedContact && matchedContact.customer_id) {
      matchedCustomer = (customers || []).find(c => c.id === matchedContact.customer_id);
    }
  }

  // 2단계: 담당자 미매칭 시 고객사명(기관명) 기준 매칭
  if (!matchedCustomer && custName) {
    const custLow = custName.toLowerCase();
    // 2-1: 기관명 + 과명 완전 일치
    matchedCustomer = (customers || []).find(c =>
      (c.name || '').trim().toLowerCase() === custLow &&
      (c.dept || '').trim().toLowerCase() === inputDept.toLowerCase()
    );
    // 2-2: 기관명만 일치 (소속/과명이 바뀌었거나 다른 경우 동일 기관으로 처리)
    if (!matchedCustomer) {
      matchedCustomer = (customers || []).find(c =>
        (c.name || '').trim().toLowerCase() === custLow
      );
    }
    // 2-3: 기관명이 다른 기관명에 포함되거나 포함하는 경우 (예: "국립산림과학원" vs "국립산림과학원 (연구)")
    if (!matchedCustomer && custLow.length >= 4) {
      matchedCustomer = (customers || []).find(c => {
        const cNameLow = (c.name || '').trim().toLowerCase();
        return cNameLow.includes(custLow) || custLow.includes(cNameLow);
      });
    }
  }

  // 고객사를 찾았는데 matchedContact는 아직 못 찾은 경우, 해당 고객사 하위 담당자 중 이름 일치 검색
  if (matchedCustomer && !matchedContact && inputContact) {
    matchedContact = (contacts || []).find(ct =>
      ct.customer_id === matchedCustomer.id &&
      (ct.name || '').trim().toLowerCase() === inputContact.toLowerCase()
    );
  }

  let finalCustomerId = matchedCustomer?.id || '';

  // 3단계: 매칭 결과에 따른 마스터 갱신 또는 신규 등록
  if (matchedCustomer) {
    finalCustomerId = matchedCustomer.id;

    // 💡 [핵심] 신규 등록 시 소속(과명)이 입력되어 있고 기존 과명과 다르면 마지막에 등록한 소속 과명으로 갱신!
    if (inputDept && matchedCustomer.dept !== inputDept && typeof updateCustomer === 'function') {
      await updateCustomer(matchedCustomer.id, {
        ...matchedCustomer,
        dept: inputDept,
        contact_person: inputContact || matchedCustomer.contact_person || '',
        phone: phone || matchedCustomer.phone || '',
        email: email || matchedCustomer.email || '',
        sales_manager: salesManager || matchedCustomer.sales_manager || '',
      });
    }

    // 담당자 마스터 처리
    if (inputContact) {
      if (matchedContact && typeof updateContact === 'function') {
        // 기존 담당자의 연락처/이메일 최신화
        await updateContact(matchedContact.id, {
          ...matchedContact,
          phone: phone || matchedContact.phone || '',
          mobile: mobile || matchedContact.mobile || '',
          email: email || matchedContact.email || '',
        });
      } else if (!matchedContact && typeof addContact === 'function') {
        // 해당 고객사에 새 담당자로 추가
        await addContact({
          customer_id: finalCustomerId,
          name: inputContact,
          phone: phone || '',
          mobile: mobile || '',
          email: email || '',
        });
      }
    }
  } else {
    // 4단계: 완전 신규 고객사인 경우
    if (typeof addCustomer === 'function' && custName) {
      const newCust = await addCustomer({
        name: custName,
        dept: inputDept,
        contact_person: inputContact,
        phone: phone || '',
        email: email || '',
        sales_manager: salesManager || '',
      });
      finalCustomerId = newCust?.id || `CUST-${Date.now()}`;

      if (inputContact && typeof addContact === 'function') {
        await addContact({
          customer_id: finalCustomerId,
          name: inputContact,
          phone: phone || '',
          mobile: mobile || '',
          email: email || '',
        });
      }
    }
  }

  return {
    customerId: finalCustomerId,
    customerName: matchedCustomer?.name || custName,
    dept: inputDept || matchedCustomer?.dept || '',
    isExistingCustomer: !!matchedCustomer,
  };
}
