// Core Game Logic

let canvas, ctx, audioCtx;
let gameState = 'START'; // START, PLAYING, GAMEOVER
let currentTheme = 'sky';
let level = 1;
let score = 0;
let bullets = 2;
let saucers = [];
let particles = [];
let currentEquation = null;
let lastTime = 0;
let saucerSpeed = 1;

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
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
        this.alpha = this.life;
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

class Saucer {
    constructor(x, y, value, isCorrect) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.isCorrect = isCorrect;
        this.radius = 40;
        this.speed = saucerSpeed;
        this.angle = 0;
    }

    update(dt) {
        const factor = dt / 16.67; // Normalize to 60fps
        this.y += this.speed * factor;
        this.angle += 0.05 * factor;
        if (this.y > canvas.height - 50) {
            gameOver();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.angle) * 5);

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.isCorrect ? 'rgba(46, 213, 115, 0.5)' : 'rgba(255, 71, 87, 0.5)';

        ctx.fillStyle = currentTheme === 'sky' ? '#dfe4ea' : '#70a1ff';
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

        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = (Math.floor(Date.now() / 200) + i) % 2 === 0 ? '#ff4757' : '#eccc68';
            ctx.beginPath();
            ctx.arc(-30 + i * 15, 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#2f3542';
        ctx.font = 'bold 24px "Segoe UI", Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value, 0, -5);

        ctx.restore();
    }
}

function init() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('mousedown', (e) => {
        initAudio();
        handleInput(e.clientX, e.clientY);
    });
    canvas.addEventListener('touchstart', (e) => {
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
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
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
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
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
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
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

    bullets--;
    updateUI();

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
            score += 10;
            level = Math.floor(score / 50) + 1;
            saucerSpeed = 1 + (level * 0.2);
            playHitSound(true);
            setTimeout(nextEquation, 500);
            saucers = [];
        } else {
            saucers.splice(hitIdx, 1);
            playHitSound(false);
        }
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
    }
}

function startGame(theme) {
    initAudio();
    currentTheme = theme;
    document.body.className = 'theme-' + theme;
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');

    gameState = 'PLAYING';
    level = 1;
    score = 0;
    bullets = 2;
    saucers = [];
    particles = [];
    saucerSpeed = 1;
    updateUI();
    nextEquation();
}

function nextEquation() {
    if (gameState !== 'PLAYING') return;
    currentEquation = MathLogic.generateEquation(level);
    document.getElementById('equation-text').innerText = currentEquation.text;
    bullets = 2;
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
    }

    requestAnimationFrame(gameLoop);
}

function update(dt) {
    saucers.forEach(saucer => saucer.update(dt));
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
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.strokeRect(0, canvas.height - 50, canvas.width, 50);

    saucers.forEach(saucer => saucer.draw());
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
    } else {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        for(let i=0; i<5; i++) {
            ctx.beginPath();
            ctx.arc(canvas.width * 0.2 * i + 50, (Date.now() / 20 % canvas.height), 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

window.onload = init;
