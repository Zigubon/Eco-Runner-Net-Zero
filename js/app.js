/**
 * [2026-01-23] Eco Runner Game Engine (Final Fix)
 * 설명: 멈춤 현상 수정(변수 참조 오류 해결), 루프 안정성 강화
 */

import { CONFIG, OBSTACLES, ITEMS, UPGRADES, Logger } from './data.js';

// === Storage & UI Manager ===
class StorageManager {
    static save(data) { localStorage.setItem('ecoRunnerData', JSON.stringify(data)); }
    static load() {
        const data = localStorage.getItem('ecoRunnerData');
        return data ? JSON.parse(data) : { coins: 0, upgrades: {} };
    }
}

class UIManager {
    constructor() {
        this.elements = {
            intro: document.getElementById('ui-intro'),
            hud: document.getElementById('ui-hud'),
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
        ['intro', 'hud', 'gameover', 'shop'].forEach(k => {
            if (this.elements[k]) {
                this.elements[k].classList.add('hidden');
                this.elements[k].classList.remove('active');
            }
        });
        if (this.elements[name]) {
            this.elements[name].classList.remove('hidden');
            this.elements[name].classList.add('active');
        }
    }

    updateHUD(score, coins, co2) {
        if(this.elements.score) this.elements.score.textContent = Math.floor(score);
        if(this.elements.coin) this.elements.coin.textContent = coins;
        if(this.elements.co2Bar) {
            this.elements.co2Bar.style.width = `${Math.min(co2, 100)}%`;
            this.elements.co2Bar.style.backgroundColor = co2 > 80 ? '#e74c3c' : (co2 > 50 ? '#f39c12' : '#2ecc71');
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
            const currentLevel = playerData.upgrades[item.id] || 0;
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
                if (!isMax && playerData.coins >= cost) {
                    buyCallback(item.id, cost);
                } else if (playerData.coins < cost) {
                    this.showToast('포인트가 부족합니다!');
                }
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
        // 바닥 위치를 캔버스 하단 100px 위로 고정
        this.groundY = canvasHeight - 100 - this.height; 
        this.y = this.groundY;
        this.dy = 0;
        this.isJumping = false;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.color = '#2ecc71'; 
        this.upgrades = upgrades;
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.dy = this.jumpCount === 0 ? CONFIG.JUMP_FORCE : CONFIG.DOUBLE_JUMP_FORCE;
            this.isJumping = true;
            this.jumpCount++;
        }
    }

    update() {
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
        
        // 눈 그리기 (방향 확인용)
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
        this.width = def.width;
        this.height = def.height;
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
        ctx.fillStyle = this.def.color;
        if (this.def.score || this.def.currency) {
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// === Main Game Class ===
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error("Canvas not found!");
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.ui = new UIManager();
        
        // 초기화
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.state = 'INTRO'; 
        this.userData = StorageManager.load();
        
        this.player = new Player(this.height, this.userData.upgrades);
        this.obstacles = [];
        this.items = [];
        this.score = 0;
        
        this.bindEvents();
        
        // 애니메이션 루프 시작
        this.lastTime = 0;
        requestAnimationFrame(this.animate.bind(this));
    }

    resize() {
        // 부모 컨테이너 크기에 맞춤
        const container = this.canvas.parentElement;
        if (container) {
            this.width = this.canvas.width = container.clientWidth;
            this.height = this.canvas.height = container.clientHeight;
        } else {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
        }
        
        // 리사이즈 시 플레이어 바닥 위치 재조정
        if (this.player) {
            this.player.groundY = this.height - 100 - this.player.height;
            if(!this.player.isJumping) this.player.y = this.player.groundY;
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
        this.frameCount = 0;
        this.passiveCo2Reduction = (this.userData.upgrades.tech || 0) * 0.01;
    }

    bindEvents() {
        // 키보드 점프
        window.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.code === 'ArrowUp') && this.state === 'PLAYING') {
                e.preventDefault();
                this.player.jump();
            }
        });

        // 마우스/터치 점프
        const jumpAction = (e) => {
            if (this.state === 'PLAYING') {
                e.preventDefault(); // 더블탭 확대 방지 등
                this.player.jump();
            }
        };
        this.canvas.addEventListener('mousedown', jumpAction);
        this.canvas.addEventListener('touchstart', jumpAction, { passive: false });

