/**
 * [2026-01-23] Eco Runner Game Engine (Updated)
 * - 나무 색상 초록색 강제 적용
 * - 일시정지/종료 기능 추가
 * - 장애물/아이템 겹침 방지 (스마트 스폰 시스템)
 */

import { CONFIG, OBSTACLES, ITEMS, UPGRADES, Logger } from './data.js';

// === Storage & UI Manager ===
class StorageManager {
    static save(data) { try { localStorage.setItem('ecoRunnerData', JSON.stringify(data)); } catch(e){} }
    static load() {
        try {
            const data = localStorage.getItem('ecoRunnerData');
            return data ? JSON.parse(data) : { coins: 0, upgrades: {} };
        } catch (e) { return { coins: 0, upgrades: {} }; }
    }
}

class UIManager {
    constructor() {
        this.elements = {
            intro: document.getElementById('ui-intro'),
            hud: document.getElementById('ui-hud'),
            pause: document.getElementById('ui-pause'), // 일시정지 화면
            gameover: document.getElementById('ui-gameover'),
            shop: document.getElementById('ui-shop'),
            score: document.getElementById('score-value'),
            coin: document.getElementById('coin-value'),
            co2Bar: document.getElementById('co2-bar'),
            finalScore: document.getElementById('final-score'),
            finalCoins: document.getElementById('final-coins'),
            shopCoins: document.getElementById('shop-coin-display'),
            shopContainer: document.getElementById('shop-items-container')
        };
    }

    showScreen(name) {
        // 모든 스크린 숨김
        Object.values(this.elements).forEach(el => {
            if (el) {
                el.classList.add('hidden');
                el.classList.remove('active');
            }
        });
        
        // 특정 스크린만 보임
        if (this.elements[name]) {
            this.elements[name].classList.remove('hidden');
            this.elements[name].classList.add('active');
        }

        // HUD는 게임 중(일시정지 포함)에는 항상 배경에 깔려있어야 함
        if (name === 'pause' && this.elements.hud) {
            this.elements.hud.classList.remove('hidden');
        }
    }

    updateHUD(score, coins, co2) {
        if(this.elements.score) this.elements.score.textContent = Math.floor(score);
        if(this.elements.coin) this.elements.coin.textContent = coins;
        if(this.elements.co2Bar) {
            const safeCo2 = isNaN(co2) ? 0 : Math.min(Math.max(co2, 0), 100);
            this.elements.co2Bar.style.width = `${safeCo2}%`;
            this.elements.co2Bar.style.backgroundColor = safeCo2 > 80 ? '#e74c3c' : (safeCo2 > 50 ? '#f39c12' : '#2ecc71');
        }
    }

