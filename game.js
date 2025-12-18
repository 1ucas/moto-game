// Food Rush - The Game!
// A fun Three.js delivery game

// ============= LEADERBOARD SYSTEM =============
const LEADERBOARD_KEY = 'ifoodRushLeaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;
const JOYSTICK_POSITION_KEY = 'ifoodRushJoystickPosition';
const ENGINE_SOUND_KEY = 'ifoodRushEngineSound';
const MUSIC_KEY = 'ifoodRushMusic';

// Sound/Music state
let engineSoundEnabled = true;
let musicEnabled = true;
let musicNodes = null; // Will hold the background music oscillators

// Track the last added entry to highlight it in leaderboard
let lastAddedEntryDate = null;

function getLeaderboard() {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading leaderboard:', e);
        return [];
    }
}

function saveLeaderboard(leaderboard) {
    try {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch (e) {
        console.error('Error saving leaderboard:', e);
    }
}

function addScoreToLeaderboard(scoreData) {
    const leaderboard = getLeaderboard();
    const entry = {
        name: getPlayerUsername(),
        score: scoreData.score,
        deliveries: scoreData.deliveries,
        distance: scoreData.distance,
        date: new Date().toISOString()
    };

    // Track this entry as the last added one
    lastAddedEntryDate = entry.date;

    leaderboard.push(entry);
    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);
    // Keep only top entries
    const trimmedLeaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
    saveLeaderboard(trimmedLeaderboard);

    // Return the rank (1-indexed) or -1 if not in top scores
    const rank = trimmedLeaderboard.findIndex(e =>
        e.score === entry.score &&
        e.date === entry.date
    );
    return rank !== -1 ? rank + 1 : -1;
}

function isNewRecord(score) {
    const leaderboard = getLeaderboard();
    if (leaderboard.length < MAX_LEADERBOARD_ENTRIES) return true;
    return score > leaderboard[leaderboard.length - 1].score;
}

function formatLeaderboardDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
}

function showLeaderboard() {
    const leaderboard = getLeaderboard();
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const leaderboardBody = document.getElementById('leaderboard-body');

    leaderboardBody.innerHTML = '';

    if (leaderboard.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">Nenhum recorde ainda! Jogue para aparecer aqui.</td></tr>';
    } else {
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const positionText = rankEmoji ? rankEmoji : `#${index + 1}`;
            const isCurrentEntry = lastAddedEntryDate && entry.date === lastAddedEntryDate;
            const playerName = entry.name || 'Entregador';
            row.innerHTML = `
                <td class="rank-cell">${positionText}</td>
                <td class="name-cell">${playerName}</td>
                <td class="score-cell">R$ ${entry.score.toLocaleString('pt-BR')}</td>
                <td>${entry.deliveries}</td>
                <td class="date-cell">${formatLeaderboardDate(entry.date)}${isCurrentEntry ? ' ←' : ''}</td>
            `;
            if (index < 3) {
                row.classList.add('top-rank');
            }
            if (isCurrentEntry) {
                row.classList.add('current-entry');
            }
            leaderboardBody.appendChild(row);
        });
    }

    leaderboardScreen.style.display = 'flex';
}

function hideLeaderboard() {
    document.getElementById('leaderboard-screen').style.display = 'none';
}

// ============= JOYSTICK POSITION PREFERENCE =============
function getJoystickPositionPreference() {
    try {
        const saved = localStorage.getItem(JOYSTICK_POSITION_KEY);
        return saved || 'left'; // Default to left
    } catch (e) {
        return 'left';
    }
}

function saveJoystickPositionPreference(position) {
    try {
        localStorage.setItem(JOYSTICK_POSITION_KEY, position);
    } catch (e) {
        console.error('Error saving joystick position:', e);
    }
}

function setJoystickPosition(position) {
    // Save preference
    saveJoystickPositionPreference(position);

    // Update UI buttons
    const leftBtn = document.getElementById('joystick-left-btn');
    const rightBtn = document.getElementById('joystick-right-btn');

    if (position === 'left') {
        leftBtn.classList.add('active');
        rightBtn.classList.remove('active');
    } else {
        rightBtn.classList.add('active');
        leftBtn.classList.remove('active');
    }

    // Update joystick position
    applyJoystickPosition(position);
}

function applyJoystickPosition(position) {
    const joystickContainer = document.getElementById('joystick-container');
    if (joystickContainer) {
        joystickContainer.classList.remove('position-left', 'position-right');
        joystickContainer.classList.add(`position-${position}`);
    }
}

function initJoystickPosition() {
    const savedPosition = getJoystickPositionPreference();

    // Update UI buttons to reflect saved preference
    const leftBtn = document.getElementById('joystick-left-btn');
    const rightBtn = document.getElementById('joystick-right-btn');

    if (leftBtn && rightBtn) {
        if (savedPosition === 'left') {
            leftBtn.classList.add('active');
            rightBtn.classList.remove('active');
        } else {
            rightBtn.classList.add('active');
            leftBtn.classList.remove('active');
        }
    }

    // Apply position to joystick
    applyJoystickPosition(savedPosition);
}

// ============= SOUND PREFERENCES =============
function getEngineSoundPreference() {
    try {
        const saved = localStorage.getItem(ENGINE_SOUND_KEY);
        return saved === null ? true : saved === 'true';
    } catch (e) {
        return true;
    }
}

function saveEngineSoundPreference(enabled) {
    try {
        localStorage.setItem(ENGINE_SOUND_KEY, enabled.toString());
    } catch (e) {
        console.error('Error saving engine sound preference:', e);
    }
}

function getMusicPreference() {
    try {
        const saved = localStorage.getItem(MUSIC_KEY);
        return saved === null ? true : saved === 'true';
    } catch (e) {
        return true;
    }
}

function saveMusicPreference(enabled) {
    try {
        localStorage.setItem(MUSIC_KEY, enabled.toString());
    } catch (e) {
        console.error('Error saving music preference:', e);
    }
}

function toggleEngineSound() {
    engineSoundEnabled = !engineSoundEnabled;
    saveEngineSoundPreference(engineSoundEnabled);
    updateSoundToggleUI();

    // If disabled, immediately silence the engine
    if (!engineSoundEnabled && gainNode) {
        gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.05);
    }
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    saveMusicPreference(musicEnabled);
    updateMusicToggleUI();

    if (musicEnabled && gameRunning) {
        startBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
}

function updateSoundToggleUI() {
    const btn = document.getElementById('engine-sound-btn');
    if (btn) {
        btn.textContent = engineSoundEnabled ? '🔊 Som' : '🔇 Som';
        btn.classList.toggle('muted', !engineSoundEnabled);
    }

    // Update sound menu button
    const menuBtn = document.getElementById('engine-sound-menu-btn');
    if (menuBtn) {
        menuBtn.textContent = engineSoundEnabled ? '🔊 Som do Motor' : '🔇 Som do Motor';
        menuBtn.classList.toggle('muted', !engineSoundEnabled);
    }
}

function updateMusicToggleUI() {
    const btn = document.getElementById('music-btn');
    if (btn) {
        btn.textContent = musicEnabled ? '🎵 Música' : '🎵 Música';
        btn.classList.toggle('muted', !musicEnabled);
    }

    // Update sound menu button
    const menuBtn = document.getElementById('music-menu-btn');
    if (menuBtn) {
        menuBtn.textContent = musicEnabled ? '🎵 Música de Fundo' : '🔇 Música de Fundo';
        menuBtn.classList.toggle('muted', !musicEnabled);
    }
}

function initSoundPreferences() {
    engineSoundEnabled = getEngineSoundPreference();
    musicEnabled = getMusicPreference();
    updateSoundToggleUI();
    updateMusicToggleUI();
}

function openSoundMenu() {
    const soundMenu = document.getElementById('sound-menu');
    if (soundMenu) {
        soundMenu.style.display = 'flex';
        // Update button states when opening menu
        updateSoundToggleUI();
        updateMusicToggleUI();
    }
}

function closeSoundMenu() {
    const soundMenu = document.getElementById('sound-menu');
    if (soundMenu) {
        soundMenu.style.display = 'none';
    }
}

