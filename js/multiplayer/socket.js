// ============= MULTIPLAYER SOCKET =============
// Socket.io connection and event handling

import { state } from '../state.js';
import { MP_USERNAME_KEY, MP_NAME_SET_KEY } from '../config.js';
import { playPickupSound, playDeliverySound, playRecordSound } from '../audio/effects.js';
import { showMessage, updateOrdersPanel } from '../ui/hud.js';
import { addOtherPlayer, removeOtherPlayer, updateOtherPlayerPosition } from '../entities/players.js';
import { updateLeaderboard } from '../ui/leaderboard.js';

// ============= USERNAME MANAGEMENT =============
export function getPlayerUsername() {
    return localStorage.getItem(MP_USERNAME_KEY) || 'Entregador';
}

export function savePlayerUsername(username) {
    localStorage.setItem(MP_USERNAME_KEY, username);
}

export function hasUserSetName() {
    return localStorage.getItem(MP_NAME_SET_KEY) === 'true';
}

export function markNameAsSet() {
    localStorage.setItem(MP_NAME_SET_KEY, 'true');
}

export function updateNameDisplay() {
    const display = document.getElementById('current-name-display');
    if (display) {
        display.textContent = getPlayerUsername();
    }
}

// ============= NAME MODAL =============
export function openNameModal() {
    const modal = document.getElementById('name-modal');
    const input = document.getElementById('name-input');
    input.value = getPlayerUsername();
    modal.style.display = 'flex';
    input.focus();
    input.select();
}

export function closeNameModal() {
    document.getElementById('name-modal').style.display = 'none';
}

export async function saveNameAndClose() {
    const input = document.getElementById('name-input');
    let name = input.value.trim();

    if (!name) {
        name = 'Entregador';
    }

    savePlayerUsername(name);
    markNameAsSet();
    updateNameDisplay();
    closeNameModal();

    // Sync username with server if session exists
    if (state.multiplayerServerUrl && state.sessionInitialized) {
        try {
            await fetch(state.multiplayerServerUrl + '/api/session/username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username: name })
            });
        } catch (error) {
            console.error('Failed to sync username:', error);
        }
    }
}

export function checkFirstTimeUser() {
    // Setup enter key handler for name input
    const nameInput = document.getElementById('name-input');
    if (nameInput) {
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveNameAndClose();
            }
        });
    }

    if (!hasUserSetName()) {
        openNameModal();
    }
    updateNameDisplay();
}

// ============= SESSION MANAGEMENT =============
async function initializeSession() {
    if (!state.multiplayerServerUrl || state.sessionInitialized) return null;

    try {
        console.log('Initializing session with:', state.multiplayerServerUrl + '/api/session');
        const response = await fetch(state.multiplayerServerUrl + '/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username: getPlayerUsername() })
        });

        console.log('Session response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            state.sessionInitialized = true;

            // Sync username from server if different
            if (data.username && data.username !== getPlayerUsername()) {
                savePlayerUsername(data.username);
                updateNameDisplay();
            }

            console.log('Session initialized:', data.isNewUser ? 'new user' : 'existing user');
            return data;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Session API error:', response.status, errorData);
        }
    } catch (error) {
        console.error('Failed to initialize session (network/CORS error?):', error);
    }
    return null;
}

// ============= CONNECTION STATUS =============
function setConnectionStatus(status, message) {
    const el = document.getElementById('connection-status');
    if (!el) return;

    el.className = 'connection-status ' + status;
    el.textContent = message || status;
}

// ============= ONLINE PANEL =============
function toggleOnlinePanel() {
    const panel = document.getElementById('online-panel');
    if (panel) {
        panel.classList.toggle('expanded');
    }
}

function setupOnlinePanelToggle() {
    const panel = document.getElementById('online-panel');
    if (panel) {
        panel.addEventListener('click', toggleOnlinePanel);
    }
}

