import { GAME_CONFIG, BUILDINGS, EVENTS, RESEARCH } from './data.js';

class TycoonGame {
    constructor() {
        this.year = 1; // Week -> Year
        this.money = GAME_CONFIG.START_MONEY;
        this.rep = GAME_CONFIG.START_REP;
        this.gridSize = 100; 
        this.mapData = Array(this.gridSize).fill(null);
        this.taxRate = GAME_CONFIG.TAX_RATE_BASE;
        this.selectedBuildingId = null;
        this.researched = []; // 개발 완료된 기술 ID 목록

        this.ui = {
            grid: document.getElementById('city-grid'),
            money: document.getElementById('ui-money'),
            emit: document.getElementById('ui-emit'),
            rep: document.getElementById('ui-rep'),
            res: document.getElementById('ui-res'),
            infra: document.getElementById('ui-infra'),
            year: document.getElementById('ui-year'),
            buildList: document.getElementById('building-list'),
            researchList: document.getElementById('research-list'),
            logList: document.getElementById('log-list'),
            reportBody: document.getElementById('report-details'),
            cancelBtn: document.getElementById('btn-cancel-select'),
            tooltip: document.getElementById('tooltip')
        };
        
        this.init();
    }

    init() {
        this.generateMap();
        this.renderGrid();
        this.updateHUD();
        this.filterBuild('growth'); // 초기 탭
        this.renderResearch();
        this.bindEvents();
        this.addLog("게임 시작! 지속가능한 도시를 건설하세요.");
    }

    // --- 맵 & 그리드 ---
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
            
            // 툴팁 이벤트
            tile.onmouseenter = (e) => this.showTooltip(e, building, idx);
            tile.onmousemove = (e) => this.moveTooltip(e);
            tile.onmouseleave = () => this.hideTooltip();
            tile.onclick = () => this.handleTileClick(idx);
            