// ============= BACKGROUND MUSIC =============
function startBackgroundMusic() {
    if (!audioContext || !musicEnabled || musicNodes) return;

    // Create a master gain for music
    const musicGain = audioContext.createGain();
    musicGain.gain.value = 0.025;
    musicGain.connect(audioContext.destination);

    // Note frequencies (Game Boy style tuning)
    const noteFreqs = {
        'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
        'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
        'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
        'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51
    };

    // Tempo: ~150 BPM
    const sixteenth = 0.1;
    const eighth = 0.2;
    const quarter = 0.4;
    const half = 0.8;
    const dottedEighth = 0.3;

    // Pokemon Red/Blue Bicycle Theme
    const melody = [
        // Phrase 1
        { note: 'E5', duration: quarter },
        { note: 'C5', duration: eighth },
        { note: 'G4', duration: eighth },
        { note: 'C5', duration: eighth },
        { note: 'E5', duration: eighth },
        { note: 'F5', duration: eighth },
        { note: 'G5', duration: eighth },
        // Phrase 2
        { note: 'A5', duration: quarter },
        { note: 'F5', duration: eighth },
        { note: 'C5', duration: eighth },
        { note: 'F5', duration: eighth },
        { note: 'A5', duration: eighth },
        { note: 'G5', duration: eighth },
        { note: 'F5', duration: eighth },
        // Phrase 3
        { note: 'G5', duration: quarter },
        { note: 'E5', duration: eighth },
        { note: 'C5', duration: eighth },
        { note: 'E5', duration: eighth },
        { note: 'G5', duration: eighth },
        { note: 'F5', duration: eighth },
        { note: 'E5', duration: eighth },
        // Phrase 4
        { note: 'D5', duration: quarter },
        { note: 'F5', duration: eighth },
        { note: 'A5', duration: eighth },
        { note: 'G5', duration: quarter },
        { note: 'B4', duration: quarter },
        
        // Repeat Phrase 1
        { note: 'E5', duration: quarter },
        { note: 'C5', duration: eighth },
        { note: 'G4', duration: eighth },
        { note: 'C5', duration: eighth },
        { note: 'E5', duration: eighth },
        { note: 'F5', duration: eighth },
        { note: 'G5', duration: eighth },
        // Repeat Phrase 2
        { note: 'A5', duration: quarter },
        { note: 'F5', duration: eighth },
        { note: 'C5', duration: eighth },
        { note: 'F5', duration: eighth },
        { note: 'A5', duration: eighth },
        { note: 'G5', duration: eighth },
        { note: 'F5', duration: eighth },
        // Repeat Phrase 3
        { note: 'G5', duration: quarter },
        { note: 'E5', duration: eighth },
        { note: 'C5', duration: eighth },
        { note: 'E5', duration: eighth },
        { note: 'G5', duration: eighth },
        { note: 'F5', duration: eighth },
        { note: 'E5', duration: eighth },
        // Ending
        { note: 'D5', duration: quarter },
        { note: 'F5', duration: eighth },
        { note: 'B4', duration: eighth },
        { note: 'C5', duration: half },
    ];

    // Harmony (Pulse 2 channel) - Simplified counterpoint
    const harmony = [
        // Bar 1
        { note: 'C4', duration: quarter },
        { note: 'E4', duration: quarter },
        { note: 'G4', duration: quarter },
        { note: 'C5', duration: quarter },
        // Bar 2
        { note: 'F4', duration: quarter },
        { note: 'A4', duration: quarter },
        { note: 'C5', duration: quarter },
        { note: 'A4', duration: quarter },
        // Bar 3
        { note: 'C4', duration: quarter },
        { note: 'E4', duration: quarter },
        { note: 'G4', duration: quarter },
        { note: 'C5', duration: quarter },
        // Bar 4
        { note: 'G4', duration: quarter },
        { note: 'B4', duration: quarter },
        { note: 'D5', duration: quarter },
        { note: 'G4', duration: quarter },
        // Bar 5
        { note: 'C4', duration: quarter },
        { note: 'E4', duration: quarter },
        { note: 'G4', duration: quarter },
        { note: 'C5', duration: quarter },
        // Bar 6
        { note: 'F4', duration: quarter },
        { note: 'A4', duration: quarter },
        { note: 'C5', duration: quarter },
        { note: 'A4', duration: quarter },
        // Bar 7
        { note: 'C4', duration: quarter },
        { note: 'E4', duration: quarter },
        { note: 'G4', duration: quarter },
        { note: 'C5', duration: quarter },
        // Bar 8
        { note: 'G4', duration: quarter },
        { note: 'G3', duration: quarter },
        { note: 'C4', duration: half },
    ];

    // Bass line (Wave channel style)
    const bassPattern = [
        // Bar 1
        { note: 'C3', duration: quarter },
        { note: 'G3', duration: quarter },
        { note: 'C3', duration: quarter },
        { note: 'G3', duration: quarter },
        // Bar 2
        { note: 'F3', duration: quarter },
        { note: 'C4', duration: quarter },
        { note: 'F3', duration: quarter },
        { note: 'C4', duration: quarter },
        // Bar 3
        { note: 'C3', duration: quarter },
        { note: 'G3', duration: quarter },
        { note: 'C3', duration: quarter },
        { note: 'G3', duration: quarter },
        // Bar 4
        { note: 'G3', duration: quarter },
        { note: 'D4', duration: quarter },
        { note: 'G3', duration: quarter },
        { note: 'D4', duration: quarter },
        // Bar 5
        { note: 'C3', duration: quarter },
        { note: 'G3', duration: quarter },
        { note: 'C3', duration: quarter },
        { note: 'G3', duration: quarter },
        // Bar 6
        { note: 'F3', duration: quarter },
        { note: 'C4', duration: quarter },
        { note: 'F3', duration: quarter },
        { note: 'C4', duration: quarter },
        // Bar 7
        { note: 'C3', duration: quarter },
        { note: 'G3', duration: quarter },
        { note: 'C3', duration: quarter },
        { note: 'G3', duration: quarter },
        // Bar 8
        { note: 'G3', duration: quarter },
        { note: 'G2', duration: quarter },
        { note: 'C3', duration: half },
    ];

    // Calculate total loop duration from melody
    let totalDuration = 0;
    melody.forEach(n => totalDuration += n.duration);

    const loopInterval = totalDuration * 1000;

    function scheduleMelody() {
        if (!musicEnabled || !musicNodes) return;

        let time = audioContext.currentTime + 0.05;
        melody.forEach(noteData => {
            const osc = audioContext.createOscillator();
            const noteGain = audioContext.createGain();

            // Use 25% duty cycle square wave for authentic Game Boy sound
            osc.type = 'square';
            osc.frequency.value = noteFreqs[noteData.note];

            osc.connect(noteGain);
            noteGain.connect(musicGain);

            // Sharp attack, slight decay for that chiptune punch
            noteGain.gain.setValueAtTime(0, time);
            noteGain.gain.linearRampToValueAtTime(0.5, time + 0.015);
            noteGain.gain.setValueAtTime(0.4, time + noteData.duration * 0.6);
            noteGain.gain.linearRampToValueAtTime(0, time + noteData.duration * 0.95);

            osc.start(time);
            osc.stop(time + noteData.duration);

            time += noteData.duration;
        });
    }

    function scheduleHarmony() {
        if (!musicEnabled || !musicNodes) return;

        let time = audioContext.currentTime + 0.05;
        const harmonyGain = audioContext.createGain();
        harmonyGain.gain.value = 0.6; // Slightly quieter than lead
        harmonyGain.connect(musicGain);

        harmony.forEach(noteData => {
            const osc = audioContext.createOscillator();
            const noteGain = audioContext.createGain();

            // 12.5% duty cycle feel (different pulse width)
            osc.type = 'square';
            osc.frequency.value = noteFreqs[noteData.note];

            osc.connect(noteGain);
            noteGain.connect(harmonyGain);

            noteGain.gain.setValueAtTime(0, time);
            noteGain.gain.linearRampToValueAtTime(0.35, time + 0.02);
            noteGain.gain.setValueAtTime(0.3, time + noteData.duration * 0.7);
            noteGain.gain.linearRampToValueAtTime(0, time + noteData.duration * 0.9);

            osc.start(time);
            osc.stop(time + noteData.duration);

            time += noteData.duration;
        });
    }

    function scheduleBass() {
        if (!musicEnabled || !musicNodes) return;

        let time = audioContext.currentTime + 0.05;
        let bassDuration = 0;
        bassPattern.forEach(n => bassDuration += n.duration);
        
        const repetitions = Math.ceil(totalDuration / bassDuration) + 1;

        for (let rep = 0; rep < repetitions; rep++) {
            bassPattern.forEach(noteData => {
                if (time < audioContext.currentTime + totalDuration + 0.1) {
                    const osc = audioContext.createOscillator();
                    const noteGain = audioContext.createGain();

                    // Triangle wave for bass - authentic Game Boy wave channel
                    osc.type = 'triangle';
                    osc.frequency.value = noteFreqs[noteData.note] || 164.81;

                    osc.connect(noteGain);
                    noteGain.connect(musicGain);

                    noteGain.gain.setValueAtTime(0, time);
                    noteGain.gain.linearRampToValueAtTime(0.5, time + 0.01);
                    noteGain.gain.setValueAtTime(0.45, time + noteData.duration * 0.5);
                    noteGain.gain.linearRampToValueAtTime(0, time + noteData.duration * 0.85);

                    osc.start(time);
                    osc.stop(time + noteData.duration);
                }
                time += noteData.duration;
            });
        }
    }

    // Add some noise channel percussion for rhythm
    function schedulePercussion() {
        if (!musicEnabled || !musicNodes) return;

        const percGain = audioContext.createGain();
        percGain.gain.value = 0.08;
        percGain.connect(musicGain);

        let time = audioContext.currentTime + 0.05;
        const beatInterval = eighth;
        const beats = Math.floor(totalDuration / beatInterval);

        for (let i = 0; i < beats; i++) {
            // Hi-hat on every beat, snare on 2 and 4
            const isSnare = (i % 4 === 2);
            
            const bufferSize = 4096;
            const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let j = 0; j < bufferSize; j++) {
                output[j] = Math.random() * 2 - 1;
            }

            const noise = audioContext.createBufferSource();
            noise.buffer = noiseBuffer;

            const noiseGain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            if (isSnare) {
                filter.type = 'bandpass';
                filter.frequency.value = 1500;
                filter.Q.value = 0.5;
                noiseGain.gain.setValueAtTime(0, time);
                noiseGain.gain.linearRampToValueAtTime(0.3, time + 0.005);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
            } else {
                filter.type = 'highpass';
                filter.frequency.value = 8000;
                noiseGain.gain.setValueAtTime(0, time);
                noiseGain.gain.linearRampToValueAtTime(0.15, time + 0.002);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);
            }

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(percGain);

            noise.start(time);
            noise.stop(time + 0.1);

            time += beatInterval;
        }
    }

    // Initial schedule
    scheduleMelody();
    scheduleHarmony();
    scheduleBass();
    schedulePercussion();

    // Create loop timer
    const loopTimer = setInterval(() => {
        if (!musicEnabled || !musicNodes) {
            clearInterval(loopTimer);
            return;
        }
        scheduleMelody();
        scheduleHarmony();
        scheduleBass();
        schedulePercussion();
    }, loopInterval);

    // Store references for cleanup
    musicNodes = {
        gain: musicGain,
        loopTimer: loopTimer
    };
}

function stopBackgroundMusic() {
    if (musicNodes) {
        if (musicNodes.loopTimer) {
            clearInterval(musicNodes.loopTimer);
        }
        if (musicNodes.gain) {
            musicNodes.gain.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
        }
        musicNodes = null;
    }
}

// ============= GAME CONFIG =============
const CONFIG = {
    GAME_TIME: 300, // 5 minutes
    CITY_SIZE: 400,
    BUILDING_COUNT: 40,
    CAR_COUNT: 8,
    DELIVERY_BASE_REWARD: 15,
    MAX_SPEED: 25,
    ACCELERATION: 0.08,
    BRAKE_POWER: 0.15,
    TURN_SPEED: 0.035,
    FRICTION: 0.03,
};

