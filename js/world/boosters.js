// ============= FIRE BOOSTERS =============
// Speed boost pickups placed on streets

import { state } from '../state.js';
import { GRID_SPACING, STREET_WIDTH } from '../config.js';

const THREE = window.THREE;

const BOOSTER_COUNT = 5;
const BOOST_AMOUNT = 15; // +15 km/h
const BOOST_DURATION = 3000; // 3 seconds in ms
const PICKUP_RADIUS = 3;

// Booster positions - placed on street segments, avoiding intersections
const BOOSTER_POSITIONS = [
    // Horizontal street segments (between intersections)
    { x: -120, z: 0, direction: 'horizontal' },
    { x: 120, z: 80, direction: 'horizontal' },
    { x: -40, z: -80, direction: 'horizontal' },
    // Vertical street segments
    { x: 0, z: -120, direction: 'vertical' },
    { x: 80, z: 40, direction: 'vertical' },
];

export function createBoosters() {
    state.boosters = [];

    BOOSTER_POSITIONS.forEach((pos, index) => {
        const booster = createBooster(pos.x, pos.z, pos.direction);
        booster.userData.index = index;
        booster.userData.active = true;
        booster.userData.respawnTime = 0;
        state.boosters.push(booster);
        state.scene.add(booster);
    });
}

function createBooster(x, z, direction) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Base platform (glowing orange/red circle)
    const baseMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.8
    });
    const base = new THREE.Mesh(
        new THREE.CircleGeometry(2, 16),
        baseMat
    );
    base.rotation.x = -Math.PI / 2;
    base.position.y = 0.1;
    group.add(base);

    // Inner glow
    const innerGlow = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 16),
        new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.9
        })
    );
    innerGlow.rotation.x = -Math.PI / 2;
    innerGlow.position.y = 0.12;
    group.add(innerGlow);

    // Fire flames (cone shapes)
    const flameMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.85
    });

    // Central flame
    const centralFlame = new THREE.Mesh(
        new THREE.ConeGeometry(0.6, 2, 8),
        flameMat
    );
    centralFlame.position.y = 1;
    group.add(centralFlame);

    // Surrounding flames
    const surroundingFlames = [];
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const flame = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 1.4, 6),
            new THREE.MeshBasicMaterial({
                color: 0xffaa00,
                transparent: true,
                opacity: 0.8
            })
        );
        flame.position.set(
            Math.cos(angle) * 0.8,
            0.7,
            Math.sin(angle) * 0.8
        );
        flame.userData.angle = angle;
        flame.userData.index = i;
        surroundingFlames.push(flame);
        group.add(flame);
    }

    // Fire emoji sprite floating above the booster (replacing the arrow indicator)
    const emojiSprite = createFireEmojiSprite();
    emojiSprite.position.y = 2.5;
    emojiSprite.scale.set(1.5, 1.5, 1);
    group.add(emojiSprite);

    // Store references for animation
    group.userData.base = base;
    group.userData.innerGlow = innerGlow;
    group.userData.emojiSprite = emojiSprite;
    group.userData.centralFlame = centralFlame;
    group.userData.surroundingFlames = surroundingFlames;

    return group;
}

// Create a fire emoji sprite using canvas
function createFireEmojiSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Draw fire emoji
    ctx.font = '100px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥', 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
    });

    return new THREE.Sprite(spriteMaterial);
}

export function updateBoosters(delta) {
    const time = state.clock.getElapsedTime();

    state.boosters.forEach(booster => {
        // Handle respawn
        if (!booster.userData.active) {
            if (Date.now() >= booster.userData.respawnTime) {
                booster.userData.active = true;
                booster.visible = true;
            }
            return;
        }

        // Animate the central flame
        const centralFlame = booster.userData.centralFlame;
        if (centralFlame) {
            centralFlame.scale.y = 1 + Math.sin(time * 10) * 0.2;
            centralFlame.scale.x = 1 + Math.sin(time * 8 + 1) * 0.1;
            centralFlame.scale.z = 1 + Math.sin(time * 8 + 2) * 0.1;
        }

        // Animate surrounding flames
        const surroundingFlames = booster.userData.surroundingFlames;
        if (surroundingFlames) {
            surroundingFlames.forEach((flame, i) => {
                flame.position.y = 0.7 + Math.sin(time * 12 + i) * 0.15;
            });
        }

        // Animate the fire emoji sprite - bob up and down and pulse scale
        const emojiSprite = booster.userData.emojiSprite;
        if (emojiSprite) {
            emojiSprite.position.y = 2.5 + Math.sin(time * 4) * 0.3;
            const scale = 1.5 + Math.sin(time * 6) * 0.15;
            emojiSprite.scale.set(scale, scale, 1);
        }

        // Pulse the base glow
        const base = booster.userData.base;
        if (base) {
            base.material.opacity = 0.6 + Math.sin(time * 5) * 0.2;
        }

        // Pulse inner glow
        const innerGlow = booster.userData.innerGlow;
        if (innerGlow) {
            innerGlow.material.opacity = 0.7 + Math.sin(time * 7) * 0.2;
        }
    });

    // Check for boost expiration
    if (state.speedBoost > 0 && Date.now() >= state.boostEndTime) {
        state.speedBoost = 0;
    }
}

export function checkBoosterCollision() {
    if (!state.motorcycle) return;

    const playerX = state.motorcycle.position.x;
    const playerZ = state.motorcycle.position.z;

    state.boosters.forEach(booster => {
        if (!booster.userData.active) return;

        const dx = playerX - booster.position.x;
        const dz = playerZ - booster.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < PICKUP_RADIUS) {
            activateBoost(booster);
        }
    });
}

function activateBoost(booster) {
    // Apply speed boost - both immediate speed increase AND raised max speed
    state.speedBoost = BOOST_AMOUNT;
    state.boostEndTime = Date.now() + BOOST_DURATION;

    // Immediate speed boost: add 15 km/h to current speed
    state.speed += BOOST_AMOUNT;

    // Hide booster and set respawn timer (10 seconds)
    booster.userData.active = false;
    booster.visible = false;
    booster.userData.respawnTime = Date.now() + 10000;
}

export { BOOST_AMOUNT, BOOST_DURATION };
