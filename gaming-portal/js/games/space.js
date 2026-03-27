// === games/space.js (Space Arena WebRTC) ===

let spaceLoop;
let isHostingSpace = false;

// Game State
const sState = {
    p1: { x: 200, y: 300, angle: 0, speed: 0, color: '#00ffcc', hp: 100 },
    p2: { x: 600, y: 300, angle: Math.PI, speed: 0, color: '#ff007f', hp: 100 },
    bullets: [],
    keys: { left: false, right: false, up: false, space: false },
    lastShotTimer: 0
};

function initSpace(isHost) {
    isHostingSpace = isHost;
    
    // Set Canvas
    canvas.width = 800;
    canvas.height = 600;
    
    // Reset state
    sState.p1 = { x: 200, y: 300, angle: 0, speed: 0, color: '#00ffcc', hp: 100 };
    sState.p2 = { x: 600, y: 300, angle: Math.PI, speed: 0, color: '#ff007f', hp: 100 };
    sState.bullets = [];
    
    document.addEventListener('keydown', sKeyDown);
    document.addEventListener('keyup', sKeyUp);
    
    if (spaceLoop) cancelAnimationFrame(spaceLoop);
    updateSpace();
}

function stopGameLoop() { // Override global stop (or app.js handles it if we rename)
    if (spaceLoop) cancelAnimationFrame(spaceLoop);
    document.removeEventListener('keydown', sKeyDown);
    document.removeEventListener('keyup', sKeyUp);
}

function sKeyDown(e) {
    if(e.key === "ArrowLeft" || e.key === "a") sState.keys.left = true;
    if(e.key === "ArrowRight" || e.key === "d") sState.keys.right = true;
    if(e.key === "ArrowUp" || e.key === "w") sState.keys.up = true;
    if(e.key === " ") sState.keys.space = true;
}

function sKeyUp(e) {
    if(e.key === "ArrowLeft" || e.key === "a") sState.keys.left = false;
    if(e.key === "ArrowRight" || e.key === "d") sState.keys.right = false;
    if(e.key === "ArrowUp" || e.key === "w") sState.keys.up = false;
    if(e.key === " ") sState.keys.space = false;
}

// Drawing Utilities
function drawShip(x, y, angle, color, thrust) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    // Ship Body (Triangle)
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-10, -10);
    ctx.closePath();
    ctx.fillStyle = '#050510';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.stroke();

    // Thrust flame
    if (thrust) {
        ctx.beginPath();
        ctx.moveTo(-10, 5);
        ctx.lineTo(-20 - Math.random() * 10, 0);
        ctx.lineTo(-10, -5);
        ctx.fillStyle = '#ffaa00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff5500';
        ctx.fill();
    }
    
    ctx.restore();
}

function drawBullet(b) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI*2);
    ctx.fillStyle = b.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = b.color;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawHP(x, y, hp, color) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x - 20, y - 25, 40, 4);
    ctx.fillStyle = color;
    ctx.shadowBlur = 5;
    ctx.shadowColor = color;
    ctx.fillRect(x - 20, y - 25, (hp/100)*40, 4);
    ctx.shadowBlur = 0;
}

// Network
window.handleNetworkData = function(payload) {
    if (currentGame !== 'space') return;

    if (isHostingSpace) {
        // Host receives client inputs
        if (payload.action === 'input') {
            sState.p2.keys = payload.keys; // Apply client keys to P2
        }
    } else {
        // Client receives world state
        sState.p1.x = payload.p1x; sState.p1.y = payload.p1y; sState.p1.angle = payload.p1a; sState.p1.hp = payload.p1hp;
        sState.p2.x = payload.p2x; sState.p2.y = payload.p2y; sState.p2.angle = payload.p2a; sState.p2.hp = payload.p2hp;
        sState.bullets = payload.b;
        
        // Also apply own thruster visual for client side
        sState.p2_thrust = payload.p2t;
        sState.p1_thrust = payload.p1t;
    }
};

window.handleNetworkEvent = function(event, content) {
    if (event === 'gameover') {
        endSpace(content.winner);
    }
    if (event === 'rematch') {
        document.getElementById('gameOverlay').style.display = 'none';
        initSpace(isHostingSpace);
    }
};

