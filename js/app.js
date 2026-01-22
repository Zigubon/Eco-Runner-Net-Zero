import { GAME_CONFIG, BUILDINGS, EVENTS, RESEARCH, LEADERS } from './data.js';

class TycoonGame {
    constructor() {
        this.year = 1;
        this.money = GAME_CONFIG.START_MONEY;
        this.rep = GAME_CONFIG.START_REP;
        this.gridSize = 100; // 10x10
        this.mapData = Array(this.gridSize).fill(null); // 건물 데이터
        this.taxRate = GAME_CONFIG.TAX_RATE_BASE;
        this.leader = null;
        this.selectedBuildingId = null;
        this.researched = [];

        this.ui = {
            grid: document.getElementById('city-grid'),
            money: document.getElementById('ui-money'),
            emit: document.getElementById('ui-emit'),
            rep: document.getElementById('ui-rep'),
            infra: document.getElementById('ui-infra'),
            year: document.getElementById('ui-year'),
            msg: document.getElementById('ui-message'),
            buildList: document.getElementById('building-list'),
            researchList: document.getElementById('research-list'),
            logList: document.getElementById('log-list'),
            reportBody: document.getElementById('report-details'),
            cancelBtn: document.getElementById('btn-cancel-select'),
            tooltip: document.getElementById('tooltip'),
            leaderModal: document.getElementById('intro-screen'),
            leaderList: document.getElementById('intro-leader-list'),
            startBtn: document.getElementById('btn-start-game'),
            rouletteModal: document.getElementById('roulette-modal'),
            rouletteText: document.getElementById('roulette-display'),
            rouletteRes: document.getElementById('roulette-result'),
            rouletteDesc: document.getElementById('roulette-desc')
        };
        
        this.init();
    }

    init() {
        this.renderLeaderSelection();
        this.ui.startBtn.onclick = () => this.startGame();
    }

