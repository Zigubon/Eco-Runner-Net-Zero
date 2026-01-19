// [DATA] 게임 밸런스 및 설정

export const CONFIG = {
    MAX_TURN: 12,        // 12분기
    START_MONEY: 50,     // 시작 자금 (단위: 억)
    BASE_TAX_RATE: 1,    // 초기 탄소세율 (점수당 1억)
    GOAL_SCORE: 200      // S등급 기준
};

// 30개 보드 타일 정의
// Types: start, market, tech, reg, offset, event, finance, rest
export const TILES = [
    { id: 0, type: 'start', name: 'START', desc: '분기 시작' },
    { id: 1, type: 'market', name: '편의점\n프랜차이즈', assetId: 'cvs' },
    { id: 2, type: 'tech', name: '에너지\n관리(EMS)' },
    { id: 3, type: 'event', name: '폭염 경보' },
    { id: 4, type: 'market', name: '물류센터', assetId: 'logistics' },
    { id: 5, type: 'reg', name: '보고 마감' },
    { id: 6, type: 'offset', name: '크레딧\n마켓' },
    { id: 7, type: 'market', name: '데이터\n센터', assetId: 'datacenter' },
    { id: 8, type: 'tech', name: '고효율\n설비' },
    { id: 9, type: 'finance', name: '대출 상담' },
    { id: 10, type: 'market', name: '제조 라인', assetId: 'factory' },
    { id: 11, type: 'event', name: '원자재\n급등' },
    { id: 12, type: 'reg', name: '현장 점검' },
    { id: 13, type: 'market', name: '리테일 몰', assetId: 'mall' },
    { id: 14, type: 'tech', name: '재생에너지\n계약' },
    { id: 15, type: 'rest', name: '리프레시', desc: '임직원 휴식' },
    { id: 16, type: 'market', name: '항만 물류', assetId: 'port' },
    { id: 17, type: 'offset', name: '프리미엄\n크레딧' },
    { id: 18, type: 'event', name: '홍수\n주의보' },
    { id: 19, type: 'market', name: '배터리\n공장', assetId: 'battery' },
    { id: 20, type: 'reg', name: '그린워싱\n단속' },
    { id: 21, type: 'tech', name: '공정\n전기화' },
    { id: 22, type: 'finance', name: '정부 보증' },
    { id: 23, type: 'market', name: 'AI 서비스', assetId: 'ai_svc' },
    { id: 24, type: 'event', name: '보조금\n공고' },
    { id: 25, type: 'offset', name: '장기\n오프테이크' },
    { id: 26, type: 'market', name: '해외 수출', assetId: 'export' },
    { id: 27, type: 'tech', name: '공급망\n전환' },
    { id: 28, type: 'reg', name: '감사 로봇' },
    { id: 29, type: 'market', name: '리사이클링', assetId: 'recycle' },
];

// 자산(사업장) 스탯
// cost: 구매가, rev: 매출, exp: 운영비, emit: 탄소배출
export const ASSETS = {
    'cvs': { name: '편의점', cost: 10, rev: 4, exp: 2, emit: 2 },
    'logistics': { name: '물류센터', cost: 20, rev: 8, exp: 4, emit: 5 },
    'datacenter': { name: '데이터센터', cost: 30, rev: 12, exp: 5, emit: 6 },
    'factory': { name: '제조라인', cost: 40, rev: 16, exp: 8, emit: 10 },
    'mall': { name: '리테일몰', cost: 25, rev: 9, exp: 4, emit: 4 },
    'port': { name: '항만물류', cost: 35, rev: 14, exp: 7, emit: 8 },
    'battery': { name: '배터리공장', cost: 50, rev: 20, exp: 10, emit: 9 },
    'ai_svc': { name: 'AI서비스', cost: 45, rev: 18, exp: 6, emit: 3 }, // 저탄소 고효율
    'export': { name: '수출채널', cost: 30, rev: 12, exp: 6, emit: 7 },
    'recycle': { name: '리사이클링', cost: 20, rev: 7, exp: 3, emit: 1 }
};

// 기술 업그레이드 옵션
export const TECH_UPGRADES = [
    { id: 'eff', name: '고효율화', cost: 5, effect: 'cost-1, emit-1', desc: '비용↓ 탄소↓' },
    { id: 'scale', name: '설비증설', cost: 8, effect: 'rev+3, emit+2', desc: '매출↑ 탄소↑' },
    { id: 'green', name: '친환경전환', cost: 10, effect: 'emit-3', desc: '탄소↓↓' }
];

// 탄소상쇄 옵션
export const OFFSETS = [
    { id: 'cheap', name: '저가 크레딧', cost: 2, reduce: 4, risk: 0.3, desc: '싸지만 무효화 위험(30%)' },
    { id: 'std', name: '표준 크레딧', cost: 4, reduce: 3, risk: 0.0, desc: '안정적인 감축' },
    { id: 'prem', name: '프리미엄', cost: 6, reduce: 2, risk: 0.0, rep: 1, desc: '감축 + 평판 상승' }
];