function endSpace(winner) {
    stopGameLoop();
    document.getElementById('gameOverlay').style.display = 'flex';
    const title = document.getElementById('winnerText');
    const iWon = (isHostingSpace && winner === 'Host') || (!isHostingSpace && winner === 'Client');
    
    if (iWon) {
        title.textContent = 'VICTORY';
        title.style.color = '#00ffcc';
        addScore(150);
    } else {
        title.textContent = 'DEFEAT';
        title.style.color = '#ff007f';
        addScore(25);
    }
}

function processPhysics() {
    // Apply host local input to P1
    applyInput(sState.p1, sState.keys);
    
    // Apply client remote input to P2
    if (sState.p2.keys) {
        applyInput(sState.p2, sState.p2.keys);
    }

    // Process Bullets
    for (let i = sState.bullets.length - 1; i >= 0; i--) {
        let b = sState.bullets[i];
        b.x += Math.cos(b.angle) * 12;
        b.y += Math.sin(b.angle) * 12;
        b.life--;
        
        // Collision
        if (b.owner === 'p1' && dist(b, sState.p2) < 20) {
            sState.p2.hp -= 10;
            sState.bullets.splice(i, 1);
        } else if (b.owner === 'p2' && dist(b, sState.p1) < 20) {
            sState.p1.hp -= 10;
            sState.bullets.splice(i, 1);
        } else if (b.life <= 0 || b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
            sState.bullets.splice(i, 1);
        }
    }

    // Win check
    if (sState.p2.hp <= 0) { sendEvent('gameover', { winner: 'Host' }); endSpace('Host'); }
    if (sState.p1.hp <= 0) { sendEvent('gameover', { winner: 'Client' }); endSpace('Client'); }
}

function applyInput(p, keys) {
    if (keys.left) p.angle -= 0.08;
    if (keys.right) p.angle += 0.08;
    
    p.thrust = keys.up;
    if (keys.up) {
        p.speed = Math.min(p.speed + 0.5, 6);
    } else {
        p.speed *= 0.95; // friction
    }
    
    p.x += Math.cos(p.angle) * p.speed;
    p.y += Math.sin(p.angle) * p.speed;
    
    // Wrap screen
    if(p.x < 0) p.x = canvas.width; if(p.x > canvas.width) p.x = 0;
    if(p.y < 0) p.y = canvas.height; if(p.y > canvas.height) p.y = 0;

    // Shooting
    p.cooldown = (p.cooldown || 0) + 1;
    if (keys.space && p.cooldown > 15) {
        p.cooldown = 0;
        sState.bullets.push({
            x: p.x + Math.cos(p.angle)*15,
            y: p.y + Math.sin(p.angle)*15,
            angle: p.angle,
            color: p.color,
            owner: p === sState.p1 ? 'p1' : 'p2',
            life: 100
        });
    }
}

function dist(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

// Main Loop
function updateSpace() {
    ctx.fillStyle = 'rgba(5, 5, 16, 0.4)'; // Trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (isHostingSpace) {
        processPhysics();
        
        // Broadcast World State
        sendState({
            p1x: sState.p1.x, p1y: sState.p1.y, p1a: sState.p1.angle, p1hp: sState.p1.hp, p1t: sState.keys.up,
            p2x: sState.p2.x, p2y: sState.p2.y, p2a: sState.p2.angle, p2hp: sState.p2.hp, p2t: sState.p2.keys?.up || false,
            b: sState.bullets
        });
    } else {
        // Client just sends inputs
        sendState({
            action: 'input',
            keys: sState.keys
        });
    }

    // Render
    drawShip(sState.p1.x, sState.p1.y, sState.p1.angle, sState.p1.color, isHostingSpace ? sState.keys.up : sState.p1_thrust);
    drawHP(sState.p1.x, sState.p1.y, sState.p1.hp, sState.p1.color);
    
    drawShip(sState.p2.x, sState.p2.y, sState.p2.angle, sState.p2.color, isHostingSpace ? sState.p2.keys?.up : sState.keys.up); // client uses own keys for local thrust visual, or uses host sync p2t
    drawHP(sState.p2.x, sState.p2.y, sState.p2.hp, sState.p2.color);

    sState.bullets.forEach(b => drawBullet(b));

    spaceLoop = requestAnimationFrame(updateSpace);
}
