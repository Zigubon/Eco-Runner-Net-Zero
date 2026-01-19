import { GAME_CONFIG, BUILDINGS, EVENTS } from './data.js';

class TycoonGame {
    constructor() {
        // 게임 상태 (State)
        this.week = 1;
        this.money = GAME_CONFIG.START_MONEY;
        this.rep = GAME_CONFIG.START_REP;
        this.gridSize = 25; // 5x5
        this.mapData = Array(this.gridSize).fill(null); // 건물 데이터 저장 (null이면 빈 땅)
        this.taxRate = GAME_CONFIG.TAX_RATE_BASE;

        // UI 캐싱
        this.ui = {
            grid: document.getElementById('city-grid'),
            money: document.getElementById('ui-money'),
            emit: document.getElementById('ui-emit'),
            rep: document.getElementById('ui-rep'),
            infra: document.getElementById('ui-infra'),
            week: document.getElementById('ui-week'),
            msg: document.getElementById('ui-message'),
            buildList: document.getElementById('building-list'),
            reportBody: document.getElementById('report-details')
        };

        this.selectedTileIndex = -1; // 현재 클릭한 타일

        this.init();
    }

    init() {
        this.renderGrid();
        this.updateHUD();
        this.bindEvents();
        console.log("🏙️ ESG City Tycoon Started!");
    }

    // 1. 그리드(마을) 그리기
    renderGrid() {
        this.ui.grid.innerHTML = '';
        this.mapData.forEach((building, idx) => {
            const tile = document.createElement('div');
            tile.className = building ? 'tile' : 'tile empty';
            tile.onclick = () => this.handleTileClick(idx);
            
            if (building) {
                tile.innerHTML = `
                    <span class="b-icon">${building.icon}</span>
                    <span class="b-name">${building.name}</span>
                `;
                // 건물 타입별 배경색 틴트 (선택사항)
                if(building.type === 'prod') tile.style.backgroundColor = '#feca57';
                if(building.type === 'energy') tile.style.backgroundColor = '#54a0ff';
                if(building.type === 'green') tile.style.backgroundColor = '#55efc4';
            }
            this.ui.grid.appendChild(tile);
        });
    }

    // 2. 타일 클릭 핸들러
    handleTileClick(idx) {
        if (this.mapData[idx]) {
            // 이미 건물이 있는 경우 (정보 보기 or 철거 - MVP에선 철거 생략)
            const b = this.mapData[idx];
            this.showMessage(`[${b.name}] 수익:${b.rev} / 배출:${b.emit}`);
        } else {
            // 빈 땅인 경우 -> 건설 메뉴 열기
            this.selectedTileIndex = idx;
            this.openBuildMenu();
        }
    }

    // 3. 건설 메뉴
    openBuildMenu() {
        this.ui.buildList.innerHTML = '';
        BUILDINGS.forEach(b => {
            const item = document.createElement('div');
            item.className = 'build-item';
            // 돈 부족하면 비활성화 스타일 (옵션)
            const canAfford = this.money >= b.cost;
            item.style.opacity = canAfford ? '1' : '0.5';
            
            item.innerHTML = `
                <span style="font-size:1.5rem">${b.icon} ${b.name}</span>
                <span class="bi-cost">💰 ${b.cost}</span>
                <span class="bi-desc">${b.desc}</span>
                <span class="bi-desc">수익 ${b.rev} / 유지 ${b.exp}</span>
            `;
            item.onclick = () => {
                if (canAfford) this.build(b);
                else alert("자금이 부족합니다!");
            };
            this.ui.buildList.appendChild(item);
        });
        document.getElementById('build-modal').classList.remove('hidden');
    }

    // 4. 건설 실행
    build(buildingTemplate) {
        // 돈 차감
        this.money -= buildingTemplate.cost;
        
        // 맵 데이터에 건물 저장
        this.mapData[this.selectedTileIndex] = { ...buildingTemplate }; // 복사해서 저장
        
        // UI 갱신
        this.renderGrid();
        this.updateHUD();
        this.showMessage(`🏗️ ${buildingTemplate.name} 건설 완료!`);
        document.getElementById('build-modal').classList.add('hidden');
    }