// ============= GAME STATE =============
let scene, camera, renderer;
let motorcycle, motorcycleGroup;
let clock, mixer;
let buildings = [];
let streetLights = [];
let trafficCars = [];
let restaurants = [];
let customers = [];
let clouds = [];
let currentOrder = null;
let hasFood = false;
let score = 0;
let deliveriesCount = 0;
let distanceTraveled = 0;
let lastPosition = { x: 0, z: 0 };
let gameTime = CONFIG.GAME_TIME;
let gameRunning = false;
let speed = 0;
let velocity = { x: 0, z: 0 };
let rotation = 0;

// Controls state
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// Audio context
let audioContext;
let gainNode;
let oscillator;

// ============= INITIALIZATION =============
function init() {
    // Scene setup - bright sunny day
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 100, 400);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 15);

    // Renderer - optimized settings
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1); // Fixed pixel ratio for performance
    renderer.shadowMap.enabled = false; // Disable shadows for performance
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Clock
    clock = new THREE.Clock();

    // Lights
    createLights();

    // Sky and clouds
    createSky();

    // City
    createGround();
    createBuildings();
    createStreets();
    createStreetLights();
    createTrafficCars();

    // Player
    createMotorcycle();

    // Game elements
    createRestaurants();
    createCustomers();

    // Event listeners
    setupControls();
    window.addEventListener('resize', onWindowResize);

    // Custom cursor
    document.addEventListener('mousemove', (e) => {
        const cursor = document.getElementById('cursor');
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Initialize joystick position preference
    initJoystickPosition();

    // Initialize sound preferences
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

// ============= LIGHTS =============
function createLights() {
    // Bright ambient light for daytime
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    // Sun light - warm and bright
    const sunLight = new THREE.DirectionalLight(0xfffacd, 1.0);
    sunLight.position.set(100, 150, 50);
    scene.add(sunLight);

    // Hemisphere light for natural sky/ground lighting
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3d6b3d, 0.4);
    scene.add(hemiLight);
}

// ============= SKY & CLOUDS =============
function createSky() {
    // Create a sky dome
    const skyGeometry = new THREE.SphereGeometry(300, 32, 32);

    // Create gradient texture for sky
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Gradient from light blue at horizon to deeper blue at top
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#4A90D9');    // Deeper blue at top
    gradient.addColorStop(0.4, '#87CEEB');  // Sky blue
    gradient.addColorStop(0.7, '#B0E0E6');  // Powder blue
    gradient.addColorStop(1, '#E0F6FF');    // Very light blue at horizon

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const skyTexture = new THREE.CanvasTexture(canvas);
    const skyMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    // Create the sun
    createSun();

    // Create fluffy clouds
    createClouds();
}

function createSun() {
    // Sun glow
    const sunGeometry = new THREE.CircleGeometry(15, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF88,
        transparent: true,
        opacity: 0.9
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(100, 120, -150);
    sun.lookAt(0, 0, 0);
    scene.add(sun);

    // Sun rays/glow effect
    const glowGeometry = new THREE.CircleGeometry(25, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFAA,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(100, 120, -151);
    glow.lookAt(0, 0, 0);
    scene.add(glow);
}

function createClouds() {
    // Clouds positioned low on the horizon for visibility
    const cloudPositions = [
        { x: -150, y: 35, z: -200, scale: 4.0 },
        { x: 80, y: 40, z: -220, scale: 5.0 },
        { x: 200, y: 32, z: -180, scale: 3.5 },
        { x: -220, y: 38, z: -160, scale: 4.5 },
        { x: 0, y: 45, z: -250, scale: 6.0 },
        { x: 150, y: 35, z: -190, scale: 4.2 },
        { x: -80, y: 42, z: -230, scale: 5.5 },
        { x: 250, y: 38, z: -200, scale: 4.0 },
        { x: -250, y: 40, z: -180, scale: 4.8 },
        { x: 50, y: 36, z: -210, scale: 4.5 },
    ];

    cloudPositions.forEach(pos => {
        createCloud(pos.x, pos.y, pos.z, pos.scale);
    });
}

function createCloud(x, y, z, scale) {
    const cloudGroup = new THREE.Group();

    const cloudMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });

    // Create fluffy cloud from multiple spheres
    const puffs = [
        { x: 0, y: 0, z: 0, r: 5 },
        { x: 4, y: 1, z: 0, r: 4 },
        { x: -4, y: 0.5, z: 0, r: 4.5 },
        { x: 2, y: 2, z: 1, r: 3.5 },
        { x: -2, y: 1.5, z: -1, r: 3 },
        { x: 6, y: -0.5, z: 0.5, r: 3 },
        { x: -6, y: 0, z: 0.5, r: 3.5 },
        { x: 0, y: 1, z: 2, r: 3 },
    ];

    puffs.forEach(puff => {
        const geometry = new THREE.SphereGeometry(puff.r, 8, 8);
        const sphere = new THREE.Mesh(geometry, cloudMaterial);
        sphere.position.set(puff.x, puff.y, puff.z);
        cloudGroup.add(sphere);
    });

    cloudGroup.position.set(x, y, z);
    cloudGroup.scale.setScalar(scale);

    // Store for animation
    cloudGroup.userData.originalX = x;
    cloudGroup.userData.speed = 0.5 + Math.random() * 0.5;

    scene.add(cloudGroup);
    clouds.push(cloudGroup);
}

// ============= GROUND & STREETS =============
const GRID_SPACING = 80; // Larger blocks
const STREET_WIDTH = 20; // Wide streets
const BLOCK_SIZE = GRID_SPACING - STREET_WIDTH; // Size of each city block

function createGround() {
    // Grass/earth base
    const groundGeometry = new THREE.PlaneGeometry(CONFIG.CITY_SIZE, CONFIG.CITY_SIZE);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x2d4a2d }); // Dark green
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
}

function createStreets() {
    const streetMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const sidewalkMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Create street grid
    for (let i = -2; i <= 2; i++) {
        // Horizontal streets
        const hStreet = new THREE.Mesh(
            new THREE.PlaneGeometry(CONFIG.CITY_SIZE, STREET_WIDTH),
            streetMaterial
        );
        hStreet.rotation.x = -Math.PI / 2;
        hStreet.position.set(0, 0.01, i * GRID_SPACING);
        scene.add(hStreet);

        // Vertical streets
        const vStreet = new THREE.Mesh(
            new THREE.PlaneGeometry(STREET_WIDTH, CONFIG.CITY_SIZE),
            streetMaterial
        );
        vStreet.rotation.x = -Math.PI / 2;
        vStreet.position.set(i * GRID_SPACING, 0.01, 0);
        scene.add(vStreet);

        // Center line markings (dashed yellow)
        for (let d = -CONFIG.CITY_SIZE / 2; d < CONFIG.CITY_SIZE / 2; d += 8) {
            const hDash = new THREE.Mesh(
                new THREE.PlaneGeometry(4, 0.3),
                markingMaterial
            );
            hDash.rotation.x = -Math.PI / 2;
            hDash.position.set(d, 0.02, i * GRID_SPACING);
            scene.add(hDash);

            const vDash = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 4),
                markingMaterial
            );
            vDash.rotation.x = -Math.PI / 2;
            vDash.position.set(i * GRID_SPACING, 0.02, d);
            scene.add(vDash);
        }

        // Edge lines (white)
        const hEdge1 = new THREE.Mesh(
            new THREE.PlaneGeometry(CONFIG.CITY_SIZE, 0.2),
            whiteMaterial
        );
        hEdge1.rotation.x = -Math.PI / 2;
        hEdge1.position.set(0, 0.02, i * GRID_SPACING + STREET_WIDTH / 2 - 1);
        scene.add(hEdge1);

        const hEdge2 = hEdge1.clone();
        hEdge2.position.z = i * GRID_SPACING - STREET_WIDTH / 2 + 1;
        scene.add(hEdge2);

        const vEdge1 = new THREE.Mesh(
            new THREE.PlaneGeometry(0.2, CONFIG.CITY_SIZE),
            whiteMaterial
        );
        vEdge1.rotation.x = -Math.PI / 2;
        vEdge1.position.set(i * GRID_SPACING + STREET_WIDTH / 2 - 1, 0.02, 0);
        scene.add(vEdge1);

        const vEdge2 = vEdge1.clone();
        vEdge2.position.x = i * GRID_SPACING - STREET_WIDTH / 2 + 1;
        scene.add(vEdge2);
    }

    // Create city blocks with sidewalks and medians
    createCityBlocks();
}

function createCityBlocks() {
    const sidewalkMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const grassMaterial = new THREE.MeshBasicMaterial({ color: 0x3d6b3d });
    const flowerColors = [0xff6b9d, 0xffeb3b, 0xff5722, 0x9c27b0, 0x4caf50];

    // Create blocks between streets
    for (let bx = -2; bx < 2; bx++) {
        for (let bz = -2; bz < 2; bz++) {
            const blockCenterX = bx * GRID_SPACING + GRID_SPACING / 2;
            const blockCenterZ = bz * GRID_SPACING + GRID_SPACING / 2;

            // Sidewalk around block
            const sidewalk = new THREE.Mesh(
                new THREE.PlaneGeometry(BLOCK_SIZE + 4, BLOCK_SIZE + 4),
                sidewalkMaterial
            );
            sidewalk.rotation.x = -Math.PI / 2;
            sidewalk.position.set(blockCenterX, 0.02, blockCenterZ);
            scene.add(sidewalk);

            // Inner grass/park area
            const innerGrass = new THREE.Mesh(
                new THREE.PlaneGeometry(BLOCK_SIZE - 4, BLOCK_SIZE - 4),
                grassMaterial
            );
            innerGrass.rotation.x = -Math.PI / 2;
            innerGrass.position.set(blockCenterX, 0.03, blockCenterZ);
            scene.add(innerGrass);

            // Add flowerbeds in some blocks
            if (Math.random() > 0.3) {
                addFlowerbed(blockCenterX, blockCenterZ, flowerColors);
            }
        }
    }

    // Add median strips along streets with flowerbeds
    createMedians(flowerColors);
}

