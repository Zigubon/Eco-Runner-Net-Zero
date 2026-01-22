import { GAME_CONFIG, BUILDINGS, EVENTS, RESEARCH, LEADERS, MAPS, POLICIES, ACHIEVEMENTS } from './data.js';

class TycoonGame {
    constructor() {
        this.year = 1;
        this.money = GAME_CONFIG.START_MONEY;
        this.rep = GAME_CONFIG.START_REP;
        
        this.gridSize = 100;
        this.mapData = Array(this.gridSize).fill(null);
        
        this.taxRate = GAME_CONFIG.TAX_RATE_BASE;
        this.leader = null;
        this.selectedBuildingId = null;
        this.researched = [];
        this.achieved = new Set();
        
        // 버튼 중복 클릭 방지용 플래그
        this.isProcessing = false;

        this.ui = {
            grid: document.getElementById('city-grid'),
            money: document.getElementById('ui-money'),
            emit: document.getElementById('ui-emit'),
            rep: document.getElementById('ui-rep'),
            infra: document.getElementById('ui-infra'),
            year: document.getElementById('ui-year'),
            mapBadge: document.getElementById('ui-map-type'),
            msg: document.getElementById('ui-message'),
            tooltip: document.getElementById('tooltip'),
            toast: document.getElementById('achievement-toast'),
            
            buildList: document.getElementById('building-list'),
            researchList: document.getElementById('research-list'),
            logList: document.getElementById('log-list'),
            cancelBtn: document.getElementById('btn-cancel-select'),
            
            introScreen: document.getElementById('intro-screen'),
            mapList: document.getElementById('map-list'),
            leaderList: document.getElementById('intro-leader-list'),
            stepMap: document.getElementById('step-map'),
            stepLeader: document.getElementById('step-leader'),
            btnBack: document.getElementById('btn-back-step'),
            btnAction: document.getElementById('btn-intro-action'),
            
            rouletteModal: document.getElementById('roulette-modal'),
            rouletteDisplay: document.getElementById('roulette-display'),
            rouletteResult: document.getElementById('roulette-result'),
            rouletteDesc: document.getElementById('roulette-desc'),
            reportModal: document.getElementById('report-modal'),
            reportDetails: document.getElementById('report-details'),
            
            policyModal: document.getElementById('policy-modal'),
            policyTitle: document.getElementById('policy-title'),
            policyDesc: document.getElementById('policy-desc'),
            policyEffectY: document.getElementById('policy-effect-y'),
            policyEffectN: document.getElementById('policy-effect-n'),
            
            gameoverModal: document.getElementById('gameover-modal'),
            finalScore: document.getElementById('final-score'),
            nextBtn: document.getElementById('btn-next-week') // 연말 정산 버튼
        };
        
        this.init();
    }

