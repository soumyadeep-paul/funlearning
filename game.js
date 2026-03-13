// Core Game Logic

let canvas, ctx, audioCtx;
let gameState = 'START'; // START, PLAYING, GAMEOVER, PAUSED
let currentTheme = 'sky';
let level = 1;
let score = 0;
let bullets = 3; // Now represents Lives
let selectedAvatar = 'super-red';
let selectedTheme = 'underwater';
let playerName = 'Player';
let totalCorrect = 0;
let currentStreak = 0;
let longestStreak = 0;
let saucers = [];
let particles = [];
let projectiles = [];
let backgrounds = [];
let player = null;
let currentEquation = null;
let lastTime = 0;
let saucerSpeed = 1.2;

class BackgroundElement {
    constructor(type) {
        this.type = type;
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = 20 + Math.random() * 40;
        if (currentTheme === 'underwater') {
            this.vy = -(0.5 + Math.random() * 1.5); // Bubbles go up
            this.vx = (Math.random() - 0.5) * 0.5;
            this.y = canvas.height + Math.random() * 100;
        } else if (currentTheme === 'sky') {
            this.vx = 0.5 + Math.random() * 1; // Clouds drift right
            this.vy = 0;
            this.x = -100 - Math.random() * 500;
        }
    }
    update(dt) {
        const factor = dt / 16.67;
        this.x += this.vx * factor;
        this.y += this.vy * factor;

        if (this.x > canvas.width + 200 || this.x < -200 || this.y > canvas.height + 200 || this.y < -200) {
            this.reset();
        }
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#fff';
        if (currentTheme === 'sky') {
            this.drawCloud();
        } else if (currentTheme === 'underwater') {
            this.drawBubble();
        } else if (currentTheme === 'desert') {
            this.drawSand();
        }
        ctx.restore();
    }
    drawCloud() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.6, this.y - this.size * 0.3, this.size * 0.8, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 1.2, this.y, this.size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
    drawBubble() {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 4, 0, Math.PI * 2);
        ctx.stroke();
    }
    drawSand() {
        ctx.fillStyle = 'rgba(210, 180, 140, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size, this.size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

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
        if (this.isStar) {
            this.drawStar(this.x, this.y, 5, this.size, this.size / 2);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size || 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
        }
        ctx.lineTo(cx, cy - outerRadius);
        ctx.closePath();
        ctx.fill();
    }
}

class Projectile {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = 6;
        this.angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.reached = false;
    }

    update(dt) {
        const factor = dt / 16.67;
        this.x += this.vx * factor;
        this.y += this.vy * factor;

        const dist = Math.sqrt((this.x - this.targetX) ** 2 + (this.y - this.targetY) ** 2);
        if (dist < 20) {
            this.reached = true;
            createRichExplosion(this.x, this.y);
            bullets--;
            if (player) player.hurtTime = 500;
            updateUI();
            if (bullets <= 0) {
                gameOver();
            }
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Bazooka Rocket
        ctx.fillStyle = '#2f3542';
        ctx.beginPath();
        ctx.roundRect(-20, -10, 30, 20, 5);
        ctx.fill();

        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.moveTo(10, -10);
        ctx.lineTo(25, 0);
        ctx.lineTo(10, 10);
        ctx.closePath();
        ctx.fill();

        // Rocket exhaust
        const offset = (Date.now() / 50) % 5;
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(-20, -5);
        ctx.lineTo(-30 - offset, 0);
        ctx.lineTo(-20, 5);
        ctx.fill();

        ctx.restore();
    }
}

class Player {
    constructor() {
        this.width = 60;
        this.height = 80;
        this.x = canvas.width / 2;
        const groundHeight = window.innerWidth < 600 ? 80 : 100;
        this.y = canvas.height - groundHeight - 40;
        this.avatar = selectedAvatar;
        this.hurtTime = 0;
    }

    update(dt) {
        if (this.hurtTime > 0) this.hurtTime -= dt;
    }

    draw() {
        const time = Date.now() / 200;
        const hurt = this.hurtTime > 0;
        drawAvatar(ctx, this.x, this.y, this.avatar, time, hurt);
    }
}

