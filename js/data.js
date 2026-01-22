/**
 * [2026-01-23] 게임 데이터 및 설정 (그래픽 포함)
 */

export const CONFIG = {
    GAME_SPEED_START: 6,
    GAME_SPEED_MAX: 15,
    GRAVITY: 0.6,
    JUMP_FORCE: -12,
    DOUBLE_JUMP_FORCE: -10,
    CO2_MAX: 100,
    CO2_PASSIVE_INCREASE: 0.05,
    SPAWN_RATE_OBSTACLE: 120,
    SPAWN_RATE_ITEM: 80,
};

// SVG 그래픽 데이터 (Data URI)
const GRAPHICS = {
    // 플레이어: 귀여운 에코 로봇
    PLAYER: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+CiAgPGc+CiAgICA8cmVjdCB4PSI1IiB5PSIxMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjM1IiByeD0iNSIgZmlsbD0iIzJlY2M3MSIvPgogICAgPHJlY3QgeD0iMTAiIHk9IjE1IiB3aWR0aD0iMzAiIGhlaWdodD0iMjAiIHJ4PSI1IiBmaWxsPSIjZmZmIi8+CiAgICA8Y2lyY2xlIGN4PSIxOCIgY3k9IjI1IiByPSIzIiBmaWxsPSIjMDAwIi8+CiAgICA8Y2lyY2xlIGN4PSIzMiIgY3k9IjI1IiByPSIzIiBmaWxsPSIjMDAwIi8+CiAgICA8cGF0aCBkPSJNMTUgMzUgcTEwIDEwIDIwIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KICAgIDxyZWN0IHg9IjIwIiB5PSIwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMzNDk4ZGIiLz4KICAgIDxwYXRoIGQ9Ik0yNSAwIEwgMjUgLTEwIiBzdHJva2U9IiMzNDk4ZGIiIHN0cm9rZS13aWR0aD0iMiIvPgogICAgPGNpcmNsZSBjeD0iMjUiIGN5PSItMTAiIHI9IjMiIGZpbGw9InJlZCIvPgogIDwvZz4KPC9zdmc+`,
    
    // 장애물 1: 스모그 구름
    SMOG: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+CiAgPHBhdGggZD0iTTEwIDQwIFEwIDQwIDAgMzAgUTEwIDEwIDI1IDEwIFE0MCAxMCA1MCAzMCBRNTAgNDAgNDAgNDAgWiIgZmlsbD0iIzc1NzU3NSIvPgogIDxjaXJjbGUgY3g9IjE1IiBjeT0iMjUiIHI9IjMiIGZpbGw9IiMwMDAiLz4KICA8Y2lyY2xlIGN4PSIzNSIgY3k9IjI1IiByPSIzIiBmaWxsPSIjMDAwIi8+CiAgPHBhdGggZD0iTTIwIDM1IEwgMzAgMzUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjwvc3ZnPg==`,
    
    // 장애물 2: 쓰레기 봉투
    TRASH: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+CiAgPHBhdGggZD0iTTEwIDUwIEwgMTAgMjAgTCAyNSAxMCBMIDQwIDIwIEwgNDAgNTAgWiIgZmlsbD0iIzM0NDk1ZSIvPgogIDxwYXRoIGQ9Ik0xNSAyNSBMIDM1IDI1IE0xNSAzNSBMIDM1IDM1IiBzdHJva2U9IiM1NTUiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=`,
    
    // 아이템 1: 나무 묘목
    SEED: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+CiAgPHBhdGggZD0iTTI1IDUwIEwgMjUgMjAiIHN0cm9rZT0iIzhkNmM1YyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CiAgPGNpcmNsZSBjeD0iMjUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiwyZWNjNzEiLz4KPC9zdmc+`,
    
    // 아이템 2: 태양광 패널
    SOLAR: `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+CiAgPHJlY3QgeD0iNSIgeT0iMTAiIHdpZHRoPSI0MCIgaGVpZ2h0PSIzMCIgZmlsbD0iIzM0OThkYiIgc3Ryb2tlPSIjZjFjNDBmIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8bGluZSB4MT0iNSIgeTE9IjIwIiB4Mj0iNDUiIHkyPSIyMCIgc3Ryb2tlPSIjZmZmIi8+CiAgPGxpbmUgeDE9IjUiIHkxPSIzMCIgeDI9IjQ1IiB5Mj0iMzAiIHN0cm9rZT0iI2ZmZiIvPgogIDxsaW5lIHgxPSIyNSIgeTE9IjEwIiB4Mj0iMjUiIHkyPSI0MCIgc3Ryb2tlPSIjZmZmIi8+Cjwvc3ZnPg==`
};

export const OBSTACLES = [
    { type: 'SMOG', name: '스모그', width: 60, height: 60, damage: 15, yPos: 'air', imgSrc: GRAPHICS.SMOG },
    { type: 'TRASH', name: '쓰레기', width: 50, height: 50, damage: 10, yPos: 'ground', imgSrc: GRAPHICS.TRASH },
];

export const ITEMS = [
    { type: 'SEED', name: '나무', score: 100, co2Reduction: 5, width: 40, height: 40, imgSrc: GRAPHICS.SEED },
    { type: 'SOLAR', name: '태양광', score: 300, co2Reduction: 10, width: 45, height: 45, imgSrc: GRAPHICS.SOLAR },
];

export const PLAYER_IMG = GRAPHICS.PLAYER;

export const UPGRADES = [
    { id: 'shoes', name: '탄소 운동화', desc: '점수 +10%', baseCost: 100, maxLevel: 5 },
    { id: 'filter', name: '마스크', desc: '피해 감소', baseCost: 150, maxLevel: 5 },
    { id: 'tech', name: '포집 기술', desc: 'CO2 감소', baseCost: 300, maxLevel: 3 }
];