function addFlowerbed(cx, cz, flowerColors) {
    const bedSize = 8 + Math.random() * 6;

    // Flower bed border
    const bed = new THREE.Mesh(
        new THREE.PlaneGeometry(bedSize, bedSize),
        new THREE.MeshBasicMaterial({ color: 0x5d4037 }) // Brown soil
    );
    bed.rotation.x = -Math.PI / 2;
    bed.position.set(cx + (Math.random() - 0.5) * 20, 0.04, cz + (Math.random() - 0.5) * 20);
    scene.add(bed);

    // Add flowers
    const flowerCount = 5 + Math.floor(Math.random() * 8);
    for (let f = 0; f < flowerCount; f++) {
        const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 6, 6),
            new THREE.MeshBasicMaterial({ color: flowerColor })
        );
        flower.position.set(
            bed.position.x + (Math.random() - 0.5) * (bedSize - 2),
            0.3,
            bed.position.z + (Math.random() - 0.5) * (bedSize - 2)
        );
        scene.add(flower);
    }
}

function createMedians(flowerColors) {
    const medianMaterial = new THREE.MeshBasicMaterial({ color: 0x4a7c4a });

    // Medians at intersections (roundabout style)
    for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
            // Skip center where player spawns
            if (i === 0 && j === 0) continue;

            const cx = i * GRID_SPACING;
            const cz = j * GRID_SPACING;

            // Small circular median at intersection
            const median = new THREE.Mesh(
                new THREE.CircleGeometry(3, 12),
                medianMaterial
            );
            median.rotation.x = -Math.PI / 2;
            median.position.set(cx, 0.03, cz);
            scene.add(median);

            // Add a small tree or flowers
            if (Math.random() > 0.5) {
                // Tree
                const trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.4, 2, 6),
                    new THREE.MeshBasicMaterial({ color: 0x5d4037 })
                );
                trunk.position.set(cx, 1, cz);
                scene.add(trunk);

                const leaves = new THREE.Mesh(
                    new THREE.SphereGeometry(1.5, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0x2e7d32 })
                );
                leaves.position.set(cx, 2.5, cz);
                scene.add(leaves);
            } else {
                // Flowers
                for (let f = 0; f < 5; f++) {
                    const flower = new THREE.Mesh(
                        new THREE.SphereGeometry(0.3, 6, 6),
                        new THREE.MeshBasicMaterial({
                            color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
                        })
                    );
                    flower.position.set(
                        cx + (Math.random() - 0.5) * 4,
                        0.3,
                        cz + (Math.random() - 0.5) * 4
                    );
                    scene.add(flower);
                }
            }
        }
    }
}

// ============= BUILDINGS =============
// Landmark positions - buildings should avoid these
const LANDMARK_POSITIONS = [
    // Restaurants
    { x: -120, z: -120 }, { x: 120, z: -120 },
    { x: -120, z: 120 }, { x: 120, z: 120 },
    { x: 0, z: -160 }, { x: 0, z: 160 },
    // Customers
    { x: -160, z: 0 }, { x: 160, z: 0 },
    { x: -40, z: -160 }, { x: 40, z: 160 },
    { x: 160, z: -120 }, { x: -160, z: 120 }
];

function isNearLandmark(x, z, margin = 15) {
    for (const pos of LANDMARK_POSITIONS) {
        const dist = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
        if (dist < margin) return true;
    }
    return false;
}

function isOnStreet(x, z) {
    // Check if position is on a street
    for (let i = -2; i <= 2; i++) {
        const streetPos = i * GRID_SPACING;
        if (Math.abs(x - streetPos) < STREET_WIDTH / 2 + 2) return true;
        if (Math.abs(z - streetPos) < STREET_WIDTH / 2 + 2) return true;
    }
    return false;
}

function createBuildings() {
    const buildingColors = [
        0x2d2d44, 0x3d3d5c, 0x4a4a6a, 0x383850,
        0x2a3a4a, 0x3a2a4a, 0x4a3a3a, 0x3a4a4a
    ];

    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const windowOffMaterial = new THREE.MeshBasicMaterial({ color: 0x222233 });

    // Place buildings in each city block
    for (let bx = -2; bx < 2; bx++) {
        for (let bz = -2; bz < 2; bz++) {
            const blockCenterX = bx * GRID_SPACING + GRID_SPACING / 2;
            const blockCenterZ = bz * GRID_SPACING + GRID_SPACING / 2;

            // Add 0-1 buildings per block (fewer buildings)
            const buildingsInBlock = Math.random() > 0.4 ? 1 : 0;

            for (let b = 0; b < buildingsInBlock; b++) {
                const maxOffset = BLOCK_SIZE / 2 - 12;
                const x = blockCenterX + (Math.random() - 0.5) * maxOffset * 2;
                const z = blockCenterZ + (Math.random() - 0.5) * maxOffset * 2;

                // Skip if near landmark or on street
                if (isNearLandmark(x, z, 20)) continue;
                if (isOnStreet(x, z)) continue;

                const width = 8 + Math.random() * 8;
                const depth = 8 + Math.random() * 8;
                const height = 12 + Math.random() * 25;

                const buildingMaterial = new THREE.MeshBasicMaterial({
                    color: buildingColors[Math.floor(Math.random() * buildingColors.length)]
                });

                const building = new THREE.Mesh(
                    new THREE.BoxGeometry(width, height, depth),
                    buildingMaterial
                );
                building.position.set(x, height / 2, z);
                scene.add(building);

                // Windows
                const windowSpacing = 5;
                for (let wy = 4; wy < height - 2; wy += windowSpacing) {
                    const isLit = Math.random() > 0.4;
                    const win = new THREE.Mesh(
                        new THREE.PlaneGeometry(width * 0.7, 1.5),
                        isLit ? windowMaterial : windowOffMaterial
                    );
                    win.position.set(x, wy, z + depth / 2 + 0.1);
                    scene.add(win);
                }

                buildings.push({ mesh: building, width, depth, x, z });
            }
        }
    }
}

// ============= STREET LIGHTS =============
function createStreetLights() {
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });

    // Place lights along the streets
    for (let i = -2; i <= 2; i++) {
        for (let d = -CONFIG.CITY_SIZE / 2 + 20; d < CONFIG.CITY_SIZE / 2; d += 40) {
            // Lights along horizontal streets
            const pole1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 0.3), poleMat);
            pole1.position.set(d, 3, i * GRID_SPACING + STREET_WIDTH / 2 - 2);
            scene.add(pole1);

            const lamp1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), glowMat);
            lamp1.position.set(d, 6.5, i * GRID_SPACING + STREET_WIDTH / 2 - 2);
            scene.add(lamp1);

            // Lights along vertical streets
            const pole2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 0.3), poleMat);
            pole2.position.set(i * GRID_SPACING + STREET_WIDTH / 2 - 2, 3, d);
            scene.add(pole2);

            const lamp2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), glowMat);
            lamp2.position.set(i * GRID_SPACING + STREET_WIDTH / 2 - 2, 6.5, d);
            scene.add(lamp2);
        }
    }
}

// ============= TRAFFIC CARS =============
function createTrafficCars() {
    const carColors = [0x4444ff, 0xff4444, 0x44ff44, 0xffff44, 0xff44ff, 0x44ffff];

    for (let i = 0; i < CONFIG.CAR_COUNT; i++) {
        const carGroup = new THREE.Group();

        const bodyMat = new THREE.MeshBasicMaterial({
            color: carColors[Math.floor(Math.random() * carColors.length)]
        });

        // Simple car body
        const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), bodyMat);
        body.position.y = 0.7;
        carGroup.add(body);

        // Car top
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2), bodyMat);
        top.position.set(0, 1.5, -0.3);
        carGroup.add(top);

        // Headlights
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        const headlight = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.1), lightMat);
        headlight.position.set(0, 0.5, 2);
        carGroup.add(headlight);

        // Tail lights
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const taillight = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.1), tailMat);
        taillight.position.set(0, 0.5, -2);
        carGroup.add(taillight);

        // Position on streets using new grid spacing
        const streetIndex = Math.floor(Math.random() * 5) - 2;
        const isHorizontal = Math.random() > 0.5;
        const streetPos = (Math.random() - 0.5) * CONFIG.CITY_SIZE * 0.8;
        const laneOffset = (Math.random() > 0.5 ? 1 : -1) * 4; // Stay in lane

        if (isHorizontal) {
            carGroup.position.set(streetPos, 0, streetIndex * GRID_SPACING + laneOffset);
            carGroup.rotation.y = laneOffset > 0 ? 0 : Math.PI;
        } else {
            carGroup.position.set(streetIndex * GRID_SPACING + laneOffset, 0, streetPos);
            carGroup.rotation.y = laneOffset > 0 ? Math.PI / 2 : -Math.PI / 2;
        }

        carGroup.userData = {
            speed: 0.03 + Math.random() * 0.05,
            direction: isHorizontal ? 'horizontal' : 'vertical',
            streetIndex: streetIndex
        };

        scene.add(carGroup);
        trafficCars.push(carGroup);
    }
}