export function updateOnlinePlayersUI() {
    const countEl = document.getElementById('online-player-count');
    const listEl = document.getElementById('online-players-list');
    if (!countEl || !listEl) return;

    const allPlayers = [
        { id: state.myPlayerId, username: getPlayerUsername(), money: state.score, isMe: true },
        ...Object.values(state.otherPlayers).map(p => ({
            id: p.data.id,
            username: p.data.username,
            money: p.data.money || 0,
            isMe: false
        }))
    ];

    // Sort by money
    allPlayers.sort((a, b) => b.money - a.money);

    countEl.textContent = allPlayers.length;

    listEl.innerHTML = allPlayers.map(p => `
        <div class="online-player-item">
            <span class="online-player-name ${p.isMe ? 'you' : ''}">${p.username}${p.isMe ? ' (você)' : ''}</span>
            <span class="online-player-score">R$ ${p.money}</span>
        </div>
    `).join('');
}

// ============= SOCKET CONNECTION =============
export async function connectToMultiplayer() {
    if (!state.multiplayerServerUrl) {
        console.error('Multiplayer server URL not configured');
        return;
    }

    setConnectionStatus('connecting', 'Conectando...');

    // Initialize session first (creates session cookie if needed)
    const session = await initializeSession();
    if (!session) {
        setConnectionStatus('disconnected', 'Erro ao criar sessão');
        return;
    }

    // Dynamically load socket.io if not already loaded
    if (typeof io === 'undefined') {
        const script = document.createElement('script');
        script.src = state.multiplayerServerUrl + '/socket.io/socket.io.js';
        script.onload = () => initSocketConnection();
        script.onerror = () => {
            setConnectionStatus('disconnected', 'Erro ao conectar');
            console.error('Failed to load socket.io');
        };
        document.head.appendChild(script);
    } else {
        initSocketConnection();
    }
}

