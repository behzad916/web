// === games/pong.js (Neon Pong WebRTC) ===

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let pongLoop;
let isHostingPong = false;
let p1Score = 0;
let p2Score = 0;

// Game State
const state = {
    paddle1: { y: 250, width: 10, height: 100 },
    paddle2: { y: 250, width: 10, height: 100 },
    ball: { x: 400, y: 300, r: 8, dx: 5, dy: 5, speed: 7 },
    upPressed: false,
    downPressed: false
};

function initPong(isHost) {
    isHostingPong = isHost;
    p1Score = 0;
    p2Score = 0;
    updateScoreUI();
    
    // Set Canvas Size
    canvas.width = 800;
    canvas.height = 600;
    
    // Initial reset
    resetBall();
    
    // Listeners
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    
    // Start loop
    if (pongLoop) cancelAnimationFrame(pongLoop);
    updatePong();
}

function stopGameLoop() {
    if (pongLoop) cancelAnimationFrame(pongLoop);
    document.removeEventListener('keydown', keyDownHandler);
    document.removeEventListener('keyup', keyUpHandler);
}

// Input Handling
function keyDownHandler(e) {
    if(e.key == "Up" || e.key == "ArrowUp" || e.key == "w") state.upPressed = true;
    else if(e.key == "Down" || e.key == "ArrowDown" || e.key == "s") state.downPressed = true;
}
function keyUpHandler(e) {
    if(e.key == "Up" || e.key == "ArrowUp" || e.key == "w") state.upPressed = false;
    else if(e.key == "Down" || e.key == "ArrowDown" || e.key == "s") state.downPressed = false;
}

// Draw Functions
function drawRect(x, y, w, h, color, glow) {
    ctx.fillStyle = color;
    ctx.shadowBlur = glow ? 20 : 0;
    ctx.shadowColor = color;
    ctx.fillRect(x, y, w, h);
    ctx.shadowBlur = 0; // reset
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2, false);
    ctx.closePath();
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawNet() {
    for(let i = 0; i <= canvas.height; i+=30) {
        drawRect(canvas.width/2 - 1, i, 2, 15, 'rgba(0, 255, 204, 0.2)', false);
    }
}

// Network Data Handlers (Called by multiplayer.js)
// Global function attached to window
window.handleNetworkData = function(payload) {
    if (currentGame !== 'pong') return;
    
    if (isHostingPong) {
        // Host receives Player 2 paddle position
        state.paddle2.y = payload.p2y;
    } else {
        // Client receives Ball and Player 1 paddle position
        state.paddle1.y = payload.p1y;
        state.ball.x = payload.bx;
        state.ball.y = payload.by;
    }
};

window.handleNetworkEvent = function(event, content) {
    if (event === 'score') {
        p1Score = content.p1;
        p2Score = content.p2;
        updateScoreUI();
    }
    if (event === 'gameover') {
        endPong(content.winner);
    }
    if (event === 'rematch') {
        document.getElementById('gameOverlay').style.display = 'none';
        initPong(isHostingPong);
    }
};

function updateScoreUI() {
    document.getElementById('p1Score').textContent = p1Score;
    document.getElementById('p2Score').textContent = p2Score;
    
    if (p1Score >= 7 || p2Score >= 7) {
        const winner = p1Score >= 7 ? 'Host' : 'Client';
        endPong(winner);
        if (isHostingPong) sendEvent('gameover', { winner });
    }
}

function resetBall() {
    state.ball.x = canvas.width/2;
    state.ball.y = canvas.height/2;
    state.ball.speed = 7;
    // Host decides direction always
    if (isHostingPong) {
        state.ball.dx = (Math.random() > 0.5 ? 1 : -1) * state.ball.speed;
        state.ball.dy = (Math.random() * 2 - 1) * state.ball.speed;
    }
}

function endPong(winner) {
    stopGameLoop();
    document.getElementById('gameOverlay').style.display = 'flex';
    
    const iWon = (isHostingPong && winner === 'Host') || (!isHostingPong && winner === 'Client');
    const title = document.getElementById('winnerText');
    
    if (iWon) {
        title.textContent = 'YOU WIN!';
        title.style.color = '#00ffcc';
        addScore(100); // UI function from app.js
    } else {
        title.textContent = 'YOU LOSE';
        title.style.color = '#ff007f';
        addScore(10); // participation
    }
}

function requestRematch() {
    document.getElementById('gameOverlay').style.display = 'none';
    sendEvent('rematch', {});
    initPong(isHostingPong);
}

// Main Loop
function updatePong() {
    // 1. Local Move
    if (isHostingPong) {
        if(state.upPressed && state.paddle1.y > 0) state.paddle1.y -= 8;
        if(state.downPressed && state.paddle1.y < canvas.height - state.paddle1.height) state.paddle1.y += 8;
    } else {
        if(state.upPressed && state.paddle2.y > 0) state.paddle2.y -= 8;
        if(state.downPressed && state.paddle2.y < canvas.height - state.paddle2.height) state.paddle2.y += 8;
    }

    // 2. Host Logic (Ball Physics)
    if (isHostingPong) {
        state.ball.x += state.ball.dx;
        state.ball.y += state.ball.dy;

        // Top/Bottom boundaries
        if (state.ball.y - state.ball.r < 0 || state.ball.y + state.ball.r > canvas.height) {
            state.ball.dy *= -1;
        }

        // Paddle Collision
        let player = (state.ball.x + state.ball.r < canvas.width/2) ? state.paddle1 : state.paddle2;
        let pX = (player === state.paddle1) ? 20 : canvas.width - 30; // 30 is width + margin

        if (state.ball.x + state.ball.r > pX && state.ball.x - state.ball.r < pX + player.width &&
            state.ball.y > player.y && state.ball.y < player.y + player.height) {
            
            // Hit logic
            let collidePoint = (state.ball.y - (player.y + player.height/2));
            collidePoint = collidePoint / (player.height/2);
            let angleRad = (Math.PI/4) * collidePoint;
            
            let direction = (state.ball.x + state.ball.r < canvas.width/2) ? 1 : -1;
            
            state.ball.dx = direction * state.ball.speed * Math.cos(angleRad);
            state.ball.dy = state.ball.speed * Math.sin(angleRad);
            state.ball.speed += 0.5; // Speed up
        }

        // Scoring
        if (state.ball.x - state.ball.r < 0) {
            p2Score++;
            updateScoreUI();
            sendEvent('score', {p1: p1Score, p2: p2Score});
            resetBall();
        } else if (state.ball.x + state.ball.r > canvas.width) {
            p1Score++;
            updateScoreUI();
            sendEvent('score', {p1: p1Score, p2: p2Score});
            resetBall();
        }
    }

    // 3. Network Sync
    if (isHostingPong) {
        sendState({
            p1y: state.paddle1.y,
            bx: state.ball.x,
            by: state.ball.y
        });
    } else {
        sendState({
            p2y: state.paddle2.y
        });
    }

    // 4. Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawNet();
    drawRect(20, state.paddle1.y, state.paddle1.width, state.paddle1.height, '#00ffcc', true); // P1
    drawRect(canvas.width - 30, state.paddle2.y, state.paddle2.width, state.paddle2.height, '#ff007f', true); // P2
    drawCircle(state.ball.x, state.ball.y, state.ball.r, '#fff'); // Ball

    pongLoop = requestAnimationFrame(updatePong);
}
