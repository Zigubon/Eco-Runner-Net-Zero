// [DATA] Net Zero City V4.0 : Ultimate Edition

export const GAME_CONFIG = {
    START_MONEY: 500,
    START_REP: 15,      // 초기 평판
    MAX_YEARS: 15,
    TAX_RATE_BASE: 1,
    POLICY_INTERVAL: 3, // 3년마다 정책 안건 상정
};

// --- 1. 맵 (지형) 데이터 ---
export const MAPS = [
    { 
        id: 'plain', name: '푸른 평원', icon: '🌲', 
        desc: '균형 잡힌 표준 난이도입니다.', 
        effectDesc: '특수 효과 없음',
        bg: '#74b9ff' 
    },
    { 
        id: 'desert', name: '불타는 사막', icon: '🌵', 
        desc: '일조량이 풍부하지만 녹화가 어렵습니다.', 
        effectDesc: '☀️ 태양광 발전량 +50%\n📉 숲 건설 비용 3배',
        bg: '#e1b12c' 
    },
    { 
        id: 'port', name: '무역 항구', icon: '⚓', 
        desc: '상업이 발달하지만 자연재해에 취약합니다.', 
        effectDesc: '💰 상업 건물 수익 +20%\n🌊 태풍 피해량 2배',
        bg: '#0984e3' 
    }
];

// --- 2. 리더 (직업) 데이터 ---
export const LEADERS = [
    { 
        id: 'energy', name: '에너지 전문가', icon: '⚡', 
        desc: '전력망 효율화의 대가', 
        buff: '에너지 건물 건설비 -20%' 
    },
    { 
        id: 'climate', name: '기후 전문가', icon: '🌱', 
        desc: '탄소 배출 규제 완화', 
        buff: '탄소세 50% 감면' 
    },
    { 
        id: 'economy', name: '경제 전문가', icon: '💰', 
        desc: '공격적인 투자 유치', 
        buff: '모든 건물 수익 +15%' 
    }
];

// --- 3. 정책 (Policy) 데이터 ---
// cost: 시행 비용, rep: 평판 변화, emit: 탄소 변화(영구)
export const POLICIES = [
    {
        id: 'diesel_ban', title: '노후 경유차 운행 제한',
        desc: '도심 내 등급이 낮은 차량의 운행을 제한하여 대기질을 개선합니다.',
        y: { label: '승인', cost: 20, rep: 5, emit: -3, msg: '대기질이 개선되었습니다.' },
        n: { label: '거부', cost: 0, rep: -2, emit: 1, msg: '시민들이 매연에 불만을 가집니다.' }
    },
    {
        id: 'green_belt', title: '그린벨트 해제 안건',
        desc: '도시 외곽의 녹지를 해제하여 개발 부지를 확보합니다.',
        y: { label: '개발 허가', cost: 0, rep: -10, emit: 5, bonusMoney: 100, msg: '건설사로부터 개발부담금을 받았습니다 (+100억).' },
        n: { label: '보존', cost: 0, rep: 5, emit: -1, msg: '녹지가 보존되었습니다.' }
    },
    {
        id: 'four_day_work', title: '주 4일제 도입 시범',
        desc: '근로 시간을 단축하여 삶의 질을 높입니다.',
        y: { label: '도입', cost: 50, rep: 15, emit: 0, msg: '시민 만족도가 대폭 상승했습니다!' },
        n: { label: '시기상조', cost: 0, rep: -5, emit: 0, msg: '노동계의 반발이 있습니다.' }
    },
    {
        id: 'plastic_tax', title: '일회용품 세금 부과',
        desc: '플라스틱 사용을 줄이기 위해 강력한 세금을 부과합니다.',
        y: { label: '부과', cost: 10, rep: -3, emit: -5, msg: '쓰레기 배출량이 눈에 띄게 줄었습니다.' },
        n: { label: '유예', cost: 0, rep: 0, emit: 2, msg: '쓰레기 문제가 심화됩니다.' }
    }
];

// --- 4. 업적 (Achievements) 데이터 ---
export const ACHIEVEMENTS = [
    { id: 'solar_king', title: '태양의 아들', desc: '태양광 발전소 5개 이상 건설', reward: 50 },
    { id: 'forest_city', title: '숲의 도시', desc: '도시숲 5개 이상 건설', reward: 50 },
    { id: 'money_maker', title: '부자 도시', desc: '자산 1000억 달성', reward: 100 },
    { id: 'net_zero', title: '넷제로 달성', desc: '탄소 배출량 0 이하 만들기', reward: 200 }
];

// --- 5. 연구 데이터 ---
export const RESEARCH = [
    { id: 'smart_grid', name: '스마트 그리드', cost: 200, icon: '📡', desc: '데이터센터/ESS/스마트시티 해금' },
    { id: 'circular_tech', name: '순환 경제', cost: 150, icon: '♻️', desc: '고효율 자원순환 시설 해금' },
    { id: 'green_infra', name: '녹색 인프라', cost: 100, icon: '🌳', desc: '대형 공원 및 탄소 흡수 기술' },
    { id: 'adv_energy', name: '차세대 에너지', cost: 300, icon: '⚛️', desc: 'SMR(소형원전) 건설 허가', req: 'smart_grid' }
];

