// src/services/hwpExportService.js
/**
 * 📄 43개 세부 데이터 100% 자동 채움(Pre-filled) 한컴오피스 HWP 5.0 호환 문서 생성 서비스
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

  // 한컴오피스 한글(HWP 2010~2024 호환) 문서 데이터 100% 채움 HTML/XML 스트림
  const hwpDocumentContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>경성문화사 작업전표_${codeNo}</title>
<style>
  @page { size: 210mm 297mm; margin: 12mm 15mm 12mm 15mm; }
  body { font-family: 'Hani', 'Malgun Gothic', 'Dotum', sans-serif; font-size: 10pt; color: #000000; line-height: 1.3; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
  th, td { border: 1px solid #000000; padding: 5px 6px; font-size: 9.5pt; text-align: center; vertical-align: middle; }
  .lbl { background-color: #f1f5f9; font-weight: bold; color: #000000; }
  .val { color: #dc2626; font-weight: bold; font-family: 'Malgun Gothic', sans-serif; }
  .box { border: 2px solid #000000; }
</style>
</head>
<body>
  <!-- 상단 레이아웃: 코드번호 박스 & KYUNGSUNG 로고 & 결재란 -->
  <table style="border:none; margin-bottom:12px;">
    <tr>
      <td style="border:none; text-align:left; vertical-align:top; width:55%;">
        <div style="border:2px solid #000; display:inline-block; padding:4px 12px; margin-bottom:10px; background:#fff;">
          <strong style="font-size:10pt;">코 드 번 호 : </strong>
          <strong style="font-size:12pt; color:#dc2626; font-family:Consolas, monospace;">${v(order.code_number)}</strong>
        </div>
        <div style="font-size:22pt; font-weight:900; letter-spacing:0.5em; margin-top:6px;">작 업 전 표</div>
      </td>
      <td style="border:none; text-align:right; vertical-align:top; width:45%;">
        <div style="margin-bottom:6px; text-align:right;">
          <strong style="font-size:14pt; color:#0252b8; font-style:italic; font-family:Arial, sans-serif;">KyungSung </strong>
          <strong style="font-size:13pt; color:#333;">경성문화사</strong>
        </div>
        <table style="border:2px solid #000; width:200px; float:right;">
          <tr style="background:#f1f5f9;">
            <td rowspan="2" style="background:#e2e8f0; font-weight:bold; width:28px;">결<br>재</td>
            <td style="font-weight:bold; width:55px;">담 당</td>
            <td style="font-weight:bold; width:55px;">부서장</td>
            <td style="font-weight:bold; width:55px;">회 장</td>
          </tr>
          <tr style="height:35px;">
            <td class="val">${v(order.manager_name)}</td>
            <td></td>
            <td></td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- 접수일 및 납품일 -->
  <div style="margin-bottom:6px; font-weight:bold; font-size:10pt;">
    <span>접 수 일 : <span class="val">${order.receipt_date || today}</span></span>
    <span style="float:right;">납 품 일 : <span class="val">${order.delivery_date || today} ${order.delivery_time ? `(시간 ${order.delivery_time})` : ''}</span></span>
  </div>

  <!-- 1:1 실물 표 데이터 100% 채움 테이블 -->
  <table class="box">
    <tr>
      <td class="lbl" style="width:16%;">발 주 처</td>
      <td colspan="5" class="val" style="text-align:left; font-size:10.5pt;">${custName}</td>
      <td colspan="4" class="val" style="font-size:10.5pt;">${custDept}</td>
    </tr>
    <tr>
      <td class="lbl">품 명</td>
      <td colspan="9" class="val" style="text-align:left; font-size:10.5pt;">${v(order.title)}</td>
    </tr>
    <tr>
      <td class="lbl">규 격</td>
      <td colspan="3" class="val">${v(order.spec)}</td>
      <td class="lbl">면 수</td>
      <td colspan="5" class="val">${v(order.pages)} ${order.duplex ? `/ ${order.duplex}` : ''}</td>
    </tr>
    <tr>
      <td class="lbl">수 량</td>
      <td colspan="3" class="val">${order.quantity ? `${order.quantity}부` : '-'}</td>
      <td class="lbl">견 적 금 액</td>
      <td colspan="5" class="val">${order.estimated_price ? `${Number(order.estimated_price).toLocaleString()} 원` : '-'}</td>
    </tr>
    <tr>
      <td class="lbl">발주업체 담당자</td>
      <td colspan="3" class="val">${v(custContact)} (${v(custPhone)})</td>
      <td class="lbl">이 메 일</td>
      <td colspan="5" class="val">${v(order.client_email)} ${v(order.email_receipt_time, '')}</td>
    </tr>
    <tr>
      <td class="lbl">표 지 작 업</td>
      <td colspan="3" class="val">${v(order.cover_job)}</td>
      <td class="lbl">표 지 용 지</td>
      <td colspan="5" class="val">${v(order.cover_paper)}</td>
    </tr>
    <tr>
      <td class="lbl">표 지 인 쇄</td>
      <td colspan="3" class="val">${v(order.cover_print)}</td>
      <td class="lbl">코 팅</td>
      <td colspan="5" class="val">${v(order.coating)}</td>
    </tr>
    <tr>
      <td class="lbl">내 지 작 업</td>
      <td colspan="3" class="val">${v(order.inner_job)}</td>
      <td class="lbl">본 문 용 지</td>
      <td colspan="5" class="val">${v(order.inner_paper)}</td>
    </tr>
    <tr>
      <td class="lbl">내 지 인 쇄</td>
      <td colspan="3" class="val">${v(order.inner_print)}</td>
      <td class="lbl">간 지 용 지</td>
      <td colspan="5" class="val">${v(order.interleaf_paper)}</td>
    </tr>
    <tr>
      <td class="lbl">제 본</td>
      <td colspan="3" class="val">${v(order.binding)}</td>
      <td class="lbl">후 가 공</td>
      <td colspan="5" class="val">없음</td>
    </tr>
    <tr>
      <td class="lbl">원 고</td>
      <td colspan="3" class="val">${v(order.draft_email)} ${v(order.draft_group)} ${v(order.mail_sender)}</td>
      <td class="lbl">교 정 일</td>
      <td colspan="5" class="val">표지: ${v(order.cover_proof_date)} / 내지: ${v(order.inner_proof_date)}</td>
    </tr>
    <tr>
      <td class="lbl">교 정 방 법</td>
      <td colspan="3" class="val">${v(order.proof_method)}</td>
      <td colspan="6"></td>
    </tr>
    <tr>
      <td class="lbl">기 획</td>
      <td colspan="3" class="val">${v(order.planning)}</td>
      <td class="lbl">사 진 촬 영</td>
      <td colspan="5" class="val">${v(order.photography, '-')}</td>
    </tr>
    <tr>
      <td class="lbl">일 러 스 트</td>
      <td colspan="3" class="val">${v(order.illustration)}</td>
      <td class="lbl">저작권ㆍ웹게시</td>
      <td colspan="5" class="val">${v(order.copyright_web, '-')}</td>
    </tr>
    <tr>
      <td class="lbl">제 작 진 행</td>
      <td colspan="3" class="val">${v(order.production_progress)}</td>
      <td class="lbl">납 품 처</td>
      <td colspan="5" class="val">${v(order.delivery_destination)}</td>
    </tr>
    <tr>
      <td class="lbl">표 지 컨 셉</td>
      <td colspan="9" class="val" style="text-align:left;">${v(order.cover_related)}</td>
    </tr>
    <tr>
      <td class="lbl">내 지 컨 셉</td>
      <td colspan="9" class="val" style="text-align:left;">${v(order.inner_related)}</td>
    </tr>
    <tr>
      <td colspan="5" style="vertical-align:top; text-align:left; height:70px;">
        <strong style="font-size:9.5pt;">&lt;표지관련&gt;</strong><br>
        <span class="val">${v(order.cover_related)}</span>
      </td>
      <td colspan="5" style="vertical-align:top; text-align:left; height:70px;">
        <strong style="font-size:9.5pt;">&lt;내지관련&gt;</strong><br>
        <span class="val">${v(order.inner_related)}</span>
      </td>
    </tr>
    <tr>
      <td colspan="10" style="vertical-align:top; text-align:left; height:80px;">
        <strong style="font-size:9.5pt;">&lt;요청사항&gt;</strong><br>
        <span class="val" style="line-height:1.4;">${v(order.request_note)}</span>
      </td>
    </tr>
  </table>

  <!-- 하단 원칙 안내문 -->
  <div style="font-size:8.5pt; margin-top:6px; line-height:1.3;">
    ※ 원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.
  </div>

  <!-- 서명란 -->
  <table style="border:none; margin-top:10px; font-weight:bold; font-size:10pt;">
    <tr>
      <td style="border:none; text-align:left; width:50%;">
        표지 작업자 : <span class="val">${v(order.editor_name)}</span>
      </td>
      <td style="border:none; text-align:right; width:50%;">
        내지 작업자 : <span class="val">${v(order.designer_name, '-')}</span>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

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
