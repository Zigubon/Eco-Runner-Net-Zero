// [DATA] 게임 밸런스 데이터 V2

export const GAME_CONFIG = {
    START_MONEY: 400,   // 시작 자금 (전환 비용 고려 상향)
    START_REP: 10,      // 초기 만족도
    MAX_WEEKS: 16,      // 16주 시나리오
    TAX_RATE_BASE: 1,   // 초기 탄소세
};

// 건물 카테고리 정의
// type: growth(성장), energy(에너지), circular(자원순환), infra(생활/기후), legacy(오염유산-건설불가)
// res: 회복력(Resilience) - 재난 피해 감소
export const BUILDINGS = [
    // --- 0. 기본/유산 (건설 메뉴에 안 뜸) ---
    { id: 'town_hall', name: '시청', icon: '🏛️', type: 'infra', cost: 0, rev: 15, exp: 0, emit: 0, power: 5, res: 1, desc: '도시의 심장' },
    { id: 'landfill', name: '매립지', icon: '🗑️', type: 'legacy', cost: 0, rev: 0, exp: 5, emit: 15, power: 0, res: 0, rep: -3, desc: '악취와 오염의 주범' },
    { id: 'old_factory', name: '노후공장', icon: '🏭', type: 'legacy', cost: 0, rev: 10, exp: 5, emit: 20, power: -5, res: 0, desc: '효율 낮고 오염 심함' },
    { id: 'flood_house', name: '침수주택', icon: '🏚️', type: 'legacy', cost: 0, rev: 2, exp: 2, emit: 2, power: -1, res: -2, desc: '재난에 매우 취약' },

    // --- 1. 성장 (Money) ---
    { id: 'shop_s', name: '소형상가', icon: '🏪', type: 'growth', cost: 40, rev: 12, exp: 3, emit: 4, power: -2, res: 0, desc: '동네 상권' },
    { id: 'shop_l', name: '대형몰', icon: '🏬', type: 'growth', cost: 120, rev: 45, exp: 12, emit: 15, power: -8, res: 0, desc: '고수익 고배출' },
    { id: 'tour_spot', name: '관광지', icon: '🎡', type: 'growth', cost: 100, rev: 35, exp: 8, emit: 5, power: -5, res: 0, desc: '관광 수입' },
    { id: 'logistics', name: '물류허브', icon: '🚛', type: 'growth', cost: 150, rev: 60, exp: 20, emit: 25, power: -10, res: 0, desc: '수익↑ 배출↑ 전력↑' },
    { id: 'industry_h', name: '중공업단지', icon: '🏭', type: 'growth', cost: 200, rev: 90, exp: 30, emit: 40, power: -20, res: 0, desc: '수익++ 오염++' },
    { id: 'data_center', name: '데이터센터', icon: '💾', type: 'growth', cost: 250, rev: 100, exp: 40, emit: 10, power: -30, res: 0, desc: '전력 블랙홀' }, // 자체 배출은 낮으나 전력을 엄청 먹음

    // --- 2. 에너지 (Power) ---
    { id: 'gas_plant', name: '가스발전', icon: '🔥', type: 'energy', cost: 80, rev: 5, exp: 10, emit: 12, power: 15, res: 0, desc: '안정적 공급, 중배출' },
    { id: 'coal_plant', name: '석탄발전', icon: '🌑', type: 'energy', cost: 60, rev: 5, exp: 5, emit: 30, power: 25, res: 0, desc: '싸고 강력한 오염' },
    { id: 'solar', name: '태양광', icon: '☀️', type: 'energy', cost: 100, rev: 2, exp: 2, emit: 0, power: 8, res: 0, desc: '청정 에너지' },
    { id: 'wind', name: '풍력', icon: '🌀', type: 'energy', cost: 130, rev: 5, exp: 3, emit: 0, power: 12, res: 0, desc: '고효율 청정' },
    { id: 'ess', name: 'ESS저장소', icon: '🔋', type: 'energy', cost: 90, rev: 0, exp: 5, emit: 0, power: 5, res: 2, desc: '전력망 안정화' },
    { id: 'grid_up', name: '스마트그리드', icon: '📡', type: 'energy', cost: 150, rev: 0, exp: 5, emit: 0, power: 0, res: 3, desc: '전력효율/회복력↑' },

    // --- 3. 자원순환 (Circular) ---
    { id: 'mrf', name: '선별센터', icon: '♻️', type: 'circular', cost: 80, rev: 15, exp: 10, emit: -5, power: -3, res: 0, desc: '재활용 수익' },
    { id: 'compost', name: '퇴비화시설', icon: '🍂', type: 'circular', cost: 50, rev: 8, exp: 5, emit: -8, power: -1, res: 0, desc: '유기물 처리' },
    { id: 'repair', name: '수리센터', icon: '🔧', type: 'circular', cost: 60, rev: 10, exp: 5, emit: -3, power: -1, res: 1, desc: '수명연장' },
    { id: 'edu_center', name: '환경교육관', icon: '🏫', type: 'circular', cost: 70, rev: 5, exp: 5, emit: 0, power: -2, res: 1, rep: 5, desc: '만족도 상승' },

    // --- 4. 인프라/기후 (Infra) ---
    { id: 'transit', name: '환승센터', icon: '🚏', type: 'infra', cost: 100, rev: 10, exp: 10, emit: -5, power: -3, res: 1, rep: 3, desc: '대중교통 활성화' },
    { id: 'park', name: '도시숲', icon: '🌳', type: 'infra', cost: 40, rev: 0, exp: 3, emit: -2, power: 0, res: 1, rep: 5, desc: '시민 휴식처' },
    { id: 'hospital', name: '종합병원', icon: '🏥', type: 'infra', cost: 150, rev: 20, exp: 20, emit: 5, power: -8, res: 5, rep: 5, desc: '회복력 대폭 상승' },
    { id: 'disaster_center', name: '방재센터', icon: '🚨', type: 'infra', cost: 120, rev: 0, exp: 15, emit: 0, power: -5, res: 8, desc: '재난 피해 최소화' },
];

export const EVENTS = [
    { name: '폭염 경보', msg: '전력 수요 폭증! (전력-10)', effect: (s) => { s.weekPower -= 10; return '전력부하 심화'; } },
    { name: '태풍 상륙', msg: '침수 피해 발생 (회복력으로 방어)', effect: (s) => { 
        let dmg = Math.max(0, 50 - s.res * 5); // 회복력 1당 피해 5감소
        s.money -= dmg; 
        return `피해액 -${dmg} (방어 ${s.res*5})`; 
    }},
    { name: '탄소국경세', msg: '수출 기업 배출 규제', effect: (s) => {
        let fine = Math.floor(s.weekEmit * 0.5);
        s.money -= fine;
        return `관세 부과 -${fine}`;
    }},
    { name: '친환경 트렌드', msg: '만족도가 높으면 보너스', effect: (s) => {
        let bonus = s.rep > 20 ? 50 : 0;
        s.money += bonus;
        return bonus > 0 ? `보너스 +${bonus}` : '만족도 부족';
    }}
];
