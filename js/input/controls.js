// ============= INPUT CONTROLS =============
// Keyboard and virtual joystick handling

import { state } from '../state.js';
import { closeSoundMenu } from '../ui/preferences.js';

export function setupControls() {
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
                state.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                state.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                state.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                state.keys.right = true;
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                state.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                state.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                state.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                state.keys.right = false;
                break;
        }
    });

    // Mobile virtual joystick (horizontal steering only)
    setupVirtualJoystick();

    // Mobile throttle/brake buttons
    setupPedalButtons();
}

function setupVirtualJoystick() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');

    if (!joystickBase || !joystickStick) return;

    const maxDistance = 50; // Maximum joystick movement radius (wider for horizontal)
    const deadzone = 0.08; // Reduced deadzone threshold (8%) for better responsiveness
    let hasBeenTouched = false; // Track first touch for hint animation

    function getJoystickCenter() {
        const rect = joystickBase.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    function handleJoystickMove(clientX, clientY) {
        const center = getJoystickCenter();

        // Calculate offset from center (horizontal only)
        let deltaX = clientX - center.x;

        // Clamp to max distance (horizontal only)
        if (Math.abs(deltaX) > maxDistance) {
            deltaX = Math.sign(deltaX) * maxDistance;
        }

        // Update stick position (horizontal movement only)
        joystickStick.style.transform = `translate(calc(-50% + ${deltaX}px), -50%)`;

        // Normalize value (-1 to 1)
        const normalizedX = deltaX / maxDistance;

        // Apply deadzone (reduced to 8% for better responsiveness)
        const absX = Math.abs(normalizedX);

        // Store smoothed joystick input for gradual turning (steering only)
        state.joystickInput.x = absX > deadzone ? normalizedX : 0;
        // Y-axis no longer controlled by joystick - handled by pedal buttons
        state.joystickInput.y = 0;

        // Update steering keys based on joystick position
        state.keys.left = normalizedX < -deadzone;
        state.keys.right = normalizedX > deadzone;
        // Forward/backward no longer controlled by joystick
    }

    function resetJoystick() {
        joystickStick.style.transform = 'translate(-50%, -50%)';
        joystickStick.classList.remove('active');
        // Only reset steering keys - forward/backward are controlled by pedal buttons
        state.keys.left = false;
        state.keys.right = false;
        state.joystickInput.x = 0;
        state.joystickInput.y = 0;
        state.joystickActive = false;
        state.joystickTouchId = null;
    }

    // Touch events
    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (state.joystickActive) return;

        // First-touch hint animation
        if (!hasBeenTouched) {
            hasBeenTouched = true;
            joystickBase.classList.add('first-touch');
            setTimeout(() => {
                joystickBase.classList.remove('first-touch');
            }, 600);

            // Hide the touch hint icon
            const touchHint = document.getElementById('joystick-touch-hint');
            if (touchHint) {
                touchHint.classList.add('hidden');
            }
        }

        const touch = e.changedTouches[0];
        state.joystickTouchId = touch.identifier;
        state.joystickActive = true;
        joystickStick.classList.add('active');
        handleJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!state.joystickActive) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === state.joystickTouchId) {
                e.preventDefault();
                handleJoystickMove(touch.clientX, touch.clientY);
                break;
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === state.joystickTouchId) {
                resetJoystick();
                break;
            }
        }
    });

    document.addEventListener('touchcancel', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === state.joystickTouchId) {
                resetJoystick();
                break;
            }
        }
    });

    // Prevent context menu on long press
    joystickBase.addEventListener('contextmenu', (e) => e.preventDefault());
}

function setupPedalButtons() {
    const throttleBtn = document.getElementById('throttle-btn');
    const brakeBtn = document.getElementById('brake-btn');

    if (!throttleBtn || !brakeBtn) return;

    // Track touch IDs to support multi-touch (gas + brake simultaneously if needed)
    let throttleTouchId = null;
    let brakeTouchId = null;

    // Throttle button handlers
    throttleBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (throttleTouchId !== null) return;
        throttleTouchId = e.changedTouches[0].identifier;
        state.keys.forward = true;
        throttleBtn.classList.add('active');
    }, { passive: false });

    throttleBtn.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === throttleTouchId) {
                throttleTouchId = null;
                state.keys.forward = false;
                throttleBtn.classList.remove('active');
                break;
            }
        }
    });

    throttleBtn.addEventListener('touchcancel', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === throttleTouchId) {
                throttleTouchId = null;
                state.keys.forward = false;
                throttleBtn.classList.remove('active');
                break;
            }
        }
    });

    // Brake button handlers
    brakeBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (brakeTouchId !== null) return;
        brakeTouchId = e.changedTouches[0].identifier;
        state.keys.backward = true;
        brakeBtn.classList.add('active');
    }, { passive: false });

    brakeBtn.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === brakeTouchId) {
                brakeTouchId = null;
                state.keys.backward = false;
                brakeBtn.classList.remove('active');
                break;
            }
        }
    });

    brakeBtn.addEventListener('touchcancel', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === brakeTouchId) {
                brakeTouchId = null;
                state.keys.backward = false;
                brakeBtn.classList.remove('active');
                break;
            }
        }
    });

    // Prevent context menu on long press
    throttleBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    brakeBtn.addEventListener('contextmenu', (e) => e.preventDefault());
}