    renderLeaderSelection() {
        this.ui.leaderList.innerHTML = '';
        LEADERS.forEach(leader => {
            const card = document.createElement('div');
            card.className = 'leader-card';
            card.innerHTML = `
                <div class="l-icon">${leader.icon}</div>
                <div class="l-title">${leader.name}</div>
                <div class="l-desc">${leader.desc}</div>
                <div class="l-buff">${leader.buff}</div>
            `;
            card.onclick = () => {
                document.querySelectorAll('.leader-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.leader = leader;
                this.ui.startBtn.disabled = false;
                this.ui.startBtn.innerText = `${leader.name}로 시작하기`;
            };
            this.ui.leaderList.appendChild(card);
        });
    }

    startGame() {
        document.getElementById('intro-screen').style.display = 'none';
        this.generateMap();
        this.renderGrid();
        this.updateHUD();
        this.filterBuild('growth');
        this.renderResearch();
        this.bindEvents();
        this.addLog(`게임 시작! ${this.leader.name} 취임.`);
    }

    // --- 맵 생성 ---
    generateMap() {
        // 중앙 시청
        this.placeBuilding(45, 'town_hall');

        // 오염 유산 6개
        const legacyTypes = ['landfill', 'old_factory', 'flood_house'];
        let placed = 0;
        while(placed < 6) {
            let rndIdx = Math.floor(Math.random() * this.gridSize);
            if(this.checkSpace(rndIdx, 1, 1)) {
                let rndType = legacyTypes[Math.floor(Math.random() * legacyTypes.length)];
                this.placeBuilding(rndIdx, rndType);
                placed++;
            }
        }

        // 숲 3개 (밸런스)
        let forests = 0;
        while(forests < 3) {
            let rndIdx = Math.floor(Math.random() * this.gridSize);
            if(this.checkSpace(rndIdx, 1, 1)) {
                this.placeBuilding(rndIdx, 'forest');
                forests++;
            }
        }
    }

    placeBuilding(idx, id) {
        const b = BUILDINGS.find(x => x.id === id);
        if(b) {
            // 멀티 타일 점유 처리
            this.setOccupied(idx, b.w, b.h, { ...b, rootIdx: idx });
        }
    }

    // 공간 확인 (Multi-tile)
    checkSpace(idx, w, h) {
        const row = Math.floor(idx / 10);
        const col = idx % 10;
        
        // 맵 밖으로 나가는지 체크
        if (col + w > 10 || row + h > 10) return false;

        for(let r=0; r<h; r++) {
            for(let c=0; c<w; c++) {
                let targetIdx = idx + (r * 10) + c;
                if(this.mapData[targetIdx] !== null) return false;
            }
        }
        return true;
    }

    // 점유 설정
    setOccupied(idx, w, h, data) {
        for(let r=0; r<h; r++) {
            for(let c=0; c<w; c++) {
                let targetIdx = idx + (r * 10) + c;
                this.mapData[targetIdx] = data; // 모든 칸에 데이터 참조 저장 (단순화)
            }
        }
    }

    // 철거 (공간 비우기)
    clearSpace(idx) {
        const b = this.mapData[idx];
        if(!b) return;
        
        // 건물의 시작점(root)을 찾거나, 저장된 rootIdx 사용
        const root = b.rootIdx !== undefined ? b.rootIdx : idx; 
        
        for(let r=0; r<b.h; r++) {
            for(let c=0; c<b.w; c++) {
                let targetIdx = root + (r * 10) + c;
                this.mapData[targetIdx] = null;
            }
        }
    }

    // --- 렌더링 ---
    renderGrid() {
        this.ui.grid.innerHTML = '';
        
        // 렌더링 중 중복 그리기 방지
        const renderedIndices = new Set();

        for(let i=0; i<this.gridSize; i++) {
            if(renderedIndices.has(i)) continue;

            const b = this.mapData[i];
            const tile = document.createElement('div');
            tile.className = 'tile';
            
            if(b) {
                // 루트인 경우에만 렌더링하고 나머지는 건너뜀
                if(b.rootIdx === i) {
                    tile.innerHTML = `<span>${b.icon}</span>`;
                    tile.setAttribute('data-type', b.type);
                    
                    // CSS Grid Span 적용
                    if(b.w > 1) tile.classList.add('w2');
                    if(b.h > 1) tile.classList.add('h2');
                    
                    // 스타일 직접 지정 (grid-column/row)
                    tile.style.gridColumnStart = (i % 10) + 1;
                    tile.style.gridColumnEnd = `span ${b.w}`;
                    tile.style.gridRowStart = Math.floor(i / 10) + 1;
                    tile.style.gridRowEnd = `span ${b.h}`;

                    // 마우스 이벤트
                    tile.onmouseenter = (e) => this.showTooltip(e, b);
                    tile.onmousemove = (e) => this.moveTooltip(e);
                    tile.onmouseleave = () => this.hideTooltip();
                    tile.onclick = () => this.handleTileClick(i); // 클릭은 루트 인덱스로

                    this.ui.grid.appendChild(tile);

                    // 점유된 인덱스들 마킹
                    for(let r=0; r<b.h; r++) {
                        for(let c=0; c<b.w; c++) {
                            renderedIndices.add(i + (r*10) + c);
                        }
                    }
                }
            } else {
                // 빈 땅
                tile.className = 'tile empty';
                tile.onclick = () => this.handleTileClick(i);
                this.ui.grid.appendChild(tile);
            }
        }
    }

    // --- 클릭 핸들러 ---
    handleTileClick(idx) {
        const currentB = this.mapData[idx];

        // 1. 건설 모드
        if (this.selectedBuildingId) {
            if(currentB) {
                if(currentB.id === 'town_hall') { alert("시청은 철거 불가!"); return; }
                if(currentB.type === 'legacy') { alert("오염 유산은 철거 후 건설하세요."); return; }
                if(currentB.id === 'forest') { /* 숲은 덮어쓰기 가능 */ }
                else { alert("빈 땅이나 숲에만 건설 가능합니다. (기존 건물은 철거 필요)"); return; }
            }
            
            const template = BUILDINGS.find(b => b.id === this.selectedBuildingId);
            
            // 공간 체크
            if(!this.checkSpace(idx, template.w, template.h)) {
                this.showMessage("❌ 공간이 부족합니다! (건물이 겹치거나 맵 밖입니다)");
                return;
            }

            // 비용 (리더 할인)
            let cost = template.cost;
            if(this.leader.id === 'energy_expert' && template.type === 'energy') cost = Math.floor(cost * 0.8);

            if(this.money < cost) { this.showMessage("💸 자금 부족!"); return; }
            
            this.build(idx, template, cost);
            return;
        }

        // 2. 일반 모드 (철거)
        if (currentB && currentB.id !== 'town_hall') {
            const cost = currentB.type === 'legacy' ? currentB.demolishCost : 10;
            if(confirm(`[${currentB.name}] 철거하시겠습니까? (비용: ${cost}억)`)) {
                if(this.money >= cost) {
                    this.money -= cost;
                    this.clearSpace(idx); // 멀티타일 철거
                    this.renderGrid();
                    this.updateHUD();
                    this.addLog(`${currentB.name} 철거 (-${cost})`);
                } else {
                    alert("철거 자금 부족");
                }
            }
        }
    }

    build(idx, template, cost) {
        this.money -= cost;
        // 기존(숲 등) 제거 후 건설
        this.clearSpace(idx);
        this.setOccupied(idx, template.w, template.h, { ...template, rootIdx: idx });
        
        this.renderGrid();
        this.updateHUD();
        this.addLog(`${template.name} 건설 (-${cost})`);
        
        // 연속 건설을 위해 선택 유지하되 메시지 띄움
        this.showMessage(`${template.name} 건설 완료!`);
    }

    // --- 툴팁 ---
    showTooltip(e, b) {
        let html = `<h4>${b.icon} ${b.name}</h4>`;
        if(b.type === 'legacy') html += `<div style="color:#ff7675">⚠️ 철거비용: ${b.demolishCost}</div>`;
        else if(b.id !== 'forest') html += `<div>수익 ${b.rev} | 유지 ${b.exp}</div>`;
        
        if(b.emit !== 0) html += `<div>탄소: ${b.emit > 0 ? '-' : '+'}${Math.abs(b.emit)}</div>`;
        if(b.power !== 0) html += `<div>전력: ${b.power > 0 ? '+' : ''}${b.power}</div>`;
        
        this.ui.tooltip.innerHTML = html;
        this.ui.tooltip.classList.remove('hidden');
        this.moveTooltip(e);
    }
    moveTooltip(e) { this.ui.tooltip.style.left = (e.pageX+15)+'px'; this.ui.tooltip.style.top = (e.pageY+15)+'px'; }
    hideTooltip() { this.ui.tooltip.classList.add('hidden'); }

    // --- 패널 ---
    filterBuild(type) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
        this.ui.buildList.innerHTML = '';
        
        const buildable = BUILDINGS.filter(b => b.type !== 'legacy' && b.id !== 'town_hall' && b.id !== 'forest');
        
        buildable.forEach(b => {
            if(type !== 'all' && b.type !== type) return;
            const item = document.createElement('div');
            item.className = 'build-item';
            
            let locked = b.reqTech && !this.researched.includes(b.reqTech);
            if(this.selectedBuildingId === b.id) item.classList.add('selected');
            
            let cost = b.cost;
            if(this.leader && this.leader.id === 'energy_expert' && b.type === 'energy') cost = Math.floor(cost * 0.8);
            
            if(this.money < cost || locked) item.classList.add('disabled');

            let sizeTag = (b.w > 1 || b.h > 1) ? `<span style="font-size:0.7em; border:1px solid #ccc; padding:1px 3px;">${b.w}x${b.h}</span>` : '';

            item.innerHTML = `
                <div class="bi-icon">${b.icon}</div>
                <div class="bi-info">
                    <div class="bi-name">${b.name} ${sizeTag} ${locked ? '🔒' : ''}</div>
                    <div class="bi-cost">💰 ${cost}</div>
                    <div class="bi-desc">수익${b.rev} 탄소${b.emit}</div>
                </div>
            `;
            item.onclick = () => {
                if(locked) { alert("연구 필요"); return; }
                if(this.money < cost) { alert("자금 부족"); return; }
                this.selectBuilding(b.id);
            };
            this.ui.buildList.appendChild(item);
        });
    }