// ============= MOTORCYCLE =============
function createMotorcycle() {
    motorcycleGroup = new THREE.Group();

    const blackMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xea1d2c });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffee });

    // Main body frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.8), blackMat);
    frame.position.y = 0.6;
    motorcycleGroup.add(frame);

    // Tank (red)
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.8), redMat);
    tank.position.set(0, 0.9, 0.1);
    motorcycleGroup.add(tank);

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.7), blackMat);
    seat.position.set(0, 1, -0.4);
    motorcycleGroup.add(seat);

    // Wheels (simplified cylinders)
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12), wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.35, 1);
    motorcycleGroup.add(frontWheel);

    const rearWheel = frontWheel.clone();
    rearWheel.position.z = -0.8;
    motorcycleGroup.add(rearWheel);

    // Headlight
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), whiteMat);
    headlight.position.set(0, 0.9, 1.1);
    motorcycleGroup.add(headlight);

    // Tail light
    const taillight = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.1, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    taillight.position.set(0, 0.85, -1);
    motorcycleGroup.add(taillight);

    // === RIDER (simplified) ===
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), redMat);
    body.position.set(0, 1.5, -0.3);
    motorcycleGroup.add(body);

    // Head with helmet
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), redMat);
    head.position.set(0, 2, -0.2);
    motorcycleGroup.add(head);

    // Visor
    const visor = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 0.12),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    visor.position.set(0, 2, -0.01);
    motorcycleGroup.add(visor);

    // Arms
    const armMat = redMat;
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), armMat);
    leftArm.position.set(-0.32, 1.4, 0.1);
    leftArm.rotation.x = -0.8;
    motorcycleGroup.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.x = 0.32;
    motorcycleGroup.add(rightArm);

    // Legs
    const legMat = blackMat;
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.15), legMat);
    leftLeg.position.set(-0.15, 1, -0.1);
    leftLeg.rotation.x = -0.3;
    motorcycleGroup.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.15;
    motorcycleGroup.add(rightLeg);

    // === DELIVERY BAG ===
    const bagGroup = new THREE.Group();

    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), redMat);
    bag.position.y = 0.35;
    bagGroup.add(bag);

    // Bag lid
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.52), redMat);
    lid.position.y = 0.75;
    bagGroup.add(lid);

    // Logo (white rectangle)
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.15), whiteMat);
    logo.position.set(0, 0.4, 0.26);
    bagGroup.add(logo);

    bagGroup.position.set(0, 1.5, -0.7);
    motorcycleGroup.add(bagGroup);

    motorcycleGroup.userData.bag = bagGroup;

    scene.add(motorcycleGroup);
    motorcycle = motorcycleGroup;
}

// ============= RESTAURANTS & CUSTOMERS =============
function createRestaurants() {
    const restaurantData = [
        { name: "Pizza Place", emoji: "🍕", color: 0xff6600 },
        { name: "Burger King", emoji: "🍔", color: 0xffaa00 },
        { name: "Sushi House", emoji: "🍣", color: 0xff4466 },
        { name: "Taco Bell", emoji: "🌮", color: 0x44ff44 },
        { name: "Noodle Bar", emoji: "🍜", color: 0xffff00 },
        { name: "Chicken Spot", emoji: "🍗", color: 0xff8844 },
    ];

    // Positions on street corners/intersections for easy access
    const positions = [
        { x: -120, z: -120 }, { x: 120, z: -120 },
        { x: -120, z: 120 }, { x: 120, z: 120 },
        { x: 0, z: -160 }, { x: 0, z: 160 }
    ];

    restaurantData.forEach((data, i) => {
        const pos = positions[i];
        const restaurantGroup = createMarker(data.color, data.emoji, true);
        restaurantGroup.position.set(pos.x, 0, pos.z);
        restaurantGroup.userData = { ...data, type: 'restaurant' };
        scene.add(restaurantGroup);
        restaurants.push(restaurantGroup);
    });
}

function createCustomers() {
    const customerData = [
        { name: "Casa do João", emoji: "🏠" },
        { name: "Apt. Maria", emoji: "🏢" },
        { name: "Escritório Tech", emoji: "💼" },
        { name: "Festa da Ana", emoji: "🎉" },
        { name: "Casa do Pedro", emoji: "🏡" },
        { name: "Dormitório UFC", emoji: "🎓" },
    ];

    // Positions along streets for easy delivery
    const positions = [
        { x: -160, z: 0 }, { x: 160, z: 0 },
        { x: -40, z: -160 }, { x: 40, z: 160 },
        { x: 160, z: -120 }, { x: -160, z: 120 }
    ];

    customerData.forEach((data, i) => {
        const pos = positions[i];
        const customerGroup = createMarker(0x00f5ff, data.emoji, false);
        customerGroup.position.set(pos.x, 0, pos.z);
        customerGroup.userData = { ...data, type: 'customer' };
        scene.add(customerGroup);
        customers.push(customerGroup);
    });
}

function createMarker(color, emoji, isRestaurant) {
    const group = new THREE.Group();

    // Simple glowing platform
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 0.3, 12),
        new THREE.MeshBasicMaterial({ color: color })
    );
    platform.position.y = 0.15;
    group.add(platform);

    // Floating icon with emoji
    const iconGroup = new THREE.Group();

    // Create a canvas texture for the emoji
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const emojiMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
    );
    iconGroup.add(emojiMesh);

    iconGroup.position.y = 4;
    group.add(iconGroup);

    group.userData.iconGroup = iconGroup;

    return group;
}

// ============= CONTROLS =============
function setupControls() {
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'Escape':
                // Close sound menu if open
                const soundMenu = document.getElementById('sound-menu');
                if (soundMenu && soundMenu.style.display === 'flex') {
                    closeSoundMenu();
                }
                break;
            case 'KeyW':
            case 'ArrowUp':
                keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                keys.right = true;
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                keys.right = false;
                break;
        }
    });

    // Mobile virtual joystick
    setupVirtualJoystick();
}

// ============= VIRTUAL JOYSTICK =============
let joystickActive = false;
let joystickTouchId = null;
let joystickInput = { x: 0, y: 0 }; // Store normalized joystick values

function setupVirtualJoystick() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');

    if (!joystickBase || !joystickStick) return;

    const baseRect = { width: 140, height: 140 };
    const maxDistance = 40; // Maximum joystick movement radius
    const deadzone = 0.15; // Deadzone threshold (15%)

    function getJoystickCenter() {
        const rect = joystickBase.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    function handleJoystickMove(clientX, clientY) {
        const center = getJoystickCenter();

        // Calculate offset from center
        let deltaX = clientX - center.x;
        let deltaY = clientY - center.y;

        // Calculate distance from center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Clamp to max distance
        if (distance > maxDistance) {
            deltaX = (deltaX / distance) * maxDistance;
            deltaY = (deltaY / distance) * maxDistance;
        }

        // Update stick position
        joystickStick.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;

        // Normalize values (-1 to 1)
        const normalizedX = deltaX / maxDistance;
        const normalizedY = deltaY / maxDistance;

        // Apply deadzone
        const absX = Math.abs(normalizedX);
        const absY = Math.abs(normalizedY);

        // Store smoothed joystick input for gradual turning
        joystickInput.x = absX > deadzone ? normalizedX : 0;
        joystickInput.y = absY > deadzone ? normalizedY : 0;

        // Update control keys based on joystick position
        keys.left = normalizedX < -deadzone;
        keys.right = normalizedX > deadzone;
        keys.forward = normalizedY < -deadzone;
        keys.backward = normalizedY > deadzone;
    }

    function resetJoystick() {
        joystickStick.style.transform = 'translate(-50%, -50%)';
        joystickStick.classList.remove('active');
        keys.forward = false;
        keys.backward = false;
        keys.left = false;
        keys.right = false;
        joystickInput.x = 0;
        joystickInput.y = 0;
        joystickActive = false;
        joystickTouchId = null;
    }

    // Touch events
    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (joystickActive) return;

        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        joystickActive = true;
        joystickStick.classList.add('active');
        handleJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === joystickTouchId) {
                e.preventDefault();
                handleJoystickMove(touch.clientX, touch.clientY);
                break;
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === joystickTouchId) {
                resetJoystick();
                break;
            }
        }
    });

    document.addEventListener('touchcancel', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === joystickTouchId) {
                resetJoystick();
                break;
            }
        }
    });

    // Prevent context menu on long press
    joystickBase.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ============= GAME LOOP =============
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (gameRunning) {
        updateMotorcycle(delta);
        updateCamera();
        updateTrafficCars(delta);
        updateMarkers(delta);
        updateClouds(delta);
        checkCollisions();
        updateHUD();
        updateMinimap();
    } else {
        // Clouds still move on start screen
        updateClouds(delta);
        // Gentle camera rotation on start screen
        const time = clock.getElapsedTime();
        camera.position.x = Math.sin(time * 0.1) * 30;
        camera.position.z = Math.cos(time * 0.1) * 30;
        camera.position.y = 20;
        camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
}

function updateMotorcycle(delta) {
    const acceleration = CONFIG.ACCELERATION;
    const maxSpeed = CONFIG.MAX_SPEED;

    // Acceleration
    if (keys.forward) {
        speed = Math.min(speed + acceleration, maxSpeed);
    } else if (keys.backward) {
        speed = Math.max(speed - CONFIG.BRAKE_POWER, -maxSpeed / 3);
    } else {
        // Friction
        speed *= (1 - CONFIG.FRICTION);
        if (Math.abs(speed) < 0.1) speed = 0;
    }

    // Turning (only when moving)
    if (Math.abs(speed) > 1) {
        const turnFactor = Math.min(Math.abs(speed) / 30, 1);

        // Use smoother turning when joystick is active
        if (joystickActive && joystickInput.x !== 0) {
            // Apply gradual turning based on joystick position (reduced by 60% for smoother control)
            rotation -= CONFIG.TURN_SPEED * turnFactor * joystickInput.x * 0.6;
        } else {
            // Keyboard input uses full turning
            if (keys.left) {
                rotation += CONFIG.TURN_SPEED * turnFactor;
            }
            if (keys.right) {
                rotation -= CONFIG.TURN_SPEED * turnFactor;
            }
        }
    }

    // Calculate velocity (speed is already in reasonable units)
    velocity.x = Math.sin(rotation) * speed * delta;
    velocity.z = Math.cos(rotation) * speed * delta;

    // Update position
    const newX = motorcycle.position.x + velocity.x;
    const newZ = motorcycle.position.z + velocity.z;

    // Check building collisions
    let canMove = true;
    for (const building of buildings) {
        const halfWidth = building.width / 2 + 1;
        const halfDepth = building.depth / 2 + 1;

        if (newX > building.x - halfWidth && newX < building.x + halfWidth &&
            newZ > building.z - halfDepth && newZ < building.z + halfDepth) {
            canMove = false;
            speed *= -0.3; // Bounce back
            break;
        }
    }

    // Boundary check
    const boundary = CONFIG.CITY_SIZE / 2 - 10;
    if (Math.abs(newX) > boundary || Math.abs(newZ) > boundary) {
        canMove = false;
        speed *= -0.5;
    }

    if (canMove) {
        // Track distance
        distanceTraveled += Math.sqrt(
            Math.pow(newX - motorcycle.position.x, 2) +
            Math.pow(newZ - motorcycle.position.z, 2)
        );

        motorcycle.position.x = newX;
        motorcycle.position.z = newZ;
    }

    // Rotation
    motorcycle.rotation.y = rotation;

    // Tilt when turning
    const targetTilt = (keys.left ? 0.2 : 0) - (keys.right ? 0.2 : 0);
    motorcycle.rotation.z = THREE.MathUtils.lerp(motorcycle.rotation.z, targetTilt * (speed / maxSpeed), 0.1);

    // Bag bounce animation
    if (motorcycle.userData.bag) {
        const bounceAmount = Math.sin(clock.getElapsedTime() * 10) * 0.02 * (speed / maxSpeed);
        motorcycle.userData.bag.rotation.x = bounceAmount;
    }

    // Update engine sound
    updateEngineSound();
}

