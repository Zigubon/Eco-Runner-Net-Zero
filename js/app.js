/**
 * [2026-01-23] 메인 게임 엔진
 * 설명: 클래스 기반 설계, 상태 관리, 로컬 스토리지 연동
 */

import { CONFIG, OBSTACLES, ITEMS, UPGRADES, Logger } from './data.js';

// === 유틸리티 클래스 ===
class StorageManager {
    static save(data) {
        localStorage.setItem('ecoRunnerData', JSON.stringify(data));
        Logger.info('데이터 저장 완료', data);
    }

    static load() {
        const data = localStorage.getItem('ecoRunnerData');
        return data ? JSON.parse(data) : { coins: 0, upgrades: {} };
    }
}

class UIManager {
    constructor() {
        this.screens = {
            intro: document.getElementById('ui-intro'),
            hud: document.getElementById('ui-hud'),
            gameover: document.getElementById('ui-gameover'),
            shop: document.getElementById('ui-shop')
        };
        this.elements = {
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
        Object.values(this.screens).forEach(el => el.classList.add('hidden'));
        Object.values(this.screens).forEach(el => el.classList.remove('active'));
        
        if (this.screens[name]) {
            this.screens[name].classList.remove('hidden');
            this.screens[name].classList.add('active');
        }
    }

    updateHUD(score, coins, co2) {
        this.elements.score.textContent = Math.floor(score);
        this.elements.coin.textContent = coins;
        this.elements.co2Bar.style.width = `${Math.min(co2, 100)}%`;
        
        // CO2가 높을수록 빨간색 강조
        this.elements.co2Bar.style.backgroundColor = co2 > 80 ? '#e74c3c' : (co2 > 50 ? '#f39c12' : '#2ecc71');
    }

    showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    renderShop(playerData, buyCallback) {
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

// === 게임 객체 클래스 ===
class Player {
    constructor(canvasHeight, upgrades) {
        this.width = 40;
        this.height = 60;
        this.x = 100;
        this.y = canvasHeight - 100 - this.height; // 지면 위치 (간단히 하드코딩된 지면 높이 100 가정)
        this.groundY = canvasHeight - 100 - this.height;
        this.dy = 0;
        this.isJumping = false;
        this.jumpCount = 0;
        this.maxJumps = 2; // 더블 점프
        this.color = '#2ecc71'; // 캐릭터 색상
        
        // 업그레이드 적용
        this.upgrades = upgrades;
    }

    jump() {
        if (this.jumpCount < this.maxJumps) {
            this.dy = this.jumpCount === 0 ? CONFIG.JUMP_FORCE : CONFIG.DOUBLE_JUMP_FORCE;
            this.isJumping = true;
            this.jumpCount++;
            Logger.info('플레이어 점프', { count: this.jumpCount });
        }
    }

    update() {
        this.dy += CONFIG.GRAVITY;
        this.y += this.dy;

        // 바닥 충돌 처리
        if (this.y > this.groundY) {
            this.y = this.groundY;
            this.dy = 0;
            this.isJumping = false;
            this.jumpCount = 0;
        }
    }

    draw(ctx) {
        // 간단한 캐릭터 그리기 (실제 게임에선 이미지 스프라이트 사용)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // 눈 그리기 (귀여움 요소)
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x + 25, this.y + 10, 10, 10);
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x + 30, this.y + 12, 5, 5);
    }
}

class GameObject {
    constructor(def, canvasWidth, canvasHeight) {
        this.def = def;
        this.x = canvasWidth;
        this.width = def.width;
        this.height = def.height;
        this.markedForDeletion = false;

        // Y 위치 결정 (공중 vs 지상)
        if (def.yPos === 'air') {
            this.y = canvasHeight - 250 - Math.random() * 100;
        } else if (def.yPos === 'ground' || !def.yPos) {
            this.y = canvasHeight - 100 - this.height;
        } else {
            // 아이템의 경우 랜덤 높이
            this.y = canvasHeight - 150 - Math.random() * 200;
        }
    }

    update(speed) {
        this.x -= speed;
        if (this.x + this.width < 0) this.markedForDeletion = true;
    }

