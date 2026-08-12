// src/components/common/JobOrderPrintModal.jsx
import React, { useRef } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function JobOrderPrintModal({ order, customer, onClose }) {
  const printRef = useRef();
  const excelTableRef = useRef();

  if (!order) return null;

  const today = new Date().toISOString().split('T')[0];
  const custName = customer ? customer.name : (order.customer_name || order.customer_id || '미지정');
  const custDept = customer ? customer.dept : (order.dept || '');
  const custContact = customer ? customer.contact_person : (order.client_contact_person || '');
  const custPhone = customer ? customer.phone : (order.client_phone || '');

  // 깔끔한 빈값 방지 표시 헬퍼
  const v = (val, defaultVal = '-') => {
    if (val === null || val === undefined || val === '') return defaultVal;
    return val;
  };

  // 📊 구글 시트 [작업전표양식] 과 100% 동일하게 엑셀 셀 병합(Colspan) 및 너비가 깨지지 않는 엑셀 추출
  const handleExportExcel = () => {
    if (!excelTableRef.current) return;
    const fileName = `경성문화사_작업전표_${order.code_number || 'ORDER'}_${today}.xlsx`;
    
    // HTML 테이블을 엑셀 워크시트로 자동 변환 (모든 colspan/rowspan 셀 병합 100% 자동 유지)
    const worksheet = XLSX.utils.table_to_sheet(excelTableRef.current, { raw: true });
    
    // 엑셀 열 너비 자동 보정 (글자 잘림 방지)
    worksheet['!cols'] = [
      { wch: 14 }, // A열: 항목명
      { wch: 22 }, // B열: 수치/내용
      { wch: 14 }, // C열: 항목명
      { wch: 18 }, // D열: 수치/내용
      { wch: 14 }, // E열: 항목명
      { wch: 18 }, // F열: 수치/내용
      { wch: 14 }, // G열: 항목명
      { wch: 22 }, // H열: 비고
    ];

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

        {/* 📄 경성문화사 실물 작업전표 1:1 종이 양식 (인쇄 전용 아이디 지정: #printable-job-order-document) */}
        <div className="p-8 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-sans text-xs">
          <div id="printable-job-order-document" ref={printRef} className="bg-white p-2">
            
            {/* 상단 1: 코드번호 & 로고 & 타이틀 & 결재란 */}
            <div className="flex justify-between items-start mb-6">
              
              {/* 좌측 상단 코드번호 */}
              <div className="border-2 border-slate-900 px-3 py-1.5 flex items-center space-x-3 bg-white">
                <span className="font-bold text-slate-900 text-xs">코드번호</span>
                <span className="font-mono font-black text-rose-600 text-base tracking-wider">
                  {v(order.code_number, '44 - 260812 - 3384')}
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
              <div className="border-2 border-slate-900 text-center text-[11px] min-w-[200px]">
                <div className="grid grid-cols-4 border-b border-slate-900 bg-slate-100 font-bold">
                  <div className="p-1 border-r border-slate-900 bg-slate-200 flex items-center justify-center">결재</div>
                  <div className="p-1 border-r border-slate-900">담 당</div>
                  <div className="p-1 border-r border-slate-900">부서장</div>
                  <div className="p-1">회 장</div>
                </div>
                <div className="grid grid-cols-4 h-12">
                  <div className="border-r border-slate-900 bg-slate-100 font-bold flex items-center justify-center"></div>
                  <div className="border-r border-slate-900 p-1 font-bold text-rose-600 flex items-center justify-center">
                    {v(order.manager_name, '김광일')}
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
                <span className="text-sky-800 font-bold">접 수 일 :</span>
                <span className="text-rose-600 font-mono font-bold">
                  {order.receipt_date ? order.receipt_date.replace(/-/g, '년 ').concat('일') : today.replace(/-/g, '년 ').concat('일')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sky-800 font-bold">납 품 일 :</span>
                <span className="text-rose-600 font-mono font-bold">
                  {order.delivery_date ? order.delivery_date.replace(/-/g, '년 ').concat('일') : today.replace(/-/g, '년 ').concat('일')} {order.delivery_time ? `시간 ${order.delivery_time}` : ''}
                </span>
              </div>
            </div>

            {/* 1:1 실물 표 서식 테이블 */}
            <div className="border-2 border-slate-900 divide-y-2 divide-slate-900 bg-white">
              
              {/* Row 1: 발주처 & 과/부서 */}
              <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center">발 주 처</div>
                <div className="col-span-6 p-2 text-rose-600 font-extrabold flex items-center text-sm">{custName}</div>
                <div className="col-span-4 p-2 text-rose-600 font-extrabold text-center flex items-center justify-center border-l border-slate-900 text-sm">{custDept || '-'}</div>
              </div>

              {/* Row 2: 품명 */}
              <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center">품 명</div>
                <div className="col-span-10 p-2 text-rose-600 font-extrabold text-sm">{v(order.title)}</div>
              </div>

              {/* Row 3: 규격 / 면수 / 양단면 */}
              <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center font-bold">
                <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center">규 격</div>
                <div className="col-span-3 p-2 text-rose-600 font-mono">{v(order.spec)}</div>
                <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center border-l border-slate-900">면 수</div>
                <div className="col-span-2 p-2 text-rose-600 font-mono">{v(order.pages)}</div>
                <div className="col-span-3 p-2 text-rose-600 font-bold border-l border-slate-900">{v(order.duplex)}</div>
              </div>

              {/* Row 4: 수량 & 견적금액 */}
              <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold text-center">
                <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center">수 량</div>
                <div className="col-span-3 p-2 text-rose-600 font-extrabold">{order.quantity ? `${order.quantity}부` : '-'}</div>
                <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center border-l border-slate-900">견적금액</div>
                <div className="col-span-5 p-2 text-rose-600 font-extrabold border-l border-slate-900">
                  {order.estimated_price ? `${Number(order.estimated_price).toLocaleString()}원` : '-'}
                </div>
              </div>

              {/* Row 5: 발주업체 담당자 & 이메일 */}
              <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center">발주업체<br/>담 당 자</div>
                <div className="col-span-4 p-2 space-y-1">
                  <p className="text-rose-600">{v(custContact)}</p>
                  <p className="text-rose-600 font-mono">{v(custPhone)}</p>
                </div>
                <div className="col-span-2 p-2 bg-slate-100 flex items-center justify-center text-center border-l border-slate-900">이 메 일</div>
                <div className="col-span-4 p-2 space-y-1 border-l border-slate-900">
                  <p className="text-rose-600 font-mono">{v(order.client_email)}</p>
                  <p className="text-rose-600 font-mono text-[11px]">{v(order.email_receipt_time, '')}</p>
                </div>
              </div>

              {/* Row 6~10: 표지/내지/간지/제본 기술 사양 표 */}
              <div className="divide-y divide-slate-900">
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold">표지작업</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.cover_job)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">표지용지</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.cover_paper)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold">표지인쇄</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.cover_print)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">코 팅</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.coating)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold">내지작업</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.inner_job)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">내지용지</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.inner_paper)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold">내지인쇄</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.inner_print)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">간지용지</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.interleaf_paper)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold">제 본</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.binding)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">후 가 공</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">없음</div>
                </div>
              </div>

              {/* Row 11~15: 원고, 교정일, 기획, 사진촬영, 저작권, 진행 */}
              <div className="divide-y divide-slate-900">
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold flex items-center justify-center">원 고</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-mono font-bold flex items-center justify-around">
                    <span>{v(order.draft_email, '-')}</span>
                    <span>{v(order.draft_group, '-')}</span>
                    <span>{v(order.mail_sender, '-')}</span>
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900 flex items-center justify-center">교 정 일</div>
                  <div className="col-span-4 p-1 space-y-1 text-[11px]">
                    <div className="flex justify-between border-b pb-0.5"><span className="font-bold">표지</span><span className="text-rose-600">{v(order.cover_proof_date, '-')}</span></div>
                    <div className="flex justify-between"><span className="font-bold">내지</span><span className="text-rose-600">{v(order.inner_proof_date, '-')}</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold">교정방법</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.proof_method)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">기 획</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.planning)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold">사진촬영</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.photography)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">일러스트</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.illustration)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold">저작권·웹게시</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.copyright_web)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold border-l border-slate-900">제 작 진 행</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.production_progress)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-100 font-bold">납 품 처</div>
                  <div className="col-span-10 p-1.5 text-rose-600 font-bold">{v(order.delivery_destination)}</div>
                </div>
              </div>

              {/* Row 16: 표지관련 & 내지관련 반반 박스 */}
              <div className="grid grid-cols-2 divide-x divide-slate-900 min-h-[90px]">
                <div className="p-3 space-y-1">
                  <p className="font-bold text-center text-rose-600">&lt;표지관련&gt;</p>
                  <p className="text-rose-600 whitespace-pre-wrap font-semibold">{v(order.cover_related)}</p>
                </div>
                <div className="p-3 space-y-1">
                  <p className="font-bold text-center text-rose-600">&lt;내지관련&gt;</p>
                  <p className="text-rose-600 whitespace-pre-wrap font-semibold">{v(order.inner_related)}</p>
                </div>
              </div>

              {/* Row 17: 요청사항 박스 */}
              <div className="p-3 min-h-[60px]">
                <p className="font-bold text-center text-slate-900 mb-1">요청사항</p>
                <p className="text-rose-600 whitespace-pre-wrap font-semibold">{v(order.request_note)}</p>
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
                <span className="text-rose-600">{v(order.editor_name, order.manager_name || '김광일')}</span>
              </div>
              <div className="p-2 flex justify-between px-6">
                <span>디자인 작업자</span>
                <span className="text-rose-600">{v(order.designer_name, '-')}</span>
              </div>
            </div>

          </div>
        </div>

        {/* 📊 엑셀 다운로드 전용 숨김 HTML 테이블 (모든 colspan 100% 완벽 변환) */}
        <div className="hidden">
          <table ref={excelTableRef} border="1">
            <tbody>
              <tr>
                <td>코드번호</td>
                <td colSpan={2}>{v(order.code_number)}</td>
                <td colSpan={3}>작 업 전 표</td>
                <td>결재</td>
                <td>담당</td>
                <td>부서장</td>
                <td>회장</td>
              </tr>
              <tr>
                <td colSpan={6}>KYUNGSUNG 경성문화사</td>
                <td></td>
                <td>{v(order.manager_name)}</td>
                <td>김광일</td>
                <td></td>
              </tr>
              <tr>
                <td>접수일 :</td>
                <td colSpan={2}>{order.receipt_date}</td>
                <td>납품일 :</td>
                <td colSpan={6}>{order.delivery_date} {order.delivery_time}</td>
              </tr>
              <tr>
                <td>발 주 처</td>
                <td colSpan={5}>{custName}</td>
                <td colSpan={4}>{custDept}</td>
              </tr>
              <tr>
                <td>품 명</td>
                <td colSpan={9}>{v(order.title)}</td>
              </tr>
              <tr>
                <td>규 격</td>
                <td colSpan={2}>{v(order.spec)}</td>
                <td>면 수</td>
                <td colSpan={2}>{v(order.pages)}</td>
                <td colSpan={3}>{v(order.duplex)}</td>
              </tr>
              <tr>
                <td>수 량</td>
                <td colSpan={2}>{order.quantity ? `${order.quantity}부` : '-'}</td>
                <td>견적금액</td>
                <td colSpan={5}>{order.estimated_price ? `${Number(order.estimated_price).toLocaleString()}원` : '-'}</td>
              </tr>
              <tr>
                <td>발주업체 담당자</td>
                <td colSpan={4}>{v(custContact)} ({v(custPhone)})</td>
                <td>이 메 일</td>
                <td colSpan={4}>{v(order.client_email)} {v(order.email_receipt_time, '')}</td>
              </tr>
              <tr>
                <td>표지작업</td>
                <td colSpan={4}>{v(order.cover_job)}</td>
                <td>표지용지</td>
                <td colSpan={4}>{v(order.cover_paper)}</td>
              </tr>
              <tr>
                <td>표지인쇄</td>
                <td colSpan={4}>{v(order.cover_print)}</td>
                <td>코 팅</td>
                <td colSpan={4}>{v(order.coating)}</td>
              </tr>
              <tr>
                <td>내지작업</td>
                <td colSpan={4}>{v(order.inner_job)}</td>
                <td>내지용지</td>
                <td colSpan={4}>{v(order.inner_paper)}</td>
              </tr>
              <tr>
                <td>내지인쇄</td>
                <td colSpan={4}>{v(order.inner_print)}</td>
                <td>간지용지</td>
                <td colSpan={4}>{v(order.interleaf_paper)}</td>
              </tr>
              <tr>
                <td>제 본</td>
                <td colSpan={4}>{v(order.binding)}</td>
                <td>후 가 공</td>
                <td colSpan={4}>없음</td>
              </tr>
              <tr>
                <td>원 고</td>
                <td colSpan={4}>{v(order.draft_email, '-')} {v(order.draft_group, '-')} {v(order.mail_sender, '-')}</td>
                <td>교 정 일</td>
                <td colSpan={4}>표지: {v(order.cover_proof_date, '-')} / 내지: {v(order.inner_proof_date, '-')}</td>
              </tr>
              <tr>
                <td>교정방법</td>
                <td colSpan={4}>{v(order.proof_method)}</td>
                <td>기 획</td>
                <td colSpan={4}>{v(order.planning)}</td>
              </tr>
              <tr>
                <td>사진촬영</td>
                <td colSpan={4}>{v(order.photography)}</td>
                <td>일러스트</td>
                <td colSpan={4}>{v(order.illustration)}</td>
              </tr>
              <tr>
                <td>저작권·웹게시</td>
                <td colSpan={4}>{v(order.copyright_web)}</td>
                <td>제작진행</td>
                <td colSpan={4}>{v(order.production_progress)}</td>
              </tr>
              <tr>
                <td>납 품 처</td>
                <td colSpan={9}>{v(order.delivery_destination)}</td>
              </tr>
              <tr>
                <td colSpan={5}>&lt;표지관련&gt;</td>
                <td colSpan={5}>&lt;내지관련&gt;</td>
              </tr>
              <tr>
                <td colSpan={5}>{v(order.cover_related)}</td>
                <td colSpan={5}>{v(order.inner_related)}</td>
              </tr>
              <tr>
                <td>요청사항</td>
                <td colSpan={9}>{v(order.request_note)}</td>
              </tr>
              <tr>
                <td colSpan={10}>※원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며 작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.</td>
              </tr>
              <tr>
                <td>편집 작업자</td>
                <td colSpan={4}>{v(order.editor_name, order.manager_name || '김광일')}</td>
                <td>디자인 작업자</td>
                <td colSpan={4}>{v(order.designer_name, '-')}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