        // UI 버튼
        const bindBtn = (id, fn) => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('click', fn);
        };

        bindBtn('btn-start', () => this.startGame());
        bindBtn('btn-restart', () => this.startGame());
        bindBtn('btn-home', () => this.goHome());
        
        bindBtn('btn-shop', () => {
            this.ui.showScreen('shop');
            this.ui.renderShop(this.userData, (id, cost) => this.buyUpgrade(id, cost));
        });
        bindBtn('btn-close-shop', () => this.goHome());
    }

    startGame() {
        this.resize();
        this.reset();
        this.state = 'PLAYING';
        this.ui.showScreen('hud');
        console.log("Game Started!");
    }

    goHome() {
        this.state = 'INTRO';
        this.ui.showScreen('intro');
    }

    buyUpgrade(id, cost) {
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
        this.frameCount++;
        if (this.frameCount % CONFIG.SPAWN_RATE_OBSTACLE === 0) {
            const def = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
            this.obstacles.push(new GameObject(def, this.width, this.height));
        }
        if (this.frameCount % CONFIG.SPAWN_RATE_ITEM === 0) {
            const def = ITEMS[Math.floor(Math.random() * ITEMS.length)];
            this.items.push(new GameObject(def, this.width, this.height));
        }
    }

    update(deltaTime) {
        if (this.state !== 'PLAYING') return;

        // 속도 제한 (프레임 드랍 시 텔레포트 방지)
        const safeDelta = Math.min(deltaTime, 50);

        if (this.gameSpeed < CONFIG.GAME_SPEED_MAX) this.gameSpeed += 0.001;
        this.co2Level += (CONFIG.CO2_PASSIVE_INCREASE - this.passiveCo2Reduction);
        
        if (this.co2Level >= CONFIG.CO2_MAX) {
            this.gameOver();
            return;
        }

        const scoreMult = 1 + ((this.userData.upgrades.shoes || 0) * 0.1);
        this.score += (0.1 * scoreMult);

        this.player.update();
        this.spawnObjects();
        
        this.obstacles.forEach(o => o.update(this.gameSpeed));
        this.items.forEach(i => i.update(this.gameSpeed));
        
        // [수정 완료] 여기서 o 대신 i를 써야 멈추지 않습니다!
        this.obstacles = this.obstacles.filter(o => !o.markedForDeletion);
        this.items = this.items.filter(i => !i.markedForDeletion); 

        this.checkCollisions();
        this.ui.updateHUD(this.score, this.sessionCoins, this.co2Level);
    }

    checkCollisions() {
        const p = this.player;
        
        // 장애물
        this.obstacles.forEach(obs => {
            if (!obs.collisionProcessed && 
                p.x < obs.x + obs.width && p.x + p.width > obs.x &&
                p.y < obs.y + obs.height && p.y + p.height > obs.y) {
                
                obs.collisionProcessed = true;
                
                let damage = obs.def.damage;
                const filterLevel = this.userData.upgrades.filter || 0;
                damage = damage * (1 - (filterLevel * 0.1));

                this.co2Level += damage;
                this.ui.showToast(`⚠️ ${obs.def.name} 충돌!`);
            }
        });
        
        // 아이템
        this.items.forEach((item, index) => {
             if (p.x < item.x + item.width && p.x + p.width > item.x &&
                p.y < item.y + item.height && p.y + p.height > item.y) {
                
                // 즉시 제거 처리
                item.markedForDeletion = true;
                
                if (item.def.currency) {
                    this.sessionCoins += item.def.currency;
                    this.ui.showToast(`💰 +${item.def.currency}`);
                } else {
                    this.score += item.def.score;
                    this.co2Level = Math.max(0, this.co2Level - item.def.co2Reduction);
                    this.ui.showToast(`🌿 ${item.def.name} 획득!`);
                }
            }
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 지면
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(0, this.height - 100, this.width, 100);

        if (this.state === 'PLAYING') {
            this.obstacles.forEach(o => o.draw(this.ctx));
            this.items.forEach(i => i.draw(this.ctx));
            this.player.draw(this.ctx);
        }
    }

    animate(timeStamp) {
        const deltaTime = timeStamp - this.lastTime;
        this.lastTime = timeStamp;

        try {
            this.update(deltaTime);
            this.draw();
        } catch (e) {
            console.error("Game Loop Error:", e);
            // 에러가 나도 루프가 멈추지 않도록 재시도하거나 상태를 변경
            // 개발 중엔 여기서 멈추는 게 낫지만, 배포용에선 재시작 유도
        }
        
        requestAnimationFrame(this.animate.bind(this));
    }
}

window.onload = () => {
    new Game();
};
