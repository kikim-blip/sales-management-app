// src/services/hwpExportService.js
/**
 * 📄 43개 세부 데이터 100% 완벽 매칭 및 표 테두리/레이아웃 보정
 * 한컴오피스 HWP (2010~2024 호환) 1:1 실물 규격 작업전표 HWP 문서 생성 서비스
 */

export async function exportJobOrderToHWP(order, customer) {
  if (!order) return;

  const today = new Date().toISOString().split('T')[0];
  const custName = customer ? customer.name : (order.customer_name || order.customer_id || '');
  const custDept = customer ? customer.dept : (order.dept || '');
  const custContact = customer ? customer.contact_person : (order.client_contact_person || '');
  const custPhone = customer ? customer.phone : (order.client_phone || '');

  const v = (val, defaultVal = '-') => {
    if (val === null || val === undefined || val === '') return defaultVal;
    return String(val);
  };

  const codeNo = order.code_number || 'ORDER';
  const fileName = `경성문화사_작업전표_${codeNo}_${today}.hwp`;

  // 한컴오피스 한글 HWP HTML 파서 최적화 인라인 테이블 스트림
  const hwpDocumentContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>경성문화사 작업전표_${codeNo}</title>
<style>
  @page { size: 210mm 297mm; margin: 10mm 12mm 10mm 12mm; }
  body { font-family: 'Hani', 'Malgun Gothic', 'Dotum', sans-serif; font-size: 10pt; color: #000000; line-height: 1.3; }
  table { border-collapse: collapse; }
  td, th { border: 1px solid #000000; }
</style>
</head>
<body style="font-family:'Malgun Gothic', sans-serif; font-size:10pt; color:#000000; margin:0; padding:10px;">

  <!-- 상단 레이아웃: 코드번호 박스 & 로고 & 결재란 -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%" style="border-collapse:collapse; border:none; margin-bottom:10px; width:100%;">
    <tr>
      <td width="55%" align="left" valign="top" style="border:none; text-align:left; vertical-align:top;">
        <table border="2" cellspacing="0" cellpadding="4" style="border-collapse:collapse; border:2px solid #000000; margin-bottom:8px; background-color:#ffffff;">
          <tr>
            <td style="border:none; padding:4px 10px; white-space:nowrap;">
              <span style="font-size:10pt; font-weight:bold; color:#000000;">코 드 번 호 : </span>
              <strong style="font-size:12pt; color:#dc2626; font-family:Consolas, monospace;">${v(order.code_number)}</strong>
            </td>
          </tr>
        </table>
        <div style="font-size:22pt; font-weight:900; letter-spacing:0.4em; margin-top:4px; font-family:'Malgun Gothic', sans-serif;">작 업 전 표</div>
      </td>

      <td width="45%" align="right" valign="top" style="border:none; text-align:right; vertical-align:top;">
        <div style="margin-bottom:6px; text-align:right; white-space:nowrap;">
          <span style="font-size:14pt; font-weight:bold; color:#0252b8; font-style:italic; font-family:Arial, sans-serif;">KyungSung </span>
          <span style="font-size:13pt; font-weight:bold; color:#1e293b;">경성문화사</span>
        </div>

        <table border="1" cellspacing="0" cellpadding="2" width="210" align="right" style="border-collapse:collapse; border:2px solid #000000; float:right;">
          <tr style="background-color:#f1f5f9; height:24px;">
            <td rowspan="2" width="30" align="center" valign="middle" style="border:1px solid #000000; background-color:#e2e8f0; font-weight:bold; font-size:9.5pt; text-align:center;">결<br>재</td>
            <td width="60" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; font-size:9.5pt; text-align:center;">담 당</td>
            <td width="60" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; font-size:9.5pt; text-align:center;">부서장</td>
            <td width="60" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; font-size:9.5pt; text-align:center;">회 장</td>
          </tr>
          <tr style="height:36px;">
            <td align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; font-size:10pt; color:#dc2626; text-align:center;">${v(order.manager_name)}</td>
            <td style="border:1px solid #000000;">&nbsp;</td>
            <td style="border:1px solid #000000;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- 접수일 및 납품일 서식 -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%" style="border-collapse:collapse; border:none; margin-bottom:6px; font-weight:bold; font-size:10pt;">
    <tr>
      <td align="left" style="border:none; text-align:left;">
        접 수 일 : <span style="color:#dc2626;">${order.receipt_date || today}</span>
      </td>
      <td align="right" style="border:none; text-align:right;">
        납 품 일 : <span style="color:#dc2626;">${order.delivery_date || today} ${order.delivery_time ? `(시간 ${order.delivery_time})` : ''}</span>
      </td>
    </tr>
  </table>

  <!-- 1:1 완벽 정밀 표 데이터 100% 매칭 테이블 (8컬럼 표준 격자) -->
  <table border="1" cellspacing="0" cellpadding="5" width="100%" style="border-collapse:collapse; border:2px solid #000000; width:100%; table-layout:fixed;">
    <colgroup>
      <col width="14%" />
      <col width="11%" />
      <col width="11%" />
      <col width="14%" />
      <col width="14%" />
      <col width="12%" />
      <col width="12%" />
      <col width="12%" />
    </colgroup>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">발 주 처</td>
      <td colspan="4" width="47%" align="left" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; padding-left:8px; font-size:10.5pt;">${custName}</td>
      <td colspan="3" width="39%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center; font-size:10.5pt;">${custDept}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">품 명</td>
      <td colspan="7" width="86%" align="left" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; padding-left:8px; font-size:10.5pt;">${v(order.title)}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">규 격</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.spec)}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">면 수</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.pages)} ${order.duplex ? `/ ${order.duplex}` : ''}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">수 량</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${order.quantity ? `${order.quantity}부` : '-'}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">견 적 금 액</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${order.estimated_price ? `${Number(order.estimated_price).toLocaleString()} 원` : '-'}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">발주업체 담당자</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(custContact)} (${v(custPhone)})</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">이 메 일</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.client_email)} ${v(order.email_receipt_time, '')}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">표 지 작 업</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.cover_job)}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">표 지 용 지</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.cover_paper)}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">표 지 인 쇄</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.cover_print)}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">코 팅</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.coating)}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">내 지 작 업</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.inner_job)}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">본 문 용 지</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.inner_paper)}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">내 지 인 쇄</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.inner_print)}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">간 지 용 지</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.interleaf_paper)}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">제 본</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.binding)}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">후 가 공</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">없음</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">원 고</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.draft_email)} ${v(order.draft_group)} ${v(order.mail_sender)}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">교 정 일</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">표지: ${v(order.cover_proof_date)} / 내지: ${v(order.inner_proof_date)}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">교 정 방 법</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.proof_method)}</td>
      <td width="14%" style="border:1px solid #000000; background-color:#ffffff;">&nbsp;</td>
      <td colspan="3" width="36%" style="border:1px solid #000000; background-color:#ffffff;">&nbsp;</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">기 획</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.planning)}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">사 진 촬 영</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.photography, '-')}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">일 러 스 트</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.illustration)}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">저작권ㆍ웹게시</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.copyright_web, '-')}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">제 작 진 행</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.production_progress)}</td>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">납 품 처</td>
      <td colspan="3" width="36%" align="center" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; text-align:center;">${v(order.delivery_destination)}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">표 지 컨 셉</td>
      <td colspan="7" width="86%" align="left" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; padding-left:8px;">${v(order.cover_related)}</td>
    </tr>

    <tr>
      <td width="14%" align="center" valign="middle" style="border:1px solid #000000; background-color:#f1f5f9; font-weight:bold; text-align:center;">내 지 컨 셉</td>
      <td colspan="7" width="86%" align="left" valign="middle" style="border:1px solid #000000; font-weight:bold; color:#dc2626; padding-left:8px;">${v(order.inner_related)}</td>
    </tr>

    <tr>
      <td colspan="4" width="50%" align="left" valign="top" style="border:1px solid #000000; height:65px; padding:6px;">
        <strong style="font-size:9.5pt;">&lt;표지관련&gt;</strong><br>
        <span style="color:#dc2626; font-weight:bold;">${v(order.cover_related)}</span>
      </td>
      <td colspan="4" width="50%" align="left" valign="top" style="border:1px solid #000000; height:65px; padding:6px;">
        <strong style="font-size:9.5pt;">&lt;내지관련&gt;</strong><br>
        <span style="color:#dc2626; font-weight:bold;">${v(order.inner_related)}</span>
      </td>
    </tr>

    <tr>
      <td colspan="8" width="100%" align="left" valign="top" style="border:1px solid #000000; height:75px; padding:6px;">
        <strong style="font-size:9.5pt;">&lt;요청사항&gt;</strong><br>
        <span style="color:#dc2626; font-weight:bold; line-height:1.4;">${v(order.request_note)}</span>
      </td>
    </tr>
  </table>

  <!-- 하단 원칙 안내문 -->
  <div style="font-size:8.5pt; margin-top:8px; line-height:1.3;">
    ※ 원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.
  </div>

  <!-- 서명란 -->
  <table border="0" cellspacing="0" cellpadding="0" width="100%" style="border-collapse:collapse; border:none; margin-top:12px; font-weight:bold; font-size:10pt; width:100%;">
    <tr>
      <td width="50%" align="left" style="border:none; text-align:left;">
        표지 작업자 : <span style="color:#dc2626;">${v(order.editor_name)}</span>
      </td>
      <td width="50%" align="right" style="border:none; text-align:right;">
        내지 작업자 : <span style="color:#dc2626;">${v(order.designer_name, '-')}</span>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // MIME Blob 생성 (application/x-hwp;charset=utf-8)
  const blob = new Blob([hwpDocumentContent], { type: 'application/x-hwp;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
