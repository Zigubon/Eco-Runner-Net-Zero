import { GAME_CONFIG, BUILDINGS, EVENTS } from './data.js';

class TycoonGame {
    constructor() {
        this.week = 1;
        this.money = GAME_CONFIG.START_MONEY;
        this.rep = GAME_CONFIG.START_REP;
        this.gridSize = 25; // 5x5
        this.mapData = Array(this.gridSize).fill(null);
        this.taxRate = GAME_CONFIG.TAX_RATE_BASE;

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

        this.selectedTileIndex = -1;
        this.init();
    }

    init() {
        // [패치] 시작 시 중앙에 시청 건설 (Town Hall)
        const centerIdx = 12; // 5x5 그리드의 정중앙
        const townHall = BUILDINGS.find(b => b.id === 'town_hall');
        if(townHall) {
            this.mapData[centerIdx] = { ...townHall };
        }

        this.renderGrid();
        this.updateHUD();
        this.bindEvents();
        console.log("🏙️ ESG City Tycoon Started!");
    }

    renderGrid() {
        this.ui.grid.innerHTML = '';
        this.mapData.forEach((building, idx) => {
            const tile = document.createElement('div');
            // 건물이 있으면 스타일 적용
            tile.className = building ? 'tile' : 'tile empty';
            tile.onclick = () => this.handleTileClick(idx);
            
            if (building) {
                tile.innerHTML = `
                    <span class="b-icon">${building.icon}</span>
                    <span class="b-name">${building.name}</span>
                `;
                // 시청은 특별한 색
                if(building.id === 'town_hall') tile.style.backgroundColor = '#a29bfe';
                else if(building.type === 'prod') tile.style.backgroundColor = '#feca57';
                else if(building.type === 'energy') tile.style.backgroundColor = '#54a0ff';
                else if(building.type === 'green') tile.style.backgroundColor = '#55efc4';
                else if(building.type === 'infra') tile.style.backgroundColor = '#ff7675';
            }
            this.ui.grid.appendChild(tile);
        });
    }

    handleTileClick(idx) {
        if (this.mapData[idx]) {
            const b = this.mapData[idx];
            // 시청은 철거 불가 메시지
            if(b.id === 'town_hall') {
                this.showMessage(`🏛️ 시청: 우리 도시의 중심입니다.`);
            } else {
                this.showMessage(`[${b.name}] 수익:${b.rev} / 배출:${b.emit}`);
            }
        } else {
            this.selectedTileIndex = idx;
            this.openBuildMenu();
        }
    }

    openBuildMenu() {
        this.ui.buildList.innerHTML = '';
        // 시청(id: town_hall)은 건설 목록에서 제외
        const buildable = BUILDINGS.filter(b => b.id !== 'town_hall');

        buildable.forEach(b => {
            const item = document.createElement('div');
            item.className = 'build-item';
            const canAfford = this.money >= b.cost;
            item.style.opacity = canAfford ? '1' : '0.5';
            
            item.innerHTML = `
                <span style="font-size:1.5rem">${b.icon} ${b.name}</span>
                <span class="bi-cost">💰 ${b.cost}</span>
                <span class="bi-desc">${b.desc}</span>
                <span class="bi-desc">수익 ${b.rev} / 탄소 ${b.emit}</span>
            `;
            item.onclick = () => {
                if (canAfford) this.build(b);
                else alert("자금이 부족합니다!");
            };
            this.ui.buildList.appendChild(item);
        });
        document.getElementById('build-modal').classList.remove('hidden');
    }

    build(buildingTemplate) {
        this.money -= buildingTemplate.cost;
        this.mapData[this.selectedTileIndex] = { ...buildingTemplate };
        this.renderGrid();
        this.updateHUD();
        this.showMessage(`🏗️ ${buildingTemplate.name} 건설 완료!`);
        document.getElementById('build-modal').classList.add('hidden');
    }

    nextWeek() {
        if (this.week > GAME_CONFIG.MAX_WEEKS) {
            this.endGame();
            return;
        }

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

        // 전력 부족 패널티 (전력이 음수면, 부족분만큼 유지비 폭증)
        if(totalPower < 0) {
            const penalty = Math.abs(totalPower) * 5;
            totalExp += penalty;
            this.showMessage(`⚡ 전력 부족! 비상 발전 비용 -${penalty}`);
        }

        const netEmit = Math.max(0, totalEmit); 
        const tax = netEmit * this.taxRate;

        const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        let tempState = { money: this.money, rep: this.rep, weekExp: totalExp, weekEmit: netEmit };
        const evtResult = evt.effect(tempState);
        
        this.money = tempState.money;
        this.rep = tempState.rep;
        totalExp = tempState.weekExp;

        const netProfit = totalRev - totalExp - tax;
        this.money += netProfit;

        this.showReport(totalRev, totalExp, tax, netEmit, evt, evtResult, netProfit);

        this.week++;
        // 4주마다 탄소세 인상 (난이도 곡선)
        if(this.week % 4 === 1 && this.week > 1) {
            this.taxRate += 1;
            this.showMessage(`📢 정책 변경: 탄소세율 인상! (x${this.taxRate})`);
        }
        
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

    endGame() {
        alert(`🏁 게임 종료! 최종 자산: ${this.money}`);
        location.reload();
    }

    updateHUD() {
        this.ui.money.innerText = this.money;
        this.ui.week.innerText = this.week <= GAME_CONFIG.MAX_WEEKS ? this.week : "END";
        this.ui.rep.innerText = this.rep;
        
        let currentEmit = this.mapData.reduce((acc, b) => acc + (b ? b.emit : 0), 0);
        let currentPower = this.mapData.reduce((acc, b) => acc + (b ? b.power : 0), 0);
        
        this.ui.emit.innerText = `${currentEmit}t`;
        this.ui.infra.innerText = currentPower >= 0 ? `⚡+${currentPower}` : `⚡${currentPower}`;
        this.ui.infra.style.color = currentPower < 0 ? 'red' : 'white';
    }

    showMessage(text) {
        this.ui.msg.innerText = text;
        this.ui.msg.style.opacity = 0;
        setTimeout(() => this.ui.msg.style.opacity = 1, 100);
    }

    bindEvents() {
        document.getElementById('btn-next-week').onclick = () => this.nextWeek();
    }
}

window.game = new TycoonGame();
