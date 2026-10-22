// src/utils/printCalculators/defaultMasterData.js
/**
 * 인쇄 견적 표준 마스터 데이터 (경성문화사 / 한국 인쇄 표준 단가 기준)
 */

export const DEFAULT_PAPERS = [
  { id: 'P01', name: '스노우지', type: '스노우', weight: 80, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 38000 },
  { id: 'P02', name: '스노우지', type: '스노우', weight: 100, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 47500 },
  { id: 'P03', name: '스노우지', type: '스노우', weight: 120, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 57000 },
  { id: 'P04', name: '스노우지', type: '스노우', weight: 150, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 71200 },
  { id: 'P05', name: '스노우지', type: '스노우', weight: 180, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 85500 },
  { id: 'P06', name: '스노우지', type: '스노우', weight: 200, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 95000 },
  { id: 'P07', name: '스노우지', type: '스노우', weight: 250, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 118700 },

  { id: 'P08', name: '스노우지', type: '스노우', weight: 100, sizeName: '4×6전지', sizeWidth: 788, sizeHeight: 1091, unitPrice: 58000 },
  { id: 'P09', name: '스노우지', type: '스노우', weight: 120, sizeName: '4×6전지', sizeWidth: 788, sizeHeight: 1091, unitPrice: 69600 },
  { id: 'P10', name: '스노우지', type: '스노우', weight: 150, sizeName: '4×6전지', sizeWidth: 788, sizeHeight: 1091, unitPrice: 87000 },
  { id: 'P11', name: '스노우지', type: '스노우', weight: 180, sizeName: '4×6전지', sizeWidth: 788, sizeHeight: 1091, unitPrice: 104400 },
  { id: 'P12', name: '스노우지', type: '스노우', weight: 200, sizeName: '4×6전지', sizeWidth: 788, sizeHeight: 1091, unitPrice: 116000 },
  { id: 'P13', name: '스노우지', type: '스노우', weight: 250, sizeName: '4×6전지', sizeWidth: 788, sizeHeight: 1091, unitPrice: 145000 },

  { id: 'P14', name: '아트지', type: '아트', weight: 100, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 47000 },
  { id: 'P15', name: '아트지', type: '아트', weight: 120, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 56400 },
  { id: 'P16', name: '아트지', type: '아트', weight: 150, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 70500 },
  { id: 'P17', name: '아트지', type: '아트', weight: 200, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 94000 },
  { id: 'P18', name: '아트지', type: '아트', weight: 250, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 117500 },

  { id: 'P19', name: '백색 모조지', type: '모조', weight: 70, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 32000 },
  { id: 'P20', name: '백색 모조지', type: '모조', weight: 80, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 36500 },
  { id: 'P21', name: '백색 모조지', type: '모조', weight: 100, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 45600 },
  { id: 'P22', name: '미색 모조지', type: '모조', weight: 70, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 33000 },
  { id: 'P23', name: '미색 모조지', type: '모조', weight: 80, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 37500 },
  { id: 'P24', name: '미색 모조지', type: '모조', weight: 100, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 47000 },

  { id: 'P25', name: '뉴플러스지', type: '서적지', weight: 80, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 39500 },
  { id: 'P26', name: '뉴플러스지', type: '서적지', weight: 100, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 49400 },

  { id: 'P27', name: '랑데뷰(울트라화이트)', type: '고급지', weight: 130, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 112000 },
  { id: 'P28', name: '랑데뷰(울트라화이트)', type: '고급지', weight: 160, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 138000 },
  { id: 'P29', name: '랑데뷰(울트라화이트)', type: '고급지', weight: 210, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 181000 },
  { id: 'P30', name: '랑데뷰(울트라화이트)', type: '고급지', weight: 240, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 207000 },

  { id: 'P31', name: '아르떼지', type: '고급지', weight: 130, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 108000 },
  { id: 'P32', name: '아르떼지', type: '고급지', weight: 210, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 175000 },

  { id: 'P33', name: '마닐라(SC)', type: '판지', weight: 300, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 125000 },
  { id: 'P34', name: '마닐라(아이보리)', type: '판지', weight: 350, sizeName: '국전지', sizeWidth: 636, sizeHeight: 939, unitPrice: 165000 },
];

