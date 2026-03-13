// Core Game Logic

let canvas, ctx, audioCtx;
let gameState = 'START'; // START, PLAYING, GAMEOVER, PAUSED
let currentTheme = 'sky';
let level = 1;
let score = 0;
let bullets = 3; // Now represents Lives
let saucers = [];
let particles = [];
let projectiles = [];
let player = null;
let currentEquation = null;
let lastTime = 0;
let saucerSpeed = 1.2;

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.alpha = 1;
        this.life = 1;
    }
    update(dt) {
        const factor = dt / 16.67;
        this.x += this.vx * factor;
        this.y += this.vy * factor;
        this.life -= 0.02 * factor;
        this.alpha = Math.max(0, this.life);
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Projectile {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = 8;
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.reached = false;
    }

    update(dt) {
        const factor = dt / 16.67;
        this.x += this.vx * factor;
        this.y += this.vy * factor;

        const dist = Math.sqrt((this.x - this.targetX) ** 2 + (this.y - this.targetY) ** 2);
        if (dist < 15) {
            this.reached = true;
            bullets--;
            updateUI();
            if (bullets <= 0) {
                gameOver();
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#576574';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2f3542';
        ctx.stroke();
        ctx.restore();
    }
}

class Player {
    constructor() {
        this.width = 60;
        this.height = 80;
        this.x = canvas.width / 2;
        this.y = canvas.height - 50 - 40;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Character
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath();
        ctx.roundRect(-20, -30, 40, 50, 10);
        ctx.fill();
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(0, -45, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-5, -48, 2, 0, Math.PI * 2);
        ctx.arc(5, -48, 2, 0, Math.PI * 2);
        ctx.fill();

        if (currentTheme === 'underwater') {
            ctx.fillStyle = '#54a0ff';
            ctx.beginPath();
            ctx.arc(0, -50, 18, Math.PI, 0);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Saucer {
    constructor(x, y, value, isCorrect) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.isCorrect = isCorrect;
        this.radius = 40;
        this.angle = 0;
        this.spawnTime = performance.now();
        this.totalFallDuration = (canvas.height - 50 - y) / saucerSpeed * 16.67;
    }

    update(dt) {
        const factor = dt / 16.67;
        this.y += saucerSpeed * factor;
        this.angle += 0.05 * factor;
        if (this.y > canvas.height - 50) {
            gameOver();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.angle) * 5);

        if (currentTheme === 'sky') {
            this.drawSaucer();
        } else if (currentTheme === 'underwater') {
            this.drawShark();
        } else if (currentTheme === 'desert') {
            this.drawCactus();
        }

        ctx.fillStyle = '#2f3542';
        if (currentTheme === 'underwater') ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value, 0, currentTheme === 'desert' ? -20 : -5);

        ctx.restore();
    }

    drawSaucer() {
        ctx.fillStyle = '#dfe4ea';
        ctx.beginPath();
        ctx.ellipse(0, 0, 45, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2f3542';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(112, 161, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(0, -8, 20, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
    }

    drawShark() {
        ctx.fillStyle = '#747d8c';
        ctx.beginPath();
        ctx.ellipse(0, 0, 50, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(40, 0);
        ctx.lineTo(60, -15);
        ctx.lineTo(60, 15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, -15);
        ctx.lineTo(-10, -35);
        ctx.lineTo(15, -15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-30, -5, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCactus() {
        ctx.fillStyle = '#2ed573';
        ctx.beginPath();
        ctx.roundRect(-15, -40, 30, 60, 15);
        ctx.fill();
        ctx.strokeStyle = '#26af5c';
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(-30, -25, 15, 25, 7);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(15, -30, 15, 25, 7);
        ctx.fill();
        ctx.stroke();
    }
}

function init() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousedown', (e) => {
        if (gameState !== 'PLAYING') return;
        initAudio();
        handleInput(e.clientX, e.clientY);
    });
    canvas.addEventListener('touchstart', (e) => {
        if (gameState !== 'PLAYING') return;
        initAudio();
        e.preventDefault();
        const touch = e.touches[0];
        handleInput(touch.clientX, touch.clientY);
    }, { passive: false });

    requestAnimationFrame(gameLoop);
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playShootSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playHitSound(isCorrect) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    if (isCorrect) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.3);
    }
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

function playGameOverSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(55, audioCtx.currentTime + 1);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
}

function handleInput(clientX, clientY) {
    if (gameState !== 'PLAYING') return;
    if (bullets <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    playShootSound();

    let hitIdx = -1;
    for (let i = saucers.length - 1; i >= 0; i--) {
        const s = saucers[i];
        const dist = Math.sqrt((x - s.x) ** 2 + (y - (s.y + Math.sin(s.angle)*5)) ** 2);
        if (dist < s.radius + 10) {
            hitIdx = i;
            break;
        }
    }

    if (hitIdx !== -1) {
        const s = saucers[hitIdx];
        createExplosion(s.x, s.y, s.isCorrect ? '#2ed573' : '#ff4757');
        if (s.isCorrect) {
            // Proportional Scoring
            const timeElapsed = performance.now() - s.spawnTime;
            const percentUsed = timeElapsed / s.totalFallDuration;
            const maxPoints = level * 10;
            let points = maxPoints;

            if (percentUsed < 0.1) {
                points = maxPoints;
            } else if (percentUsed > 0.9) {
                points = Math.max(1, Math.round(maxPoints * 0.1));
            } else {
                const ratio = 1 - (percentUsed - 0.1) / 0.8;
                points = Math.max(1, Math.round(maxPoints * (0.1 + 0.9 * ratio)));
            }

            score += points;
            level = Math.floor(score / 100) + 1;
            playHitSound(true);
            setTimeout(nextEquation, 500);
            saucers = [];
        } else {
            projectiles.push(new Projectile(s.x, s.y, player.x, player.y));
            saucers.splice(hitIdx, 1);
            playHitSound(false);
        }
    } else {
        // Mis-click costs a life immediately
        bullets--;
        updateUI();
        if (bullets <= 0) gameOver();
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function resize() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (player) {
            player.x = canvas.width / 2;
            player.y = canvas.height - 50 - 40;
        }
    }
}

function startGame(theme) {
    initAudio();
    currentTheme = theme;
    document.body.className = 'theme-' + theme;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');

    gameState = 'PLAYING';
    level = 1;
    score = 0;
    bullets = 3;
    saucers = [];
    particles = [];
    projectiles = [];
    player = new Player();
    updateUI();
    nextEquation();
}

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        document.getElementById('pause-screen').classList.remove('hidden');
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        document.getElementById('pause-screen').classList.add('hidden');
        lastTime = performance.now();
    }
}