    selectBuilding(id) {
        this.selectedBuildingId = id;
        this.ui.cancelBtn.classList.remove('hidden');
        this.filterBuild(BUILDINGS.find(b=>b.id===id).type);
    }
    cancelSelection() {
        this.selectedBuildingId = null;
        this.ui.cancelBtn.classList.add('hidden');
        const activeTab = document.querySelector('.sub-tab-btn.active');
        if(activeTab) this.filterBuild(activeTab.dataset.type);
    }

    switchMainTab(tab) {
        ['panel-build', 'panel-research', 'panel-log'].forEach(id => document.getElementById(id).classList.add('hidden'));
        document.getElementById(`panel-${tab}`).classList.remove('hidden');
    }

    renderResearch() {
        this.ui.researchList.innerHTML = '';
        RESEARCH.forEach(r => {
            const item = document.createElement('div');
            item.className = 'research-item';
            const isDone = this.researched.includes(r.id);
            const locked = r.req && !this.researched.includes(r.req);
            
            if(isDone) item.classList.add('done');
            else if(locked || this.money < r.cost) item.classList.add('disabled');

            item.innerHTML = `
                <div class="bi-icon">${r.icon}</div>
                <div class="bi-info">
                    <div class="bi-name">${r.name} ${isDone ? '✅' : (locked ? '🔒' : '')}</div>
                    ${!isDone ? `<div class="bi-cost">💰 ${r.cost}</div>` : ''}
                    <div class="bi-desc">${r.desc}</div>
                </div>
            `;
            item.onclick = () => {
                if(isDone || locked || this.money < r.cost) return;
                if(confirm(`연구 진행? (${r.cost})`)) {
                    this.money -= r.cost;
                    this.researched.push(r.id);
                    this.addLog(`연구 완료: ${r.name}`);
                    this.updateHUD();
                    this.renderResearch();
                }
            };
            this.ui.researchList.appendChild(item);
        });
    }

