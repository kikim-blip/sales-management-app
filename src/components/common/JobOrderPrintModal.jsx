// src/components/common/JobOrderPrintModal.jsx
import React, { useRef } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function JobOrderPrintModal({ order, customer, onClose }) {
  const printRef = useRef();
  const excelTableRef = useRef();

  if (!order) return null;

  const today = new Date().toISOString().split('T')[0];
  const custName = customer ? customer.name : (order.customer_name || order.customer_id || '');
  const custDept = customer ? customer.dept : (order.dept || '');
  const custContact = customer ? customer.contact_person : (order.client_contact_person || '');
  const custPhone = customer ? customer.phone : (order.client_phone || '');

  // 빈값 감싸기 헬퍼 (값이 있으면 표시, 없으면 공백 또는 -)
  const v = (val, defaultVal = '') => {
    if (val === null || val === undefined || val === '') return defaultVal;
    return val;
  };

  // 📊 첨부해주신 PDF 실물 서식과 100% 동일한 엑셀 추출 (.xlsx)
  const handleExportExcel = () => {
    if (!excelTableRef.current) return;
    const fileName = `경성문화사_작업전표_${order.code_number || 'ORDER'}_${today}.xlsx`;
    
    // HTML 테이블을 엑셀 워크시트로 자동 변환 (모든 colspan/rowspan 셀 병합 100% 유지)
    const worksheet = XLSX.utils.table_to_sheet(excelTableRef.current, { raw: true });
    
    // 엑셀 열 너비 자동 설정
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
    XLSX.utils.book_append_sheet(workbook, worksheet, '작업전표');
    XLSX.writeFile(workbook, fileName);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* 모달 상단 조작 헤더 (인쇄 시 자동 숨김) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base">
              경성문화사 실물 작업전표 1:1 샘플 양식 (PDF / 엑셀 추출)
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

        {/* 📄 경성문화사 실물 작업전표 1:1 종이 양식 (PDF 샘플 이미지와 100% 동일한 레이아웃) */}
        <div className="p-8 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-sans text-xs">
          <div id="printable-job-order-document" ref={printRef} className="bg-white p-2 border border-slate-300 print:border-none">
            
            {/* 1. 상단 레이아웃: [좌측: 코드번호 박스 & 큰 타이틀 '작 업 전 표'] | [우측: KYUNGSUNG 로고 & 결재란] */}
            <div className="flex justify-between items-start mb-4">
              
              {/* 좌측: 코드번호 상자 + 작 업 전 표 타이틀 */}
              <div className="space-y-4">
                <div className="border-2 border-slate-900 px-4 py-2 flex items-center space-x-4 bg-white min-w-[280px]">
                  <span className="font-bold text-slate-900 text-xs tracking-wider">코 드 번 호</span>
                  <span className="font-mono font-black text-rose-600 text-base tracking-widest">
                    {v(order.code_number)}
                  </span>
                </div>

                <h1 className="text-3xl font-black tracking-[0.6em] text-slate-900 uppercase pt-2">
                  작 업 전 표
                </h1>
              </div>

              {/* 우측: KYUNGSUNG 경성문화사 로고 + 결재란 */}
              <div className="flex flex-col items-end space-y-3">
                {/* KYUNGSUNG 경성문화사 로고 (파란 삼각 심볼) */}
                <div className="flex items-center space-x-1.5">
                  <div className="w-4 h-4 bg-sky-600 clip-triangle flex-shrink-0" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                  <span className="font-black text-sky-800 tracking-wider text-base">KYUNGSUNG</span>
                  <span className="font-extrabold text-slate-900 text-sm">경성문화사</span>
                </div>

                {/* 결재란 표 (결재 | 담당 | 부서장 | 회장) */}
                <div className="border-2 border-slate-900 text-center text-[11px] flex bg-white">
                  <div className="border-r border-slate-900 bg-slate-100 font-bold w-7 flex items-center justify-center p-1 text-[11px] leading-tight">
                    결<br/>재
                  </div>
                  <div className="divide-y divide-slate-900 min-w-[180px]">
                    <div className="grid grid-cols-3 divide-x divide-slate-900 border-b border-slate-900 bg-slate-100 font-bold p-1">
                      <div>담 당</div>
                      <div>부서장</div>
                      <div>회 장</div>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-slate-900 h-10 font-bold text-rose-600">
                      <div className="flex items-center justify-center">{v(order.manager_name)}</div>
                      <div className="flex items-center justify-center">김광일</div>
                      <div className="flex items-center justify-center"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 2. 접수일 & 납품일 서식 헤더 */}
            <div className="flex justify-between items-center mb-1 font-bold text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-900 font-bold">접 수 일 :</span>
                <span className="text-rose-600 font-mono font-bold">
                  {order.receipt_date ? order.receipt_date.replace(/-/g, '년 ').concat('일') : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-900 font-bold">납 품 일 :</span>
                <span className="text-rose-600 font-mono font-bold">
                  {order.delivery_date ? order.delivery_date.replace(/-/g, '년 ').concat('일') : ''} {order.delivery_time ? `시간 ${order.delivery_time}` : ''}
                </span>
              </div>
            </div>

            {/* 3. 1:1 실물 표 서식 테이블 (PDF 샘플과 100% 매칭) */}
            <div className="border-2 border-slate-900 divide-y-2 divide-slate-900 bg-white">
              
              {/* 상단 기본 정보 섹션 */}
              <div className="divide-y divide-slate-900">
                
                {/* Row 1: 발주처 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center text-center tracking-widest">발 주 처</div>
                  <div className="col-span-6 p-2 text-rose-600 font-extrabold flex items-center text-sm">{custName}</div>
                  <div className="col-span-4 p-2 text-rose-600 font-extrabold text-center flex items-center justify-center border-l border-slate-900 text-sm">{custDept}</div>
                </div>

                {/* Row 2: 품명 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center text-center tracking-widest">품 명</div>
                  <div className="col-span-10 p-2 text-rose-600 font-extrabold text-sm">{v(order.title)}</div>
                </div>

                {/* Row 3: 규격 / 면수 / 양단면 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center tracking-widest">규 격</div>
                  <div className="col-span-4 p-2 text-rose-600 font-mono">{v(order.spec)}</div>
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center border-l border-slate-900 tracking-widest">면 수</div>
                  <div className="col-span-4 p-2 text-rose-600 font-mono flex justify-between px-4">
                    <span>{v(order.pages)}</span>
                    {order.duplex && <span className="border-l border-dotted border-slate-400 pl-3">{order.duplex}</span>}
                  </div>
                </div>

                {/* Row 4: 수량 & 견적금액 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold text-center">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center tracking-widest">수 량</div>
                  <div className="col-span-4 p-2 text-rose-600 font-extrabold">{order.quantity ? `${order.quantity}부` : ''}</div>
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center border-l border-slate-900 tracking-wider">견 적 금 액</div>
                  <div className="col-span-4 p-2 text-rose-600 font-extrabold border-l border-slate-900">
                    {order.estimated_price ? `${Number(order.estimated_price).toLocaleString()}원` : ''}
                  </div>
                </div>

                {/* Row 5: 발주업체 담당자 & 이메일 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center text-center leading-tight tracking-wider">발 주 업 체<br/>담 당 자</div>
                  <div className="col-span-4 p-2 space-y-0.5">
                    <p className="text-rose-600">{v(custContact)}</p>
                    <p className="text-rose-600 font-mono text-[11px]">{v(custPhone)}</p>
                  </div>
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center text-center border-l border-slate-900 tracking-widest">이 메 일</div>
                  <div className="col-span-4 p-2 space-y-0.5 border-l border-slate-900">
                    <p className="text-rose-600 font-mono">{v(order.client_email)}</p>
                    <p className="text-rose-600 font-mono text-[11px]">{v(order.email_receipt_time)}</p>
                  </div>
                </div>

              </div>

              {/* 하단 인쇄/표지/내지 사양 섹션 (구분 두꺼운 테두리) */}
              <div className="divide-y divide-slate-900">
                
                {/* Row 6: 표지작업 & 표지용지 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">표 지 작 업</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.cover_job)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-wider">표 지 용 지</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.cover_paper)}</div>
                </div>

                {/* Row 7: 표지인쇄 & 코팅 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">표 지 인 쇄</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.cover_print)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-widest">코 팅</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.coating)}</div>
                </div>

                {/* Row 8: 내지작업 & 본문용지 (★ PDF 샘플과 동일하게 '본문용지' 표기!) */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">내 지 작 업</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.inner_job)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-wider">본 문 용 지</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.inner_paper)}</div>
                </div>

                {/* Row 9: 내지인쇄 & 간지용지 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">내 지 인 쇄</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.inner_print)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-wider">간 지 용 지</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.interleaf_paper)}</div>
                </div>

                {/* Row 10: 제본 & 후가공 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-widest">제 본</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.binding)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-widest">후 가 공</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">없음</div>
                </div>

                {/* Row 11: 원고 & 교정일 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold flex items-center justify-center tracking-widest">원 고</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-mono font-bold flex items-center justify-around">
                    <span>{v(order.draft_email)}</span>
                    <span>{v(order.draft_group)}</span>
                    <span>{v(order.mail_sender)}</span>
                  </div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 flex items-center justify-center tracking-widest">교 정 일</div>
                  <div className="col-span-4 divide-y divide-slate-200 text-[11px]">
                    <div className="flex justify-between px-3 py-0.5"><span className="font-bold">표지</span><span className="text-rose-600">{v(order.cover_proof_date)}</span></div>
                    <div className="flex justify-between px-3 py-0.5"><span className="font-bold">내지</span><span className="text-rose-600">{v(order.inner_proof_date)}</span></div>
                  </div>
                </div>

                {/* Row 12: 교정방법 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">교 정 방 법</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.proof_method)}</div>
                  <div className="col-span-6 p-1.5 bg-white"></div>
                </div>

                {/* Row 13: 기획 & 사진촬영 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-widest">기 획</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.planning)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-wider">사 진 촬 영</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.photography, '-')}</div>
                </div>

                {/* Row 14: 일러스트 & 저작권.웹게시 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">일 러 스 트</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.illustration)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-tight">저작권ㆍ웹게시</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.copyright_web, '-')}</div>
                </div>

                {/* Row 15: 제작진행 & 납품처 */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">제 작 진 행</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.production_progress)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-wider">납 품 처</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.delivery_destination)}</div>
                </div>

                {/* Row 16: 표지컨셉 (★ PDF 샘플과 동일하게 '표지컨셉' 표기!) */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center text-center tracking-wider">표 지 컨 셉</div>
                  <div className="col-span-10 p-2 text-rose-600 font-semibold min-h-[36px]">{v(order.cover_related)}</div>
                </div>

                {/* Row 17: 내지컨셉 (★ PDF 샘플과 동일하게 '내지컨셉' 표기!) */}
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center text-center tracking-wider">내 지 컨 셉</div>
                  <div className="col-span-10 p-2 text-rose-600 font-semibold min-h-[36px]">{v(order.inner_related)}</div>
                </div>

                {/* Row 18: <요청사항> */}
                <div className="p-3 min-h-[90px]">
                  <p className="font-bold text-slate-900 mb-1.5 text-[11px]">&lt;요청사항&gt;</p>
                  <p className="text-rose-600 whitespace-pre-wrap font-semibold leading-relaxed">{v(order.request_note)}</p>
                </div>

              </div>

            </div>

            {/* 4. 하단 원칙 안내문 (PDF 샘플과 100% 동일한 텍스트 & 정렬) */}
            <div className="text-[10px] text-slate-800 space-y-0.5 mt-2 font-medium">
              <p>※ 원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며</p>
              <p className="pl-12">작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.</p>
            </div>

            {/* 5. 하단 작업자 서명란 (★ PDF 샘플과 동일하게 '표지 작업자 :' & '내지 작업자 :' 표기!) */}
            <div className="flex justify-between items-center mt-3 px-8 text-xs font-bold text-slate-900">
              <div className="flex items-center space-x-2">
                <span>표지 작업자 :</span>
                <span className="text-rose-600 font-extrabold">{v(order.editor_name, order.manager_name || '김광일')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>내지 작업자 :</span>
                <span className="text-rose-600 font-extrabold">{v(order.designer_name, '-')}</span>
              </div>
            </div>

          </div>
        </div>

        {/* 📊 엑셀 다운로드 전용 숨김 HTML 테이블 (PDF 샘플과 100% 동일한 서식) */}
        <div className="hidden">
          <table ref={excelTableRef} border="1">
            <tbody>
              <tr>
                <td>코드번호</td>
                <td colSpan={3}>{v(order.code_number)}</td>
                <td colSpan={2}>KYUNGSUNG 경성문화사</td>
                <td>결재</td>
                <td>담당</td>
                <td>부서장</td>
                <td>회장</td>
              </tr>
              <tr>
                <td colSpan={4}>작 업 전 표</td>
                <td colSpan={2}></td>
                <td></td>
                <td>{v(order.manager_name)}</td>
                <td>김광일</td>
                <td></td>
              </tr>
              <tr>
                <td>접수일 :</td>
                <td colSpan={3}>{order.receipt_date}</td>
                <td>납품일 :</td>
                <td colSpan={5}>{order.delivery_date} {order.delivery_time}</td>
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
                <td colSpan={3}>{v(order.spec)}</td>
                <td>면 수</td>
                <td colSpan={5}>{v(order.pages)} {order.duplex ? `/ ${order.duplex}` : ''}</td>
              </tr>
              <tr>
                <td>수 량</td>
                <td colSpan={3}>{order.quantity ? `${order.quantity}부` : ''}</td>
                <td>견 적 금 액</td>
                <td colSpan={5}>{order.estimated_price ? `${Number(order.estimated_price).toLocaleString()}원` : ''}</td>
              </tr>
              <tr>
                <td>발주업체 담당자</td>
                <td colSpan={3}>{v(custContact)} ({v(custPhone)})</td>
                <td>이 메 일</td>
                <td colSpan={5}>{v(order.client_email)} {v(order.email_receipt_time, '')}</td>
              </tr>
              <tr>
                <td>표 지 작 업</td>
                <td colSpan={3}>{v(order.cover_job)}</td>
                <td>표 지 용 지</td>
                <td colSpan={5}>{v(order.cover_paper)}</td>
              </tr>
              <tr>
                <td>표 지 인 쇄</td>
                <td colSpan={3}>{v(order.cover_print)}</td>
                <td>코 팅</td>
                <td colSpan={5}>{v(order.coating)}</td>
              </tr>
              <tr>
                <td>내 지 작 업</td>
                <td colSpan={3}>{v(order.inner_job)}</td>
                <td>본 문 용 지</td>
                <td colSpan={5}>{v(order.inner_paper)}</td>
              </tr>
              <tr>
                <td>내 지 인 쇄</td>
                <td colSpan={3}>{v(order.inner_print)}</td>
                <td>간 지 용 지</td>
                <td colSpan={5}>{v(order.interleaf_paper)}</td>
              </tr>
              <tr>
                <td>제 본</td>
                <td colSpan={3}>{v(order.binding)}</td>
                <td>후 가 공</td>
                <td colSpan={5}>없음</td>
              </tr>
              <tr>
                <td>원 고</td>
                <td colSpan={3}>{v(order.draft_email)} {v(order.draft_group)} {v(order.mail_sender)}</td>
                <td>교 정 일</td>
                <td colSpan={5}>표지: {v(order.cover_proof_date)} / 내지: {v(order.inner_proof_date)}</td>
              </tr>
              <tr>
                <td>교 정 방 법</td>
                <td colSpan={3}>{v(order.proof_method)}</td>
                <td colSpan={6}></td>
              </tr>
              <tr>
                <td>기 획</td>
                <td colSpan={3}>{v(order.planning)}</td>
                <td>사 진 촬 영</td>
                <td colSpan={5}>{v(order.photography, '-')}</td>
              </tr>
              <tr>
                <td>일 러 스 트</td>
                <td colSpan={3}>{v(order.illustration)}</td>
                <td>저작권ㆍ웹게시</td>
                <td colSpan={5}>{v(order.copyright_web, '-')}</td>
              </tr>
              <tr>
                <td>제 작 진 행</td>
                <td colSpan={3}>{v(order.production_progress)}</td>
                <td>납 품 처</td>
                <td colSpan={5}>{v(order.delivery_destination)}</td>
              </tr>
              <tr>
                <td>표 지 컨 셉</td>
                <td colSpan={9}>{v(order.cover_related)}</td>
              </tr>
              <tr>
                <td>내 지 컨 셉</td>
                <td colSpan={9}>{v(order.inner_related)}</td>
              </tr>
              <tr>
                <td colSpan={10}>&lt;요청사항&gt;<br/>{v(order.request_note)}</td>
              </tr>
              <tr>
                <td colSpan={10}>※ 원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며 작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.</td>
              </tr>
              <tr>
                <td colSpan={5}>표지 작업자 : {v(order.editor_name, order.manager_name || '김광일')}</td>
                <td colSpan={5}>내지 작업자 : {v(order.designer_name, '-')}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