function initSocketConnection() {
    state.socket = io(state.multiplayerServerUrl, {
        withCredentials: true
    });

    state.socket.on('connect', () => {
        setConnectionStatus('connected', 'Conectado');

        // Join the game (session validated via cookie on server)
        state.socket.emit('join', {
            username: getPlayerUsername()
        });
    });

    state.socket.on('disconnect', () => {
        setConnectionStatus('disconnected', 'Desconectado');
        state.isMultiplayer = false;

        // Remove all other players
        Object.keys(state.otherPlayers).forEach(id => {
            if (state.otherPlayers[id].mesh) {
                state.scene.remove(state.otherPlayers[id].mesh);
            }
        });
        state.otherPlayers = {};
    });

    state.socket.on('error', (error) => {
        console.error('Socket error:', error);
        setConnectionStatus('disconnected', 'Erro: ' + error.message);
    });

    // Game initialization
    state.socket.on('init', (data) => {
        state.myPlayerId = data.playerId;

        // Add existing players
        data.otherPlayers.forEach(playerData => {
            addOtherPlayer(playerData);
        });

        // Set current delivery from server
        if (data.currentDelivery) {
            state.currentOrder = {
                restaurant: data.currentDelivery.restaurant.name,
                restaurantEmoji: data.currentDelivery.restaurant.emoji,
                customer: data.currentDelivery.customer.name,
                customerEmoji: data.currentDelivery.customer.emoji
            };
        }

        // Show online panel and setup toggle
        document.getElementById('online-panel').classList.add('visible');
        setupOnlinePanelToggle();
        updateOnlinePlayersUI();

        state.isMultiplayer = true;
        console.log('Multiplayer initialized with', data.otherPlayers.length, 'other players');
    });

    // New player joined
    state.socket.on('player-joined', (playerData) => {
        addOtherPlayer(playerData);
        updateOnlinePlayersUI();
    });

    // Player left
    state.socket.on('player-left', (playerId) => {
        removeOtherPlayer(playerId);
        updateOnlinePlayersUI();
    });

    // Player moved
    state.socket.on('player-moved', (data) => {
        updateOtherPlayerPosition(data.id, data);
    });

    // Player stats updated (other player completed delivery)
    state.socket.on('player-stats-updated', (data) => {
        if (state.otherPlayers[data.id]) {
            state.otherPlayers[data.id].data.money = data.money;
            state.otherPlayers[data.id].data.deliveries = data.deliveries;
            updateOnlinePlayersUI();
        }
    });

    // Player updated (hasFood, etc)
    state.socket.on('player-updated', (data) => {
        if (state.otherPlayers[data.id]) {
            Object.assign(state.otherPlayers[data.id].data, data);
        }
    });

    // New delivery assigned
    state.socket.on('new-delivery', (delivery) => {
        console.log('Server assigned delivery:', delivery);
        state.currentOrder = {
            restaurant: delivery.restaurant.name,
            restaurantEmoji: delivery.restaurant.emoji,
            customer: delivery.customer.name,
            customerEmoji: delivery.customer.emoji
        };
        updateOrdersPanel();
    });

    // Pickup success
    state.socket.on('pickup-success', (data) => {
        state.hasFood = true;
        playPickupSound();
        showMessage(state.currentOrder.restaurantEmoji, "Pedido Coletado!", `De: ${state.currentOrder.restaurant}`);
        updateOrdersPanel();
    });

    // Delivery success
    state.socket.on('delivery-success', (data) => {
        state.score = data.newTotal;
        state.deliveriesCount = data.deliveries;
        playDeliverySound();

        const messages = [
            { text: "Entrega Realizada!", emoji: "🎉" },
            { text: "Boa entrega, motoboy!", emoji: "🔥" },
            { text: "Cliente feliz!", emoji: "😋" },
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        showMessage(msg.emoji, msg.text, `+R$ ${data.reward},00`);

        state.hasFood = false;
        // Note: currentOrder will be set by the 'new-delivery' event from server
    });

    // Round ended
    state.socket.on('round-ended', (data) => {
        console.log('Round ended:', data);
        if (data.leaderboard) {
            updateLeaderboard(data.leaderboard);

            // Check if player made the leaderboard
            const username = getPlayerUsername();
            const playerInLeaderboard = data.leaderboard.some(
                entry => entry.username === username && entry.score === data.finalScore
            );

            if (playerInLeaderboard && data.finalScore > 0) {
                const badge = document.getElementById('new-record-badge');
                if (badge) {
                    badge.classList.add('visible');
                    playRecordSound();
                }
            }
        }
    });

    // New round started (after restart)
    state.socket.on('round-started', (data) => {
        console.log('New round started:', data);
        // Update delivery from server
        if (data.currentDelivery) {
            state.currentOrder = {
                restaurant: data.currentDelivery.restaurant.name,
                restaurantEmoji: data.currentDelivery.restaurant.emoji,
                customer: data.currentDelivery.customer.name,
                customerEmoji: data.currentDelivery.customer.emoji
            };
            state.hasFood = false;
            updateOrdersPanel();
        }
    });

    // Leaderboard data
    state.socket.on('leaderboard', (data) => {
        updateLeaderboard(data);
    });
}

export function broadcastPosition() {
    if (!state.isMultiplayer || !state.socket || !state.motorcycle) return;

    state.socket.emit('move', {
        x: state.motorcycle.position.x,
        z: state.motorcycle.position.z,
        rotation: state.rotation
    });
}

// Debug function - call window.debugPlayerState() from browser console
window.debugPlayerState = function() {
    console.log('=== PLAYER STATE DEBUG ===');
    console.log('My player ID:', state.myPlayerId);
    console.log('My score:', state.score);
    console.log('Other players:');
    Object.entries(state.otherPlayers).forEach(([id, player]) => {
        console.log(`  ${id}:`, {
            username: player.data.username,
            money: player.data.money,
            deliveries: player.data.deliveries,
            fullData: player.data
        });
    });
    console.log('=== END DEBUG ===');
};