    // --- 연말 정산 & 룰렛 ---
    nextYear() {
        if(this.year > GAME_CONFIG.MAX_YEARS) return;
        
        // 1. 룰렛 시작
        this.ui.rouletteModal.classList.remove('hidden');
        this.ui.rouletteText.classList.remove('hidden');
        this.ui.rouletteRes.classList.add('hidden');
        
        let count = 0;
        const interval = setInterval(() => {
            const rndEvt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
            this.ui.rouletteText.innerText = `🎲 ${rndEvt.name}...`;
            count++;
            if(count > 15) { // 1.5초 후 정지
                clearInterval(interval);
                this.calculateYear(EVENTS[Math.floor(Math.random() * EVENTS.length)]);
            }
        }, 100);
    }

    calculateYear(evt) {
        // 실제 계산 로직
        let totalRev=0, totalExp=0, baseEmit=0, totalPower=0;
        
        // 중복 계산 방지 (루트만 계산)
        const countedIndices = new Set();
        this.mapData.forEach((b, i) => {
            if(b && b.rootIdx === i) {
                let rev = b.rev;
                if(this.leader.id === 'economy_expert') rev = Math.floor(rev * 1.15);
                totalRev += rev;
                totalExp += b.exp;
                baseEmit += b.emit;
                totalPower += b.power;
            }
        });

        // 스모그 (1x1 기준 인접 체크는 복잡하므로 단순화: 전체 배출량에 비례한 패널티로 대체하거나 생략)
        // 이번 버전에서는 로직 단순화를 위해 스모그는 제외하거나, 타일별 루프를 다시 돌려야 함.
        // 여기선 '전체 배출량이 높으면 추가 패널티'로 단순화
        let smogPenalty = 0;
        if(baseEmit > 50) smogPenalty = 10;

        let totalEmit = baseEmit + smogPenalty;

        // 전력 패널티
        if(totalPower < 0) {
            totalExp += Math.abs(totalPower) * 5;
            this.addLog("⚡ 전력 부족 패널티 발생", 'bad');
        }

        const netEmit = Math.max(0, totalEmit);
        let tax = Math.floor(netEmit * this.taxRate);
        if(this.leader.id === 'climate_expert') tax = Math.floor(tax * 0.5);

        // 이벤트 적용
        let tempState = { money: this.money, weekEmit: netEmit, weekPower: totalPower, rep: this.rep, res: 0 };
        const evtResult = evt.effect(tempState);
        this.money = tempState.money;

        // 최종
        const netProfit = totalRev - totalExp - tax;
        this.money += netProfit;

        // UI 표시 (룰렛 결과창)
        this.ui.rouletteText.classList.add('hidden');
        this.ui.rouletteRes.classList.remove('hidden');
        this.ui.rouletteDesc.innerHTML = `
            <h3>${evt.name}</h3>
            <p>${evtResult}</p>
            <hr>
            <p>매출: +${totalRev} / 유지: -${totalExp}</p>
            <p>탄소세: -${tax} (배출 ${netEmit}t)</p>
            <h3 style="color:${netProfit>=0?'green':'red'}">순이익: ${netProfit}</h3>
        `;

        this.pendingYearUpdate = { netProfit, netEmit }; // 확인 버튼 누르면 반영
    }

