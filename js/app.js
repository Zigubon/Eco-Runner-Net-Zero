import { GAME_CONFIG, BUILDINGS, EVENTS } from './data.js';

class TycoonGame {
    constructor() {
        this.week = 1;
        this.money = GAME_CONFIG.START_MONEY;
        this.rep = GAME_CONFIG.START_REP;
        this.gridSize = 100; // 10x10 Grid
        this.mapData = Array(this.gridSize).fill(null);
        this.taxRate = GAME_CONFIG.TAX_RATE_BASE;

        // UI 캐싱
        this.ui = {
            grid: document.getElementById('city-grid'),
            money: document.getElementById('ui-money'),
            emit: document.getElementById('ui-emit'),
            rep: document.getElementById('ui-rep'),
            res: document.getElementById('ui-res'),
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
        this.generateMap();
        this.renderGrid();
        this.updateHUD();
        this.bindEvents();
        console.log("🏙️ ESG City V2 - 10x10 Map Initialized");
    }

    // 0. 맵 생성 (오염 유산 배치)
    generateMap() {
        // 중앙 시청 (44, 45, 54, 55 중 하나, 10x10이니까 45번 위치쯤)
        const centerIdx = 45;
        this.placeBuilding(centerIdx, 'town_hall');

        // 오염 유산 랜덤 배치 (10개 정도)
        const legacyTypes = ['landfill', 'old_factory', 'flood_house'];
        for(let i=0; i<10; i++) {
            let rndIdx = Math.floor(Math.random() * this.gridSize);
            if(!this.mapData[rndIdx]) { // 빈 땅이면
                let rndType = legacyTypes[Math.floor(Math.random() * legacyTypes.length)];
                this.placeBuilding(rndIdx, rndType);
            }
        }
    }

    placeBuilding(idx, id) {
        const b = BUILDINGS.find(x => x.id === id);
        if(b) this.mapData[idx] = { ...b };
    }

    renderGrid() {
        this.ui.grid.innerHTML = '';
        this.mapData.forEach((building, idx) => {
            const tile = document.createElement('div');
            tile.className = building ? 'tile' : 'tile empty';
            // 오염 유산 등 타입 데이터 속성 추가 (CSS 스타일링용)
            if(building) tile.setAttribute('data-type', building.type);
            
            tile.onclick = () => this.handleTileClick(idx);
            
            if (building) {
                tile.innerHTML = `<span class="b-icon">${building.icon}</span>`;
            }
            this.ui.grid.appendChild(tile);
        });
    }

    handleTileClick(idx) {
        if (this.mapData[idx]) {
            const b = this.mapData[idx];
            // 오염 유산이나 기존 건물도 덮어쓰기(재건축) 가능하게 UX 변경
            // 단, 시청은 보호
            if(b.id === 'town_hall') {
                this.showMessage(`🏛️ 시청: 철거할 수 없습니다.`);
            } else {
                this.selectedTileIndex = idx;
                // 기존 건물 정보 보여주면서 재건축 유도
                if(b.type === 'legacy') this.showMessage(`⚠️ [${b.name}] 철거하고 새 건물을 지으세요!`);
                else this.showMessage(`[${b.name}] 선택됨. (재건축 가능)`);
                this.openBuildMenu();
            }
        } else {
            this.selectedTileIndex = idx;
            this.openBuildMenu();
        }
    }

    // 탭 필터링
    filterBuild(type) {
        const items = document.querySelectorAll('.build-item');
        items.forEach(item => {
            if(type === 'all' || item.dataset.type === type) item.style.display = 'flex';
            else item.style.display = 'none';
        });
    }

    openBuildMenu() {
        this.ui.buildList.innerHTML = '';
        // 건설 가능한 목록 (유산/기본건물 제외)
        const buildable = BUILDINGS.filter(b => b.type !== 'legacy' && b.id !== 'town_hall');

        buildable.forEach(b => {
            const item = document.createElement('div');
            item.className = 'build-item';
            item.dataset.type = b.type; // 필터용
            
            const canAfford = this.money >= b.cost;
            item.style.opacity = canAfford ? '1' : '0.5';
            
            let statHtml = `💰${b.cost} | 수익 ${b.rev}`;
            if(b.emit > 0) statHtml += ` | <span style="color:red">배출 ${b.emit}</span>`;
            if(b.emit < 0) statHtml += ` | <span style="color:green">감축 ${Math.abs(b.emit)}</span>`;
            if(b.power < 0) statHtml += ` | ⚡${b.power}`;

            item.innerHTML = `
                <div class="bi-head">${b.icon} ${b.name}</div>
                <div class="bi-stat">${statHtml}</div>
                <div class="bi-stat">${b.desc}</div>
            `;
            item.onclick = () => {
                if (canAfford) this.build(b);
                else alert("자금이 부족합니다!");
            };
            this.ui.buildList.appendChild(item);
        });
        document.getElementById('build-modal').classList.remove('hidden');
        // 기본적으로 첫 탭 활성화 (Growth)
        this.filterBuild('growth'); 
    }

    build(template) {
        // 기존 건물이 있다면(오염 유산 등) 철거비용? 일단 무료 철거로 처리
        this.money -= template.cost;
        this.mapData[this.selectedTileIndex] = { ...template };
        this.renderGrid();
        this.updateHUD();
        this.showMessage(`🏗️ ${template.name} 건설 완료!`);
        document.getElementById('build-modal').classList.add('hidden');
    }

    nextWeek() {
        if (this.week > GAME_CONFIG.MAX_WEEKS) {
            alert(`게임 종료! 최종 자산: ${this.money}`);
            location.reload();
            return;
        }

        let totalRev = 0, totalExp = 0, totalEmit = 0, totalPower = 0;
        let totalRep = 0, totalRes = 0;

        this.mapData.forEach(b => {
            if (b) {
                totalRev += b.rev;
                totalExp += b.exp;
                totalEmit += b.emit;
                totalPower += b.power;
                if(b.rep) totalRep += b.rep;
                if(b.res) totalRes += b.res;
            }
        });

        // 1. 전력망 패널티 (데이터센터 등 전력 먹는 하마가 있는데 전력이 부족하면?)
        // 그리드 업그레이드(스마트그리드)가 있으면 페널티 완화 가능하지만, 여기선 단순 계산
        if(totalPower < 0) {
            // 부족분 1당 유지비 5 증가 (비상 발전)
            const penalty = Math.abs(totalPower) * 5;
            totalExp += penalty;
            this.showMessage(`⚡ 전력 부족! (${totalPower}) 비용 -${penalty}`);
        }

        // 2. 탄소세
        const netEmit = Math.max(0, totalEmit); 
        const tax = netEmit * this.taxRate;

        // 3. 이벤트
        // 이벤트 계산을 위한 임시 상태
        let tempState = { money: this.money, rep: this.rep + totalRep, res: totalRes, weekEmit: netEmit, weekPower: totalPower };
        
        const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        const evtResult = evt.effect(tempState);

        // 이벤트 결과 반영
        this.money = tempState.money;
        
        // 4. 최종 정산
        const netProfit = totalRev - totalExp - tax;
        this.money += netProfit;

        this.showReport(totalRev, totalExp, tax, netEmit, evt, evtResult, netProfit);

        this.week++;
        // 4주마다 탄소세 인상
        if(this.week % 4 === 1 && this.week > 1) {
            this.taxRate += 1;
        }
        
        this.updateHUD();
    }

    showReport(rev, exp, tax, emit, evt, evtResult, netProfit) {
        const html = `
            <div class="report-row"><span>매출</span> <span>+${rev}</span></div>
            <div class="report-row"><span>유지비</span> <span style="color:red">-${exp}</span></div>
            <div class="report-row"><span>탄소세 (${emit}t)</span> <span style="color:red">-${tax}</span></div>
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

    updateHUD() {
        this.ui.money.innerText = this.money;
        this.ui.week.innerText = this.week <= GAME_CONFIG.MAX_WEEKS ? this.week : "END";
        
        // 전체 스탯 다시 계산
        let currentEmit = 0, currentPower = 0, currentRep = GAME_CONFIG.START_REP, currentRes = 0;
        this.mapData.forEach(b => {
            if(b) {
                currentEmit += b.emit;
                currentPower += b.power;
                if(b.rep) currentRep += b.rep;
                if(b.res) currentRes += b.res;
            }
        });

        this.ui.rep.innerText = currentRep;
        this.ui.res.innerText = currentRes;
        this.ui.emit.innerText = `${currentEmit}t`;
        this.ui.infra.innerText = currentPower >= 0 ? `⚡+${currentPower}` : `⚡${currentPower}`;
        this.ui.infra.style.color = currentPower < 0 ? '#ff7675' : '#55efc4';
    }

    showMessage(text) {
        this.ui.msg.innerText = text;
        this.ui.msg.style.opacity = 0;
        setTimeout(() => this.ui.msg.style.opacity = 1, 100);
    }

    bindEvents() {
        document.getElementById('btn-next-week').onclick = () => this.nextWeek();
        // 전역 함수 연결 (HTML에서 호출)
        window.game = this; 
    }
}

new TycoonGame();
