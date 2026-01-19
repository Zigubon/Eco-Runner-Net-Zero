import { CONFIG, TILES, ASSETS, TECH_UPGRADES, OFFSETS } from './data.js';

class Game {
    constructor() {
        // [State] 플레이어 상태
        this.turn = 1;
        this.pos = 0;
        this.money = CONFIG.START_MONEY;
        this.carbonScore = 0;
        this.reputation = 0;
        this.carbonTaxRate = CONFIG.BASE_TAX_RATE;
        this.assets = []; // { id, level, ...stats }
        
        // Flags
        this.flags = {
            reported: false, // 보고 여부
            insurance: false // 보험 여부
        };

        // UI Elements
        this.ui = {
            board: document.getElementById('board'),
            log: document.getElementById('game-log'),
            modal: document.getElementById('action-modal'),
            modalOpts: document.getElementById('modal-options'),
            rollBtn: document.getElementById('roll-btn')
        };

        this.init();
    }

    init() {
        this.renderBoard();
        this.updateDashboard();
        this.log("🚀 게임 시작! 12분기 동안 기업을 생존시키세요.");
        
        this.ui.rollBtn.onclick = () => this.phaseMove();
    }

    // --- 1. 보드 렌더링 (CSS Grid 배치) ---
    renderBoard() {
        // 중앙 영역 보존
        const center = document.querySelector('.center-area');
        this.ui.board.innerHTML = '';
        this.ui.board.appendChild(center);

        TILES.forEach((tile, idx) => {
            const el = document.createElement('div');
            el.className = `tile ${tile.type}`;
            el.innerHTML = `<div>${tile.name}</div>`;
            el.id = `tile-${idx}`;
            
            // 30칸 루프 좌표 계산 (9x7 테두리)
            // 상단(0~8), 우측(9~14), 하단(15~23), 좌측(24~29)
            if (idx <= 8) { el.style.gridRow = 1; el.style.gridColumn = idx + 1; }
            else if (idx <= 14) { el.style.gridRow = idx - 7; el.style.gridColumn = 9; }
            else if (idx <= 23) { el.style.gridRow = 7; el.style.gridColumn = 9 - (idx - 15); }
            else { el.style.gridRow = 7 - (idx - 23); el.style.gridColumn = 1; }

            if (idx === 0) this.spawnToken(el);
            this.ui.board.appendChild(el);
        });
    }

    spawnToken(parent) {
        const token = document.createElement('div');
        token.className = 'player-token';
        token.id = 'p-token';
        parent.appendChild(token);
    }

    // --- 2. Phase 1: 이동 (Move) ---
    phaseMove() {
        this.ui.rollBtn.disabled = true;
        const dice = Math.floor(Math.random() * 6) + 1;
        document.getElementById('dice-val').innerText = `🎲 ${dice}`;
        
        // 이동 로직
        let nextPos = (this.pos + dice);
        if (nextPos >= TILES.length) {
            nextPos %= TILES.length;
            this.passStart(); // 한 바퀴 돔
        }
        this.pos = nextPos;

        // 토큰 이동 시각화
        const targetTile = document.getElementById(`tile-${this.pos}`);
        targetTile.appendChild(document.getElementById('p-token'));

        setTimeout(() => this.phaseTileEffect(), 500);
    }

    passStart() {
        this.log("🔄 한 바퀴 완주! (특별 보너스는 없음, 정산은 매 턴 진행)");
    }

