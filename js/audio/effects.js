// ============= SOUND EFFECTS =============
// Pickup, delivery, and record sound effects

import { state } from '../state.js';

export function playPickupSound() {
    if (!state.audioContext) return;

    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();

    osc.connect(gain);
    gain.connect(state.audioContext.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, state.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, state.audioContext.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(600, state.audioContext.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, state.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, state.audioContext.currentTime + 0.3);

    osc.start(state.audioContext.currentTime);
    osc.stop(state.audioContext.currentTime + 0.3);
}

export function playDeliverySound() {
    if (!state.audioContext) return;

    // Happy delivery chime
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
        const osc = state.audioContext.createOscillator();
        const gain = state.audioContext.createGain();

        osc.connect(gain);
        gain.connect(state.audioContext.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = state.audioContext.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
    });
}

export function playRecordSound() {
    if (!state.audioContext) return;

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
        const osc = state.audioContext.createOscillator();
        const gain = state.audioContext.createGain();

        osc.connect(gain);
        gain.connect(state.audioContext.destination);

        osc.type = 'triangle';
        osc.frequency.value = note.freq;

        const startTime = state.audioContext.currentTime + note.delay;
        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.duration);

        osc.start(startTime);
        osc.stop(startTime + note.duration);
    });
}