    // 5. 주간 정산 (핵심 루프)
    nextWeek() {
        if (this.week > GAME_CONFIG.MAX_WEEKS) {
            alert("게임 종료! 엔딩은 다음 버전에...");
            return;
        }

        // A. 수지 타산 계산
        let totalRev = 0;
        let totalExp = 0;
        let totalEmit = 0;
        let totalPower = 0;

        this.mapData.forEach(b => {
            if (b) {
                totalRev += b.rev;
                totalExp += b.exp;
                totalEmit += b.emit;
                totalPower += b.power;
            }
        });

        // B. 탄소세 계산
        // 배출량이 음수(흡수)면 세금 0
        const netEmit = Math.max(0, totalEmit); 
        const tax = netEmit * this.taxRate;

        // C. 이벤트 발생
        const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        // 임시 상태 객체로 이벤트 효과 적용
        let tempState = { money: this.money, rep: this.rep, weekExp: totalExp, weekEmit: netEmit };
        const evtResult = evt.effect(tempState);
        
        // 변동사항 반영
        this.money = tempState.money;
        this.rep = tempState.rep;
        totalExp = tempState.weekExp;

        // D. 최종 자금 반영
        const netProfit = totalRev - totalExp - tax;
        this.money += netProfit;

        // E. 리포트 표시
        this.showReport(totalRev, totalExp, tax, netEmit, evt, evtResult, netProfit);

        // F. 다음 주 준비
        this.week++;
        // 탄소세율 점진적 증가 (난이도 상승)
        if(this.week % 4 === 0) this.taxRate += 1; 
        
        this.updateHUD();
    }

    showReport(rev, exp, tax, emit, evt, evtResult, netProfit) {
        const html = `
            <div class="report-row"><span>매출 합계</span> <span>+${rev}</span></div>
            <div class="report-row"><span>유지비</span> <span style="color:red">-${exp}</span></div>
            <div class="report-row"><span>탄소세 (${emit}t x ${this.taxRate})</span> <span style="color:red">-${tax}</span></div>
            <div class="report-row" style="background:#f0f0f0; padding:4px;">
                <span>🔔 ${evt.name}</span>
                <span style="font-size:0.8rem">${evtResult}</span>
            </div>
            <div class="report-total">
                순이익: ${netProfit >= 0 ? '+' : ''}${netProfit}
            </div>
            <div style="text-align:center; font-size:0.8rem; margin-top:5px; color:#666;">
                현재 자금: ${this.money}
            </div>
        `;
        this.ui.reportBody.innerHTML = html;
        document.getElementById('report-modal').classList.remove('hidden');
    }

    // --- 유틸리티 ---
    updateHUD() {
        this.ui.money.innerText = this.money;
        this.ui.week.innerText = this.week;
        this.ui.rep.innerText = this.rep;
        
        // 현재 예상 주간 배출량 계산
        let currentEmit = this.mapData.reduce((acc, b) => acc + (b ? b.emit : 0), 0);
        let currentPower = this.mapData.reduce((acc, b) => acc + (b ? b.power : 0), 0);
        
        this.ui.emit.innerText = `${currentEmit}t`;
        this.ui.infra.innerText = currentPower >= 0 ? `⚡+${currentPower}` : `⚡${currentPower}`;
        
        // 전력 부족 시 경고 스타일
        this.ui.infra.style.color = currentPower < 0 ? 'red' : 'white';
    }

    showMessage(text) {
        this.ui.msg.innerText = text;
        // 간단한 애니메이션 효과
        this.ui.msg.style.opacity = 0;
        setTimeout(() => this.ui.msg.style.opacity = 1, 100);
    }

    bindEvents() {
        document.getElementById('btn-next-week').onclick = () => this.nextWeek();
    }
}

// 게임 시작
window.game = new TycoonGame();