function drawAvatar(context, x, y, type, time, hurt) {
    context.save();
    context.translate(x, y);

    if (hurt) {
        context.translate(Math.sin(Date.now() * 0.1) * 5, 0);
    }

    const bounce = Math.sin(time) * 3;

    if (type === 'super-red') {
        // Classic Cape Hero
        context.fillStyle = '#ff4757';
        context.beginPath();
        const capeWobble = Math.sin(time * 0.5) * 10;
        context.moveTo(-20, -20 + bounce);
        context.lineTo(-40 - capeWobble, 30 + bounce);
        context.lineTo(40 + capeWobble, 30 + bounce);
        context.lineTo(20, -20 + bounce);
        context.closePath();
        context.fill();

        context.fillStyle = '#ee5253';
        context.beginPath();
        context.roundRect(-20, -30 + bounce, 40, 50, 10);
        context.fill();

        context.fillStyle = '#f1c40f';
        context.beginPath();
        context.arc(0, -10 + bounce, 8, 0, Math.PI * 2);
        context.fill();
    } else if (type === 'cosmo-blue') {
        // Robo/Armor Hero
        context.fillStyle = '#341f97';
        context.fillRect(-22, -25 + bounce, 44, 40);
        context.fillStyle = '#54a0ff';
        context.fillRect(-18, -20 + bounce, 36, 30);

        // Glowing shoulder pads
        context.fillStyle = '#00d2ff';
        context.beginPath();
        context.arc(-22, -22 + bounce, 8, 0, Math.PI * 2);
        context.arc(22, -22 + bounce, 8, 0, Math.PI * 2);
        context.fill();
    } else if (type === 'aqua-green') {
        // Elemental/Nature Hero
        context.fillStyle = '#01a3a4';
        context.beginPath();
        context.moveTo(0, 30 + bounce);
        context.lineTo(-25, -20 + bounce);
        context.lineTo(25, -20 + bounce);
        context.closePath();
        context.fill();

        context.fillStyle = '#1dd1a1';
        context.beginPath();
        context.arc(0, -10 + bounce, 20, 0, Math.PI * 2);
        context.fill();

        // Leaf emblem
        context.fillStyle = '#10ac84';
        context.beginPath();
        context.ellipse(0, -10 + bounce, 5, 12, Math.PI/4, 0, Math.PI*2);
        context.fill();
    }

    // Head
    context.fillStyle = '#ffdbac';
    context.beginPath();
    context.arc(0, -45 + bounce, 18, 0, Math.PI * 2);
    context.fill();

    if (hurt) {
        context.fillStyle = 'rgba(255, 0, 0, 0.3)';
        context.beginPath();
        context.arc(0, -45 + bounce, 18, 0, Math.PI * 2);
        context.fill();

        context.strokeStyle = '#000';
        context.lineWidth = 2;
        for (let eyeX of [-6, 6]) {
            context.beginPath();
            context.moveTo(eyeX - 3, -48 + bounce);
            context.lineTo(eyeX + 3, -42 + bounce);
            context.moveTo(eyeX + 3, -48 + bounce);
            context.lineTo(eyeX - 3, -42 + bounce);
            context.stroke();
        }
    } else {
        // Mask specific to hero
        let maskColor = '#ff4757';
        if (type === 'cosmo-blue') maskColor = '#341f97';
        if (type === 'aqua-green') maskColor = '#01a3a4';

        context.fillStyle = maskColor;
        if (type === 'cosmo-blue') {
            context.fillRect(-18, -55 + bounce, 36, 15);
        } else {
            context.beginPath();
            context.roundRect(-18, -52 + bounce, 36, 12, 5);
            context.fill();
        }

        const shine = Math.abs(Math.sin(time)) * 0.5 + 0.5;
        context.fillStyle = `rgba(255, 255, 255, ${shine})`;
        context.beginPath();
        context.arc(-7, -46 + bounce, 3, 0, Math.PI * 2);
        context.arc(7, -46 + bounce, 3, 0, Math.PI * 2);
        context.fill();
    }

    context.restore();
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
        const groundHeight = window.innerWidth < 600 ? 80 : 100;
        this.totalFallDuration = (canvas.height - groundHeight - y) / saucerSpeed * 16.67;
    }

    update(dt) {
        const factor = dt / 16.67;
        this.y += saucerSpeed * factor;
        this.angle += 0.05 * factor;
        const groundHeight = window.innerWidth < 600 ? 80 : 100;
        if (this.y > canvas.height - groundHeight) {
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
        ctx.font = 'bold 24px "Fredoka", sans-serif';
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

    // Default theme
    setTheme('underwater');

    // Start home screen preview loops
    requestAnimationFrame(previewLoop);

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
        if (s.isCorrect) {
            createCelebrationStars(s.x, s.y);
            // Proportional Scoring - Constant base points to avoid level-up spam
            const timeElapsed = performance.now() - s.spawnTime;
            const percentUsed = timeElapsed / s.totalFallDuration;
            const basePoints = 10; // Fixed base instead of level * 10
            let points = basePoints;

            if (percentUsed < 0.1) {
                points = basePoints;
            } else if (percentUsed > 0.9) {
                points = Math.max(1, Math.round(basePoints * 0.1));
            } else {
                const ratio = 1 - (percentUsed - 0.1) / 0.8;
                points = Math.max(1, Math.round(basePoints * (0.1 + 0.9 * ratio)));
            }

            score += points;
            totalCorrect++;
            currentStreak++;
            if (currentStreak > longestStreak) longestStreak = currentStreak;

            const newLevel = Math.floor(score / 100) + 1;
            if (newLevel > level) {
                showLevelUp();
            }
            level = newLevel;

            playHitSound(true);

            // Clear saucers and set a temporary flag to ignore mis-clicks during transition
            saucers = [];
            gameState = 'TRANSITION';
            setTimeout(() => {
                if (gameState === 'TRANSITION') gameState = 'PLAYING';
                nextEquation();
            }, 500);
        } else {
            createExplosion(s.x, s.y, '#ff4757');
            projectiles.push(new Projectile(s.x, s.y, player.x, player.y));
            saucers.splice(hitIdx, 1);
            playHitSound(false);
            currentStreak = 0;
        }
    } else {
        // Mis-click costs a life immediately
        bullets--;
        if (player) player.hurtTime = 500;
        currentStreak = 0;
        updateUI();
        if (bullets <= 0) gameOver();
    }
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function createRichExplosion(x, y) {
    const colors = ['#ff4757', '#ff6b6b', '#f1c40f', '#e67e22', '#ffffff'];
    for (let i = 0; i < 50; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const p = new Particle(x, y, color);
        p.size = 4 + Math.random() * 8;
        p.vx = (Math.random() - 0.5) * 20;
        p.vy = (Math.random() - 0.5) * 20;
        p.life = 1 + Math.random();
        particles.push(p);
    }
}

function createCelebrationStars(x, y) {
    const colors = ['#f1c40f', '#fff', '#f39c12', '#fbc531'];
    for (let i = 0; i < 40; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const p = new Particle(x, y, color);
        p.isStar = true;
        p.size = 6 + Math.random() * 12;
        p.vx = (Math.random() - 0.5) * 18;
        p.vy = (Math.random() - 0.5) * 18;
        p.life = 1.5; // Longer lasting stars
        particles.push(p);
    }
}

function showLevelUp() {
    const el = document.getElementById('level-up-overlay');
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 1500);
}