    finishYear() {
        this.ui.rouletteModal.classList.add('hidden');
        
        // 파산 체크
        if(this.money < 0) {
            document.getElementById('gameover-modal').classList.remove('hidden');
            document.getElementById('final-score').innerText = `${this.year}년차 파산`;
            return;
        }

        this.year++;
        if(this.year > GAME_CONFIG.MAX_YEARS) {
            alert("게임 승리! 15년 임기를 마쳤습니다.");
            return;
        }
        
        if(this.year % 5 === 1) {
            this.taxRate += 1;
            this.addLog(`📢 탄소세율 인상 (x${this.taxRate})`, 'bad');
        }

        this.updateHUD();
        this.addLog(`📅 ${this.year}년 시작`);
    }

    updateHUD() {
        this.ui.money.innerText = this.money;
        this.ui.year.innerText = this.year;
        
        let e=0, p=0;
        this.mapData.forEach((b, i) => { 
            if(b && b.rootIdx === i) { e+=b.emit; p+=b.power; } 
        });
        
        this.ui.emit.innerText = `${e}t`;
        this.ui.infra.innerText = p; // 숫자만
        this.ui.infra.style.color = p<0 ? '#ff7675' : '#55efc4';
        this.ui.rep.innerText = this.rep;
    }

    addLog(msg, type='normal') {
        const d = document.createElement('div');
        d.className = `log-item ${type}`;
        d.innerText = msg;
        this.ui.logList.prepend(d);
    }
    
    showMessage(t) { 
        this.ui.msg.innerText = t; 
        this.ui.msg.style.opacity = 0.5; 
        setTimeout(()=>this.ui.msg.style.opacity=1, 100); 
    }

    bindEvents() {
        document.getElementById('btn-next-week').onclick = () => this.nextYear();
        window.game = this; 
        document.addEventListener('keydown', e => { if(e.key==='Escape') this.cancelSelection(); });
    }
}

new TycoonGame();