function updateCamera() {
    // Third person camera following motorcycle
    const idealOffset = new THREE.Vector3(
        -Math.sin(rotation) * 12,
        6 + Math.abs(speed) / 20,
        -Math.cos(rotation) * 12
    );

    const idealLookat = new THREE.Vector3(
        motorcycle.position.x + Math.sin(rotation) * 5,
        1,
        motorcycle.position.z + Math.cos(rotation) * 5
    );

    camera.position.lerp(
        new THREE.Vector3(
            motorcycle.position.x + idealOffset.x,
            idealOffset.y,
            motorcycle.position.z + idealOffset.z
        ),
        0.05
    );

    camera.lookAt(idealLookat);
}

function updateTrafficCars(delta) {
    const gridSpacing = 50;

    trafficCars.forEach(car => {
        const moveSpeed = car.userData.speed * delta * 60;
        const dir = car.rotation.y;

        car.position.x += Math.sin(dir) * moveSpeed;
        car.position.z += Math.cos(dir) * moveSpeed;

        // Wrap around city
        if (car.position.x > CONFIG.CITY_SIZE / 2) car.position.x = -CONFIG.CITY_SIZE / 2;
        if (car.position.x < -CONFIG.CITY_SIZE / 2) car.position.x = CONFIG.CITY_SIZE / 2;
        if (car.position.z > CONFIG.CITY_SIZE / 2) car.position.z = -CONFIG.CITY_SIZE / 2;
        if (car.position.z < -CONFIG.CITY_SIZE / 2) car.position.z = CONFIG.CITY_SIZE / 2;
    });
}

function updateMarkers(delta) {
    const time = clock.getElapsedTime();

    // Simple floating animation for icons
    [...restaurants, ...customers].forEach(marker => {
        if (marker.userData.iconGroup) {
            marker.userData.iconGroup.position.y = 4 + Math.sin(time * 2) * 0.3;
            // Billboard effect - make emoji always face the camera
            marker.userData.iconGroup.lookAt(camera.position);
        }
    });
}

function updateClouds(delta) {
    // Slowly drift clouds across the sky
    clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed * delta * 2;

        // Wrap around when cloud goes too far
        if (cloud.position.x > 200) {
            cloud.position.x = -200;
        }
    });
}

function checkCollisions() {
    const playerPos = motorcycle.position;
    const pickupRadius = 4;

    // Check restaurant collisions (pickup)
    if (!hasFood && currentOrder) {
        const restaurant = restaurants.find(r => r.userData.name === currentOrder.restaurant);
        if (restaurant) {
            const dist = playerPos.distanceTo(restaurant.position);
            if (dist < pickupRadius) {
                pickupFood();
            }
        }
    }

    // Check customer collisions (delivery)
    if (hasFood && currentOrder) {
        const customer = customers.find(c => c.userData.name === currentOrder.customer);
        if (customer) {
            const dist = playerPos.distanceTo(customer.position);
            if (dist < pickupRadius) {
                deliverFood();
            }
        }
    }
}

function pickupFood() {
    hasFood = true;
    playPickupSound();
    showMessage(currentOrder.restaurantEmoji, "Pedido Coletado!", `De: ${currentOrder.restaurant}`);
    updateOrdersPanel();
}

function deliverFood() {
    // Calculate reward
    const reward = CONFIG.DELIVERY_BASE_REWARD + Math.floor(Math.random() * 10);

    score += reward;
    deliveriesCount++;

    // Play celebration sound
    playDeliverySound();

    // Funny Brazilian delivery messages
    const messages = [
        { text: "Entrega Realizada!", emoji: "🎉" },
        { text: "Boa entrega, motoboy!", emoji: "🔥" },
        { text: "Cliente feliz!", emoji: "😋" },
        { text: "Mandou bem!", emoji: "💪" },
        { text: "Rapidinho!", emoji: "⚡" },
        { text: "Comida quentinha!", emoji: "🍕" },
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    showMessage(msg.emoji, msg.text, `+R$ ${reward},00`);

    // Reset and generate new order
    hasFood = false;
    currentOrder = null;
    generateNewOrder();
}

function generateNewOrder() {
    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];

    currentOrder = {
        restaurant: restaurant.userData.name,
        restaurantEmoji: restaurant.userData.emoji,
        customer: customer.userData.name,
        customerEmoji: customer.userData.emoji
    };

    updateOrdersPanel();
}

function updateOrdersPanel() {
    const panel = document.getElementById('orders-panel');
    panel.innerHTML = '';

    if (currentOrder) {
        if (!hasFood) {
            // Show pickup location
            const pickupCard = document.createElement('div');
            pickupCard.className = 'order-card active pickup';
            pickupCard.innerHTML = `
                <div class="order-type pickup">BUSCAR EM</div>
                <div class="order-name">${currentOrder.restaurantEmoji} ${currentOrder.restaurant}</div>
                <div class="order-distance">${getDistanceToRestaurant()}m</div>
            `;
            panel.appendChild(pickupCard);
        }

        // Show delivery location
        const deliveryCard = document.createElement('div');
        deliveryCard.className = `order-card ${hasFood ? 'active' : ''} delivery`;
        deliveryCard.innerHTML = `
            <div class="order-type delivery">ENTREGAR EM</div>
            <div class="order-name">${currentOrder.customerEmoji} ${currentOrder.customer}</div>
            <div class="order-distance">${getDistanceToCustomer()}m</div>
        `;
        panel.appendChild(deliveryCard);
    }
}

function getDistanceToRestaurant() {
    if (!currentOrder) return 0;
    const restaurant = restaurants.find(r => r.userData.name === currentOrder.restaurant);
    if (!restaurant) return 0;
    return Math.floor(motorcycle.position.distanceTo(restaurant.position));
}

function getDistanceToCustomer() {
    if (!currentOrder) return 0;
    const customer = customers.find(c => c.userData.name === currentOrder.customer);
    if (!customer) return 0;
    return Math.floor(motorcycle.position.distanceTo(customer.position));
}

function updateHUD() {
    document.getElementById('score').textContent = score.toLocaleString('pt-BR');
    document.getElementById('speed').textContent = Math.abs(Math.floor(speed));

    // Update timer
    gameTime -= 1 / 60;
    if (gameTime <= 0) {
        endGame();
        return;
    }

    const minutes = Math.floor(gameTime / 60);
    const seconds = Math.floor(gameTime % 60);
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (gameTime <= 30) {
        timerElement.classList.add('urgent');
    }

    // Update order distances
    updateOrdersPanel();
}

function updateMinimap() {
    const minimap = document.getElementById('minimap');
    if (!minimap || !motorcycle) return;

    const minimapSize = minimap.offsetWidth || 150;
    const minimapScale = minimapSize / 400;
    const minimapCenter = minimapSize / 2;

    // Clear old markers
    document.querySelectorAll('.minimap-marker').forEach(m => m.remove());

    const playerHeading = motorcycle.rotation.y;

    // Transform world position to minimap position (heading-up display)
    function worldToMinimap(targetX, targetZ) {
        const dx = targetX - motorcycle.position.x;
        const dz = targetZ - motorcycle.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.1) {
            return { left: minimapCenter, top: minimapCenter };
        }

        const worldAngle = Math.atan2(dx, dz);
        const relativeAngle = worldAngle - playerHeading;
        const scaledDist = distance * minimapScale;

        return {
            left: Math.max(5, Math.min(minimapSize - 5, minimapCenter - Math.sin(relativeAngle) * scaledDist)),
            top: Math.max(5, Math.min(minimapSize - 5, minimapCenter - Math.cos(relativeAngle) * scaledDist))
        };
    }

    // Helper to create and position a marker
    function addMarker(x, z, className) {
        const pos = worldToMinimap(x, z);
        const marker = document.createElement('div');
        marker.className = 'minimap-marker ' + className;
        marker.style.left = pos.left + 'px';
        marker.style.top = pos.top + 'px';
        minimap.appendChild(marker);
    }

    // Show markers for current order (restaurant and customer)
    if (currentOrder) {
        if (!hasFood) {
            const restaurant = restaurants.find(r => r.userData.name === currentOrder.restaurant);
            if (restaurant) {
                addMarker(restaurant.position.x, restaurant.position.z, 'restaurant');
            }
        }

        const customer = customers.find(c => c.userData.name === currentOrder.customer);
        if (customer) {
            addMarker(customer.position.x, customer.position.z, 'customer');
        }
    }

    // Show other players in multiplayer mode
    if (isMultiplayer && otherPlayers) {
        Object.values(otherPlayers).forEach(player => {
            if (player.mesh) {
                addMarker(player.mesh.position.x, player.mesh.position.z, 'other-player');
            }
        });
    }
}


function showMessage(emoji, text, subtext) {
    const popup = document.getElementById('message-popup');
    document.getElementById('message-emoji').textContent = emoji;
    document.getElementById('message-text').textContent = text;
    document.getElementById('message-subtext').textContent = subtext;

    popup.style.display = 'block';
    popup.style.animation = 'none';
    popup.offsetHeight; // Force reflow
    popup.style.animation = 'popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    setTimeout(() => {
        popup.style.display = 'none';
    }, 2000);
}

// ============= GAME FLOW =============
function initAudio() {
    try {
        // Reuse existing audio context if already initialized
        if (audioContext && oscillator) {
            // Just ensure the audio context is running (may be suspended)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            return;
        }

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0;

        oscillator = audioContext.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 50;
        oscillator.connect(gainNode);
        oscillator.start();
    } catch (e) {
        console.log('Audio not supported');
    }
}

