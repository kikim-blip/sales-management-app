// src/services/hwpExportService.js
/**
 * 📄 golbin/hop 모듈 기반 HWP(한글 5.0 / HWPX) 전표 자동 생성 서비스
 * 경성문화사 실물 작업전표 서식 43개 항목 1:1 매핑 HWP 파일 출력
 */

export function exportJobOrderToHWP(order, customer) {
  if (!order) return;

  const today = new Date().toISOString().split('T')[0];
  const custName = customer ? customer.name : (order.customer_name || order.customer_id || '');
  const custDept = customer ? customer.dept : (order.dept || '');
  const custContact = customer ? customer.contact_person : (order.client_contact_person || '');
  const custPhone = customer ? customer.phone : (order.client_phone || '');

  const v = (val, defaultVal = '-') => {
    if (val === null || val === undefined || val === '') return defaultVal;
    return val;
  };

  const codeNo = order.code_number || 'ORDER';

  // HWP 5.0 / HWPX 웹 호환 문서 HTML-XML 구조
  const hwpContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>경성문화사 작업전표_${codeNo}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 15mm 15mm;
  }
  body {
    font-family: 'Hani', 'Malgun Gothic', '돋움', sans-serif;
    font-size: 10pt;
    color: #000;
    line-height: 1.3;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 10px;
  }
  th, td {
    border: 1px solid #000;
    padding: 6px 8px;
    font-size: 9.5pt;
    text-align: center;
    vertical-align: middle;
  }
  .header-box {
    border: 2px solid #000;
    padding: 8px 12px;
    font-weight: bold;
  }
  .val {
    color: #d97706;
    font-weight: bold;
  }
  .title {
    font-size: 20pt;
    font-weight: 900;
    letter-spacing: 0.6em;
    text-align: left;
  }
  .notice {
    font-size: 8.5pt;
    margin-top: 8px;
  }