export const DEFAULT_PROCESSES = [
  // 제판 (PREPRESS)
  { id: 'PR01', name: 'CTP 출력', type: 'PREPRESS', category: 'CTP', desc: 'CTP 인쇄판 소부 및 출력' },
  { id: 'PR02', name: '기획 디자인', type: 'PREPRESS', category: 'DESIGN', desc: '기획, 디자인, 편집비' },
  { id: 'PR03', name: '조판 및 교정', type: 'PREPRESS', category: 'TYPESET', desc: '본문 조판 및 터잡기' },

  // 인쇄 (PRINT)
  { id: 'PR04', name: '매엽 오프셋 인쇄', type: 'PRINT', category: 'OFFSET', desc: '일반 매엽 옵셋 인쇄' },
  { id: 'PR05', name: '롤 오프셋(윤전) 인쇄', type: 'PRINT', category: 'ROLL', desc: '대량 부수 윤전 인쇄' },
  { id: 'PR06', name: '디지털 인쇄(POD)', type: 'PRINT', category: 'DIGITAL', desc: '소량 다품종 디지털 인쇄' },

  // 제본 (BINDING)
  { id: 'PR07', name: '무선제본', type: 'BINDING', category: 'WIRELESS', desc: '일반 핫멜트/PUR 무선제본' },
  { id: 'PR08', name: '무선날개제본', type: 'BINDING', category: 'WIRELESS', desc: '표지 앞뒤 날개 무선제본' },
  { id: 'PR09', name: '중철제본', type: 'BINDING', category: 'SADDLE', desc: '스테이플러 중철 제본' },
  { id: 'PR10', name: '환양장(하드커버)', type: 'BINDING', category: 'HARDCOVER', desc: '정통 각양장/환양장 제본' },
  { id: 'PR11', name: '스프링(와이어)제본', type: 'BINDING', category: 'SPRING', desc: '트윈 와이어 스프링 제본' },

  // 후가공 (FINISHING)
  { id: 'PR12', name: '무광 라미네이팅', type: 'FINISHING', category: 'COATING', desc: '표지 무광 코팅' },
  { id: 'PR13', name: '유광 라미네이팅', type: 'FINISHING', category: 'COATING', desc: '표지 유광 코팅' },
  { id: 'PR14', name: 'UV 코팅', type: 'FINISHING', category: 'COATING', desc: '전면 자외선 코팅' },
  { id: 'PR15', name: '부분 UV 코팅(실크)', type: 'FINISHING', category: 'COATING', desc: '제목/특정 부위 부분 광택' },
  { id: 'PR16', name: '금박/은박/먹박', type: 'FINISHING', category: 'FOIL', desc: '열박 및 핫스탬핑' },
  { id: 'PR17', name: '형압(동판/수지판)', type: 'FINISHING', category: 'EMBOSS', desc: '양각/음각 엠보싱' },
  { id: 'PR18', name: '톰슨(도무송 타발)', type: 'FINISHING', category: 'DIECUT', desc: '목형 모양 따내기' },
  { id: 'PR19', name: '접지(병풍/십자/2단)', type: 'FINISHING', category: 'FOLDING', desc: '리플렛 접지 공정' },
  { id: 'PR20', name: '오시/미싱', type: 'FINISHING', category: 'CREASE', desc: '접힘선(오시) 및 절취선' },
  { id: 'PR21', name: '에폭시 코팅', type: 'FINISHING', category: 'EPOXY', desc: '도톰한 입체 광택 후가공' },

  // 기타 (OTHER)
  { id: 'PR22', name: '포장 및 밴딩', type: 'OTHER', category: 'PACK', desc: '수축포장 및 박스포장' },
  { id: 'PR23', name: '물류/용달 배송비', type: 'OTHER', category: 'DELIVERY', desc: '전국 납품 운송비' },
];