function nextEquation() {
    if (gameState !== 'PLAYING') return;
    currentEquation = MathLogic.generateEquation(level);
    document.getElementById('equation-text').innerText = currentEquation.text;
    spawnSaucers();
    updateUI();
}

function spawnSaucers() {
    saucers = [];
    const values = [currentEquation.answer, ...MathLogic.generateDistractors(currentEquation.answer, level)];
    values.sort(() => Math.random() - 0.5);

    const spacing = canvas.width / (values.length + 1);
    for (let i = 0; i < values.length; i++) {
        const x = spacing * (i + 1);
        const y = -50 - (Math.random() * 100);
        saucers.push(new Saucer(x, y, values[i], values[i] === currentEquation.answer));
    }
}

function updateUI() {
    document.getElementById('level-val').innerText = level;
    document.getElementById('score-val').innerText = score;
    document.getElementById('bullets-val').innerText = bullets;
}

function gameOver() {
    if (gameState === 'GAMEOVER') return;
    gameState = 'GAMEOVER';
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = 'Score: ' + score;
    playGameOverSound();
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING') {
        update(deltaTime);
        draw();
    } else if (gameState === 'PAUSED') {
        draw();
    }

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    saucers.forEach(saucer => saucer.update(dt));
    for (let i = projectiles.length - 1; i >= 0; i--) {
        projectiles[i].update(dt);
        if (projectiles[i].reached) {
            projectiles.splice(i, 1);
        }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function draw() {
    drawBackground();
    const groundColor = getComputedStyle(document.documentElement).getPropertyValue('--ground-color').trim();
    ctx.fillStyle = groundColor || '#228B22';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    if (player) player.draw();
    saucers.forEach(saucer => saucer.draw());
    projectiles.forEach(p => p.draw());
    particles.forEach(p => p.draw());
}

function drawBackground() {
    if (currentTheme === 'sky') {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(100, 100, 30, 0, Math.PI * 2);
        ctx.arc(130, 110, 40, 0, Math.PI * 2);
        ctx.arc(160, 100, 30, 0, Math.PI * 2);
        ctx.fill();
    } else if (currentTheme === 'underwater') {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for(let i=0; i<5; i++) {
            ctx.beginPath();
            ctx.arc(canvas.width * 0.2 * i + 50, (Date.now() / 20 % canvas.height), 10, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (currentTheme === 'desert') {
        ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(canvas.width - 100, 100, 50, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.onload = init;
