// ============= MAIN ENTRY POINT =============
// Orchestrates all game modules

import { state, resetGameState } from './state.js';
import { CONFIG } from './config.js';

// Audio
import { initAudio, stopEngineSound } from './audio/engine.js';
import { startBackgroundMusic, stopBackgroundMusic } from './audio/music.js';
import { playRecordSound } from './audio/effects.js';

// World
import { initScene, createLights, createSky, updateClouds, updateCamera, onWindowResize } from './world/scene.js';
import { createGround, createStreets, createBuildings, createStreetLights, createSimpleBillboards } from './world/city.js';
import { createTrafficCars, updateTrafficCars } from './world/traffic.js';

// Entities
import { createMotorcycle, updateMotorcycle } from './entities/motorcycle.js';
import { createRestaurants, createCustomers, updateMarkers } from './entities/markers.js';
import { updateOtherPlayers } from './entities/players.js';

// Input
import { setupControls } from './input/controls.js';

// UI
import { updateHUD, updateOrdersPanel, showMessage } from './ui/hud.js';
import { updateMinimap } from './ui/minimap.js';
import {
    showLeaderboard,
    hideLeaderboard,
    addScoreToLeaderboard,
    isNewRecord
} from './ui/leaderboard.js';
import {
    initJoystickPosition,
    setJoystickPosition,
    initSoundPreferences,
    toggleEngineSound,
    toggleMusic,
    openSoundMenu,
    closeSoundMenu
} from './ui/preferences.js';

// Gameplay
import { generateNewOrder } from './gameplay/orders.js';
import { checkCollisions } from './gameplay/collision.js';

// Multiplayer
import {
    connectToMultiplayer,
    broadcastPosition,
    updateOnlinePlayersUI,
    checkFirstTimeUser,
    openNameModal,
    saveNameAndClose
} from './multiplayer/socket.js';

// ============= GAME FLOW =============
function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    // Show online panel if in multiplayer mode
    if (state.isMultiplayer) {
        document.getElementById('online-panel').classList.add('visible');
    }

    // Hide connection status during gameplay
    document.getElementById('connection-status').style.display = 'none';

    // Hide cursor during gameplay
    document.body.classList.add('game-active');

    // Initialize audio on user interaction
    initAudio();

    // Reset game state
    resetGameState();

    // Reset motorcycle position
    state.motorcycle.position.set(0, 0, 0);
    state.motorcycle.rotation.set(0, 0, 0);

    // Generate first order if not already set by server
    if (!state.isMultiplayer || !state.currentOrder) {
        generateNewOrder();
    } else {
        updateOrdersPanel();
    }

    state.gameRunning = true;

    // Start background music if enabled
    if (state.musicEnabled) {
        startBackgroundMusic();
    }

    // Show welcome message based on device type
    setTimeout(() => {
        const isTouchDevice = isMobileDevice();
        if (isTouchDevice) {
            showMessage("🏍️", "Bora trabalhar!", "Use o joystick para dirigir");
        } else {
            showMessage("🏍️", "Bora trabalhar!", "Use WASD ou setas para dirigir");
        }
    }, 500);
}

function isMobileDevice() {
    return (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        window.innerWidth <= 768
    );
}

function endGame() {
    state.gameRunning = false;
    stopEngineSound();
    stopBackgroundMusic();
    document.body.classList.remove('game-active');

    // Notify server if multiplayer
    if (state.isMultiplayer && state.socket) {
        state.socket.emit('end-round');
    }

    // Hide online panel during end screen
    document.getElementById('online-panel').classList.remove('visible');

    document.getElementById('hud').style.display = 'none';
    document.getElementById('game-over').style.display = 'flex';

    document.getElementById('final-score').textContent = state.score.toLocaleString('pt-BR');
    document.getElementById('stat-deliveries').textContent = state.deliveriesCount;
    document.getElementById('stat-distance').textContent = (state.distanceTraveled / 1000).toFixed(1);

    const isRecord = isNewRecord(state.score);
    const newRecordBadge = document.getElementById('new-record-badge');

    addScoreToLeaderboard({
        score: state.score,
        deliveries: state.deliveriesCount,
        distance: parseFloat((state.distanceTraveled / 1000).toFixed(1))
    });

    if (isRecord && state.score > 0) {
        newRecordBadge.classList.add('visible');
        playRecordSound();
    } else {
        newRecordBadge.classList.remove('visible');
    }
}