    showToast(message) {
        const container = document.getElementById('toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }
    
    renderShop(playerData, buyCallback) {
        if(!this.elements.shopCoins) return;
        this.elements.shopCoins.textContent = playerData.coins;
        this.elements.shopContainer.innerHTML = '';

        UPGRADES.forEach(item => {
            const currentLevel = (playerData.upgrades && playerData.upgrades[item.id]) || 0;
            const cost = item.baseCost * (currentLevel + 1);
            const isMax = currentLevel >= item.maxLevel;

            const div = document.createElement('div');
            div.className = `shop-item ${isMax ? 'locked' : ''}`;
            div.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.desc}</p>
                <p>Lv. ${currentLevel} / ${item.maxLevel}</p>
                <button class="btn primary small">${isMax ? 'MAX' : cost + ' EP'}</button>
            `;
            div.onclick = () => {
                if (!isMax && playerData.coins >= cost) buyCallback(item.id, cost);
            };
            this.elements.shopContainer.appendChild(div);
        });
    }
}

// === Player Class ===
class Player {
    constructor(canvasHeight, upgrades) {
        this.width = 44; 
        this.height = 44;
        this.x = 50; 
        const safeHeight = Math.max(canvasHeight, 200);
        this.groundY = safeHeight - 100 - this.height; 
        this.y = this.groundY;
        this.dy = 0;
        this.isJumping = false;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.color = '#2ecc71'; 
        this.upgrades = upgrades || {};
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.dy = this.jumpCount === 0 ? CONFIG.JUMP_FORCE : CONFIG.DOUBLE_JUMP_FORCE;
            this.isJumping = true;
            this.jumpCount++;
        }
    }

    update(canvasHeight) {
        if (canvasHeight) {
             const safeHeight = Math.max(canvasHeight, 200);
             this.groundY = safeHeight - 100 - this.height;
        }

        this.dy += CONFIG.GRAVITY;
        this.y += this.dy;

        if (this.y > this.groundY) {
            this.y = this.groundY;
            this.dy = 0;
            this.isJumping = false;
            this.jumpCount = 0;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 눈 (방향 표시)
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 24, this.y + 10, 12, 12);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 30, this.y + 12, 6, 6);
    }
}

// === GameObject Class ===
class GameObject {
    constructor(def, canvasWidth, canvasHeight) {
        this.def = def;
        this.x = canvasWidth;
        this.width = def.width || 30;
        this.height = def.height || 30;
        this.markedForDeletion = false;
        this.collisionProcessed = false;

        if (def.yPos === 'air') {
            this.y = canvasHeight - 220 - Math.random() * 80;
        } else if (def.yPos === 'ground' || !def.yPos) {
            this.y = canvasHeight - 100 - this.height;
        } else {
            this.y = canvasHeight - 150 - Math.random() * 150;
        }
    }

    update(speed) {
        this.x -= speed;
        if (this.x + this.width < 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        // [수정 1] 나무 색상 버그 해결
        // 만약 def.color가 지정되어 있으면 그것을 쓰고, 없으면 기본값
        // 여기서 명시적으로 fillStyle을 설정해서 검정색으로 나오는 문제 방지
        ctx.fillStyle = this.def.color || '#2ecc71'; 

        if (this.def.score || this.def.currency) {
            // 아이템 (원형)
            ctx.beginPath();
            const cx = this.x + this.width/2;
            const cy = this.y + this.height/2;
            ctx.arc(cx, cy, this.width/2, 0, Math.PI * 2);
            ctx.fill(); // 위에서 설정한 fillStyle로 채움
        } else {
            // 장애물 (사각형)
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// === Main Game Class ===
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = new UIManager();
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.state = 'INTRO'; // INTRO, PLAYING, PAUSED, GAMEOVER
        this.isPaused = false;
        this.userData = StorageManager.load();
        
        this.reset();
        this.bindEvents();
        
        this.lastTime = performance.now();
        requestAnimationFrame(this.animate.bind(this));
    }

    resize() {
        const container = this.canvas.parentElement;
        if (container && container.clientWidth > 0 && container.clientHeight > 0) {
            this.width = this.canvas.width = container.clientWidth;
            this.height = this.canvas.height = container.clientHeight;
        } else {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        }
    }

    reset() {
        this.player = new Player(this.height, this.userData.upgrades);
        this.obstacles = [];
        this.items = [];
        this.score = 0;
        this.gameSpeed = CONFIG.GAME_SPEED_START;
        this.co2Level = 0;
        this.sessionCoins = 0;
        
        // [수정 3] 겹침 방지를 위한 스폰 쿨타임 시스템
        this.spawnTimer = 0; 
        
        const techLevel = (this.userData.upgrades && this.userData.upgrades.tech) || 0;
        this.passiveCo2Reduction = techLevel * 0.01;
    }

    bindEvents() {
        // 키보드 입력
        window.addEventListener('keydown', (e) => {
            if (this.state === 'PLAYING' && !this.isPaused) {
                if (e.code === 'Space' || e.code === 'ArrowUp') {
                    e.preventDefault();
                    this.player.jump();
                }
            }
            if (e.code === 'Escape' && this.state === 'PLAYING') {
                this.togglePause();
            }
        });

        // 마우스/터치 점프
        const jumpAction = (e) => {
            // HUD나 버튼 클릭은 제외
            if (e.target.tagName === 'BUTTON' || e.target.closest('.icon-btn')) return;

            if (this.state === 'PLAYING' && !this.isPaused) {
                e.preventDefault();
                this.player.jump();
            }
        };
        this.canvas.addEventListener('mousedown', jumpAction);
        this.canvas.addEventListener('touchstart', jumpAction, { passive: false });

        // 버튼 이벤트 바인딩 함수
        const safeBind = (id, fn) => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('click', fn);
        };

        safeBind('btn-start', () => this.startGame());
        safeBind('btn-restart', () => this.startGame());
        safeBind('btn-home', () => this.goHome());
        
        // [수정 2] 일시정지 관련 버튼 연결
        safeBind('btn-pause', () => this.togglePause());
        safeBind('btn-resume', () => this.togglePause()); // 계속하기
        safeBind('btn-quit', () => this.goHome()); // 종료하고 메인으로

        safeBind('btn-shop', () => {
            this.ui.showScreen('shop');
            this.ui.renderShop(this.userData, (id, cost) => this.buyUpgrade(id, cost));
        });
        safeBind('btn-close-shop', () => this.goHome());
    }

    togglePause() {
        if (this.state !== 'PLAYING' && this.state !== 'PAUSED') return;

        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.state = 'PAUSED';
            this.ui.showScreen('pause');
        } else {
            this.state = 'PLAYING';
            this.ui.showScreen('hud');
        }
    }

    startGame() {
        this.resize();
        this.reset();
        this.state = 'PLAYING';
        this.isPaused = false;
        this.ui.showScreen('hud');
    }

    goHome() {
        this.state = 'INTRO';
        this.isPaused = false;
        this.ui.showScreen('intro');
    }

    buyUpgrade(id, cost) {
        if (!this.userData.upgrades) this.userData.upgrades = {};
        this.userData.coins -= cost;
        this.userData.upgrades[id] = (this.userData.upgrades[id] || 0) + 1;
        StorageManager.save(this.userData);
        this.ui.renderShop(this.userData, (i, c) => this.buyUpgrade(i, c));
        this.ui.showToast('업그레이드 완료!');
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.userData.coins += this.sessionCoins;
        StorageManager.save(this.userData);
        
        const finalScoreEl = document.getElementById('final-score');
        const finalCoinsEl = document.getElementById('final-coins');
        if(finalScoreEl) finalScoreEl.textContent = Math.floor(this.score);
        if(finalCoinsEl) finalCoinsEl.textContent = this.sessionCoins;
        
        this.ui.showScreen('gameover');
    }

    spawnObjects() {
        // [수정 3] 스마트 스폰 시스템 (겹침 방지)
        // 쿨타임이 0이 될 때까지 대기
        if (this.spawnTimer > 0) {
            this.spawnTimer--;
            return;
        }

        // 무엇을 소환할지 결정 (랜덤)
        // 장애물 확률 60%, 아이템 확률 40%
        const isObstacle = Math.random() < 0.6;

        if (isObstacle) {
            if (OBSTACLES.length > 0) {
                const def = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
                this.obstacles.push(new GameObject(def, this.width, this.height));
            }
        } else {
            if (ITEMS.length > 0) {
                const def = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                this.items.push(new GameObject(def, this.width, this.height));
            }
        }

        // 다음 소환까지 랜덤 쿨타임 설정 (60 ~ 140 프레임)
        // 이렇게 하면 절대 겹치지 않고 간격이 불규칙해서 더 재미있음
        this.spawnTimer = Math.floor(Math.random() * 80) + 60;
    }

    update(deltaTime) {
        if (this.state !== 'PLAYING' || this.isPaused) return;
        
        const safeDelta = Math.min(deltaTime, 50);

        if (this.gameSpeed < CONFIG.GAME_SPEED_MAX) this.gameSpeed += 0.001;
        this.co2Level += (CONFIG.CO2_PASSIVE_INCREASE - this.passiveCo2Reduction);
        
        if (this.co2Level >= CONFIG.CO2_MAX) {
            this.gameOver();
            return;
        }

        const shoeLevel = (this.userData.upgrades && this.userData.upgrades.shoes) || 0;
        this.score += (0.1 * (1 + shoeLevel * 0.1));

        this.player.update(this.height);
        this.spawnObjects();
        
        this.obstacles.forEach(o => o.update(this.gameSpeed));
        this.items.forEach(i => i.update(this.gameSpeed));
        
        this.obstacles = this.obstacles.filter(o => !o.markedForDeletion);
        this.items = this.items.filter(i => !i.markedForDeletion); 

        this.checkCollisions();
        this.ui.updateHUD(this.score, this.sessionCoins, this.co2Level);
    }

    checkCollisions() {
        const p = this.player;
        const safeUpgrades = this.userData.upgrades || {};
        
        this.obstacles.forEach(obs => {
            if (!obs.collisionProcessed && 
                p.x < obs.x + obs.width && p.x + p.width > obs.x &&
                p.y < obs.y + obs.height && p.y + p.height > obs.y) {
                
                obs.collisionProcessed = true;
                
                let damage = obs.def.damage || 10;
                const filterLevel = safeUpgrades.filter || 0;
                damage = damage * (1 - (filterLevel * 0.1));

                this.co2Level += damage;
                this.ui.showToast(`⚠️ ${obs.def.name} 충돌!`);
            }
        });
        
        this.items.forEach((item) => {
             if (!item.markedForDeletion && 
                p.x < item.x + item.width && p.x + p.width > item.x &&
                p.y < item.y + item.height && p.y + p.height > item.y) {
                
                item.markedForDeletion = true;
                
                if (item.def.currency) {
                    this.sessionCoins += item.def.currency;
                    this.ui.showToast(`💰 +${item.def.currency}`);
                } else {
                    this.score += (item.def.score || 0);
                    const reduction = item.def.co2Reduction || 0;
                    this.co2Level = Math.max(0, this.co2Level - reduction);
                    this.ui.showToast(`🌿 ${item.def.name} 획득!`);
                }
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 바닥
        if (this.height > 100) {
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(0, this.height - 100, this.width, 100);
        }

        // 일시정지 상태여도 화면은 계속 그려져야 함 (멈춘 상태로)
        if (this.state === 'PLAYING' || this.state === 'PAUSED') {
            try {
                this.obstacles.forEach(o => o.draw(this.ctx));
                this.items.forEach(i => i.draw(this.ctx));
                this.player.draw(this.ctx);
            } catch(e) {}
        }
    }

    animate(timeStamp) {
        const deltaTime = timeStamp - this.lastTime;
        this.lastTime = timeStamp;

        try {
            this.update(deltaTime);
            this.draw();
        } catch (e) {
            console.error("Loop Error:", e);
        }
        
        requestAnimationFrame(this.animate.bind(this));
    }
}

window.onload = () => {
    new Game();
};
