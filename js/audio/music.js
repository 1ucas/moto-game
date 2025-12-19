// ============= BACKGROUND MUSIC =============
// 8-bit style procedural music generation

import { state } from '../state.js';

export function startBackgroundMusic() {
    if (!state.audioContext || !state.musicEnabled || state.musicNodes) return;

    // Create a master gain for music
    const musicGain = state.audioContext.createGain();
    musicGain.gain.value = 0.025;
    musicGain.connect(state.audioContext.destination);

    // Note frequencies (Game Boy style tuning)
    const noteFreqs = {
        'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
        'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
        'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
        'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51
    };

    // Tempo: ~150 BPM
    const eighth = 0.2;
    const quarter = 0.4;
    const half = 0.8;

    // Pokemon Red/Blue Bicycle Theme inspired melody
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

    // Harmony (Pulse 2 channel)
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
        if (!state.musicEnabled || !state.musicNodes) return;

        let time = state.audioContext.currentTime + 0.05;
        melody.forEach(noteData => {
            const osc = state.audioContext.createOscillator();
            const noteGain = state.audioContext.createGain();

            osc.type = 'square';
            osc.frequency.value = noteFreqs[noteData.note];

            osc.connect(noteGain);
            noteGain.connect(musicGain);

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
        if (!state.musicEnabled || !state.musicNodes) return;

        let time = state.audioContext.currentTime + 0.05;
        const harmonyGain = state.audioContext.createGain();
        harmonyGain.gain.value = 0.6;
        harmonyGain.connect(musicGain);

        harmony.forEach(noteData => {
            const osc = state.audioContext.createOscillator();
            const noteGain = state.audioContext.createGain();

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
        if (!state.musicEnabled || !state.musicNodes) return;

        let time = state.audioContext.currentTime + 0.05;
        let bassDuration = 0;
        bassPattern.forEach(n => bassDuration += n.duration);

        const repetitions = Math.ceil(totalDuration / bassDuration) + 1;

        for (let rep = 0; rep < repetitions; rep++) {
            bassPattern.forEach(noteData => {
                if (time < state.audioContext.currentTime + totalDuration + 0.1) {
                    const osc = state.audioContext.createOscillator();
                    const noteGain = state.audioContext.createGain();

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

    function schedulePercussion() {
        if (!state.musicEnabled || !state.musicNodes) return;

        const percGain = state.audioContext.createGain();
        percGain.gain.value = 0.08;
        percGain.connect(musicGain);

        let time = state.audioContext.currentTime + 0.05;
        const beatInterval = eighth;
        const beats = Math.floor(totalDuration / beatInterval);

        for (let i = 0; i < beats; i++) {
            const isSnare = (i % 4 === 2);

            const bufferSize = 4096;
            const noiseBuffer = state.audioContext.createBuffer(1, bufferSize, state.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let j = 0; j < bufferSize; j++) {
                output[j] = Math.random() * 2 - 1;
            }

            const noise = state.audioContext.createBufferSource();
            noise.buffer = noiseBuffer;

            const noiseGain = state.audioContext.createGain();
            const filter = state.audioContext.createBiquadFilter();

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
        if (!state.musicEnabled || !state.musicNodes) {
            clearInterval(loopTimer);
            return;
        }
        scheduleMelody();
        scheduleHarmony();
        scheduleBass();
        schedulePercussion();
    }, loopInterval);

    // Store references for cleanup
    state.musicNodes = {
        gain: musicGain,
        loopTimer: loopTimer
    };
}

export function stopBackgroundMusic() {
    if (state.musicNodes) {
        if (state.musicNodes.loopTimer) {
            clearInterval(state.musicNodes.loopTimer);
        }
        if (state.musicNodes.gain) {
            state.musicNodes.gain.gain.setTargetAtTime(0, state.audioContext.currentTime, 0.1);
        }
        state.musicNodes = null;
    }
}