function restartGame() {
    document.getElementById('game-over').style.display = 'none';

    // If in multiplayer and still connected, emit start-round to server
    if (state.isMultiplayer && state.socket && state.socket.connected) {
        state.socket.emit('start-round');
    }

    startGame();
}

async function startMultiplayerGame() {
    if (!state.multiplayerServerUrl) {
        alert('Servidor multiplayer não disponível ainda!');
        return;
    }

    await connectToMultiplayer();

    // Wait for connection then start game
    const checkConnection = setInterval(() => {
        if (state.isMultiplayer) {
            clearInterval(checkConnection);
            startGame();
        }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(checkConnection);
        if (!state.isMultiplayer) {
            const el = document.getElementById('connection-status');
            if (el) {
                el.className = 'connection-status disconnected';
                el.textContent = 'Tempo esgotado';
            }
        }
    }, 10000);
}

// ============= GAME LOOP =============
function animate() {
    requestAnimationFrame(animate);

    const delta = state.clock.getDelta();

    if (state.gameRunning) {
        updateMotorcycle(delta);
        updateCamera();
        updateTrafficCars(delta);
        updateMarkers(delta);
        updateClouds(delta);
        checkCollisions();
        updateHUD(endGame);
        updateMinimap();

        // Multiplayer updates
        if (state.isMultiplayer) {
            updateOtherPlayers();
            broadcastPosition();

            // Update online players UI less frequently
            if (Math.floor(state.clock.getElapsedTime() * 2) % 2 === 0) {
                updateOnlinePlayersUI();
            }
        }
    } else {
        // Clouds still move on start screen
        updateClouds(delta);
        // Gentle camera rotation on start screen
        const time = state.clock.getElapsedTime();
        state.camera.position.x = Math.sin(time * 0.1) * 30;
        state.camera.position.z = Math.cos(time * 0.1) * 30;
        state.camera.position.y = 20;
        state.camera.lookAt(0, 0, 0);
    }

    state.renderer.render(state.scene, state.camera);
}

// ============= INITIALIZATION =============
function init() {
    // Scene setup
    initScene();
    createLights();
    createSky();

    // City
    createGround();
    createStreets();
    createBuildings();
    createStreetLights();

    // Traffic
    createTrafficCars();

    // Player
    createMotorcycle();

    // Game elements
    createRestaurants();
    createCustomers();

    // Enhancements
    createSimpleBillboards();

    // Event listeners
    setupControls();
    window.addEventListener('resize', onWindowResize);

    // Custom cursor
    document.addEventListener('mousemove', (e) => {
        const cursor = document.getElementById('cursor');
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Initialize preferences
    initJoystickPosition();
    initSoundPreferences();

    // Hide keyboard instructions on mobile devices
    if (isMobileDevice()) {
        const instructions = document.querySelector('.instructions');
        if (instructions) {
            instructions.style.display = 'none';
        }
    }

    // Hide loading, show start
    document.getElementById('loading').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';

    // Check if first time user needs to set name
    checkFirstTimeUser();

    // Start render loop
    animate();
}

// ============= EXPOSE FUNCTIONS TO WINDOW =============
// These are called from HTML onclick handlers
window.startMultiplayerGame = startMultiplayerGame;
window.restartGame = restartGame;
window.showLeaderboard = showLeaderboard;
window.hideLeaderboard = hideLeaderboard;
window.openNameModal = openNameModal;
window.saveNameAndClose = saveNameAndClose;
window.setJoystickPosition = setJoystickPosition;
window.toggleEngineSound = toggleEngineSound;
window.toggleMusic = toggleMusic;
window.openSoundMenu = openSoundMenu;
window.closeSoundMenu = closeSoundMenu;

// ============= START =============
// Set multiplayer server URL
state.multiplayerServerUrl = window.location.origin;

// Initialize the game
init();
