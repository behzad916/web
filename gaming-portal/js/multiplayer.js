// === multiplayer.js (WebRTC Networking via PeerJS) ===

let peer = null;
let conn = null;
let isHost = false;

// Generate a random ID for the peer
const generateId = () => 'nxs-' + Math.random().toString(36).substr(2, 6);

// Initialize Peer object
function initPeer(onReady) {
    const statusDot = document.getElementById('connStatusDot');
    const statusText = document.getElementById('connStatusText');
    
    peer = new Peer(generateId(), {
        debug: 2 // Log warnings/errors
    });

    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        statusDot.className = 'status-indicator online';
        statusText.textContent = 'Nexus Node Online';
        if (onReady) onReady(id);
    });

    peer.on('error', (err) => {
        console.error('Peer error:', err);
        statusDot.className = 'status-indicator offline';
        statusText.textContent = 'Connection Error: ' + err.type;
        alert('Network error. Please try again.');
    });

    // When someone connects to us (Host logic)
    peer.on('connection', (c) => {
        if (conn) {
            c.send({ type: 'error', message: 'Lobby is full.' });
            c.close();
            return;
        }

        conn = c;
        setupConnection(conn, true);
    });
}

// HOST: Create a new lobby
function createLobby() {
    if (!currentGame) {
        alert("Please select a game first!");
        return;
    }

    if (!peer) {
        initPeer((id) => {
            showLobbyUI(id);
        });
    } else {
        showLobbyUI(peer.id);
    }
}

function showLobbyUI(peerId) {
    isHost = true;
    document.getElementById('activeLobby').style.display = 'block';
    
    // Generate share link
    const baseUrl = window.location.origin + window.location.pathname;
    const shareLink = `${baseUrl}?lobby=${peerId}&game=${currentGame}`;
    document.getElementById('inviteLinkInput').value = shareLink;
}

// CLIENT: Join an existing lobby
function joinLobby() {
    const hostId = document.getElementById('joinLobbyId').value.trim();
    if (!hostId) {
        alert("Enter an invite code first!");
        return;
    }

    if (!currentGame) {
        alert("Please select what game you are trying to join first!");
        // Actually, could auto-select if via URL
    }

    if (!peer) {
        initPeer(() => connectToHost(hostId));
    } else {
        connectToHost(hostId);
    }
}

function connectToHost(hostId) {
    document.getElementById('connStatusText').textContent = 'Connecting to Host...';
    isHost = false;
    conn = peer.connect(hostId, {
        reliable: false // use UDP-like for lower latency in games
    });

    setupConnection(conn, false);
}

// Setup Data Channel Events (Both Host and Client)
function setupConnection(c, iAmHost) {
    c.on('open', () => {
        console.log("Connected to:", c.peer);
        document.getElementById('connStatusText').textContent = 'Connected! Starting match...';
        
        // Immediately send profile info
        c.send({
            type: 'handshake',
            username: userProfile.username,
            color: userProfile.color,
            game: currentGame
        });

        // Launch game UI
        showGameUI(iAmHost);
        
        // Start ping calculation
        setInterval(sendPing, 2000);
    });

    c.on('data', (data) => {
        // Handle Handshake
        if (data.type === 'handshake') {
            const oppNameEl = iAmHost ? document.getElementById('p2Name') : document.getElementById('p1Name');
            oppNameEl.textContent = data.username;
            oppNameEl.style.color = data.color;
            if (iAmHost && currentGame !== data.game) {
                 console.warn("Games don't match! Client wants:", data.game);
                 // Host dictates game
                 c.send({ type: 'sync_game_type', game: currentGame });
            }
        }
        
        // Handle Game Sync
        if (data.type === 'game_sync' && typeof handleNetworkData === 'function') {
            handleNetworkData(data.payload);
        }

        // Handle Ping
        if (data.type === 'ping') {
            c.send({ type: 'pong', time: data.time });
        }
        if (data.type === 'pong') {
            const rtt = Date.now() - data.time;
            document.getElementById('gamePing').textContent = `Ping: ${rtt} ms`;
            document.getElementById('gamePing').style.color = rtt < 50 ? '#00ffcc' : rtt < 150 ? '#f59e0b' : '#ff007f';
        }
        
        // Handle Game Events (Score, Win, Rematch)
        if (data.type === 'game_event' && typeof handleNetworkEvent === 'function') {
            handleNetworkEvent(data.event, data.content);
        }
    });

    c.on('close', () => {
        alert("Opponent disconnected.");
        quitGame();
    });
}

function sendPing() {
    if (conn && conn.open) {
        conn.send({ type: 'ping', time: Date.now() });
    }
}

// Wrapper for sending game state to opponent (called by game scripts)
function sendState(payload) {
    if (conn && conn.open) {
        conn.send({ type: 'game_sync', payload: payload });
    }
}

// Wrapper for sending game events (score update, game over)
function sendEvent(event, content) {
    if (conn && conn.open) {
        conn.send({ type: 'game_event', event: event, content: content });
    }
}

function disconnect() {
    if (conn) { conn.close(); conn = null; }
    document.getElementById('activeLobby').style.display = 'none';
    document.getElementById('connStatusText').textContent = 'Nexus Node Online';
    isHost = false;
}

// Start PeerJS connection on load
window.addEventListener('load', () => {
    // Only init if not auto-joining via URL
    if (!window.location.search.includes('lobby=')) {
        initPeer();
    }
});
