// src/components/common/JobOrderPrintModal.jsx
import React, { useRef } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function JobOrderPrintModal({ order, customer, onClose }) {
  const printRef = useRef();

  if (!order) return null;

  const today = new Date().toISOString().split('T')[0];
  const custName = customer ? customer.name : (order.customer_name || order.customer_id || '미지정');
  const custDept = customer ? customer.dept : (order.dept || '');
  const custContact = customer ? customer.contact_person : (order.client_contact_person || '');
  const custPhone = customer ? customer.phone : (order.client_phone || '');

  // 📊 구글 시트 [작업전표양식] 탭과 1:1 서식으로 엑셀 파일 다운로드
  const handleExportExcel = () => {
    const fileName = `경성문화사_작업전표_${order.code_number || 'ORDER'}_${today}.xlsx`;
    const excelRows = [
      ['코드번호', order.code_number || '', '', '', '', '', '', '', '', '작 업 전 표', '', '', '', '', '결재', '담 당', '부서장', '회 장'],
      ['KYUNGSUNG 경성문화사', '', '', '', '', '', '', '', '', '', '', '', '', '', '', order.manager_name || '', '김광일', ''],
      ['접수일 :', order.receipt_date ? order.receipt_date.replace(/-/g, '년 ').concat('일') : '', '', '', '납품일 :', `${order.delivery_date ? order.delivery_date.replace(/-/g, '년 ').concat('일') : ''} 시간 ${order.delivery_time || ''}`],
      ['발 주 처', custName, '', '', '', '', '', '', custDept],
      ['품 명', order.title || ''],
      ['규 격', order.spec || '', '', '면 수', order.pages || '', '', '양/단면', order.duplex || ''],
      ['수 량', order.quantity ? `${order.quantity}부` : '', '', '견적금액', order.estimated_price ? `${Number(order.estimated_price).toLocaleString()}원` : ''],
      ['발주업체 담당자', `${custContact} (${custPhone})`, '', '', '이 메 일', `${order.client_email || ''} ${order.email_receipt_time || ''}`],
      ['표지작업', order.cover_job || '', '', '', '표지용지', order.cover_paper || ''],
      ['표지인쇄', order.cover_print || '', '', '', '코 팅', order.coating || ''],
      ['내지작업', order.inner_job || '', '', '', '내지용지', order.inner_paper || ''],
      ['내지인쇄', order.inner_print || '', '', '', '간지용지', order.interleaf_paper || ''],
      ['제 본', order.binding || '', '', '', '후 가 공', ''],
      ['원 고', `${order.draft_email || ''} ${order.draft_group || ''} ${order.mail_sender || ''}`, '', '', '교 정 일', `표지: ${order.cover_proof_date || ''} / 내지: ${order.inner_proof_date || ''}`],
      ['교정방법', order.proof_method || ''],
      ['기 획', order.planning || '', '', '', '사진촬영', order.photography || ''],
      ['일러스트', order.illustration || '', '', '', '저작권·웹게시', order.copyright_web || ''],
      ['제작진행', order.production_progress || '', '', '', '납 품 처', order.delivery_destination || ''],
      ['<표지관련>', '', '', '', '<내지관련>'],
      [order.cover_related || '', '', '', '', order.inner_related || ''],
      ['요청사항', order.request_note || ''],
      ['※원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며'],
      ['작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.'],
      ['편집 작업자', order.editor_name || '', '', '', '디자인 작업자', order.designer_name || '']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '작업전표양식');
    XLSX.writeFile(workbook, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* 모달 헤더 (인쇄 시 숨김) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base">
              경성문화사 실물 작업전표 1:1 양식 서식 (PDF / 엑셀 추출)
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-4 h-4" />
              <span>양식 엑셀 다운로드 (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>인쇄 / PDF 저장</span>
            </button>

            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 📄 경성문화사 실물 작업전표 1:1 종이 양식 (인쇄용) */}
        <div ref={printRef} className="p-8 sm:p-10 overflow-y-auto flex-1 bg-white print:p-0 print:overflow-visible text-slate-900 font-sans text-xs">
          
          {/* 상단 1: 코드번호 & 로고 & 타이틀 & 결재란 */}
          <div className="flex justify-between items-start mb-6">
            
            {/* 좌측 상단 코드번호 */}
            <div className="border border-slate-900 px-3 py-1.5 flex items-center space-x-3 bg-white">
              <span className="font-bold text-slate-900 text-xs">코드번호</span>
              <span className="font-mono font-bold text-rose-600 text-sm tracking-widest">
                {order.code_number}
              </span>
            </div>

            {/* 중앙 로고 및 타이틀 */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1.5 mb-1">
                <span className="font-black text-sky-800 tracking-wider text-base">KYUNGSUNG</span>
                <span className="font-extrabold text-slate-900 text-sm">경성문화사</span>
              </div>
              <h1 className="text-3xl font-black tracking-[0.4em] text-slate-900 uppercase underline decoration-2 underline-offset-8">
                작 업 전 표
              </h1>
            </div>

            {/* 우측 결재란 표 */}
            <div className="border-2 border-slate-900 text-center text-[11px]">
              <div className="grid grid-cols-4 border-b border-slate-900 bg-slate-100 font-bold">
                <div className="p-1 border-r border-slate-900 bg-slate-200 flex items-center justify-center">결재</div>
                <div className="p-1 border-r border-slate-900">담 당</div>
                <div className="p-1 border-r border-slate-900">부서장</div>
                <div className="p-1">회 장</div>
              </div>
              <div className="grid grid-cols-4 h-12">
                <div className="border-r border-slate-900 bg-slate-100 font-bold flex items-center justify-center"></div>
                <div className="border-r border-slate-900 p-1 font-bold text-rose-600 flex items-center justify-center">
                  {order.manager_name}
                </div>
                <div className="border-r border-slate-900 p-1 font-bold text-rose-600 flex items-center justify-center">
                  김광일
                </div>
                <div className="p-1"></div>
              </div>
            </div>

          </div>

          {/* 접수일 & 납품일 서식 헤더 */}
          <div className="flex justify-between items-center mb-2 font-bold text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-sky-700 font-bold">접 수 일 :</span>
              <span className="text-rose-600 font-mono">
                {order.receipt_date ? order.receipt_date.replace(/-/g, '년 ').concat('일') : ''}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sky-700 font-bold">납 품 일 :</span>
              <span className="text-rose-600 font-mono">
                {order.delivery_date ? order.delivery_date.replace(/-/g, '년 ').concat('일') : ''} {order.delivery_time ? `시간 ${order.delivery_time}` : ''}
              </span>
            </div>
          </div>

          {/* 1:1 실물 표 서식 테이블 */}
          <div className="border-2 border-slate-900 divide-y-2 divide-slate-900 bg-white">
            
            {/* Row 1: 발주처 & 과/부서 */}
            <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
              <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center">발 주 처</div>
              <div className="col-span-6 p-2 text-rose-600 font-extrabold flex items-center">{custName}</div>
              <div className="col-span-4 p-2 text-rose-600 font-extrabold text-center flex items-center justify-center border-l border-slate-900">{custDept}</div>
            </div>

            {/* Row 2: 품명 */}
            <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
              <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center">품 명</div>
              <div className="col-span-10 p-2 text-rose-600 font-extrabold">{order.title}</div>
            </div>

            {/* Row 3: 규격 / 면수 / 양단면 */}
            <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center font-bold">
              <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center">규 격</div>
              <div className="col-span-3 p-2 text-rose-600 font-mono">{order.spec}</div>
              <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center border-l border-slate-900">면 수</div>
              <div className="col-span-2 p-2 text-rose-600 font-mono">{order.pages}</div>
              <div className="col-span-3 p-2 text-rose-600 font-bold border-l border-slate-900">{order.duplex}</div>
            </div>

            {/* Row 4: 수량 & 견적금액 */}
            <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold text-center">
              <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center">수 량</div>
              <div className="col-span-3 p-2 text-rose-600 font-extrabold">{order.quantity ? `${order.quantity}부` : ''}</div>
              <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center border-l border-slate-900">견적금액</div>
              <div className="col-span-5 p-2 text-rose-600 font-extrabold border-l border-slate-900">
                {order.estimated_price ? `${Number(order.estimated_price).toLocaleString()}원` : ''}
              </div>
            </div>

            {/* Row 5: 발주업체 담당자 & 이메일 */}
            <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
              <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center">발주업체<br/>담 당 자</div>
              <div className="col-span-4 p-2 space-y-1">
                <p className="text-rose-600">{custContact}</p>
                <p className="text-rose-600 font-mono">{custPhone}</p>
              </div>
              <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center border-l border-slate-900">이 메 일</div>
              <div className="col-span-4 p-2 space-y-1 border-l border-slate-900">
                <p className="text-rose-600 font-mono">{order.client_email}</p>
                <p className="text-rose-600 font-mono text-[11px]">{order.email_receipt_time}</p>
              </div>
            </div>

            {/* Row 6~10: 표지/내지/간지/제본 기술 사양 표 */}
            <div className="divide-y divide-slate-900">
              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold">표지작업</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.cover_job}</div>
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">표지용지</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.cover_paper}</div>
              </div>

              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold">표지인쇄</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.cover_print}</div>
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">코 팅</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.coating}</div>
              </div>

              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold">내지작업</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.inner_job}</div>
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">내지용지</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.inner_paper}</div>
              </div>

              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold">내지인쇄</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.inner_print}</div>
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">간지용지</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.interleaf_paper}</div>
              </div>

              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold">제 본</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.binding}</div>
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">후 가 공</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">없음</div>
              </div>
            </div>

            {/* Row 11~15: 원고, 교정일, 기획, 사진촬영, 저작권, 진행 */}
            <div className="divide-y divide-slate-900">
              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold flex items-center justify-center">원 고</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-mono font-bold flex items-center justify-around">
                  <span>{order.draft_email}</span>
                  <span>{order.draft_group}</span>
                  <span>{order.mail_sender}</span>
                </div>
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900 flex items-center justify-center">교 정 일</div>
                <div className="col-span-4 p-1 space-y-1 text-[11px]">
                  <div className="flex justify-between border-b pb-0.5"><span className="font-bold">표지</span><span className="text-rose-600">{order.cover_proof_date}</span></div>
                  <div className="flex justify-between"><span className="font-bold">내지</span><span className="text-rose-600">{order.inner_proof_date}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold">교정방법</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.proof_method}</div>
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">기 획</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.planning}</div>
              </div>

              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold">사진촬영</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.photography}</div>
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">일러스트</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.illustration}</div>
              </div>

              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold">저작권·웹게시</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.copyright_web}</div>
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">제 작 진 행</div>
                <div className="col-span-4 p-1.5 text-rose-600 font-bold">{order.production_progress}</div>
              </div>

              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                <div className="col-span-2 p-1.5 bg-slate-100 font-bold">납 품 처</div>
                <div className="col-span-10 p-1.5 text-rose-600 font-bold">{order.delivery_destination}</div>
              </div>
            </div>

            {/* Row 16: 표지관련 & 내지관련 반반 박스 */}
            <div className="grid grid-cols-2 divide-x divide-slate-900 min-h-[90px]">
              <div className="p-3 space-y-1">
                <p className="font-bold text-center text-rose-600">&lt;표지관련&gt;</p>
                <p className="text-rose-600 whitespace-pre-wrap font-semibold">{order.cover_related}</p>
              </div>
              <div className="p-3 space-y-1">
                <p className="font-bold text-center text-rose-600">&lt;내지관련&gt;</p>
                <p className="text-rose-600 whitespace-pre-wrap font-semibold">{order.inner_related}</p>
              </div>
            </div>

            {/* Row 17: 요청사항 박스 */}
            <div className="p-3 min-h-[60px]">
              <p className="font-bold text-center text-slate-900 mb-1">요청사항</p>
              <p className="text-rose-600 whitespace-pre-wrap font-semibold">{order.request_note}</p>
            </div>

          </div>

          {/* 하단 1: 영업자 원칙 안내문 */}
          <div className="text-[10px] text-slate-800 space-y-0.5 mt-2 font-medium">
            <p>※원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며</p>
            <p className="pl-8">작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.</p>
          </div>

          {/* 하단 2: 편집 작업자 & 디자인 작업자 서명란 */}
          <div className="grid grid-cols-2 gap-4 border border-slate-900 mt-2 text-xs font-bold text-center divide-x divide-slate-900">
            <div className="p-2 flex justify-between px-6">
              <span>편집 작업자</span>
              <span className="text-rose-600">{order.editor_name}</span>
            </div>
            <div className="p-2 flex justify-between px-6">
              <span>디자인 작업자</span>
              <span className="text-rose-600">{order.designer_name}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
