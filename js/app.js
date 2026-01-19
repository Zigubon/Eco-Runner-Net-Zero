import { GAME_CONFIG, BUILDINGS, EVENTS } from './data.js';

class TycoonGame {
    constructor() {
        this.week = 1;
        this.money = GAME_CONFIG.START_MONEY;
        this.rep = GAME_CONFIG.START_REP;
        this.gridSize = 100; 
        this.mapData = Array(this.gridSize).fill(null);
        this.taxRate = GAME_CONFIG.TAX_RATE_BASE;

        // 선택된 건물 (건설 모드)
        this.selectedBuildingId = null;

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
            reportBody: document.getElementById('report-details'),
            cancelBtn: document.getElementById('btn-cancel-select')
        };
        
        this.init();
    }

    init() {
        this.generateMap();
        this.renderGrid();
        this.updateHUD();
        // 초기화 시 성장 탭 렌더링
        this.filterBuild('growth');
        this.bindEvents();
        console.log("🏙️ ESG City V2.1 - Sidebar UI Mode");
    }

    // 0. 맵 생성
    generateMap() {
        const centerIdx = 45;
        this.placeBuilding(centerIdx, 'town_hall');

        const legacyTypes = ['landfill', 'old_factory', 'flood_house'];
        for(let i=0; i<10; i++) {
            let rndIdx = Math.floor(Math.random() * this.gridSize);
            if(!this.mapData[rndIdx]) { 
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
            if(building) tile.setAttribute('data-type', building.type);
            
            tile.onclick = () => this.handleTileClick(idx);
            
            if (building) {
                tile.innerHTML = `<span>${building.icon}</span>`;
            }
            this.ui.grid.appendChild(tile);
        });
    }

    // --- 핵심 로직 변경: 타일 클릭 ---
    handleTileClick(idx) {
        const currentB = this.mapData[idx];

        // 1. 건설 모드일 때 (건물을 선택한 상태)
        if (this.selectedBuildingId) {
            const template = BUILDINGS.find(b => b.id === this.selectedBuildingId);
            
            // 시청은 덮어쓰기 불가
            if(currentB && currentB.id === 'town_hall') {
                this.showMessage("❌ 시청은 철거할 수 없습니다.");
                return;
            }

            // 돈 확인
            if(this.money < template.cost) {
                this.showMessage("💸 자금이 부족합니다!");
                return;
            }

            // 건설 실행
            this.build(idx, template);
            return;
        }

        // 2. 정보 보기 모드 (아무것도 선택 안 함)
        if (currentB) {
            if(currentB.type === 'legacy') this.showMessage(`⚠️ [${currentB.name}] 오염 유산입니다. 철거하세요!`);
            else this.showMessage(`ℹ️ [${currentB.name}] 수익:${currentB.rev} 배출:${currentB.emit}`);
        } else {
            this.showMessage("우측 메뉴에서 건물을 선택하고 클릭하세요.");
        }
    }

    // --- 우측 패널 로직 ---
    
    // 탭 필터링 및 리스트 렌더링
    filterBuild(type) {
        // 탭 활성화 스타일
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        this.ui.buildList.innerHTML = '';
        const buildable = BUILDINGS.filter(b => b.type !== 'legacy' && b.id !== 'town_hall');

        buildable.forEach(b => {
            // 타입 필터
            if(type !== 'all' && b.type !== type) return;

            const item = document.createElement('div');
            item.className = 'build-item';
            // 이미 선택된 건물이면 스타일 적용
            if(this.selectedBuildingId === b.id) item.classList.add('selected');
            
            const canAfford = this.money >= b.cost;
            if(!canAfford) item.classList.add('disabled');

            item.innerHTML = `
                <div class="bi-icon">${b.icon}</div>
                <div class="bi-info">
                    <div class="bi-name">${b.name}</div>
                    <div class="bi-cost">💰 ${b.cost}</div>
                    <div class="bi-desc">수익${b.rev} / 탄소${b.emit}</div>
                </div>
            `;
            
            item.onclick = () => {
                if(!canAfford) { this.showMessage("자금이 부족합니다."); return; }
                this.selectBuilding(b.id);
            };

            this.ui.buildList.appendChild(item);
        });
    }

    selectBuilding(id) {
        this.selectedBuildingId = id;
        this.showMessage(`🔨 건설 모드: 맵을 클릭해 건설하세요.`);
        
        // UI 갱신 (선택 표시)
        const items = document.querySelectorAll('.build-item');
        items.forEach(el => el.classList.remove('selected'));
        // 다시 렌더링하긴 비효율적이니, 간단히 처리하거나 탭 갱신
        // 여기선 간단히 탭을 리프레시 하지 않고 스타일만 찾아서 넣을 수도 있으나,
        // 코드를 단순하게 유지하기 위해 현재 탭 재렌더링은 생략하고 클래스만 토글한다고 가정
        // 하지만 위 filterBuild 함수가 호출될 때마다 초기화되므로, 
        // 그냥 시각적 피드백을 위해 취소 버튼을 활성화함.
        
        this.ui.cancelBtn.classList.remove('hidden');
        
        // 리스트 아이템 스타일 갱신 (간단버전)
        this.filterBuild(BUILDINGS.find(b=>b.id===id).type); 
    }

    cancelSelection() {
        this.selectedBuildingId = null;
        this.showMessage("선택 취소됨.");
        this.ui.cancelBtn.classList.add('hidden');
        
        // 리스트 스타일 초기화
        const items = document.querySelectorAll('.build-item');
        items.forEach(el => el.classList.remove('selected'));
    }

    build(idx, template) {
        this.money -= template.cost;
        this.mapData[idx] = { ...template };
        
        this.renderGrid();
        this.updateHUD();
        this.showMessage(`🏗️ ${template.name} 건설 완료!`);
        
        // 연속 건설을 위해 선택 상태 유지 (원하면 여기서 null로 초기화 가능)
        // this.cancelSelection(); 
    }

    // --- 주간 정산 (기존 로직 유지) ---
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

        if(totalPower < 0) {
            const penalty = Math.abs(totalPower) * 5;
            totalExp += penalty;
            this.showMessage(`⚡ 전력 부족! 비용 -${penalty}`);
        }

        const netEmit = Math.max(0, totalEmit); 
        const tax = netEmit * this.taxRate;

        let tempState = { money: this.money, rep: this.rep + totalRep, res: totalRes, weekEmit: netEmit, weekPower: totalPower };
        
        const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        const evtResult = evt.effect(tempState);

        this.money = tempState.money;
        const netProfit = totalRev - totalExp - tax;
        this.money += netProfit;

        this.showReport(totalRev, totalExp, tax, netEmit, evt, evtResult, netProfit);

        this.week++;
        if(this.week % 4 === 1 && this.week > 1) {
            this.taxRate += 1;
        }
        
        this.updateHUD();
        // UI 리프레시 (건설 가능 여부 갱신 등)
        if(this.selectedBuildingId) {
             const bType = BUILDINGS.find(b=>b.id===this.selectedBuildingId).type;
             this.filterBuild(bType);
        }
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
        window.game = this; 
        
        // 키보드 ESC 취소
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Escape') this.cancelSelection();
        });
    }
}

new TycoonGame();