// --- 6. 건물 데이터 ---
export const BUILDINGS = [
    // [0] 기본/유산
    { id: 'forest', name: '숲', icon: '🌲', type: 'forest', cost: 0, rev: 0, exp: 0, emit: -2, power: 0, w:1, h:1, desc: '자연 정화' },
    { id: 'town_hall', name: '시청', icon: '🏛️', type: 'infra', cost: 0, rev: 15, exp: 0, emit: 0, power: 5, w:1, h:1, desc: '행정 중심' },
    
    // 오염 유산
    { id: 'landfill', name: '매립지', icon: '🗑️', type: 'legacy', cost: 0, rev: 0, exp: 5, emit: 15, power: 0, demolishCost: 50, w:1, h:1, desc: '철거비 50억' },
    { id: 'old_factory', name: '노후공장', icon: '🏭', type: 'legacy', cost: 0, rev: 10, exp: 5, emit: 20, power: -5, demolishCost: 40, w:1, h:1, desc: '철거비 40억' },
    { id: 'flood_house', name: '침수주택', icon: '🏚️', type: 'legacy', cost: 0, rev: 2, exp: 2, emit: 2, power: -1, demolishCost: 30, w:1, h:1, desc: '철거비 30억' },

    // [1] 성장
    { id: 'shop_s', name: '소형상가', icon: '🏪', type: 'growth', cost: 40, rev: 12, exp: 3, emit: 4, power: -2, w:1, h:1, desc: '동네 상권' },
    { id: 'shop_l', name: '대형몰', icon: '🏬', type: 'growth', cost: 150, rev: 60, exp: 15, emit: 20, power: -10, w:2, h:2, desc: '2x2 대형' },
    { id: 'logistics', name: '물류허브', icon: '🚛', type: 'growth', cost: 150, rev: 70, exp: 20, emit: 25, power: -10, w:2, h:1, desc: '2x1 물류' },
    { id: 'industry_h', name: '중공업단지', icon: '🏭', type: 'growth', cost: 200, rev: 100, exp: 30, emit: 45, power: -25, w:2, h:1, desc: '2x1 고수익' },
    { id: 'data_center', name: '데이터센터', icon: '💾', type: 'growth', cost: 250, rev: 120, exp: 40, emit: 10, power: -40, w:1, h:1, desc: '전력 블랙홀', reqTech: 'smart_grid' },

    // [2] 에너지
    { id: 'coal_plant', name: '석탄발전', icon: '🌑', type: 'energy', cost: 60, rev: 5, exp: 5, emit: 30, power: 30, w:1, h:1, desc: '싸고 더러움' },
    { id: 'gas_plant', name: '가스발전', icon: '🔥', type: 'energy', cost: 80, rev: 5, exp: 10, emit: 12, power: 15, w:1, h:1, desc: '안정적 공급' },
    { id: 'solar', name: '태양광', icon: '☀️', type: 'energy', cost: 100, rev: 2, exp: 2, emit: 0, power: 10, w:1, h:1, desc: '청정 에너지' },
    { id: 'wind_farm', name: '풍력단지', icon: '🌀', type: 'energy', cost: 180, rev: 8, exp: 5, emit: 0, power: 25, w:2, h:1, desc: '2x1 고효율' },
    { id: 'ess', name: 'ESS저장소', icon: '🔋', type: 'energy', cost: 90, rev: 0, exp: 5, emit: 0, power: 5, w:1, h:1, desc: '전력망 보조', reqTech: 'smart_grid' },
    { id: 'nuclear', name: 'SMR', icon: '⚛️', type: 'energy', cost: 350, rev: 15, exp: 20, emit: 0, power: 55, w:1, h:1, desc: '차세대 원전', reqTech: 'adv_energy' },

    // [3] 순환 & 인프라
    { id: 'mrf', name: '선별센터', icon: '♻️', type: 'circular', cost: 80, rev: 15, exp: 10, emit: -5, power: -3, w:1, h:1, desc: '재활용' },
    { id: 'chem_recycle', name: '화학적재활용', icon: '⚗️', type: 'circular', cost: 150, rev: 25, exp: 15, emit: -15, power: -10, w:1, h:1, desc: '대규모 감축', reqTech: 'circular_tech' },
    { id: 'park', name: '도시숲', icon: '🌳', type: 'infra', cost: 40, rev: 0, exp: 3, emit: -3, power: 0, w:1, h:1, desc: '시민 휴식처' },
    { id: 'hospital', name: '종합병원', icon: '🏥', type: 'infra', cost: 150, rev: 20, exp: 20, emit: 5, power: -10, w:2, h:1, desc: '회복력 상승' },
    { id: 'smart_city', name: '스마트시티', icon: '🏙️', type: 'infra', cost: 300, rev: 50, exp: 15, emit: -10, power: -10, w:2, h:2, desc: '2x2 주거', reqTech: 'green_infra' },
];

// 7. 이벤트 목록 (랜덤)
export const EVENTS = [
    { name: '기록적 폭염', msg: '냉방 수요 폭증! (전력 -20)', effect: (s) => { s.weekPower -= 20; return '전력난 심화'; } },
    { name: '태풍 상륙', msg: '시설물 침수 피해 발생', effect: (s) => { 
        let dmg = 80; s.money -= dmg; return `복구비 -${dmg}`; 
    }},
    { name: '탄소국경세', msg: '수출 기업 탄소세 부과', effect: (s) => {
        let fine = Math.floor(s.weekEmit * 0.8); s.money -= fine; return `관세 -${fine}`;
    }},
    { name: 'ESG 경영대상', msg: '우수 도시 선정 보너스', effect: (s) => {
        let bonus = s.rep > 25 ? 100 : 0; s.money += bonus; return bonus > 0 ? `상금 +${bonus}` : '조건 미달 (평판 부족)';
    }},
    { name: '기술 혁신', msg: '발전 효율 증가', effect: (s) => { s.weekPower += 20; return '전력 +20'; } },
    { name: '국제 투자 유치', msg: '친환경 도시 투자금 유입', effect: (s) => { s.money += 50; return '투자금 +50'; } },
    { name: '평온한 한해', msg: '특별한 사건 없이 지나갔습니다.', effect: () => '무탈함' }
];