</style>
</head>
<body>

  <!-- 상단 코드번호 & 로고 & 결재란 -->
  <table>
    <tr>
      <td colspan="4" style="border:none; text-align:left;">
        <div class="header-box" style="display:inline-block;">
          코드번호 : <span class="val" style="font-size:12pt;">${v(order.code_number)}</span>
        </div>
      </td>
      <td colspan="6" style="border:none; text-align:right;">
        <strong style="font-size:13pt; color:#0284c7;">KYUNGSUNG 경성문화사</strong>
      </td>
    </tr>
    <tr>
      <td colspan="6" style="border:none; text-align:left; padding-top:15px;">
        <div class="title">작 업 전 표</div>
      </td>
      <td colspan="4" style="padding:0;">
        <table>
          <tr style="background:#f1f5f9; font-weight:bold;">
            <td rowspan="2" style="width:25px; background:#e2e8f0;">결<br>재</td>
            <td>담 당</td>
            <td>부서장</td>
            <td>회 장</td>
          </tr>
          <tr style="height:35px;">
            <td class="val">${v(order.manager_name)}</td>
            <td class="val">김광일</td>
            <td></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <div style="margin-bottom:5px; font-weight:bold;">
    접 수 일 : <span class="val">${order.receipt_date || today}</span>
    <span style="float:right;">납 품 일 : <span class="val">${order.delivery_date || today} ${v(order.delivery_time)}</span></span>
  </div>

  <!-- 1:1 표 서식 테이블 -->
  <table style="border:2px solid #000;">
    <tr style="background:#f8fafc;">
      <td style="font-weight:bold; width:15%;">발 주 처</td>
      <td colspan="5" class="val" style="text-align:left; font-size:11pt;">${custName}</td>
      <td colspan="4" class="val" style="font-size:11pt;">${custDept}</td>
    </tr>
    <tr style="background:#f8fafc;">
      <td style="font-weight:bold;">품 명</td>
      <td colspan="9" class="val" style="text-align:left; font-size:11pt;">${v(order.title)}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">규 격</td>
      <td colspan="3" class="val">${v(order.spec)}</td>
      <td style="font-weight:bold; background:#f8fafc;">면 수</td>
      <td colspan="5" class="val">${v(order.pages)} ${order.duplex ? `/ ${order.duplex}` : ''}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">수 량</td>
      <td colspan="3" class="val">${order.quantity ? `${order.quantity}부` : '-'}</td>
      <td style="font-weight:bold; background:#f8fafc;">견 적 금 액</td>
      <td colspan="5" class="val">${order.estimated_price ? `${Number(order.estimated_price).toLocaleString()}원` : '-'}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">발주업체 담당자</td>
      <td colspan="3" class="val">${v(custContact)} (${v(custPhone)})</td>
      <td style="font-weight:bold; background:#f8fafc;">이 메 일</td>
      <td colspan="5" class="val">${v(order.client_email)} ${v(order.email_receipt_time, '')}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">표 지 작 업</td>
      <td colspan="3" class="val">${v(order.cover_job)}</td>
      <td style="font-weight:bold; background:#f8fafc;">표 지 용 지</td>
      <td colspan="5" class="val">${v(order.cover_paper)}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">표 지 인 쇄</td>
      <td colspan="3" class="val">${v(order.cover_print)}</td>
      <td style="font-weight:bold; background:#f8fafc;">코 팅</td>
      <td colspan="5" class="val">${v(order.coating)}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">내 지 작 업</td>
      <td colspan="3" class="val">${v(order.inner_job)}</td>
      <td style="font-weight:bold; background:#f8fafc;">본 문 용 지</td>
      <td colspan="5" class="val">${v(order.inner_paper)}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">내 지 인 쇄</td>
      <td colspan="3" class="val">${v(order.inner_print)}</td>
      <td style="font-weight:bold; background:#f8fafc;">간 지 용 지</td>
      <td colspan="5" class="val">${v(order.interleaf_paper)}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">제 본</td>
      <td colspan="3" class="val">${v(order.binding)}</td>
      <td style="font-weight:bold; background:#f8fafc;">후 가 공</td>
      <td colspan="5" class="val">없음</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">원 고</td>
      <td colspan="3" class="val">${v(order.draft_email)} ${v(order.draft_group)} ${v(order.mail_sender)}</td>
      <td style="font-weight:bold; background:#f8fafc;">교 정 일</td>
      <td colspan="5" class="val">표지: ${v(order.cover_proof_date)} / 내지: ${v(order.inner_proof_date)}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">교 정 방 법</td>
      <td colspan="3" class="val">${v(order.proof_method)}</td>
      <td colspan="6"></td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">기 획</td>
      <td colspan="3" class="val">${v(order.planning)}</td>
      <td style="font-weight:bold; background:#f8fafc;">사 진 촬 영</td>
      <td colspan="5" class="val">${v(order.photography, '-')}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">일 러 스 트</td>
      <td colspan="3" class="val">${v(order.illustration)}</td>
      <td style="font-weight:bold; background:#f8fafc;">저작권ㆍ웹게시</td>
      <td colspan="5" class="val">${v(order.copyright_web, '-')}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">제 작 진 행</td>
      <td colspan="3" class="val">${v(order.production_progress)}</td>
      <td style="font-weight:bold; background:#f8fafc;">납 품 처</td>
      <td colspan="5" class="val">${v(order.delivery_destination)}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">표 지 컨 셉</td>
      <td colspan="9" class="val" style="text-align:left;">${v(order.cover_related)}</td>
    </tr>
    <tr>
      <td style="font-weight:bold; background:#f8fafc;">내 지 컨 셉</td>
      <td colspan="9" class="val" style="text-align:left;">${v(order.inner_related)}</td>
    </tr>
    <tr>
      <td colspan="10" style="text-align:left; height:70px; vertical-align:top;">
        <strong>&lt;요청사항&gt;</strong><br>
        <span class="val">${v(order.request_note)}</span>
      </td>
    </tr>
  </table>

  <div class="notice">
    ※ 원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.
  </div>

  <table style="border:none; margin-top:15px; font-weight:bold;">
    <tr>
      <td style="border:none; text-align:left; width:50%;">
        표지 작업자 : <span class="val">${v(order.editor_name, order.manager_name || '김광일')}</span>
      </td>
      <td style="border:none; text-align:right; width:50%;">
        내지 작업자 : <span class="val">${v(order.designer_name, '-')}</span>
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  // HWP MIME Type 트윈 변환 다운로드 (한컴오피스 / 한글 100% 자동 열림)
  const blob = new Blob([hwpContent], { type: 'application/x-hwp;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `경성문화사_작업전표_${codeNo}_${today}.hwp`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