            if (building) {
                tile.innerHTML = `<span>${building.icon}</span>`;
            }
            this.ui.grid.appendChild(tile);
        });
    }

    // --- 툴팁 기능 ---
    showTooltip(e, building, idx) {
        // 건설 모드일 때 빈 땅에 마우스 올리면 선택된 건물 미리보기 정보 표시 가능
        // 여기선 기존 건물 정보만 표시
        if(!building) return;

        let html = `<h4>${building.icon} ${building.name}</h4>`;
        
        if(building.type === 'legacy') {
             html += `<div style="color:#ff7675">⚠️ 오염 유산</div>`;
             html += `<div>철거비용: 💰${building.demolishCost}</div>`;
        } else {
             html += `<div>수익: +${building.rev}</div>`;
             html += `<div>유지비: -${building.exp}</div>`;
        }
        
        // 탄소
        if(building.emit > 0) html += `<div>탄소: <span class="stat-neg">배출 ${building.emit}t</span></div>`;
        if(building.emit < 0) html += `<div>탄소: <span class="stat-pos">감축 ${Math.abs(building.emit)}t</span></div>`;
        
        // 에너지
        if(building.power > 0) html += `<div>전력: <span class="stat-pos">생산 +${building.power}</span></div>`;
        if(building.power < 0) html += `<div>전력: <span class="stat-neg">소모 ${building.power}</span></div>`;

        this.ui.tooltip.innerHTML = html;
        this.ui.tooltip.classList.remove('hidden');
        this.moveTooltip(e);
    }

    moveTooltip(e) {
        // 툴팁 위치 조정 (마우스 오른쪽 아래)
        // 맵 영역 밖으로 안 나가게 약간의 보정 필요하지만 MVP에선 단순 처리
        this.ui.tooltip.style.left = (e.pageX + 15) + 'px';
        this.ui.tooltip.style.top = (e.pageY + 15) + 'px';
    }

    hideTooltip() {
        this.ui.tooltip.classList.add('hidden');
    }


    // --- 타일 클릭 ---
    handleTileClick(idx) {
        const currentB = this.mapData[idx];

        if (this.selectedBuildingId) {
            if(currentB) {
                if(currentB.id === 'town_hall') { alert("시청은 건드릴 수 없습니다."); return; }
                if(currentB.type === 'legacy') { alert("오염 유산은 먼저 철거해야 합니다."); return; }
            }
            const template = BUILDINGS.find(b => b.id === this.selectedBuildingId);
            if(this.money < template.cost) { alert("자금이 부족합니다!"); return; }
            
            this.build(idx, template);
            return;
        }

        // 일반 클릭 (철거 등)
        if (currentB && currentB.type === 'legacy') {
            const cost = currentB.demolishCost;
            if(confirm(`[${currentB.name}] 철거하시겠습니까? (비용: ${cost}억)`)) {
                if(this.money >= cost) {
                    this.money -= cost;
                    this.mapData[idx] = null;
                    this.renderGrid();
                    this.updateHUD();
                    this.addLog(`${currentB.name} 철거 완료 (-${cost})`, 'bad');
                } else {
                    alert("철거 자금이 부족합니다.");
                }
            }
        }
    }

    // --- 건설 & 연구 패널 ---
    filterBuild(type) {
        // 탭 활성화
        const tabs = document.querySelectorAll('.sub-tab-btn');
        tabs.forEach(btn => {
            if(btn.dataset.type === type) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        this.ui.buildList.innerHTML = '';
        const buildable = BUILDINGS.filter(b => b.type !== 'legacy' && b.id !== 'town_hall');

        buildable.forEach(b => {
            if(type !== 'all' && b.type !== type) return;

            const item = document.createElement('div');
            item.className = 'build-item';
            
            // 연구 해금 여부 체크
            let locked = false;
            if(b.reqTech && !this.researched.includes(b.reqTech)) locked = true;

            if(this.selectedBuildingId === b.id) item.classList.add('selected');
            
            const canAfford = this.money >= b.cost;
            if(!canAfford || locked) item.classList.add('disabled');

            // 전력/탄소 표시 개선
            let powerStat = b.power > 0 ? `<span class="stat-pos">⚡+${b.power}</span>` : (b.power < 0 ? `<span class="stat-neg">⚡${b.power}</span>` : '');
            let emitStat = b.emit > 0 ? `<span class="stat-neg">♨️${b.emit}</span>` : (b.emit < 0 ? `<span class="stat-pos">🌱${Math.abs(b.emit)}</span>` : '');

            let html = `
                <div class="bi-icon">${b.icon}</div>
                <div class="bi-info">
                    <div class="bi-name">${b.name} ${locked ? '🔒' : ''}</div>
            `;
            
            if(locked) {
                const techName = RESEARCH.find(r=>r.id===b.reqTech).name;
                html += `<div class="bi-desc" style="color:#e74c3c">필요: ${techName}</div>`;
            } else {
                html += `
                    <div class="bi-cost">💰 ${b.cost}</div>
                    <div class="bi-desc">수익${b.rev} | ${emitStat} ${powerStat}</div>
                `;
            }
            html += `</div>`;
            item.innerHTML = html;
            
            item.onclick = () => {
                if(locked) { alert("연구가 필요합니다!"); return; }
                if(!canAfford) { alert("자금이 부족합니다."); return; }
                this.selectBuilding(b.id);
            };

            this.ui.buildList.appendChild(item);
        });
    }

    renderResearch() {
        this.ui.researchList.innerHTML = '';
        RESEARCH.forEach(r => {
            const item = document.createElement('div');
            item.className = 'research-item';
            
            const isDone = this.researched.includes(r.id);
            const canAfford = this.money >= r.cost;
            // 선행 연구 체크
            let locked = false;
            if(r.req && !this.researched.includes(r.req)) locked = true;

            if(isDone) item.classList.add('done');
            else if(!canAfford || locked) item.classList.add('disabled');

            let statusIcon = isDone ? '✅' : (locked ? '🔒' : '');

            item.innerHTML = `
                <div class="bi-icon">${r.icon}</div>
                <div class="bi-info">
                    <div class="bi-name">${r.name} ${statusIcon}</div>
                    ${!isDone ? `<div class="bi-cost">💰 ${r.cost}</div>` : '<div class="stat-pos">개발 완료</div>'}
                    <div class="bi-desc">${r.desc}</div>
                    ${locked ? `<div class="bi-desc" style="color:#e74c3c">선행: ${RESEARCH.find(x=>x.id===r.req).name}</div>` : ''}
                </div>
            `;
            
            item.onclick = () => {
                if(isDone) return;
                if(locked) { alert("선행 연구가 필요합니다."); return; }
                if(!canAfford) { alert("연구 자금이 부족합니다."); return; }
                
                if(confirm(`${r.name} 연구를 진행하시겠습니까? (비용 ${r.cost})`)) {
                    this.money -= r.cost;
                    this.researched.push(r.id);
                    this.addLog(`🔬 기술 개발: ${r.name}`, 'good');
                    this.updateHUD();
                    this.renderResearch();
                    // 건설 탭 리프레시 (해금된거 반영)
                    if(!document.getElementById('panel-build').classList.contains('hidden')) {
                         this.filterBuild(document.querySelector('.sub-tab-btn.active').dataset.type);
                    }
                }
            };
            this.ui.researchList.appendChild(item);
        });
    }

    selectBuilding(id) {
        this.selectedBuildingId = id;
        this.ui.cancelBtn.classList.remove('hidden');
        // 선택 표시 업데이트
        const items = document.querySelectorAll('.build-item');
        items.forEach(el => el.classList.remove('selected'));
        // 탭 다시 그리기
        const bType = BUILDINGS.find(b=>b.id===id).type;
        this.filterBuild(bType);
    }

    cancelSelection() {
        this.selectedBuildingId = null;
        this.ui.cancelBtn.classList.add('hidden');
        const items = document.querySelectorAll('.build-item');
        items.forEach(el => el.classList.remove('selected'));
    }

    build(idx, template) {
        this.money -= template.cost;
        this.mapData[idx] = { ...template };
        this.renderGrid();
        this.updateHUD();
        this.addLog(`${template.name} 건설완료`);
    }

    // --- 탭 전환 ---
    switchMainTab(tabName) {
        const panels = ['panel-build', 'panel-research', 'panel-log'];
        panels.forEach(id => document.getElementById(id).classList.add('hidden'));
        document.getElementById(`panel-${tabName}`).classList.remove('hidden');

        // 버튼 스타일
        const btns = document.querySelectorAll('.main-tab-btn');
        btns.forEach(b => b.classList.remove('active'));
        if(event) event.target.classList.add('active');
    }

    addLog(msg, type = 'normal') {
        const item = document.createElement('div');
        item.className = `log-item ${type}`;
        item.innerHTML = `<span style="opacity:0.6; margin-right:5px;">Y${this.year}</span> ${msg}`;
        this.ui.logList.prepend(item);
    }

    // --- 연말 정산 ---
    nextYear() {
        if (this.year > GAME_CONFIG.MAX_YEARS) {
            alert(`게임 종료! 최종 자산: ${this.money}`);
            return;
        }

        let totalRev = 0, totalExp = 0, totalEmit = 0, totalPower = 0;
        let totalRep = 0;

        this.mapData.forEach(b => {
            if (b) {
                totalRev += b.rev;
                totalExp += b.exp;
                totalEmit += b.emit;
                totalPower += b.power;
                if(b.rep) totalRep += b.rep;
            }
        });

        // 전력 패널티: 부족분만큼 유지비 5배 증가 (비상발전)
        let penalty = 0;
        if(totalPower < 0) {
            penalty = Math.abs(totalPower) * 5;
            totalExp += penalty;
            this.addLog(`⚡ 전력부족! 비상발전비용 -${penalty}`, 'bad');
        }

        const netEmit = Math.max(0, totalEmit); 
        const tax = netEmit * this.taxRate;

        let tempState = { money: this.money, rep: this.rep + totalRep, res: 0, weekEmit: netEmit, weekPower: totalPower };
        
        const evt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        const evtResult = evt.effect(tempState);
        this.addLog(`🔔 ${evt.name}: ${evtResult}`);

        this.money = tempState.money;
        const netProfit = totalRev - totalExp - tax;
        this.money += netProfit;

        this.showReport(totalRev, totalExp, tax, netEmit, evt, evtResult, netProfit);

        this.year++;
        if(this.year % 5 === 1 && this.year > 1) {
            this.taxRate += 1;
            this.addLog(`📢 탄소세율 인상 (x${this.taxRate})`, 'bad');
        }
        
        this.updateHUD();
        // 건설 탭 리프레시 (자금 변동 반영)
        if(!document.getElementById('panel-build').classList.contains('hidden')) {
             // 현재 탭 찾기 귀찮으니 그냥 성장 탭으로.. 아니면 active 찾기
             const activeTab = document.querySelector('.sub-tab-btn.active');
             if(activeTab) this.filterBuild(activeTab.dataset.type);
        }
        this.renderResearch(); // 연구 탭 리프레시
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
        this.ui.year.innerText = this.year <= GAME_CONFIG.MAX_YEARS ? this.year : "END";
        
        let currentEmit = 0, currentPower = 0, currentRep = GAME_CONFIG.START_REP;
        this.mapData.forEach(b => {
            if(b) {
                currentEmit += b.emit;
                currentPower += b.power;
                if(b.rep) currentRep += b.rep;
            }
        });

        this.ui.rep.innerText = currentRep;
        this.ui.emit.innerText = `${currentEmit}t`;
        this.ui.infra.innerText = currentPower >= 0 ? `⚡+${currentPower}` : `⚡${currentPower}`;
        this.ui.infra.style.color = currentPower < 0 ? '#ff7675' : '#55efc4';
    }

    bindEvents() {
        document.getElementById('btn-next-week').onclick = () => this.nextYear();
        window.game = this; 
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Escape') this.cancelSelection();
        });
    }
}

new TycoonGame();
