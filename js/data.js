// [DATA] 게임 밸런스 데이터 V2.3

export const GAME_CONFIG = {
    START_MONEY: 450,
    START_REP: 10,
    MAX_YEARS: 15, // 주 -> 년 (Year)
    TAX_RATE_BASE: 1,
};

// 연구 데이터 (기술 트리)
export const RESEARCH = [
    { id: 'smart_grid', name: '스마트 그리드', cost: 200, icon: '📡', desc: '전력 효율 증가 및 대형 발전소 해금' },
    { id: 'circular_tech', name: '순환 경제', cost: 150, icon: '♻️', desc: '고효율 자원순환 시설 해금' },
    { id: 'green_infra', name: '녹색 인프라', cost: 100, icon: '🌳', desc: '고급 인프라 및 탄소 감축 기술' },
    { id: 'adv_energy', name: '차세대 에너지', cost: 300, icon: '⚛️', desc: '초고효율 청정 에너지 해금', req: 'smart_grid' } // 선행 기술 필요
];

// 건물 목록
// reqTech: 이 건물을 짓기 위해 필요한 연구 ID
export const BUILDINGS = [
    // 0. 기본/유산
    { id: 'town_hall', name: '시청', icon: '🏛️', type: 'infra', cost: 0, rev: 15, exp: 0, emit: 0, power: 5, res: 1, desc: '도시의 심장' },
    { id: 'landfill', name: '매립지', icon: '🗑️', type: 'legacy', cost: 0, rev: 0, exp: 5, emit: 15, power: 0, res: 0, rep: -3, demolishCost: 50, desc: '철거비용 50억' },
    { id: 'old_factory', name: '노후공장', icon: '🏭', type: 'legacy', cost: 0, rev: 10, exp: 5, emit: 20, power: -5, res: 0, demolishCost: 40, desc: '철거비용 40억' },
    { id: 'flood_house', name: '침수주택', icon: '🏚️', type: 'legacy', cost: 0, rev: 2, exp: 2, emit: 2, power: -1, res: -2, demolishCost: 30, desc: '철거비용 30억' },

    // 1. 성장
    { id: 'shop_s', name: '소형상가', icon: '🏪', type: 'growth', cost: 40, rev: 12, exp: 3, emit: 4, power: -2, res: 0, desc: '동네 상권' },
    { id: 'shop_l', name: '대형몰', icon: '🏬', type: 'growth', cost: 120, rev: 45, exp: 12, emit: 15, power: -8, res: 0, desc: '고수익 고배출' },
    { id: 'tour_spot', name: '관광지', icon: '🎡', type: 'growth', cost: 100, rev: 35, exp: 8, emit: 5, power: -5, res: 0, desc: '관광 수입' },
    { id: 'logistics', name: '물류허브', icon: '🚛', type: 'growth', cost: 150, rev: 60, exp: 20, emit: 25, power: -10, res: 0, desc: '수익↑ 배출↑ 전력↑' },
    { id: 'data_center', name: '데이터센터', icon: '💾', type: 'growth', cost: 250, rev: 100, exp: 40, emit: 10, power: -30, res: 0, desc: '전력 블랙홀', reqTech: 'smart_grid' },

    // 2. 에너지
    { id: 'coal_plant', name: '석탄발전', icon: '🌑', type: 'energy', cost: 60, rev: 5, exp: 5, emit: 30, power: 25, res: 0, desc: '싸고 강력한 오염' },
    { id: 'gas_plant', name: '가스발전', icon: '🔥', type: 'energy', cost: 80, rev: 5, exp: 10, emit: 12, power: 15, res: 0, desc: '안정적 공급' },
    { id: 'solar', name: '태양광', icon: '☀️', type: 'energy', cost: 100, rev: 2, exp: 2, emit: 0, power: 8, res: 0, desc: '청정 에너지' },
    { id: 'wind', name: '풍력', icon: '🌀', type: 'energy', cost: 130, rev: 5, exp: 3, emit: 0, power: 12, res: 0, desc: '고효율 청정' },
    { id: 'ess', name: 'ESS저장소', icon: '🔋', type: 'energy', cost: 90, rev: 0, exp: 5, emit: 0, power: 5, res: 2, desc: '전력망 안정화', reqTech: 'smart_grid' },
    { id: 'nuclear', name: 'SMR(소형원전)', icon: '⚛️', type: 'energy', cost: 300, rev: 10, exp: 15, emit: 0, power: 40, res: 1, desc: '초고효율 무탄소', reqTech: 'adv_energy' },

    // 3. 자원순환
    { id: 'mrf', name: '선별센터', icon: '♻️', type: 'circular', cost: 80, rev: 15, exp: 10, emit: -5, power: -3, res: 0, desc: '재활용 수익' },
    { id: 'compost', name: '퇴비화시설', icon: '🍂', type: 'circular', cost: 50, rev: 8, exp: 5, emit: -8, power: -1, res: 0, desc: '유기물 처리' },
    { id: 'repair', name: '수리센터', icon: '🔧', type: 'circular', cost: 60, rev: 10, exp: 5, emit: -3, power: -1, res: 1, desc: '수명연장' },
    { id: 'recycle_adv', name: '화학적재활용', icon: '⚗️', type: 'circular', cost: 150, rev: 25, exp: 15, emit: -15, power: -5, res: 1, desc: '대규모 감축', reqTech: 'circular_tech' },

    // 4. 인프라
    { id: 'park', name: '도시숲', icon: '🌳', type: 'infra', cost: 40, rev: 0, exp: 3, emit: -2, power: 0, res: 1, rep: 5, desc: '시민 휴식처' },
    { id: 'hospital', name: '종합병원', icon: '🏥', type: 'infra', cost: 150, rev: 20, exp: 20, emit: 5, power: -8, res: 5, rep: 5, desc: '회복력 대폭 상승' },
    { id: 'eco_complex', name: '스마트시티', icon: '🏙️', type: 'infra', cost: 200, rev: 30, exp: 10, emit: -5, power: -5, res: 3, rep: 10, desc: '미래형 주거', reqTech: 'green_infra' },
];

export const EVENTS = [
    { name: '기록적 폭염', msg: '전력 수요 폭증! (전력-15)', effect: (s) => { s.weekPower -= 15; return '전력부하 심화'; } },
    { name: '태풍 상륙', msg: '침수 피해 발생 (회복력으로 방어)', effect: (s) => { 
        let dmg = Math.max(0, 80 - s.res * 8); 
        s.money -= dmg; 
        return `피해액 -${dmg} (방어 ${s.res*8})`; 
    }},
    { name: '탄소국경세', msg: '수출 기업 배출 규제', effect: (s) => {
        let fine = Math.floor(s.weekEmit * 0.8);
        s.money -= fine;
        return `관세 부과 -${fine}`;
    }},
    { name: 'ESG 경영대상', msg: '만족도/평판이 높으면 보너스', effect: (s) => {
        let bonus = s.rep > 25 ? 100 : 0;
        s.money += bonus;
        return bonus > 0 ? `상금 +${bonus}` : '조건 미달';
    }}
];