function updateEngineSound() {
    if (!audioContext || !oscillator) return;

    // Engine frequency based on speed
    const baseFreq = 40;
    const maxFreq = 150;
    const freq = baseFreq + (Math.abs(speed) / CONFIG.MAX_SPEED) * (maxFreq - baseFreq);

    oscillator.frequency.setTargetAtTime(freq, audioContext.currentTime, 0.1);

    // Volume based on speed (respects engine sound toggle)
    const volume = engineSoundEnabled ? Math.min(Math.abs(speed) / 30, 0.04) : 0;
    gainNode.gain.setTargetAtTime(volume, audioContext.currentTime, 0.1);
}

function stopEngineSound() {
    if (!audioContext || !gainNode) return;

    // Silence the engine sound
    gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
}

function playPickupSound() {
    if (!audioContext) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.3);
}

function playDeliverySound() {
    if (!audioContext) return;

    // Happy delivery chime
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = audioContext.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
    });
}

function playRecordSound() {
    if (!audioContext) return;

    // Triumphant fanfare for new record!
    const notes = [
        { freq: 523.25, delay: 0, duration: 0.15 },     // C5
        { freq: 659.25, delay: 0.1, duration: 0.15 },   // E5
        { freq: 783.99, delay: 0.2, duration: 0.15 },   // G5
        { freq: 1046.50, delay: 0.3, duration: 0.3 },   // C6
        { freq: 987.77, delay: 0.5, duration: 0.15 },   // B5
        { freq: 1046.50, delay: 0.65, duration: 0.4 },  // C6 (hold)
    ];

    notes.forEach(note => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'triangle';
        osc.frequency.value = note.freq;

        const startTime = audioContext.currentTime + note.delay;
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

        osc.start(startTime);
        osc.stop(startTime + note.duration);
    });
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    // Show online panel if in multiplayer mode
    if (isMultiplayer) {
        document.getElementById('online-panel').classList.add('visible');
    }

    // Hide cursor during gameplay
    document.body.classList.add('game-active');

    // Initialize audio on user interaction
    initAudio();

    // Reset game state
    score = 0;
    deliveriesCount = 0;
    distanceTraveled = 0;
    gameTime = CONFIG.GAME_TIME;
    speed = 0;
    rotation = 0;
    hasFood = false;

    // Reset motorcycle position
    motorcycle.position.set(0, 0, 0);
    motorcycle.rotation.set(0, 0, 0);

    // Generate first order (only in single-player or if not already set by server)
    if (!isMultiplayer || !currentOrder) {
        generateNewOrder();
    } else {
        // In multiplayer with existing order, just update the UI
        updateOrdersPanel();
    }

    gameRunning = true;

    // Start background music if enabled
    if (musicEnabled) {
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

// Detect if user is on a mobile/touch device
function isMobileDevice() {
    return (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        window.innerWidth <= 768
    );
}

function endGame() {
    gameRunning = false;

    // Stop the engine sound and background music
    stopEngineSound();
    stopBackgroundMusic();

    // Show cursor again
    document.body.classList.remove('game-active');

    document.getElementById('hud').style.display = 'none';
    document.getElementById('game-over').style.display = 'flex';

    // Update stats
    document.getElementById('final-score').textContent = score.toLocaleString('pt-BR');
    document.getElementById('stat-deliveries').textContent = deliveriesCount;
    document.getElementById('stat-distance').textContent = (distanceTraveled / 1000).toFixed(1);

    // Check for new record before saving
    const isRecord = isNewRecord(score);
    const newRecordBadge = document.getElementById('new-record-badge');

    // Save score to leaderboard
    const rank = addScoreToLeaderboard({
        score: score,
        deliveries: deliveriesCount,
        distance: parseFloat((distanceTraveled / 1000).toFixed(1))
    });

    // Show NEW RECORD badge if it's a new high score
    if (isRecord && score > 0) {
        newRecordBadge.classList.add('visible');
        playRecordSound();
    } else {
        newRecordBadge.classList.remove('visible');
    }
}

function restartGame() {
    document.getElementById('game-over').style.display = 'none';

    // If in multiplayer and still connected, emit start-round to server
    if (isMultiplayer && socket && socket.connected) {
        socket.emit('start-round');
    }

    startGame();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============= ENVIRONMENT EFFECTS =============
function createSimpleBillboards() {
    const billboardData = [
        { text: "Dirija com cuidado", color: 0xea1d2c, x: -120, z: -50 },
        { text: "FOME?", color: 0xffcc00, x: 120, z: 50 },
        { text: "PEDALE!", color: 0x00aa00, x: 0, z: -120 },
    ];

    billboardData.forEach(data => {
        // Billboard pole
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 25, 8),
            new THREE.MeshBasicMaterial({ color: 0x666666 })
        );
        pole.position.set(data.x, 12.5, data.z);
        scene.add(pole);

        // Billboard background
        const bgMesh = new THREE.Mesh(
            new THREE.BoxGeometry(14, 7, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        bgMesh.position.set(data.x, 28, data.z);
        scene.add(bgMesh);

        // Billboard text
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, 256, 128);
        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(data.text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const billboard = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 6),
            new THREE.MeshBasicMaterial({ map: texture })
        );
        billboard.position.set(data.x, 28, data.z + 0.3);
        scene.add(billboard);
    });
}

// ============= ENHANCED INIT =============
function enhanceGame() {
    createSimpleBillboards();
}

// ============= MULTIPLAYER SYSTEM =============

// Multiplayer state
let isMultiplayer = false;
let socket = null;
let myPlayerId = null;
let otherPlayers = {};           // socketId -> { data, mesh }
let multiplayerServerUrl = null; // Set this when server is available
let sessionInitialized = false;  // Track if session cookie is set

// LocalStorage keys for multiplayer
const MP_USERNAME_KEY = 'foodrush_mp_username';
const MP_NAME_SET_KEY = 'foodrush_name_set';

/**
 * Initialize session with server (gets/creates session cookie)
 */
async function initializeSession() {
    if (!multiplayerServerUrl || sessionInitialized) return null;

    try {
        console.log('Initializing session with:', multiplayerServerUrl + '/api/session');
        const response = await fetch(multiplayerServerUrl + '/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important: include cookies
            body: JSON.stringify({ username: getPlayerUsername() })
        });

        console.log('Session response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            sessionInitialized = true;

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

/**
 * Get saved username
 */
function getPlayerUsername() {
    return localStorage.getItem(MP_USERNAME_KEY) || 'Entregador';
}

/**
 * Save username
 */
function savePlayerUsername(username) {
    localStorage.setItem(MP_USERNAME_KEY, username);
}

/**
 * Check if user has ever set their name
 */
function hasUserSetName() {
    return localStorage.getItem(MP_NAME_SET_KEY) === 'true';
}

/**
 * Mark that user has set their name
 */
function markNameAsSet() {
    localStorage.setItem(MP_NAME_SET_KEY, 'true');
}

/**
 * Open the name input modal
 */
function openNameModal() {
    const modal = document.getElementById('name-modal');
    const input = document.getElementById('name-input');
    input.value = getPlayerUsername();
    modal.style.display = 'flex';
    input.focus();
    input.select();
}

/**
 * Close the name modal
 */
function closeNameModal() {
    document.getElementById('name-modal').style.display = 'none';
}

/**
 * Save name and close modal
 */
async function saveNameAndClose() {
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
    if (multiplayerServerUrl && sessionInitialized) {
        try {
            await fetch(multiplayerServerUrl + '/api/session/username', {
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

/**
 * Update name display on start screen
 */
function updateNameDisplay() {
    const display = document.getElementById('current-name-display');
    if (display) {
        display.textContent = getPlayerUsername();
    }
}

/**
 * Check and prompt for name if new user
 */
function checkFirstTimeUser() {
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

/**
 * Create a simplified motorcycle mesh for other players
 */
function createOtherPlayerMesh(playerData) {
    const group = new THREE.Group();

    // Use a simpler version for other players (performance)
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x4CAF50 }); // Green for other players
    const blackMat = new THREE.MeshBasicMaterial({ color: 0x222222 });

    // Simple bike body
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.8), blackMat);
    frame.position.y = 0.6;
    group.add(frame);

    // Rider body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), bodyMat);
    body.position.set(0, 1.5, -0.3);
    group.add(body);

    // Rider head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bodyMat);
    head.position.set(0, 2, -0.2);
    group.add(head);

    // Wheels
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 8), wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.35, 1);
    group.add(frontWheel);

    const rearWheel = frontWheel.clone();
    rearWheel.position.z = -0.8;
    group.add(rearWheel);

    // Delivery bag (green)
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), bodyMat);
    bag.position.set(0, 1.85, -0.7);
    group.add(bag);

    // Username label (canvas texture)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(playerData.username || 'Player', 128, 32);

    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    const label = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.75), labelMaterial);
    label.position.set(0, 3.5, 0);
    group.add(label);
    group.userData.label = label;

    // Set initial position
    if (playerData.position) {
        group.position.set(playerData.position.x, 0, playerData.position.z);
        group.rotation.y = playerData.position.rotation || 0;
    }

    return group;
}

/**
 * Update other player's position smoothly
 */
function updateOtherPlayerPosition(playerId, position) {
    const player = otherPlayers[playerId];
    if (!player || !player.mesh) return;

    // Lerp to new position for smooth movement
    player.targetPosition = {
        x: position.x,
        z: position.z,
        rotation: position.rotation || 0
    };
}

/**
 * Animate other players (called in game loop)
 */