function resize() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (player) {
            player.x = canvas.width / 2;
            const groundHeight = window.innerWidth < 600 ? 80 : 100;
            player.y = canvas.height - groundHeight - 40;
        }
    }
}

function setTheme(theme) {
    selectedTheme = theme;
    document.querySelectorAll('.btn-theme-small').forEach(btn => btn.classList.remove('active'));
    if (theme === 'underwater') {
        const btn = document.getElementById('btn-underwater');
        if (btn) btn.classList.add('active');
    } else {
        const btn = document.querySelector(`.btn-theme-small.${theme}`);
        if (btn) btn.classList.add('active');
    }
    // Update body class for home screen preview
    document.body.className = 'theme-' + theme;
}

function selectAvatar(avatar) {
    selectedAvatar = avatar;
    const options = document.querySelectorAll('.avatar-option');
    options.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.getAttribute('data-avatar') === avatar) {
            opt.classList.add('selected');
        }
    });
}

function previewLoop() {
    if (gameState !== 'START') return;

    const avatars = ['super-red', 'cosmo-blue', 'aqua-green'];
    const time = Date.now() / 200;

    avatars.forEach(id => {
        const can = document.getElementById(`preview-${id}`);
        if (can) {
            const pctx = can.getContext('2d');
            pctx.clearRect(0, 0, can.width, can.height);
            drawAvatar(pctx, can.width / 2, can.height - 20, id, time, false);
        }
    });

    requestAnimationFrame(previewLoop);
}

function startGameWithDefault() {
    startGame(selectedTheme);
}

function startGame(theme) {
    initAudio();
    currentTheme = theme;
    playerName = document.getElementById('player-name').value || 'Player';
    document.getElementById('player-display').innerText = playerName;
    document.body.className = 'theme-' + theme;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');

    gameState = 'PLAYING';
    level = 1;
    score = 0;
    bullets = 3;
    totalCorrect = 0;
    currentStreak = 0;
    longestStreak = 0;
    saucers = [];
    particles = [];
    projectiles = [];
    backgrounds = [];
    for(let i=0; i<10; i++) backgrounds.push(new BackgroundElement());
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

    const container = document.getElementById('lives-container');
    container.innerHTML = '';
    for(let i=0; i<bullets; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        container.appendChild(heart);
    }
}

function gameOver() {
    if (gameState === 'GAMEOVER') return;
    gameState = 'GAMEOVER';
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
    document.getElementById('stat-correct').innerText = totalCorrect;
    document.getElementById('stat-streak').innerText = longestStreak;
    document.getElementById('game-over-title').innerText = 'Great Job, ' + playerName + '!';
    playGameOverSound();
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'PLAYING' || gameState === 'TRANSITION') {
        update(deltaTime);
        draw();
    } else if (gameState === 'PAUSED') {
        draw();
    }

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    backgrounds.forEach(bg => bg.update(dt));
    if (player) player.update(dt);
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
    backgrounds.forEach(bg => bg.draw());
    const groundColor = getComputedStyle(document.documentElement).getPropertyValue('--ground-color').trim();
    ctx.fillStyle = groundColor || '#228B22';
    const groundHeight = window.innerWidth < 600 ? 80 : 100;
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    if (player) player.draw();
    saucers.forEach(saucer => saucer.draw());
    projectiles.forEach(p => p.draw());
    particles.forEach(p => p.draw());
}

window.onload = init;
