import { MAP_DATA, GAME_CONFIG } from './data.js';

class CarbonMarble {
    constructor() {
        this.player = { pos: 0, money: GAME_CONFIG.START_MONEY, carbon: 0 };
        this.boardEl = document.getElementById('board');
        this.logEl = document.getElementById('game-log');
        
        this.init();
    }

    init() {
        this.renderBoard();
        this.updateUI();
        
        document.getElementById('roll-btn').addEventListener('click', () => this.rollDice());
    }

    renderBoard() {
        // 맵 데이터 20개를 보드 테두리에 배치하는 로직
        // (간단하게 구현하기 위해 순서대로 DOM에 추가하고 CSS Grid로 위치 잡기)
        // 실제로는 좌표 계산이 필요하지만, 여기선 스타일 테스트를 위해 단순 추가
        MAP_DATA.forEach((tile, index) => {
            const el = document.createElement('div');
            el.className = `tile ${tile.type}`;
            el.innerHTML = `
                <div>${tile.name}</div>
                ${tile.cost ? `<div>₩${tile.cost}</div>` : ''}
            `;
            
            // CSS Grid 배치를 위한 좌표 계산 (6x6 테두리)
            // 상단(0~5), 우측(6~9), 하단(10~15 역순), 좌측(16~19 역순) 등
            // 이 부분은 복잡하므로 일단 순서대로 렌더링만 합니다.
            this.setGridPosition(el, index);
            
            // 플레이어 토큰 (시작점에)
            if (index === 0) {
                const token = document.createElement('div');
                token.className = 'player-token';
                token.id = 'player-token';
                el.appendChild(token);
            }
            
            this.boardEl.appendChild(el);
        });
    }

    setGridPosition(el, index) {
        // 6x6 보드 인덱스 매핑 (총 20칸)
        // 상단: row 1 / col 1~6
        if (index < 6) { el.style.gridRow = 1; el.style.gridColumn = index + 1; }
        // 우측: row 2~5 / col 6
        else if (index < 10) { el.style.gridRow = index - 4; el.style.gridColumn = 6; }
        // 하단: row 6 / col 6~1 (역순)
        else if (index < 16) { el.style.gridRow = 6; el.style.gridColumn = 6 - (index - 10); }
        // 좌측: row 5~2 / col 1 (역순)
        else { el.style.gridRow = 6 - (index - 15); el.style.gridColumn = 1; }
    }

    rollDice() {
        const dice = Math.floor(Math.random() * 6) + 1;
        document.getElementById('dice-display').innerText = `🎲 ${dice}`;
        this.movePlayer(dice);
    }

    movePlayer(steps) {
        const oldPos = this.player.pos;
        this.player.pos = (this.player.pos + steps) % MAP_DATA.length;
        
        // UI 이동 (토큰을 해당 타일로 이동)
        const targetTile = this.boardEl.children[this.player.pos];
        const token = document.getElementById('player-token');
        targetTile.appendChild(token); // 토큰을 새 부모(타일)로 이동

        this.log(`주사위 ${steps}! [${MAP_DATA[this.player.pos].name}] 도착.`);
        
        if (this.player.pos < oldPos) {
            this.player.money += GAME_CONFIG.SALARY;
            this.log(`한 바퀴 완주! 월급 +${GAME_CONFIG.SALARY}`);
            this.updateUI();
        }
    }

    updateUI() {
        document.getElementById('money').innerText = `${this.player.money.toLocaleString()}k`;
        document.getElementById('carbon').innerText = `${this.player.carbon} t`;
    }

    log(msg) {
        const p = document.createElement('p');
        p.innerText = msg;
        this.logEl.prepend(p);
    }
}

new CarbonMarble();