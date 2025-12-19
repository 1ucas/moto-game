// ============= ENGINE SOUND SYSTEM =============
// Web Audio API oscillator for motorcycle engine sound

import { state } from '../state.js';
import { CONFIG } from '../config.js';

export function initAudio() {
    try {
        // Reuse existing audio context if already initialized
        if (state.audioContext && state.oscillator) {
            // Just ensure the audio context is running (may be suspended)
            if (state.audioContext.state === 'suspended') {
                state.audioContext.resume();
            }
            return;
        }

        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        state.gainNode = state.audioContext.createGain();
        state.gainNode.connect(state.audioContext.destination);
        state.gainNode.gain.value = 0;

        state.oscillator = state.audioContext.createOscillator();
        state.oscillator.type = 'sawtooth';
        state.oscillator.frequency.value = 50;
        state.oscillator.connect(state.gainNode);
        state.oscillator.start();
    } catch (e) {
        console.log('Audio not supported');
    }
}

export function updateEngineSound() {
    if (!state.audioContext || !state.oscillator) return;

    // Engine frequency based on speed
    const baseFreq = 40;
    const maxFreq = 150;
    const freq = baseFreq + (Math.abs(state.speed) / CONFIG.MAX_SPEED) * (maxFreq - baseFreq);

    state.oscillator.frequency.setTargetAtTime(freq, state.audioContext.currentTime, 0.1);

    // Volume based on speed (respects engine sound toggle)
    const volume = state.engineSoundEnabled ? Math.min(Math.abs(state.speed) / 30, 0.04) : 0;
    state.gainNode.gain.setTargetAtTime(volume, state.audioContext.currentTime, 0.1);
}

export function stopEngineSound() {
    if (!state.audioContext || !state.gainNode) return;

    // Silence the engine sound
    state.gainNode.gain.setTargetAtTime(0, state.audioContext.currentTime, 0.1);
}
