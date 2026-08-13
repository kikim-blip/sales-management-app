// src/components/common/JobOrderPrintModal.jsx
import React, { useRef } from 'react';
import { X, Download, Printer, FileText, FileSpreadsheet, FileCode } from 'lucide-react';
import * as XLSX from 'xlsx';
import { exportJobOrderToHWP } from '../../services/hwpExportService';

export default function JobOrderPrintModal({ order, customer, onClose }) {
  const printRef = useRef();
  const excelTableRef = useRef();

  if (!order) return null;

  const today = new Date().toISOString().split('T')[0];
  const custName = customer ? customer.name : (order.customer_name || order.customer_id || '');
  const custDept = customer ? customer.dept : (order.dept || '');
  const custContact = customer ? customer.contact_person : (order.client_contact_person || '');
  const custPhone = customer ? customer.phone : (order.client_phone || '');

  // 빈값 감싸기 헬퍼
  const v = (val, defaultVal = '') => {
    if (val === null || val === undefined || val === '') return defaultVal;
    return val;
  };

  // 📊 엑셀 (.xlsx) 다운로드: HTML 테이블의 모든 colSpan 셀 병합 100% 자동 유지!
  const handleExportExcel = () => {
    if (!excelTableRef.current) return;
    const fileName = `경성문화사_작업전표_${order.code_number || 'ORDER'}_${today}.xlsx`;
    
    // HTML 테이블을 엑셀 워크시트로 자동 변환 (모든 colSpan 셀 병합 100% 완벽 유지!)
    const worksheet = XLSX.utils.table_to_sheet(excelTableRef.current, { raw: true });
    
    // 엑셀 열 너비 (A~J열) 최적화 설정
    worksheet['!cols'] = [
      { wch: 15 }, // A열: 항목명 (코드번호, 발주처, 품명 등)
      { wch: 16 }, // B열
      { wch: 16 }, // C열
      { wch: 16 }, // D열
      { wch: 15 }, // E열: 항목명 (면수, 견적금액, 이메일 등)
      { wch: 16 }, // F열
      { wch: 16 }, // G열
      { wch: 12 }, // H열: 결재란
      { wch: 12 }, // I열: 결재란
      { wch: 12 }, // J열: 결재란
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
        
        {/* 모달 상단 조작 헤더 (인쇄 시 자동 숨김) */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between bg-slate-50 gap-2 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-800 text-base">
              경성문화사 실물 작업전표 1:1 양식 서식 (PDF / 엑셀 / HWP 한글 추출)
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {/* 💡 1클릭 HWP 한글 파일 다운로드 버튼 (golbin/hop 및 HWP 5.0 호환) */}
            <button
              onClick={() => exportJobOrderToHWP(order, customer)}
              className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
              title="한컴오피스 HWP 한글 파일 다운로드"
            >
              <FileCode className="w-4 h-4" />
              <span>HWP 한글 양식 다운로드 (.hwp)</span>
            </button>

            {/* 💡 1클릭 엑셀 다운로드 버튼 */}
            <button
              onClick={handleExportExcel}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
              title="마이크로소프트 엑셀 파일 다운로드"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>양식 엑셀 다운로드 (.xlsx)</span>
            </button>

            {/* 💡 1클릭 PDF 인쇄 버튼 */}
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

        {/* 📄 경성문화사 실물 작업전표 1:1 종이 양식 (화면 및 PDF 인쇄용) */}
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
                <div className="flex items-center space-x-1.5">
                  <div className="w-4 h-4 bg-sky-600 clip-triangle flex-shrink-0" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                  <span className="font-black text-sky-800 tracking-wider text-base">KYUNGSUNG</span>
                  <span className="font-extrabold text-slate-900 text-sm">경성문화사</span>
                </div>

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

            {/* 3. 1:1 실물 표 서식 테이블 */}
            <div className="border-2 border-slate-900 divide-y-2 divide-slate-900 bg-white">
              
              <div className="divide-y divide-slate-900">
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center text-center tracking-widest">발 주 처</div>
                  <div className="col-span-6 p-2 text-rose-600 font-extrabold flex items-center text-sm">{custName}</div>
                  <div className="col-span-4 p-2 text-rose-600 font-extrabold text-center flex items-center justify-center border-l border-slate-900 text-sm">{custDept}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center text-center tracking-widest">품 명</div>
                  <div className="col-span-10 p-2 text-rose-600 font-extrabold text-sm">{v(order.title)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center tracking-widest">규 격</div>
                  <div className="col-span-4 p-2 text-rose-600 font-mono">{v(order.spec)}</div>
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center border-l border-slate-900 tracking-widest">면 수</div>
                  <div className="col-span-4 p-2 text-rose-600 font-mono flex justify-between px-4">
                    <span>{v(order.pages)}</span>
                    {order.duplex && <span className="border-l border-dotted border-slate-400 pl-3">{order.duplex}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold text-center">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center tracking-widest">수 량</div>
                  <div className="col-span-4 p-2 text-rose-600 font-extrabold">{order.quantity ? `${order.quantity}부` : ''}</div>
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center border-l border-slate-900 tracking-wider">견 적 금 액</div>
                  <div className="col-span-4 p-2 text-rose-600 font-extrabold border-l border-slate-900">
                    {order.estimated_price ? `${Number(order.estimated_price).toLocaleString()}원` : ''}
                  </div>
                </div>

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

              <div className="divide-y divide-slate-900">
                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">표 지 작 업</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.cover_job)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-wider">표 지 용 지</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.cover_paper)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">표 지 인 쇄</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.cover_print)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-widest">코 팅</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.coating)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">내 지 작 업</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.inner_job)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-wider">본 문 용 지</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.inner_paper)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">내 지 인 쇄</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.inner_print)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-wider">간 지 용 지</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.interleaf_paper)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-widest">제 본</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.binding)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-widest">후 가 공</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">없음</div>
                </div>

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

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">교 정 방 법</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.proof_method)}</div>
                  <div className="col-span-6 p-1.5 bg-white"></div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-widest">기 획</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.planning)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-wider">사 진 촬 영</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.photography, '-')}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">일 러 스 트</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.illustration)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-tight">저작권ㆍ웹게시</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.copyright_web, '-')}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 text-center">
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold tracking-wider">제 작 진 행</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.production_progress)}</div>
                  <div className="col-span-2 p-1.5 bg-slate-50 font-bold border-l border-slate-900 tracking-wider">납 품 처</div>
                  <div className="col-span-4 p-1.5 text-rose-600 font-bold">{v(order.delivery_destination)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center text-center tracking-wider">표 지 컨 셉</div>
                  <div className="col-span-10 p-2 text-rose-600 font-semibold min-h-[36px]">{v(order.cover_related)}</div>
                </div>

                <div className="grid grid-cols-12 divide-x border-b border-slate-900 font-bold">
                  <div className="col-span-2 p-2 bg-slate-50 flex items-center justify-center text-center tracking-wider">내 지 컨 셉</div>
                  <div className="col-span-10 p-2 text-rose-600 font-semibold min-h-[36px]">{v(order.inner_related)}</div>
                </div>

                <div className="p-3 min-h-[90px]">
                  <p className="font-bold text-slate-900 mb-1.5 text-[11px]">&lt;요청사항&gt;</p>
                  <p className="text-rose-600 whitespace-pre-wrap font-semibold leading-relaxed">{v(order.request_note)}</p>
                </div>
              </div>

            </div>

            <div className="text-[10px] text-slate-800 space-y-0.5 mt-2 font-medium">
              <p>※ 원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며</p>
              <p className="pl-12">작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.</p>
            </div>

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

        {/* 📊 엑셀 다운로드 전용 HTML 테이블 */}
        <div className="hidden">
          <table ref={excelTableRef} border="1">
            <tbody>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>코드번호</td>
                <td colSpan={3} style={{ color: '#dc2626', fontWeight: 'bold' }}>{v(order.code_number)}</td>
                <td colSpan={2} style={{ fontWeight: 'bold', textAlign: 'center' }}>KYUNGSUNG 경성문화사</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#e2e8f0', textAlign: 'center' }}>결재</td>
                <td style={{ fontWeight: 'bold', textAlign: 'center' }}>담당</td>
                <td style={{ fontWeight: 'bold', textAlign: 'center' }}>부서장</td>
                <td style={{ fontWeight: 'bold', textAlign: 'center' }}>회장</td>
              </tr>
              <tr>
                <td colSpan={4} style={{ fontSize: '16px', fontWeight: 'bold', textAlign: 'center' }}>작 업 전 표</td>
                <td colSpan={2}></td>
                <td></td>
                <td style={{ color: '#dc2626', textAlignment: 'center' }}>{v(order.manager_name)}</td>
                <td style={{ color: '#dc2626', textAlignment: 'center' }}>김광일</td>
                <td></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>접수일 :</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{order.receipt_date}</td>
                <td style={{ fontWeight: 'bold' }}>납품일 :</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>{order.delivery_date} {order.delivery_time}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>발 주 처</td>
                <td colSpan={5} style={{ color: '#dc2626', fontWeight: 'bold' }}>{custName}</td>
                <td colSpan={4} style={{ color: '#dc2626', fontWeight: 'bold' }}>{custDept}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>품 명</td>
                <td colSpan={9} style={{ color: '#dc2626', fontWeight: 'bold' }}>{v(order.title)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>규 격</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.spec)}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>면 수</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>{v(order.pages)} {order.duplex ? `/ ${order.duplex}` : ''}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>수 량</td>
                <td colSpan={3} style={{ color: '#dc2626', fontWeight: 'bold' }}>{order.quantity ? `${order.quantity}부` : ''}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>견 적 금 액</td>
                <td colSpan={5} style={{ color: '#dc2626', fontWeight: 'bold' }}>{order.estimated_price ? `${Number(order.estimated_price).toLocaleString()}원` : ''}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>발주업체 담당자</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(custContact)} ({v(custPhone)})</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>이 메 일</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>{v(order.client_email)} {v(order.email_receipt_time, '')}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>표 지 작 업</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.cover_job)}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>표 지 용 지</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>{v(order.cover_paper)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>표 지 인 쇄</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.cover_print)}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>코 팅</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>{v(order.coating)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>내 지 작 업</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.inner_job)}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>본 문 용 지</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>{v(order.inner_paper)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>내 지 인 쇄</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.inner_print)}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>간 지 용 지</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>{v(order.interleaf_paper)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>제 본</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.binding)}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>후 가 공</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>없음</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>원 고</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.draft_email)} {v(order.draft_group)} {v(order.mail_sender)}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>교 정 일</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>표지: {v(order.cover_proof_date)} / 내지: {v(order.inner_proof_date)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>교 정 방 법</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.proof_method)}</td>
                <td colSpan={6}></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>기 획</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.planning)}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>사 진 촬 영</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>{v(order.photography, '-')}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>일 러 스 트</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.illustration)}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>저작권ㆍ웹게시</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>{v(order.copyright_web, '-')}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>제 작 진 행</td>
                <td colSpan={3} style={{ color: '#dc2626' }}>{v(order.production_progress)}</td>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>납 품 처</td>
                <td colSpan={5} style={{ color: '#dc2626' }}>{v(order.delivery_destination)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>표 지 컨 셉</td>
                <td colSpan={9} style={{ color: '#dc2626' }}>{v(order.cover_related)}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>내 지 컨 셉</td>
                <td colSpan={9} style={{ color: '#dc2626' }}>{v(order.inner_related)}</td>
              </tr>
              <tr>
                <td colSpan={10} style={{ fontWeight: 'bold' }}>&lt;요청사항&gt;<br/>{v(order.request_note)}</td>
              </tr>
              <tr>
                <td colSpan={10} style={{ fontSize: '10px' }}>※ 원칙: 영업자는 6하원칙에 따라 작업자가 쉽게 이해 하도록 작업내용을 구체적으로 작성하여 요청 바라며 작업자는 업무를 배당받고 실제 작업착수시에 영업자에게 재차 요청업무를 확인 후 진행 당부 드립니다.</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ fontWeight: 'bold' }}>표지 작업자 : {v(order.editor_name, order.manager_name || '김광일')}</td>
                <td colSpan={5} style={{ fontWeight: 'bold' }}>내지 작업자 : {v(order.designer_name, '-')}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
