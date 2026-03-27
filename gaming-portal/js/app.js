// === app.js (UI & Profile State Management) ===

let userProfile = {
    username: 'Guest' + Math.floor(Math.random() * 1000),
    color: '#00ffcc',
    score: 0
};

let currentGame = null;

const API_BASE = 'http://localhost:3000/api';
let authToken = localStorage.getItem('nexus_token');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    updateProfileUI();

    if (authToken) {
        checkAuth();
    }

    // Check URL parameters for invite links
    const urlParams = new URLSearchParams(window.location.search);
    const lobbyId = urlParams.get('lobby');
    const gameId = urlParams.get('game');
    
    if (lobbyId && gameId) {
        // Auto-join if link has params
        document.getElementById('joinLobbyId').value = lobbyId;
        currentGame = gameId;
        joinLobby(); // defined in multiplayer.js
    }
});

// Profile Management
function loadProfile() {
    const saved = localStorage.getItem('nexus_profile');
    if (saved) {
        userProfile = JSON.parse(saved);
    } else {
        saveProfileToStorage();
    }
}

function saveProfileToStorage() {
    localStorage.setItem('nexus_profile', JSON.stringify(userProfile));
}

function updateProfileUI() {
    document.getElementById('displayUsername').textContent = userProfile.username;
    document.getElementById('displayScore').textContent = 'Score: ' + userProfile.score;
    const avatar = document.getElementById('avatarIcon');
    avatar.textContent = userProfile.username.substring(0, 2).toUpperCase();
    avatar.style.color = '#000';
    avatar.style.backgroundColor = userProfile.color;
    avatar.style.boxShadow = `0 0 10px ${userProfile.color}`;
}

// Modal Logic
function toggleProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        updateAuthUI();
        modal.style.display = 'flex';
    }
}

function updateAuthUI() {
    const authForms = document.getElementById('authForms');
    const loggedInProfile = document.getElementById('loggedInProfile');
    
    if (authToken) {
        authForms.style.display = 'none';
        loggedInProfile.style.display = 'block';
        document.getElementById('profileTagName').textContent = userProfile.username;
        document.getElementById('profileTotalScore').textContent = userProfile.score;
    } else {
        authForms.style.display = 'block';
        loggedInProfile.style.display = 'none';
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

// Authentication Handlers
async function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            authToken = data.token;
            localStorage.setItem('nexus_token', authToken);
            userProfile = data.user;
            saveProfileToStorage();
            updateProfileUI();
            updateAuthUI();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Login error:", err);
    }
}

async function handleRegister() {
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const color = document.getElementById('regColor').value;

    try {
        const res = await fetch(`${API_BASE}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, color })
        });
        const data = await res.json();
        if (res.ok) {
            authToken = data.token;
            localStorage.setItem('nexus_token', authToken);
            userProfile = data.user;
            saveProfileToStorage();
            updateProfileUI();
            updateAuthUI();
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error("Registration error:", err);
    }
}

function handleLogout() {
    authToken = null;
    localStorage.removeItem('nexus_token');
    userProfile.username = 'Guest' + Math.floor(Math.random() * 1000);
    userProfile.score = 0;
    saveProfileToStorage();
    updateProfileUI();
    updateAuthUI();
}

async function checkAuth() {
    // Optional: verify token validity with backend
}

// Leaderboard Logic
async function toggleLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    if (modal.style.display === 'flex') {
        modal.style.display = 'none';
    } else {
        await fetchLeaderboard();
        modal.style.display = 'flex';
    }
}

async function fetchLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '<p>Loading ranks...</p>';
    
    try {
        const res = await fetch(`${API_BASE}/scores/leaderboard`);
        const data = await res.json();
        
        list.innerHTML = '';
        data.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <span class="rank">#${index + 1}</span>
                <span class="name" style="color: ${entry.color}">${entry.username}</span>
                <span class="points">${entry.score} pts</span>
            `;
            list.appendChild(item);
        });
    } catch (err) {
        list.innerHTML = '<p>Error loading leaderboard.</p>';
    }
}

// Game Selection
function selectGame(gameId) {
    // Visual feedback
    document.querySelectorAll('.game-card').forEach(c => c.style.borderColor = 'var(--border-color)');
    const card = document.querySelector(`.game-card[onclick="selectGame('${gameId}')"]`);
    if(card) {
        card.style.borderColor = 'var(--primary)';
        card.style.boxShadow = 'var(--primary-glow)';
    }

    currentGame = gameId;
    
    // Highlight Host button
    const hostBtn = document.getElementById('btnCreateLobby');
    hostBtn.style.animation = 'pulse 1s infinite alternate';
    setTimeout(() => hostBtn.style.animation = '', 3000);
}

// UI State Switching
function showGameUI(isHost) {
    document.getElementById('hub-ui').style.display = 'none';
    document.getElementById('game-ui').style.display = 'flex';
    document.getElementById('gameOverlay').style.display = 'none';

    // Set player names
    if (isHost) {
        document.getElementById('p1Name').textContent = userProfile.username;
        document.getElementById('p1Name').style.color = userProfile.color;
        document.getElementById('p2Name').textContent = 'Opponent';
    } else {
        document.getElementById('p2Name').textContent = userProfile.username;
        document.getElementById('p2Name').style.color = userProfile.color;
        document.getElementById('p1Name').textContent = 'Host';
    }

    // Initialize the specific game logic
    if (currentGame === 'pong' && typeof initPong === 'function') {
        initPong(isHost);
    } else if (currentGame === 'space' && typeof initSpace === 'function') {
        initSpace(isHost);
    } else if (currentGame === 'hex' && typeof initHex === 'function') {
        initHex(isHost);
    } else {
        console.error("Game script not loaded for:", currentGame);
        quitGame();
    }
}

function quitGame() {
    disconnect(); // defined in multiplayer.js
    
    document.getElementById('hub-ui').style.display = 'flex';
    document.getElementById('game-ui').style.display = 'none';
    
    // Stop game loops if any
    if (typeof stopGameLoop === 'function') stopGameLoop();
    
    // Reset URL to cleanly exit lobby
    window.history.pushState({}, document.title, window.location.pathname);
}

// Helper: Append a score after match
async function addScore(points) {
    userProfile.score += points;
    saveProfileToStorage();
    updateProfileUI();

    if (authToken) {
        try {
            await fetch(`${API_BASE}/scores`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ score: points, game: currentGame })
            });
        } catch (err) {
            console.error("Score sync error:", err);
        }
    }
}

function copyInviteLink() {
    const linkInput = document.getElementById('inviteLinkInput');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999);
    document.execCommand('copy');
    alert("Share link copied to clipboard!");
}
