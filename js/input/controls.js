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

    // Mobile virtual joystick
    setupVirtualJoystick();
}

function setupVirtualJoystick() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');

    if (!joystickBase || !joystickStick) return;

    const maxDistance = 40; // Maximum joystick movement radius
    const deadzone = 0.15; // Deadzone threshold (15%)
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
        state.joystickInput.x = absX > deadzone ? normalizedX : 0;
        state.joystickInput.y = absY > deadzone ? normalizedY : 0;

        // Update control keys based on joystick position
        state.keys.left = normalizedX < -deadzone;
        state.keys.right = normalizedX > deadzone;
        state.keys.forward = normalizedY < -deadzone;
        state.keys.backward = normalizedY > deadzone;
    }

    function resetJoystick() {
        joystickStick.style.transform = 'translate(-50%, -50%)';
        joystickStick.classList.remove('active');
        state.keys.forward = false;
        state.keys.backward = false;
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
