// ============= MOTORCYCLE =============
// Player motorcycle creation and physics

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { updateEngineSound } from '../audio/engine.js';

const THREE = window.THREE;

export function createMotorcycle() {
    state.motorcycleGroup = new THREE.Group();

    const blackMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xea1d2c });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffee });

    // Main body frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.8), blackMat);
    frame.position.y = 0.6;
    state.motorcycleGroup.add(frame);

    // Tank (red)
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.8), redMat);
    tank.position.set(0, 0.9, 0.1);
    state.motorcycleGroup.add(tank);

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.7), blackMat);
    seat.position.set(0, 1, -0.4);
    state.motorcycleGroup.add(seat);

    // Wheels (simplified cylinders)
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12), wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.35, 1);
    state.motorcycleGroup.add(frontWheel);

    const rearWheel = frontWheel.clone();
    rearWheel.position.z = -0.8;
    state.motorcycleGroup.add(rearWheel);

    // Headlight
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), whiteMat);
    headlight.position.set(0, 0.9, 1.1);
    state.motorcycleGroup.add(headlight);

    // Tail light
    const taillight = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.1, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    taillight.position.set(0, 0.85, -1);
    state.motorcycleGroup.add(taillight);

    // === RIDER (simplified) ===
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), redMat);
    body.position.set(0, 1.5, -0.3);
    state.motorcycleGroup.add(body);

    // Head with helmet
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), redMat);
    head.position.set(0, 2, -0.2);
    state.motorcycleGroup.add(head);

    // Santa hat
    const santaRedMat = new THREE.MeshBasicMaterial({ color: 0xcc0000 });
    const santaWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Hat cone
    const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 8), santaRedMat);
    hatCone.position.set(0, 2.3, -0.2);
    hatCone.rotation.z = 0.3; // Slight tilt
    hatCone.rotation.x = -0.1;
    state.motorcycleGroup.add(hatCone);

    // Hat brim (white fluffy part)
    const hatBrim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 6, 12), santaWhiteMat);
    hatBrim.position.set(0, 2.15, -0.2);
    hatBrim.rotation.x = Math.PI / 2;
    state.motorcycleGroup.add(hatBrim);

    // Pom-pom at tip
    const pomPom = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), santaWhiteMat);
    pomPom.position.set(0.1, 2.45, -0.2);
    state.motorcycleGroup.add(pomPom);

    // Visor
    const visor = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 0.12),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    visor.position.set(0, 2, -0.01);
    state.motorcycleGroup.add(visor);

    // Arms
    const armMat = redMat;
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), armMat);
    leftArm.position.set(-0.32, 1.4, 0.1);
    leftArm.rotation.x = -0.8;
    state.motorcycleGroup.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.x = 0.32;
    state.motorcycleGroup.add(rightArm);

    // Legs
    const legMat = blackMat;
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.15), legMat);
    leftLeg.position.set(-0.15, 1, -0.1);
    leftLeg.rotation.x = -0.3;
    state.motorcycleGroup.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.15;
    state.motorcycleGroup.add(rightLeg);

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
    state.motorcycleGroup.add(bagGroup);

    state.motorcycleGroup.userData.bag = bagGroup;

    state.scene.add(state.motorcycleGroup);
    state.motorcycle = state.motorcycleGroup;
}

export function updateMotorcycle(delta) {
    const acceleration = CONFIG.ACCELERATION;
    const maxSpeed = CONFIG.MAX_SPEED + state.speedBoost;

    // Acceleration
    if (state.keys.forward) {
        state.speed = Math.min(state.speed + acceleration, maxSpeed);
    } else if (state.keys.backward) {
        state.speed = Math.max(state.speed - CONFIG.BRAKE_POWER, -15);
    } else {
        // Friction
        state.speed *= (1 - CONFIG.FRICTION);
        if (Math.abs(state.speed) < 0.1) state.speed = 0;
    }

    // Turning (only when moving)
    if (Math.abs(state.speed) > 1) {
        const turnFactor = Math.min(Math.abs(state.speed) / 30, 1);

        // Use smoother turning when joystick is active
        if (state.joystickActive && state.joystickInput.x !== 0) {
            // Apply gradual turning based on joystick position (reduced by 60% for smoother control)
            state.rotation -= CONFIG.TURN_SPEED * turnFactor * state.joystickInput.x * 0.6;
        } else {
            // Keyboard input uses full turning
            if (state.keys.left) {
                state.rotation += CONFIG.TURN_SPEED * turnFactor;
            }
            if (state.keys.right) {
                state.rotation -= CONFIG.TURN_SPEED * turnFactor;
            }
        }
    }

    // Calculate velocity
    state.velocity.x = Math.sin(state.rotation) * state.speed * delta;
    state.velocity.z = Math.cos(state.rotation) * state.speed * delta;

    // Update position
    const newX = state.motorcycle.position.x + state.velocity.x;
    const newZ = state.motorcycle.position.z + state.velocity.z;

    // Check building collisions
    let canMove = true;
    for (const building of state.buildings) {
        const halfWidth = building.width / 2 + 1;
        const halfDepth = building.depth / 2 + 1;

        if (newX > building.x - halfWidth && newX < building.x + halfWidth &&
            newZ > building.z - halfDepth && newZ < building.z + halfDepth) {
            canMove = false;
            state.speed *= -0.3; // Bounce back
            break;
        }
    }

    // Boundary check
    const boundary = CONFIG.CITY_SIZE / 2 - 10;
    if (Math.abs(newX) > boundary || Math.abs(newZ) > boundary) {
        canMove = false;
        state.speed *= -0.5;
    }

    if (canMove) {
        // Track distance
        state.distanceTraveled += Math.sqrt(
            Math.pow(newX - state.motorcycle.position.x, 2) +
            Math.pow(newZ - state.motorcycle.position.z, 2)
        );

        state.motorcycle.position.x = newX;
        state.motorcycle.position.z = newZ;
    }

    // Rotation
    state.motorcycle.rotation.y = state.rotation;

    // Tilt when turning
    const targetTilt = (state.keys.left ? 0.2 : 0) - (state.keys.right ? 0.2 : 0);
    state.motorcycle.rotation.z = THREE.MathUtils.lerp(state.motorcycle.rotation.z, targetTilt * (state.speed / maxSpeed), 0.1);

    // Bag bounce animation
    if (state.motorcycle.userData.bag) {
        const bounceAmount = Math.sin(state.clock.getElapsedTime() * 10) * 0.02 * (state.speed / maxSpeed);
        state.motorcycle.userData.bag.rotation.x = bounceAmount;
    }

    // Update engine sound
    updateEngineSound();
}