    draw(ctx) {
        ctx.fillStyle = this.def.color;
        
        // 원형(아이템) 또는 사각형(장애물) 그리기
        if (this.def.score || this.def.currency) {
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, this.width/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// === 메인 게임 클래스 ===
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = new UIManager();
        
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight > 720 ? 720 : window.innerHeight;
        
        this.state = 'INTRO'; // INTRO, PLAYING, GAMEOVER
        this.userData = StorageManager.load();
        
        this.reset();
        this.bindEvents();
        
        Logger.info('게임 엔진 초기화 완료', { width: this.width, height: this.height });
        
        // 렌더링 루프 시작
        this.lastTime = 0;
        this.animate(0);
    }

    reset() {
        this.player = new Player(this.height, this.userData.upgrades);
        this.obstacles = [];
        this.items = [];
        this.particles = [];
        this.score = 0;
        this.gameSpeed = CONFIG.GAME_SPEED_START;
        this.co2Level = 0;
        this.sessionCoins = 0;
        
        this.frameCount = 0;
        
        // 업그레이드 효과 적용 (예: 탄소 포집 기술)
        this.passiveCo2Reduction = (this.userData.upgrades.tech || 0) * 0.01;
    }

    bindEvents() {
        // 키보드 입력
        window.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.code === 'ArrowUp') && this.state === 'PLAYING') {
                this.player.jump();
            }
        });

        // UI 버튼 이벤트
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.startGame());
        document.getElementById('btn-home').addEventListener('click', () => this.goHome());
        
        document.getElementById('btn-shop').addEventListener('click', () => {
            this.ui.showScreen('shop');
            this.ui.renderShop(this.userData, (id, cost) => this.buyUpgrade(id, cost));
        });
        
        document.getElementById('btn-close-shop').addEventListener('click', () => this.goHome());
    }

    startGame() {
        this.reset();
        this.state = 'PLAYING';
        this.ui.showScreen('hud');
        Logger.info('게임 시작');
    }

    goHome() {
        this.state = 'INTRO';
        this.ui.showScreen('intro');
    }

    buyUpgrade(id, cost) {
        this.userData.coins -= cost;
        this.userData.upgrades[id] = (this.userData.upgrades[id] || 0) + 1;
        StorageManager.save(this.userData);
        this.ui.renderShop(this.userData, (i, c) => this.buyUpgrade(i, c)); // 리렌더링
        this.ui.showToast('업그레이드 완료!');
        Logger.info(`업그레이드 구매: ${id}`);
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.userData.coins += this.sessionCoins;
        StorageManager.save(this.userData);
        
        this.ui.elements.finalScore.textContent = Math.floor(this.score);
        this.ui.elements.finalCoins.textContent = this.sessionCoins;
        this.ui.showScreen('gameover');
        Logger.info('게임 오버', { score: this.score });
    }

    spawnObjects() {
        this.frameCount++;

        // 장애물 생성
        if (this.frameCount % CONFIG.SPAWN_RATE_OBSTACLE === 0) {
            const def = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
            this.obstacles.push(new GameObject(def, this.width, this.height));
        }

        // 아이템 생성
        if (this.frameCount % CONFIG.SPAWN_RATE_ITEM === 0) {
            const def = ITEMS[Math.floor(Math.random() * ITEMS.length)];
            this.items.push(new GameObject(def, this.width, this.height));
        }
    }

    checkCollisions() {
        // AABB 충돌 감지
        const p = this.player;

        // 장애물 충돌
        this.obstacles.forEach(obs => {
            if (!obs.collisionProcessed && 
                p.x < obs.x + obs.width &&
                p.x + p.width > obs.x &&
                p.y < obs.y + obs.height &&
                p.y + p.height > obs.y) {
                
                obs.collisionProcessed = true;
                
                // 업그레이드 효과: 필터가 있으면 데미지 감소
                let damage = obs.def.damage;
                const filterLevel = this.userData.upgrades.filter || 0;
                damage = damage * (1 - (filterLevel * 0.1));

                this.co2Level += damage;
                this.ui.showToast(`⚠️ ${obs.def.name} 충돌! CO2 급증!`);
                
                // 화면 흔들림 효과 (구현 생략, 로직만 처리)
            }
        });

        // 아이템 충돌
        this.items.forEach((item, index) => {
             if (p.x < item.x + item.width &&
                p.x + p.width > item.x &&
                p.y < item.y + item.height &&
                p.y + p.height > item.y) {
                
                this.items.splice(index, 1);
                
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

    update(deltaTime) {
        if (this.state !== 'PLAYING') return;

        // 속도 증가 (난이도 곡선)
        if (this.gameSpeed < CONFIG.GAME_SPEED_MAX) {
            this.gameSpeed += 0.001;
        }

        // CO2 자연 증가
        this.co2Level += (CONFIG.CO2_PASSIVE_INCREASE - this.passiveCo2Reduction);
        if (this.co2Level >= CONFIG.CO2_MAX) {
            this.gameOver();
            return;
        }

        // 점수 증가 (업그레이드 반영)
        const scoreMult = 1 + ((this.userData.upgrades.shoes || 0) * 0.1);
        this.score += (0.1 * scoreMult);

        this.player.update();
        this.spawnObjects();
        
        this.obstacles.forEach(o => o.update(this.gameSpeed));
        this.items.forEach(i => i.update(this.gameSpeed));
        
        this.obstacles = this.obstacles.filter(o => !o.markedForDeletion);
        this.items = this.items.filter(i => !o.markedForDeletion);

        this.checkCollisions();
        this.ui.updateHUD(this.score, this.sessionCoins, this.co2Level);
    }

    draw() {
        // 배경 지우기
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 지면 그리기
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

        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame(this.animate.bind(this));
    }
}

// 게임 인스턴스 시작
window.onload = () => {
    const game = new Game();
};