    // --- 3. Phase 2: 타일 효과 (Encounter) ---
    phaseTileEffect() {
        const tile = TILES[this.pos];
        this.log(`📍 [${tile.name}] 도착`);

        // 타일별 기본 이벤트 처리
        if (tile.type === 'start') {
            this.phaseAction(2); // 바로 액션 단계로
        } else if (tile.type === 'market' && tile.assetId) {
            // 자산 구매 기회
            this.showModal(`사업 확장 기회: ${tile.name}`, `매입하시겠습니까?`, [
                { text: `매입 (비용 ${ASSETS[tile.assetId].cost})`, cb: () => this.buyAsset(tile.assetId) },
                { text: '패스', cb: () => this.phaseAction(2) }
            ]);
        } else if (tile.type === 'event') {
            this.triggerRandomEvent();
        } else if (tile.type === 'reg') {
            this.triggerAudit();
        } else {
            // Tech, Offset, Finance 등은 액션 단계에서 선택 가능하도록 유도
            this.phaseAction(2);
        }
    }

    // --- 4. Phase 3: 경영 액션 (Management) ---
    // ap: Action Point (기본 2회)
    phaseAction(ap) {
        if (ap <= 0) {
            this.phaseSettlement();
            return;
        }

        this.showModal(`경영 액션 선택 (남은 횟수: ${ap})`, "이번 분기에 무엇을 하시겠습니까?", [
            { text: '🛠️ 기술 투자 (업그레이드)', cb: () => this.openTechMenu(ap) },
            { text: '🌳 탄소 상쇄 구매', cb: () => this.openOffsetMenu(ap) },
            { text: '📄 ESG 보고서 제출', cb: () => { 
                this.flags.reported = true; 
                this.log("✅ ESG 보고서를 제출했습니다. (규제 방어)");
                this.updateDashboard();
                this.phaseAction(ap - 1);
            }},
            { text: '🛡️ 보험 가입 (비용 5)', cb: () => {
                if(this.money >= 5) {
                    this.money -= 5;
                    this.flags.insurance = true;
                    this.log("🛡️ 재난 보험에 가입했습니다.");
                    this.updateDashboard();
                    this.phaseAction(ap - 1);
                } else this.log("❌ 자금이 부족합니다.");
            }},
            { text: '⏩ 턴 종료', cb: () => this.phaseSettlement() }
        ]);
    }

    // 액션: 자산 구매
    buyAsset(assetId) {
        const data = ASSETS[assetId];
        if (this.money >= data.cost) {
            this.money -= data.cost;
            // 자산 추가 (고유 ID 생성)
            this.assets.push({ ...data, id: Date.now(), level: 0 });
            this.log(`🎉 [${data.name}] 인수 완료!`);
            this.updateDashboard();
            this.phaseAction(1); // 구매 후 액션 1회 남음
        } else {
            this.log("❌ 자금이 부족하여 인수 포기.");
            this.phaseAction(2);
        }
    }

    // 액션: 기술 메뉴
    openTechMenu(ap) {
        if (this.assets.length === 0) {
            this.log("⚠️ 보유 자산이 없어 업그레이드할 수 없습니다.");
            this.phaseAction(ap);
            return;
        }
        
        const opts = this.assets.map(asset => ({
            text: `${asset.name} 개량`,
            cb: () => this.showUpgradeOptions(asset, ap)
        }));
        opts.push({ text: '취소', cb: () => this.phaseAction(ap) });
        this.showModal("기술 투자 대상 선택", "어떤 사업장을 개선합니까?", opts);
    }

    showUpgradeOptions(asset, ap) {
        const opts = TECH_UPGRADES.map(tech => ({
            text: `${tech.name} (비용 ${tech.cost}) : ${tech.desc}`,
            cb: () => {
                if(this.money >= tech.cost) {
                    this.money -= tech.cost;
                    this.applyUpgrade(asset, tech);
                    this.phaseAction(ap - 1);
                } else this.log("❌ 자금이 부족합니다.");
            }
        }));
        this.showModal(`${asset.name} 업그레이드`, "기술을 선택하세요", opts);
    }