function updateOtherPlayers() {
    if (!isMultiplayer) return;

    Object.values(otherPlayers).forEach(player => {
        if (!player.mesh || !player.targetPosition) return;

        // Smooth interpolation
        player.mesh.position.x += (player.targetPosition.x - player.mesh.position.x) * 0.15;
        player.mesh.position.z += (player.targetPosition.z - player.mesh.position.z) * 0.15;

        // Smooth rotation
        let rotDiff = player.targetPosition.rotation - player.mesh.rotation.y;
        // Handle wrap-around
        if (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        if (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        player.mesh.rotation.y += rotDiff * 0.15;

        // Make label face camera
        if (player.mesh.userData.label) {
            player.mesh.userData.label.lookAt(camera.position);
        }
    });
}

/**
 * Broadcast player position to server
 */
function broadcastPosition() {
    if (!isMultiplayer || !socket || !motorcycle) return;

    socket.emit('move', {
        x: motorcycle.position.x,
        z: motorcycle.position.z,
        rotation: rotation
    });
}

/**
 * Toggle online panel expanded state
 */
function toggleOnlinePanel() {
    const panel = document.getElementById('online-panel');
    if (panel) {
        panel.classList.toggle('expanded');
    }
}

/**
 * Setup online panel click handler
 */
function setupOnlinePanelToggle() {
    const panel = document.getElementById('online-panel');
    if (panel) {
        panel.addEventListener('click', toggleOnlinePanel);
    }
}

/**
 * Update online players list UI
 */
function updateOnlinePlayersUI() {
    const countEl = document.getElementById('online-player-count');
    const listEl = document.getElementById('online-players-list');
    if (!countEl || !listEl) return;

    const allPlayers = [
        { id: myPlayerId, username: getPlayerUsername(), money: score, isMe: true },
        ...Object.values(otherPlayers).map(p => ({
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

/**
 * Set connection status UI
 */
function setConnectionStatus(status, message) {
    const el = document.getElementById('connection-status');
    if (!el) return;

    el.className = 'connection-status ' + status;
    el.textContent = message || status;
}

/**
 * Connect to multiplayer server
 */
async function connectToMultiplayer() {
    if (!multiplayerServerUrl) {
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
        script.src = multiplayerServerUrl + '/socket.io/socket.io.js';
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

/**
 * Initialize socket connection and event handlers
 */
function initSocketConnection() {
    socket = io(multiplayerServerUrl, {
        withCredentials: true // Send cookies with socket.io connection
    });

    socket.on('connect', () => {
        setConnectionStatus('connected', 'Conectado');

        // Join the game (session validated via cookie on server)
        socket.emit('join', {
            username: getPlayerUsername()
        });
    });

    socket.on('disconnect', () => {
        setConnectionStatus('disconnected', 'Desconectado');
        isMultiplayer = false;

        // Remove all other players
        Object.keys(otherPlayers).forEach(id => {
            if (otherPlayers[id].mesh) {
                scene.remove(otherPlayers[id].mesh);
            }
        });
        otherPlayers = {};
    });

    socket.on('error', (error) => {
        console.error('Socket error:', error);
        setConnectionStatus('disconnected', 'Erro: ' + error.message);
    });

    // Game initialization
    socket.on('init', (data) => {
        myPlayerId = data.playerId;

        // Add existing players
        data.otherPlayers.forEach(playerData => {
            addOtherPlayer(playerData);
        });

        // Set current delivery from server
        if (data.currentDelivery) {
            currentOrder = {
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

        isMultiplayer = true;
        console.log('Multiplayer initialized with', data.otherPlayers.length, 'other players');
    });

    // New player joined
    socket.on('player-joined', (playerData) => {
        addOtherPlayer(playerData);
        updateOnlinePlayersUI();
    });

    // Player left
    socket.on('player-left', (playerId) => {
        removeOtherPlayer(playerId);
        updateOnlinePlayersUI();
    });

    // Player moved
    socket.on('player-moved', (data) => {
        updateOtherPlayerPosition(data.id, data);
    });

    // Player stats updated
    socket.on('player-stats-updated', (data) => {
        if (otherPlayers[data.id]) {
            otherPlayers[data.id].data.money = data.money;
            otherPlayers[data.id].data.deliveries = data.deliveries;
        }
        updateOnlinePlayersUI();
    });

    // Player updated (hasFood, etc)
    socket.on('player-updated', (data) => {
        if (otherPlayers[data.id]) {
            Object.assign(otherPlayers[data.id].data, data);
        }
    });

    // New delivery assigned
    socket.on('new-delivery', (delivery) => {
        // Server-assigned delivery (for multiplayer sync)
        // We still generate locally for now, but this can be used for validation
        console.log('Server assigned delivery:', delivery);
    });

    // Pickup success
    socket.on('pickup-success', (data) => {
        hasFood = true;
        playPickupSound();
        showMessage(currentOrder.restaurantEmoji, "Pedido Coletado!", `De: ${currentOrder.restaurant}`);
        updateOrdersPanel();
    });

    // Delivery success
    socket.on('delivery-success', (data) => {
        score = data.newTotal;
        deliveriesCount = data.deliveries;
        playDeliverySound();

        const messages = [
            { text: "Entrega Realizada!", emoji: "🎉" },
            { text: "Boa entrega, motoboy!", emoji: "🔥" },
            { text: "Cliente feliz!", emoji: "😋" },
        ];
        const msg = messages[Math.floor(Math.random() * messages.length)];
        showMessage(msg.emoji, msg.text, `+R$ ${data.reward},00`);

        hasFood = false;
        currentOrder = null;
        generateNewOrder();
    });

    // Round ended
    socket.on('round-ended', (data) => {
        console.log('Round ended:', data);
    });

    // New round started (after restart)
    socket.on('round-started', (data) => {
        console.log('New round started:', data);
        // Update delivery from server
        if (data.currentDelivery) {
            currentOrder = {
                restaurant: data.currentDelivery.restaurant.name,
                restaurantEmoji: data.currentDelivery.restaurant.emoji,
                customer: data.currentDelivery.customer.name,
                customerEmoji: data.currentDelivery.customer.emoji
            };
            hasFood = false;
            updateOrdersPanel();
        }
    });

    // Leaderboard data
    socket.on('leaderboard', (data) => {
        console.log('Leaderboard:', data);
    });
}

/**
 * Add another player to the scene
 */
function addOtherPlayer(playerData) {
    if (otherPlayers[playerData.id]) return;

    const mesh = createOtherPlayerMesh(playerData);
    scene.add(mesh);

    otherPlayers[playerData.id] = {
        data: playerData,
        mesh: mesh,
        targetPosition: playerData.position || { x: 0, z: 0, rotation: 0 }
    };

    console.log('Added player:', playerData.username);
}

/**
 * Remove another player from the scene
 */
function removeOtherPlayer(playerId) {
    if (!otherPlayers[playerId]) return;

    if (otherPlayers[playerId].mesh) {
        scene.remove(otherPlayers[playerId].mesh);
    }
    delete otherPlayers[playerId];

    console.log('Removed player:', playerId);
}

/**
 * Start multiplayer game
 */
function startMultiplayerGame() {
    if (!multiplayerServerUrl) {
        alert('Servidor multiplayer não disponível ainda!');
        return;
    }

    connectToMultiplayer();

    // Wait for connection then start game
    const checkConnection = setInterval(() => {
        if (isMultiplayer) {
            clearInterval(checkConnection);
            startGame();
        }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(checkConnection);
        if (!isMultiplayer) {
            setConnectionStatus('disconnected', 'Tempo esgotado');
        }
    }, 10000);
}

/**
 * Check if multiplayer server is available and show button
 */
function checkMultiplayerAvailability() {
    // Only show multiplayer on shurato.com.br (third-party cookies blocked elsewhere)
    if (!window.location.hostname.includes('shurato.com.br')) return;
    if (!multiplayerServerUrl) return;

    fetch(multiplayerServerUrl + '/health')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'ok') {
                const btn = document.getElementById('multiplayer-btn');
                const count = document.getElementById('online-count');
                if (btn) {
                    btn.style.display = 'inline-block';
                    if (count && data.players > 0) {
                        count.textContent = data.players + ' online';
                    }
                }
            }
        })
        .catch(() => {
            // Server not available, keep button hidden
        });
}

// ============= MODIFIED GAME FUNCTIONS FOR MULTIPLAYER =============

// Store original functions
const originalAnimate = animate;
const originalUpdateMinimap = updateMinimap;

// Override animate to include multiplayer updates
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (gameRunning) {
        updateMotorcycle(delta);
        updateCamera();
        updateTrafficCars(delta);
        updateMarkers(delta);
        updateClouds(delta);
        checkCollisions();
        updateHUD();
        updateMinimap();

        // Multiplayer updates
        if (isMultiplayer) {
            updateOtherPlayers();
            broadcastPosition();

            // Update online players UI less frequently
            if (Math.floor(clock.getElapsedTime() * 2) % 2 === 0) {
                updateOnlinePlayersUI();
            }
        }
    } else {
        // Clouds still move on start screen
        updateClouds(delta);
        // Gentle camera rotation on start screen
        const time = clock.getElapsedTime();
        camera.position.x = Math.sin(time * 0.1) * 30;
        camera.position.z = Math.cos(time * 0.1) * 30;
        camera.position.y = 20;
        camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
}

// Override endGame to handle multiplayer
const originalEndGame = endGame;
function endGame() {
    gameRunning = false;
    stopEngineSound();
    stopBackgroundMusic();
    document.body.classList.remove('game-active');

    // Notify server if multiplayer
    if (isMultiplayer && socket) {
        socket.emit('end-round');
    }

    // Hide online panel during end screen
    document.getElementById('online-panel').classList.remove('visible');

    document.getElementById('hud').style.display = 'none';
    document.getElementById('game-over').style.display = 'flex';

    document.getElementById('final-score').textContent = score.toLocaleString('pt-BR');
    document.getElementById('stat-deliveries').textContent = deliveriesCount;
    document.getElementById('stat-distance').textContent = (distanceTraveled / 1000).toFixed(1);

    const isRecord = isNewRecord(score);
    const newRecordBadge = document.getElementById('new-record-badge');

    const rank = addScoreToLeaderboard({
        score: score,
        deliveries: deliveriesCount,
        distance: parseFloat((distanceTraveled / 1000).toFixed(1))
    });

    if (isRecord && score > 0) {
        newRecordBadge.classList.add('visible');
        playRecordSound();
    } else {
        newRecordBadge.classList.remove('visible');
    }
}

// ============= START =============
init();
enhanceGame();

// Check multiplayer availability after init
// Multiplayer only works when served from shurato.com.br (same-origin cookies)
if (window.location.hostname.includes('shurato.com.br')) {
    multiplayerServerUrl = window.location.origin;
    checkMultiplayerAvailability();
}
