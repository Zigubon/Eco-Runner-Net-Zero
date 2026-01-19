export const GAME_CONFIG = {
    START_MONEY: 3000,
    SALARY: 500,
    TAX_RATE: 10 // 탄소 1톤당 10k
};

// 맵 데이터 (총 20칸: 6x6 테두리)
// type: start, factory(기업), eco(숲), chance(이벤트)
export const MAP_DATA = [
    { id: 0, type: 'start', name: '출발' },
    { id: 1, type: 'factory', name: 'S제철', cost: 500, carbon: 50 },
    { id: 2, type: 'eco', name: '작은 숲', cost: 200, carbon: -20 },
    { id: 3, type: 'chance', name: '황금열쇠' },
    { id: 4, type: 'factory', name: 'K화학', cost: 600, carbon: 60 },
    { id: 5, type: 'eco', name: '태양광', cost: 400, carbon: -40 },
    // ... (임시로 5개만 예시, 실제 구현 시 20개 채워야 함)
    // 맵 렌더링 테스트를 위해 나머지는 더미 데이터 생성
    ...Array.from({length: 14}, (_, i) => ({ 
        id: i+6, type: 'factory', name: `공장 ${i+1}`, cost: 300, carbon: 30 
    }))
];