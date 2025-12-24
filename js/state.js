// ============= SHARED GAME STATE =============
// Central state object - all modules import from here

import { CONFIG } from './config.js';

// Main game state singleton
export const state = {
    // Three.js core
    scene: null,
    camera: null,
    renderer: null,
    clock: null,
    mixer: null,

    // Player
    motorcycle: null,
    motorcycleGroup: null,

    // World objects
    buildings: [],
    streetLights: [],
    trafficCars: [],
    restaurants: [],
    customers: [],
    clouds: [],
    boosters: [],

    // Speed boost state
    speedBoost: 0,
    boostEndTime: 0,

    // Game state
    currentOrder: null,
    hasFood: false,
    score: 0,
    deliveriesCount: 0,
    distanceTraveled: 0,
    lastPosition: { x: 0, z: 0 },
    gameTime: CONFIG.GAME_TIME,
    gameRunning: false,

    // Physics
    speed: 0,
    velocity: { x: 0, z: 0 },
    rotation: 0,

    // Controls
    keys: {
        forward: false,
        backward: false,
        left: false,
        right: false
    },

    // Audio
    audioContext: null,
    gainNode: null,
    oscillator: null,
    engineSoundEnabled: true,
    musicEnabled: true,
    musicNodes: null,

    // Joystick
    joystickActive: false,
    joystickTouchId: null,
    joystickInput: { x: 0, y: 0 },

    // Multiplayer
    isMultiplayer: false,
    socket: null,
    myPlayerId: null,
    otherPlayers: {},
    multiplayerServerUrl: null,
    sessionInitialized: false,

    // UI state
    lastAddedEntryDate: null,

    // Leaderboard (from server)
    leaderboard: [],
};

// Reset game state to initial values
export function resetGameState() {
    state.score = 0;
    state.deliveriesCount = 0;
    state.distanceTraveled = 0;
    state.gameTime = CONFIG.GAME_TIME;
    state.speed = 0;
    state.rotation = 0;
    state.hasFood = false;
    state.velocity = { x: 0, z: 0 };
    state.speedBoost = 0;
    state.boostEndTime = 0;
}