    applyUpgrade(asset, tech) {
        // 단순화된 로직: 효과 파싱
        if(tech.id === 'eff') { asset.exp -= 1; asset.emit -= 1; }
        if(tech.id === 'scale') { asset.rev += 3; asset.emit += 2; }
        if(tech.id === 'green') { asset.emit -= 3; }
        
        // Min check
        asset.exp = Math.max(1, asset.exp);
        asset.emit = Math.max(0, asset.emit);
        
        this.log(`🛠️ ${asset.name}에 [${tech.name}] 적용 완료!`);
        this.updateDashboard();
    }

    // 액션: 상쇄 메뉴
    openOffsetMenu(ap) {
        const opts = OFFSETS.map(off => ({
            text: `${off.name} (비용 ${off.cost}) : ${off.desc}`,
            cb: () => {
                if(this.money >= off.cost) {
                    this.money -= off.cost;
                    // 상쇄 로직: 확률 체크
                    if (Math.random() > off.risk) {
                        this.carbonScore -= off.reduce;
                        if(off.rep) this.reputation += off.rep;
                        this.log(`🌳 ${off.name} 구매 성공! 탄소 -${off.reduce}`);
                    } else {
                        this.log(`⚠️ ${off.name} 구매했으나 품질 이슈로 무효화되었습니다!`);
                        this.reputation -= 1;
                    }
                    this.updateDashboard();
                    this.phaseAction(ap - 1);
                } else this.log("❌ 자금이 부족합니다.");
            }
        }));
        opts.push({ text: '취소', cb: () => this.phaseAction(ap) });
        this.showModal("탄소 상쇄 크레딧 구매", "리스크를 고려해 선택하세요", opts);
    }

    // 이벤트: 감사(Audit)
    triggerAudit() {
        this.log("👮 규제 당국의 불시 감사가 들이닥쳤습니다!");
        if (this.flags.reported) {
            this.log("✅ 사전 보고를 완료하여 무사히 통과했습니다. (평판 +1)");
            this.reputation += 1;
        } else {
            this.log("🚨 보고서 미제출 적발! 과태료 5억 부과.");
            this.money -= 5;
            this.reputation -= 1;
        }
        this.updateDashboard();
        this.phaseAction(2);
    }

    // 이벤트: 랜덤
    triggerRandomEvent() {
        const evts = [
            { msg: "🔥 공장 화재 발생!", act: () => { 
                if(this.flags.insurance) this.log("🛡️ 보험으로 피해를 막았습니다.");
                else { this.money -= 5; this.log("💸 복구 비용 5억 지출."); }
            }},
            { msg: "🌊 홍수 피해!", act: () => { 
                // 자산 중 하나 탄소배출 일시 증가
                if(this.assets.length > 0) {
                    this.assets[0].emit += 2;
                    this.log(`🌊 침수로 인해 ${this.assets[0].name} 효율 저하.`);
                }
            }},
            { msg: "💰 친환경 보조금 당첨!", act: () => { this.money += 8; this.log("💵 보조금 8억 수령!"); } }
        ];
        const e = evts[Math.floor(Math.random() * evts.length)];
        this.log(`❗ 이벤트: ${e.msg}`);
        e.act();
        this.updateDashboard();
        this.phaseAction(2);
    }