export const DEFAULT_STD_PRICES = {
  // CTP 판당 단가
  ctp: {
    'CTP_COMMON': { name: 'CTP 인쇄판 (공통 표준)', unitPrice: 6500, unit: '판' },
    'CTP_4x6_2절': { name: '4×6판 2절', unitPrice: 15286, unit: '판' },
    'CTP_4x6_전지': { name: '4×6판 전지', unitPrice: 25476, unit: '판' },
    'CTP_국_2절': { name: '국 2절', unitPrice: 10618, unit: '판' },
    'CTP_국_전지': { name: '국 전지', unitPrice: 17697, unit: '판' },
  },

  // 4×6 2절 기준 도수별 통당 인쇄비 (원/통)
  offsetRates: {
    1000: [16.64, 33.26, 45.74, 59.88],
    2000: [15.24, 30.47, 41.90, 54.85],
    3000: [13.60, 27.18, 37.37, 48.93],
    5000: [11.98, 23.95, 32.94, 43.12],
    7000: [11.20, 22.40, 30.80, 40.32],
    10000: [10.28, 20.55, 28.26, 37.00],
    13000: [8.86, 17.72, 24.36, 31.89],
    max: [6.78, 13.55, 18.64, 24.40],
  },

  // 용지 손지율 (%)
  wasteRates: {
    1000: [9.0, 14.0, 18.0, 23.0],
    3000: [7.0, 11.0, 14.0, 17.5],
    5000: [5.5, 8.4, 11.0, 13.5],
    10000: [3.7, 5.7, 7.5, 9.3],
    max: [2.5, 3.8, 5.0, 6.3],
  },

  // 무선제본 면당 단가 (원/면)
  bindingRates: {
    '타블로이드': [1.86, 2.16, 3.08],
    '4x6배판': [1.31, 1.53, 2.17],
    '16절': [1.31, 1.53, 2.17],
    'B5': [1.31, 1.53, 2.17],
    '4x6판': [1.04, 1.21, 1.81],
    '32절': [1.04, 1.21, 1.81],
    '국배판': [2.26, 2.64, 3.88],
    'A4': [2.26, 2.64, 3.88],
    '국판': [1.07, 1.25, 1.86],
    'A5': [1.07, 1.25, 1.86],
    '크라운판': [1.17, 1.36, 2.01],
  },
  bindingBaseFee: 200000, // 무선제본 기본료

  // 후가공 단가
  finishing: {
    '무광코팅_4x6': { name: '무광코팅 4×6전지', unitPrice: 57000, unit: 'R', stdPrice: 78550 },
    '무광코팅_국전지': { name: '무광코팅 국전지', unitPrice: 46000, unit: 'R', stdPrice: 64000 },
    '유광코팅_4x6': { name: '유광코팅 4×6전지', unitPrice: 48000, unit: 'R', stdPrice: 60820 },
    '유광코팅_국전지': { name: '유광코팅 국전지', unitPrice: 40000, unit: 'R', stdPrice: 47000 },
    'UV코팅_4x6전지': { name: 'UV코팅 4×6전지', unitPrice: 40530, unit: 'R', stdPrice: 40530 },
    'UV코팅_국전지': { name: 'UV코팅 국전지', unitPrice: 33000, unit: 'R', stdPrice: 33000 },
    '부분UV_기본': { name: '부분UV 기본(판대포함)', unitPrice: 120000, unit: '건', stdPrice: 150000 },
    '박_기본료': { name: '금박/은박 기본료', unitPrice: 100000, unit: '건', stdPrice: 100000 },
    '박_부당단가': { name: '금박/은박 부당 단가', unitPrice: 30, unit: '부', stdPrice: 30 },
    '동판': { name: '형압 동판 제작', unitPrice: 35000, unit: '개', stdPrice: 35000 },
    '수지판': { name: '수지판 제작', unitPrice: 60000, unit: '개', stdPrice: 60000 },
    '목형_기본': { name: '톰슨 목형 제작', unitPrice: 200000, unit: 'EA', stdPrice: 200000 },
    '톰슨_가공': { name: '톰슨(도무송) 가공', unitPrice: 26000, unit: 'R', stdPrice: 26000 },
    '오시_줄당': { name: '오시(줄당/부)', unitPrice: 15, unit: '줄·부', stdPrice: 20 },
    '접지_부당': { name: '접지 가공비', unitPrice: 25, unit: '부', stdPrice: 30 },
    '에폭시': { name: '에폭시 코팅', unitPrice: 130, unit: '부', stdPrice: 130 },
  }
};
