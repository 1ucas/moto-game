// ============= USER PREFERENCES =============
// Sound, music, and joystick position preferences

import { state } from '../state.js';
import {
    JOYSTICK_POSITION_KEY,
    ENGINE_SOUND_KEY,
    MUSIC_KEY
} from '../config.js';
import { startBackgroundMusic, stopBackgroundMusic } from '../audio/music.js';

// ============= JOYSTICK POSITION =============
export function getJoystickPositionPreference() {
    try {
        const saved = localStorage.getItem(JOYSTICK_POSITION_KEY);
        return saved || 'left';
    } catch (e) {
        return 'left';
    }
}

export function saveJoystickPositionPreference(position) {
    try {
        localStorage.setItem(JOYSTICK_POSITION_KEY, position);
    } catch (e) {
        console.error('Error saving joystick position:', e);
    }
}

export function setJoystickPosition(position) {
    saveJoystickPositionPreference(position);

    const leftBtn = document.getElementById('joystick-left-btn');
    const rightBtn = document.getElementById('joystick-right-btn');

    if (position === 'left') {
        leftBtn.classList.add('active');
        rightBtn.classList.remove('active');
    } else {
        rightBtn.classList.add('active');
        leftBtn.classList.remove('active');
    }

    applyJoystickPosition(position);
}

export function applyJoystickPosition(position) {
    const joystickContainer = document.getElementById('joystick-container');
    if (joystickContainer) {
        joystickContainer.classList.remove('position-left', 'position-right');
        joystickContainer.classList.add(`position-${position}`);
    }

    // Position minimap on opposite side of joystick to prevent finger overlap
    const minimap = document.querySelector('.minimap');
    if (minimap) {
        minimap.classList.remove('position-left', 'position-right');
        // Joystick left → minimap right, joystick right → minimap left
        const minimapPosition = position === 'left' ? 'right' : 'left';
        minimap.classList.add(`position-${minimapPosition}`);
    }
}

export function initJoystickPosition() {
    const savedPosition = getJoystickPositionPreference();

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

    applyJoystickPosition(savedPosition);
}

// ============= SOUND PREFERENCES =============
export function getEngineSoundPreference() {
    try {
        const saved = localStorage.getItem(ENGINE_SOUND_KEY);
        return saved === null ? true : saved === 'true';
    } catch (e) {
        return true;
    }
}

export function saveEngineSoundPreference(enabled) {
    try {
        localStorage.setItem(ENGINE_SOUND_KEY, enabled.toString());
    } catch (e) {
        console.error('Error saving engine sound preference:', e);
    }
}

export function getMusicPreference() {
    try {
        const saved = localStorage.getItem(MUSIC_KEY);
        return saved === null ? true : saved === 'true';
    } catch (e) {
        return true;
    }
}

export function saveMusicPreference(enabled) {
    try {
        localStorage.setItem(MUSIC_KEY, enabled.toString());
    } catch (e) {
        console.error('Error saving music preference:', e);
    }
}

export function toggleEngineSound() {
    state.engineSoundEnabled = !state.engineSoundEnabled;
    saveEngineSoundPreference(state.engineSoundEnabled);
    updateSoundToggleUI();

    if (!state.engineSoundEnabled && state.gainNode) {
        state.gainNode.gain.setTargetAtTime(0, state.audioContext.currentTime, 0.05);
    }
}

export function toggleMusic() {
    state.musicEnabled = !state.musicEnabled;
    saveMusicPreference(state.musicEnabled);
    updateMusicToggleUI();

    if (state.musicEnabled && state.gameRunning) {
        startBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
}

export function updateSoundToggleUI() {
    const btn = document.getElementById('engine-sound-btn');
    if (btn) {
        btn.textContent = state.engineSoundEnabled ? '🔊 Som' : '🔇 Som';
        btn.classList.toggle('muted', !state.engineSoundEnabled);
    }

    const menuBtn = document.getElementById('engine-sound-menu-btn');
    if (menuBtn) {
        menuBtn.textContent = state.engineSoundEnabled ? '🔊 Som do Motor' : '🔇 Som do Motor';
        menuBtn.classList.toggle('muted', !state.engineSoundEnabled);
    }
}

export function updateMusicToggleUI() {
    const btn = document.getElementById('music-btn');
    if (btn) {
        btn.textContent = state.musicEnabled ? '🎵 Música' : '🎵 Música';
        btn.classList.toggle('muted', !state.musicEnabled);
    }

    const menuBtn = document.getElementById('music-menu-btn');
    if (menuBtn) {
        menuBtn.textContent = state.musicEnabled ? '🎵 Música de Fundo' : '🔇 Música de Fundo';
        menuBtn.classList.toggle('muted', !state.musicEnabled);
    }
}

export function initSoundPreferences() {
    state.engineSoundEnabled = getEngineSoundPreference();
    state.musicEnabled = getMusicPreference();
    updateSoundToggleUI();
    updateMusicToggleUI();
}

export function openSoundMenu() {
    const soundMenu = document.getElementById('sound-menu');
    if (soundMenu) {
        soundMenu.style.display = 'flex';
        updateSoundToggleUI();
        updateMusicToggleUI();
    }
}

export function closeSoundMenu() {
    const soundMenu = document.getElementById('sound-menu');
    if (soundMenu) {
        soundMenu.style.display = 'none';
    }
}