    // --- 5. Phase 4: 정산 (Settlement) ---
    phaseSettlement() {
        this.log("==== 💰 분기 결산 ====");
        
        // 1. 사업 수익/비용
        let totalRev = 0;
        let totalExp = 0;
        let totalEmit = 0;
        
        this.assets.forEach(a => {
            totalRev += a.rev;
            totalExp += a.exp;
            totalEmit += a.emit;
        });

        const opProfit = totalRev - totalExp;
        this.money += opProfit;
        this.carbonScore += totalEmit; // 누적 탄소

        this.log(`📈 영업이익: +${opProfit}억 (매출 ${totalRev} - 비용 ${totalExp})`);
        
        // 2. 탄소세 계산
        // 탄소점수는 이번 턴 배출량만큼 오르고, 세금 낸 후 일부 초기화되거나 누적됨.
        // 여기선 '이번 턴 발생분'에 대해 세금을 매기고, 탄소점수는 '누적 배출량'으로 관리한다고 가정.
        // 하지만 게임적 허용으로 carbonScore를 '세금 부과 대상'으로 보고 세금 내면 0으로 리셋하는게 캐주얼함.
        
        let tax = Math.max(0, this.carbonScore * this.carbonTaxRate);
        this.money -= tax;
        this.log(`📉 탄소세 납부: -${tax}억 (배출 ${this.carbonScore} * 세율 ${this.carbonTaxRate})`);
        
        // 리셋 및 변동
        this.carbonScore = 0; // 세금 냈으니 이번 분기 배출 리셋
        this.flags.reported = false; // 보고 초기화
        this.flags.insurance = false; // 보험 만료
        this.carbonTaxRate += 0.2; // 세율 증가 (정책 강화)

        // 3. 턴 종료 체크
        if (this.turn >= CONFIG.MAX_TURN) {
            this.endGame();
        } else {
            this.turn++;
            this.updateDashboard();
            this.ui.rollBtn.disabled = false;
            this.log(`📅 ${this.turn}분기가 시작되었습니다.`);
        }
    }

    endGame() {
        // 최종 점수 계산
        let assetVal = this.assets.reduce((acc, cur) => acc + cur.cost, 0);
        let finalScore = this.money + assetVal + (this.reputation * 5);
        
        let grade = 'C';
        if (finalScore >= 300) grade = 'S (그린 유니콘)';
        else if (finalScore >= 200) grade = 'A (ESG 우수)';
        else if (finalScore >= 100) grade = 'B (평범)';
        else grade = 'D (파산 위기)';

        alert(`🏁 게임 종료!\n\n등급: ${grade}\n최종 점수: ${finalScore}\n(현금 ${this.money} + 자산 ${assetVal} + 평판보너스)`);
        location.reload();
    }

    // --- UI Helpers ---
    updateDashboard() {
        document.getElementById('d-money').innerText = Math.floor(this.money);
        document.getElementById('d-carbon').innerText = this.carbonScore;
        document.getElementById('d-rep').innerText = this.reputation;
        document.getElementById('d-rate').innerText = `x${this.carbonTaxRate.toFixed(1)}`;
        document.getElementById('turn-display').innerText = this.turn;
        
        const flagRep = document.getElementById('flag-report');
        flagRep.className = this.flags.reported ? 'badge active' : 'badge';
        flagRep.innerText = this.flags.reported ? '📄 보고완료' : '📄 미보고';

        const flagIns = document.getElementById('flag-insurance');
        flagIns.className = this.flags.insurance ? 'badge active' : 'badge';
        flagIns.innerText = this.flags.insurance ? '🛡️ 보험가입' : '🛡️ 미가입';

        // 자산 리스트
        const ul = document.getElementById('asset-ul');
        ul.innerHTML = '';
        this.assets.forEach(a => {
            const li = document.createElement('li');
            li.className = 'asset-item';
            li.innerHTML = `<span>${a.name}</span><span>Rev ${a.rev}/Emit ${a.emit}</span>`;
            ul.appendChild(li);
        });
    }

    log(msg) {
        const p = document.createElement('div');
        p.innerText = msg;
        p.style.marginBottom = "4px";
        this.ui.log.prepend(p);
    }

    showModal(title, desc, options) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-desc').innerText = desc;
        this.ui.modalOpts.innerHTML = '';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'btn-opt';
            btn.innerHTML = opt.text.replace(/\n/g, '<br>');
            btn.onclick = () => {
                this.closeModal();
                opt.cb();
            };
            this.ui.modalOpts.appendChild(btn);
        });
        
        this.ui.modal.classList.remove('hidden');
    }

    closeModal() {
        this.ui.modal.classList.add('hidden');
    }
}

new Game();
