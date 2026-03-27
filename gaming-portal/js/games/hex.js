// === games/hex.js (Hex Strategy WebRTC) ===

let hexLoop;
let isHostingHex = false;
let myTurn = false;

// Hex Math
const HEX_SIZE = 30;
const HEX_W = Math.sqrt(3) * HEX_SIZE;
const HEX_H = 2 * HEX_SIZE;

// Game State
let board = {}; // "q,r": owner (0=empty, 1=p1, 2=p2)
let hState = {
    turn: 1, // 1 = P1 (Host), 2 = P2 (Client)
    winner: null,
    p1Score: 0,
    p2Score: 0
};

function initHex(isHost) {
    isHostingHex = isHost;
    myTurn = isHost; // Host goes first
    
    // Set Canvas
    canvas.width = 800;
    canvas.height = 600;
    
    // Create Board (Radius 5 Hex Grid)
    board = {};
    for (let q = -5; q <= 5; q++) {
        let r1 = Math.max(-5, -q - 5);
        let r2 = Math.min(5, -q + 5);
        for (let r = r1; r <= r2; r++) {
            board[`${q},${r}`] = 0;
        }
    }
    
    // Starting positions
    board["0,-5"] = 1; // P1 top
    board["0,5"] = 2;  // P2 bottom
    
    hState.turn = 1;
    hState.winner = null;
    updateUIScores();

    canvas.addEventListener('click', hClick);
    
    if (hexLoop) cancelAnimationFrame(hexLoop);
    updateHex();
}

function stopGameLoop() {
    if (hexLoop) cancelAnimationFrame(hexLoop);
    canvas.removeEventListener('click', hClick);
}

// Coordinate conversions
function hexToPixel(q, r) {
    let x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
    let y = HEX_SIZE * 3/2 * r;
    return { x: x + canvas.width/2, y: y + canvas.height/2 };
}

function pixelToHex(px, py) {
    let x = px - canvas.width/2;
    let y = py - canvas.height/2;
    let q = (Math.sqrt(3)/3 * x - 1/3 * y) / HEX_SIZE;
    let r = (2/3 * y) / HEX_SIZE;
    return hexRound(q, r);
}

function hexRound(q, r) {
    let s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);
    let q_diff = Math.abs(rq - q);
    let r_diff = Math.abs(rr - r);
    let s_diff = Math.abs(rs - s);
    if (q_diff > r_diff && q_diff > s_diff) rq = -rr - rs;
    else if (r_diff > s_diff) rr = -rq - rs;
    return { q: rq, r: rr };
}

// Drawing Utilities
function drawHex(q, r, owner) {
    let pos = hexToPixel(q, r);
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        let angle_deg = 60 * i + 30;
        let angle_rad = Math.PI / 180 * angle_deg;
        let px = pos.x + HEX_SIZE * Math.cos(angle_rad);
        let py = pos.y + HEX_SIZE * Math.sin(angle_rad);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#0f172a'; // empty
    
    if (owner === 1) {
        ctx.fillStyle = 'rgba(0, 255, 204, 0.4)';
        ctx.strokeStyle = '#00ffcc';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffcc';
    } else if (owner === 2) {
        ctx.fillStyle = 'rgba(255, 0, 127, 0.4)';
        ctx.strokeStyle = '#ff007f';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff007f';
    }
    
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
}

// Logic
function hClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if ((isHostingHex && hState.turn !== 1) || (!isHostingHex && hState.turn !== 2)) return;
    
    let clicked = pixelToHex(x, y);
    let key = `${clicked.q},${clicked.r}`;
    
    // Verify valid move
    if (board[key] === 0 && isValidMove(clicked.q, clicked.r, hState.turn)) {
        board[key] = hState.turn; // Claim hex
        
        // Convert neighbors
        getNeighbors(clicked.q, clicked.r).forEach(n => {
            let nKey = `${n.q},${n.r}`;
            if (board[nKey] !== undefined && board[nKey] !== 0 && board[nKey] !== hState.turn) {
                board[nKey] = hState.turn;
            }
        });
        
        hState.turn = hState.turn === 1 ? 2 : 1; // Swap turn
        updateUIScores();
        
        // Send state
        sendState({ b: board, t: hState.turn });
        
        checkWinCondition();
    }
}

function isValidMove(q, r, player) {
    let valid = false;
    getNeighbors(q, r).forEach(n => {
        let nkey = `${n.q},${n.r}`;
        if (board[nkey] === player) valid = true;
    });
    // Can also jump 2 spaces in real hex wars, but let's stick to adjacent for simplicity
    return valid;
}

function getNeighbors(q, r) {
    return [
        {q: q+1, r: r}, {q: q+1, r: r-1}, {q: q, r: r-1},
        {q: q-1, r: r}, {q: q-1, r: r+1}, {q: q, r: r+1}
    ];
}

function updateUIScores() {
    hState.p1Score = 0; hState.p2Score = 0;
    for (let k in board) {
        if (board[k] === 1) hState.p1Score++;
        if (board[k] === 2) hState.p2Score++;
    }
    document.getElementById('p1Score').textContent = hState.p1Score;
    document.getElementById('p2Score').textContent = hState.p2Score;
    
    // Highlight active player
    document.getElementById('p1Name').style.opacity = hState.turn === 1 ? '1' : '0.5';
    document.getElementById('p2Name').style.opacity = hState.turn === 2 ? '1' : '0.5';
}

function checkWinCondition() {
    let empty = 0;
    for (let k in board) if(board[k] === 0) empty++;
    
    // Can current player move?
    let canMove = false;
    for (let k in board) {
        if(board[k] === 0) {
            let parts = k.split(',');
            if (isValidMove(parseInt(parts[0]), parseInt(parts[1]), hState.turn)) {
                canMove = true;
                break;
            }
        }
    }
    
    if (empty === 0 || !canMove) {
        let winner = hState.p1Score > hState.p2Score ? 'Host' : 'Client';
        
        if (isHostingHex) {
            sendEvent('gameover', { winner: winner });
        }
        endHex(winner);
    }
}

// Network Sync
window.handleNetworkData = function(payload) {
    if (currentGame !== 'hex') return;
    board = payload.b;
    hState.turn = payload.t;
    updateUIScores();
    checkWinCondition();
};

window.handleNetworkEvent = function(event, content) {
    if (event === 'gameover') {
        endHex(content.winner);
    }
    if (event === 'rematch') {
        document.getElementById('gameOverlay').style.display = 'none';
        initHex(isHostingHex);
    }
};

function endHex(winner) {
    stopGameLoop();
    document.getElementById('gameOverlay').style.display = 'flex';
    const title = document.getElementById('winnerText');
    const iWon = (isHostingHex && winner === 'Host') || (!isHostingHex && winner === 'Client');
    
    if (iWon) {
        title.textContent = 'DOMINATION';
        title.style.color = '#00ffcc';
        addScore(300);
    } else {
        title.textContent = 'EXTERMINATED';
        title.style.color = '#ff007f';
        addScore(50);
    }
}

// Render Only Loop (Logic is event driven)
function updateHex() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let k in board) {
        let parts = k.split(',');
        drawHex(parseInt(parts[0]), parseInt(parts[1]), board[k]);
    }
    
    hexLoop = requestAnimationFrame(updateHex);
}