    init() {
        this.renderIntroMapSelection();
        window.game = this; // HTML onclick 연결
        
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Escape') this.cancelSelection();
        });
    }

    // --- 인트로 ---
    renderIntroMapSelection() {
        this.ui.mapList.innerHTML = '';
        MAPS.forEach(map => {
            const card = this.createSelectionCard(map, map.effectDesc);
            card.onclick = () => this.selectMap(map, card);
            this.ui.mapList.appendChild(card);
        });
        this.ui.btnAction.innerText = "맵을 선택하세요";
        this.ui.btnAction.onclick = () => this.goToLeaderStep();
        this.ui.btnBack.classList.add('hidden');
    }

    selectMap(map, cardElement) {
        this.selectedMap = map;
        this.highlightCard(cardElement);
        this.ui.btnAction.disabled = false;
        this.ui.btnAction.innerText = "다음 단계로";
    }

    goToLeaderStep() {
        this.ui.stepMap.classList.add('hidden');
        this.ui.stepLeader.classList.remove('hidden');
        this.ui.btnBack.classList.remove('hidden');
        
        this.ui.leaderList.innerHTML = '';
        LEADERS.forEach(leader => {
            const card = this.createSelectionCard(leader, leader.buff);
            card.onclick = () => this.selectLeader(leader, card);
            this.ui.leaderList.appendChild(card);
        });

        this.ui.btnAction.innerText = "리더를 선택하세요";
        this.ui.btnAction.disabled = true;
        this.ui.btnAction.onclick = () => this.startGame();
        
        this.ui.btnBack.onclick = () => {
            this.ui.stepLeader.classList.add('hidden');
            this.ui.stepMap.classList.remove('hidden');
            this.ui.btnBack.classList.add('hidden');
            this.ui.btnAction.innerText = "다음 단계로";
            this.ui.btnAction.onclick = () => this.goToLeaderStep();
        };
    }

    selectLeader(leader, cardElement) {
        this.leader = leader;
        this.highlightCard(cardElement);
        this.ui.btnAction.disabled = false;
        this.ui.btnAction.innerText = "임기 시작하기";
    }

    createSelectionCard(data, subText) {
        const div = document.createElement('div');
        div.className = 'select-card';
        div.innerHTML = `
            <div class="card-icon">${data.icon}</div>
            <div class="card-title">${data.name}</div>
            <div class="card-desc">${data.desc}</div>
            <div class="card-buff">${subText}</div>
        `;
        return div;
    }

    highlightCard(el) {
        document.querySelectorAll('.select-card').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
    }

    startGame() {
        this.ui.introScreen.style.display = 'none';
        document.documentElement.style.setProperty('--map-bg', this.selectedMap.bg);
        this.ui.mapBadge.innerText = this.selectedMap.name;

        this.generateMap();
        this.renderGrid();
        this.updateHUD();
        this.filterBuild('growth');
        this.renderResearch();
        this.bindMainEvents();
        
        this.addLog(`게임 시작! ${this.leader.name} 시장 취임.`);
        this.showMessage(`환영합니다! ${this.leader.buff} 효과가 적용됩니다.`);
    }

    // --- 맵 ---
    generateMap() {
        this.placeBuilding(45, 'town_hall');
        const legacyTypes = ['landfill', 'old_factory', 'flood_house'];
        let placedLegacies = 0;
        while(placedLegacies < 6) {
            let rndIdx = Math.floor(Math.random() * this.gridSize);
            if(this.checkSpace(rndIdx, 1, 1)) {
                let rndType = legacyTypes[Math.floor(Math.random() * legacyTypes.length)];
                this.placeBuilding(rndIdx, rndType);
                placedLegacies++;
            }
        }
        let forestCount = this.selectedMap.id === 'desert' ? 2 : 6;
        let placedForests = 0;
        while(placedForests < forestCount) {
            let rndIdx = Math.floor(Math.random() * this.gridSize);
            if(this.checkSpace(rndIdx, 1, 1)) {
                this.placeBuilding(rndIdx, 'forest');
                placedForests++;
            }
        }
    }

    placeBuilding(idx, id) {
        const b = BUILDINGS.find(x => x.id === id);
        if(b) {
            const instance = { ...b, rootIdx: idx };
            this.setOccupied(idx, b.w, b.h, instance);
        }
    }

    setOccupied(idx, w, h, data) {
        for(let r=0; r<h; r++) {
            for(let c=0; c<w; c++) {
                let targetIdx = idx + (r * 10) + c;
                this.mapData[targetIdx] = data; 
            }
        }
    }

    checkSpace(idx, w, h) {
        const row = Math.floor(idx / 10);
        const col = idx % 10;
        if (col + w > 10 || row + h > 10) return false;
        for(let r=0; r<h; r++) {
            for(let c=0; c<w; c++) {
                let targetIdx = idx + (r * 10) + c;
                if(this.mapData[targetIdx] !== null) return false;
            }
        }
        return true;
    }

    clearSpace(idx) {
        const b = this.mapData[idx];
        if(!b) return;
        const root = b.rootIdx;
        for(let r=0; r<b.h; r++) {
            for(let c=0; c<b.w; c++) {
                let targetIdx = root + (r * 10) + c;
                this.mapData[targetIdx] = null;
            }
        }
    }

    renderGrid() {
        this.ui.grid.innerHTML = '';
        const renderedIndices = new Set();

        for(let i=0; i<this.gridSize; i++) {
            if(renderedIndices.has(i)) continue;
            const b = this.mapData[i];
            const tile = document.createElement('div');
            tile.className = 'tile';
            
            if(b) {
                if(b.rootIdx === i) {
                    tile.innerHTML = `<span>${b.icon}</span>`;
                    tile.setAttribute('data-type', b.type);
                    if(b.w > 1) tile.classList.add('w2');
                    if(b.h > 1) tile.classList.add('h2');
                    tile.style.gridColumn = `span ${b.w}`;
                    tile.style.gridRow = `span ${b.h}`;

                    tile.onmouseenter = (e) => this.showTooltip(e, b);
                    tile.onmousemove = (e) => this.moveTooltip(e);
                    tile.onmouseleave = () => this.hideTooltip();
                    tile.onclick = () => this.handleTileClick(i); 
                    tile.oncontextmenu = (e) => { e.preventDefault(); this.cancelSelection(); };

                    this.ui.grid.appendChild(tile);
                    for(let r=0; r<b.h; r++) {
                        for(let c=0; c<b.w; c++) {
                            renderedIndices.add(i + (r*10) + c);
                        }
                    }
                }
            } else {
                tile.className = 'tile empty';
                tile.onclick = () => this.handleTileClick(i);
                tile.oncontextmenu = (e) => { e.preventDefault(); this.cancelSelection(); };
                this.ui.grid.appendChild(tile);
            }
        }
    }

    handleTileClick(idx) {
        if(this.isProcessing) return; // 정산 중 클릭 방지
        const currentB = this.mapData[idx];

        if (this.selectedBuildingId) {
            if(currentB) {
                if(currentB.id === 'town_hall') { this.showMessage("❌ 시청은 철거 불가!"); return; }
                if(currentB.type === 'legacy') { this.showMessage("⚠️ 오염 유산은 먼저 클릭해서 철거하세요."); return; }
                if(currentB.id === 'forest') { /* 숲 덮어쓰기 가능 */ } 
                else { this.showMessage("❌ 빈 땅에만 건설할 수 있습니다."); return; }
            }
            
            const template = BUILDINGS.find(b => b.id === this.selectedBuildingId);
            if(!this.checkSpace(idx, template.w, template.h)) {
                this.showMessage("❌ 공간이 부족합니다!");
                return;
            }

            let cost = this.calculateCost(template);
            if(this.money < cost) { this.showMessage("💸 자금이 부족합니다!"); return; }
            
            this.build(idx, template, cost);
            return;
        }

        if (currentB && currentB.id !== 'town_hall') {
            const cost = currentB.type === 'legacy' ? currentB.demolishCost : 10;
            if(confirm(`[${currentB.name}] 철거하시겠습니까? (비용: ${cost}억)`)) {
                if(this.money >= cost) {
                    this.money -= cost;
                    this.clearSpace(idx);
                    this.renderGrid();
                    this.updateHUD();
                    this.addLog(`${currentB.name} 철거 (-${cost}억)`, 'bad');
                    this.showMessage("철거되었습니다.");
                } else {
                    alert("철거 자금이 부족합니다.");
                }
            }
        } else if (!currentB) {
            this.showMessage("우측 메뉴에서 건물을 선택하고 땅을 클릭하세요.");
        }
    }

    calculateCost(template) {
        let cost = template.cost;
        if(this.leader.id === 'energy' && template.type === 'energy') {
            cost = Math.floor(cost * 0.8);
        }
        if(this.selectedMap.id === 'desert' && template.id === 'forest') {
            cost = cost * 3; // 사막 숲 비용 증가
        }
        return cost;
    }

    build(idx, template, finalCost) {
        this.money -= finalCost;
        this.clearSpace(idx);
        this.setOccupied(idx, template.w, template.h, { ...template, rootIdx: idx });
        this.renderGrid();
        this.updateHUD();
        this.addLog(`${template.name} 건설 (-${finalCost}억)`);
        this.showMessage(`${template.name} 건설 완료!`);
    }

    // --- 패널 ---
    filterBuild(type) {
        document.querySelectorAll('.sub-tab-btn').forEach(btn => 
            btn.classList.toggle('active', btn.dataset.type === type));

        this.ui.buildList.innerHTML = '';
        const buildable = BUILDINGS.filter(b => b.type !== 'legacy' && b.id !== 'town_hall');

        buildable.forEach(b => {
            if(type !== 'all' && b.type !== type) return;
            const item = document.createElement('div');
            item.className = 'build-item';
            
            let locked = b.reqTech && !this.researched.includes(b.reqTech);
            if(this.selectedBuildingId === b.id) item.classList.add('selected');
            const cost = this.calculateCost(b);
            if(this.money < cost || locked) item.classList.add('disabled');

            let costHtml = cost < b.cost ? `<span class="stat-pos">💰${cost}</span>` : `💰${cost}`;
            let powerTxt = b.power > 0 ? `<span class="stat-pos">⚡+${b.power}</span>` : (b.power < 0 ? `<span class="stat-neg">⚡${b.power}</span>` : '');
            let emitTxt = b.emit > 0 ? `<span class="stat-neg">♨️${b.emit}</span>` : (b.emit < 0 ? `<span class="stat-pos">🌱${Math.abs(b.emit)}</span>` : '');
            let lockHtml = locked ? `<div class="bi-desc stat-neg">🔒 필요: ${RESEARCH.find(r=>r.id===b.reqTech).name}</div>` : `<div class="bi-desc">수익${b.rev} ${emitTxt} ${powerTxt}</div>`;

            item.innerHTML = `
                <div class="bi-icon">${b.icon}</div>
                <div class="bi-info">
                    <div class="bi-name">${b.name}</div>
                    <div class="bi-cost">${locked ? '' : costHtml}</div>
                    ${lockHtml}
                </div>
            `;
            
            item.onclick = () => {
                if(locked) { this.showMessage("🔒 선행 연구가 필요합니다."); return; }
                if(this.money < cost) { this.showMessage("💸 자금이 부족합니다."); return; }
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
            const locked = r.req && !this.researched.includes(r.req);
            
            if(isDone) item.classList.add('done');
            else if(locked || this.money < r.cost) item.classList.add('disabled');

            let status = isDone ? '✅ 개발완료' : (locked ? '🔒 잠김' : `💰 ${r.cost}`);

            item.innerHTML = `
                <div class="bi-icon">${r.icon}</div>
                <div class="bi-info">
                    <div class="bi-name">${r.name}</div>
                    <div class="bi-cost">${status}</div>
                    <div class="bi-desc">${r.desc}</div>
                    ${locked ? `<div class="bi-desc stat-neg">선행: ${RESEARCH.find(x=>x.id===r.req).name}</div>` : ''}
                </div>
            `;
            
            item.onclick = () => {
                if(isDone || locked || this.money < r.cost) return;
                if(confirm(`${r.name} 연구를 진행하시겠습니까? (-${r.cost}억)`)) {
                    this.money -= r.cost;
                    this.researched.push(r.id);
                    this.addLog(`🔬 연구 완료: ${r.name}`, 'good');
                    this.updateHUD();
                    this.renderResearch();
                    if(!document.getElementById('panel-build').classList.contains('hidden')) {
                        const activeTab = document.querySelector('.sub-tab-btn.active');
                        this.filterBuild(activeTab.dataset.type);
                    }
                }
            };
            this.ui.researchList.appendChild(item);
        });
    }

    selectBuilding(id) {
        this.selectedBuildingId = id;
        this.ui.cancelBtn.classList.remove('hidden');
        this.showMessage(`${BUILDINGS.find(b=>b.id===id).name} 선택됨. 맵을 클릭하세요.`);
        const b = BUILDINGS.find(x=>x.id===id);
        this.filterBuild(b.type);
    }

    cancelSelection() {
        this.selectedBuildingId = null;
        this.ui.cancelBtn.classList.add('hidden');
        this.showMessage("선택 취소");
        const activeTab = document.querySelector('.sub-tab-btn.active');
        if(activeTab) this.filterBuild(activeTab.dataset.type);
    }

    switchMainTab(tab) {
        ['panel-build', 'panel-research', 'panel-log'].forEach(id => document.getElementById(id).classList.add('hidden'));
        document.getElementById(`panel-${tab}`).classList.remove('hidden');
        document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
        if(event) event.target.classList.add('active');
    }

    // --- 연말 정산 ---
    nextYear() {
        if(this.year > GAME_CONFIG.MAX_YEARS || this.isProcessing) return;
        
        this.isProcessing = true; // 중복 클릭 방지
        this.ui.nextBtn.disabled = true;
        this.ui.nextBtn.innerText = "정산 중...";

        this.ui.rouletteModal.classList.remove('hidden');
        this.ui.rouletteDisplay.classList.remove('hidden');
        this.ui.rouletteResult.classList.add('hidden');
        
        let count = 0;
        const interval = setInterval(() => {
            const rndEvt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
            this.ui.rouletteDisplay.innerText = `🎲 ${rndEvt.name}...`;
            count++;
            if(count > 15) { 
                clearInterval(interval);
                const finalEvt = EVENTS[Math.floor(Math.random() * EVENTS.length)];
                this.calculateYear(finalEvt);
            }
        }, 80);
    }

    calculateYear(evt) {
        let totalRev=0, totalExp=0, baseEmit=0, totalPower=0;
        
        this.mapData.forEach((b, i) => {
            if(b && b.rootIdx === i) {
                let rev = b.rev;
                if(this.leader.id === 'economy') rev = Math.floor(rev * 1.15);
                if(this.selectedMap.id === 'port' && b.type === 'growth') rev = Math.floor(rev * 1.2);
                
                let power = b.power;
                if(this.selectedMap.id === 'desert' && b.id === 'solar') power = Math.floor(power * 1.5);

                totalRev += rev;
                totalExp += b.exp;
                baseEmit += b.emit;
                totalPower += power;
            }
        });

        // 스모그 효과
        let smogPenalty = 0;
        for(let i=0; i<this.gridSize; i++) {
            const b = this.mapData[i];
            if(b && b.emit > 0 && b.rootIdx === i) {
                const neighbors = [i-1, i+1, i-10, i+10];
                neighbors.forEach(nIdx => {
                    if(i%10 === 0 && nIdx === i-1) return;
                    if(i%10 === 9 && nIdx === i+1) return;
                    if(nIdx >= 0 && nIdx < 100) {
                        const neighbor = this.mapData[nIdx];
                        if(neighbor && neighbor.emit > 0 && neighbor.rootIdx !== i) {
                            smogPenalty += 2; 
                        }
                    }
                });
            }
        }
        let totalEmit = baseEmit + smogPenalty;

        // 전력 패널티
        if(totalPower < 0) {
            const pCost = Math.abs(totalPower) * 5;
            totalExp += pCost;
            this.addLog(`⚡ 전력부족! 비상발전비용 -${pCost}억`, 'bad');
        }

        const netEmit = Math.max(0, totalEmit);
        let tax = Math.floor(netEmit * this.taxRate);
        if(this.leader.id === 'climate') tax = Math.floor(tax * 0.5);

        // 이벤트 적용
        let tempState = { money: this.money, rep: this.rep, res: 0, weekEmit: netEmit, weekPower: totalPower };
        const evtResult = evt.effect(tempState);
        let evtMoneyDiff = tempState.money - this.money;
        
        // 항구 맵 태풍 2배
        if(this.selectedMap.id === 'port' && evt.name.includes('태풍')) {
            evtMoneyDiff *= 2; 
        }
        this.addLog(`🔔 ${evt.name}: ${evtResult}`);

        // 최종 계산
        const netProfit = totalRev - totalExp - tax + evtMoneyDiff;
        this.money += netProfit;

        // 결과창 표시
        this.ui.rouletteDisplay.classList.add('hidden');
        this.ui.rouletteResult.classList.remove('hidden');
        this.ui.rouletteDesc.innerHTML = `
            <h3 style="color:#00cec9">${evt.name}</h3>
            <p>${evtResult}</p>
            ${this.selectedMap.id==='port' && evt.name.includes('태풍') ? '<p class="stat-neg">(항구 특성: 피해 2배)</p>' : ''}
            <hr style="border-color:#555; margin:10px 0;">
            <div style="font-size:0.9rem; text-align:left; padding-left:20px;">
                <p>📈 매출: +${totalRev}</p>
                <p>📉 유지비: -${totalExp}</p>
                <p>🏛️ 탄소세: -${tax} (배출 ${netEmit}t)</p>
                ${smogPenalty>0 ? `<p class="stat-neg">⚠️ 스모그 패널티: 탄소 +${smogPenalty}t</p>` : ''}
            </div>
            <h2 style="color:${netProfit>=0?'#2ecc71':'#e74c3c'}">최종 손익: ${netProfit > 0 ? '+' : ''}${netProfit}억</h2>
        `;
        
        this.checkAchievements(netEmit);
    }

    finishYear() {
        this.ui.rouletteModal.classList.add('hidden');
        this.isProcessing = false;
        this.ui.nextBtn.disabled = false;
        this.ui.nextBtn.innerText = "📅 연말 정산";

        if(this.money < 0) {
            this.ui.finalScore.innerText = `${this.year}년차 파산 (최종 부채 ${this.money}억)`;
            this.ui.gameoverModal.classList.remove('hidden');
            return;
        }

        // 정책 트리거 (3년마다)
        if(this.year % GAME_CONFIG.POLICY_INTERVAL === 0) {
            this.triggerPolicy();
            return;
        }

        this.resumeYear();
    }

    triggerPolicy() {
        const policyIdx = (this.year / GAME_CONFIG.POLICY_INTERVAL) - 1;
        if(policyIdx >= POLICIES.length) { this.resumeYear(); return; }

        const p = POLICIES[policyIdx];
        this.currentPolicy = p;

        this.ui.policyTitle.innerText = p.title;
        this.ui.policyDesc.innerText = p.desc;
        this.ui.policyEffectY.innerText = `비용 ${p.y.cost}억 | ${p.y.msg}`;
        this.ui.policyEffectN.innerText = `비용 ${p.n.cost}억 | ${p.n.msg}`;
        
        this.ui.policyModal.classList.remove('hidden');
    }

    decidePolicy(isApprove) {
        const p = this.currentPolicy;
        const choice = isApprove ? p.y : p.n;
        
        if(this.money < choice.cost) { alert("시행 예산이 부족합니다!"); return; }

        this.money -= choice.cost;
        if(choice.bonusMoney) this.money += choice.bonusMoney;
        this.rep += choice.rep;
        // 영구적 효과는 MVP에서 생략하거나 리포트용 전역변수에 저장 가능
        
        this.addLog(`📜 정책 [${p.title}] - ${choice.label}`, 'good');
        this.ui.policyModal.classList.add('hidden');
        this.resumeYear();
    }

    resumeYear() {
        this.year++;
        if(this.year > GAME_CONFIG.MAX_YEARS) {
            alert(`🎉 축하합니다! 15년 임기를 성공적으로 마쳤습니다.\n최종 자금: ${this.money}억`);
            location.reload();
            return;
        }
        if(this.year % 5 === 1) {
            this.taxRate += 1;
            this.addLog(`📢 탄소세율 인상 (x${this.taxRate})`, 'bad');
            this.showMessage("탄소세율이 인상되었습니다!");
        }
        this.updateHUD();
        this.addLog(`📅 ${this.year}년이 시작되었습니다.`);
    }

    checkAchievements(currentEmit) {
        if(!ACHIEVEMENTS) return;
        ACHIEVEMENTS.forEach(ach => {
            if(this.achieved.has(ach.id)) return;
            let unlocked = false;
            
            if(ach.id === 'money_maker' && this.money >= 1000) unlocked = true;
            if(ach.id === 'net_zero' && currentEmit <= 0) unlocked = true;
            
            if(ach.id === 'solar_king') {
                const count = this.mapData.filter(b => b && b.id === 'solar').length;
                if(count >= 5) unlocked = true;
            }
            if(ach.id === 'forest_city') {
                const count = this.mapData.filter(b => b && b.id === 'park').length;
                if(count >= 5) unlocked = true;
            }

            if(unlocked) {
                this.achieved.add(ach.id);
                this.money += ach.reward;
                this.showToast(ach);
                this.addLog(`🏆 업적 달성: ${ach.title} (+${ach.reward}억)`, 'good');
            }
        });
    }

    showToast(ach) {
        const t = this.ui.toast;
        t.querySelector('h4').innerText = ach.title;
        t.querySelector('p').innerText = ach.desc;
        t.classList.remove('hidden');
        setTimeout(() => t.classList.add('hidden'), 3000);
    }

    // --- 유틸 ---
    showTooltip(e, b) {
        if(!b) return;
        let html = `<h4>${b.icon} ${b.name}</h4>`;
        if(b.type === 'legacy') html += `<div style="color:#ff7675">⚠️ 오염 유산</div><div>철거비: 💰${b.demolishCost}</div>`;
        else if(b.id !== 'forest') html += `<div>수익: +${b.rev} | 유지: -${b.exp}</div>`;
        
        if(b.emit !== 0) html += `<div>탄소: ${b.emit > 0 ? `<span class="stat-neg">+${b.emit}t</span>` : `<span class="stat-pos">${b.emit}t</span>`}</div>`;
        if(b.power !== 0) html += `<div>전력: ${b.power > 0 ? `<span class="stat-pos">+${b.power}</span>` : `<span class="stat-neg">${b.power}</span>`}</div>`;
        
        if(b.id === 'data_center') html += `<div class="synergy">Tip: 스마트그리드 연구 시 효율↑</div>`;
        
        this.ui.tooltip.innerHTML = html;
        this.ui.tooltip.classList.remove('hidden');
        this.moveTooltip(e);
    }
    moveTooltip(e) { this.ui.tooltip.style.left = (e.pageX+15)+'px'; this.ui.tooltip.style.top = (e.pageY+15)+'px'; }
    hideTooltip() { this.ui.tooltip.classList.add('hidden'); }

    updateHUD() {
        this.ui.money.innerText = this.money;
        this.ui.year.innerText = this.year;
        let e=0, p=0;
        this.mapData.forEach((b, i) => { 
            if(b && b.rootIdx === i) { e+=b.emit; p+=b.power; } 
        });
        this.ui.emit.innerText = `${e}t`;
        this.ui.infra.innerText = p;
        this.ui.infra.style.color = p<0 ? '#ff7675' : '#55efc4';
        this.ui.rep.innerText = this.rep;
    }

    addLog(msg, type='normal') {
        const d = document.createElement('div');
        d.className = `log-item ${type}`;
        d.innerHTML = `<span>Y${this.year}</span> ${msg}`;
        this.ui.logList.prepend(d);
    }
    
    showMessage(t) { 
        this.ui.msg.innerText = t; 
        this.ui.msg.style.animation = 'none';
        this.ui.msg.offsetHeight; 
        this.ui.msg.style.animation = 'pulse 0.5s';
    }

    bindMainEvents() {
        this.ui.nextBtn.onclick = () => this.nextYear();
    }
}

new TycoonGame();
