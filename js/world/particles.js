// ============= BOOST PARTICLE TRAIL =============
// Visual particle trail that appears when boosted

import { state } from '../state.js';

const THREE = window.THREE;

const MAX_PARTICLES = 50;
const PARTICLE_LIFETIME = 0.8; // seconds
const SPAWN_RATE = 0.02; // seconds between spawns

let particles = [];
let timeSinceLastSpawn = 0;
let particleGeometry = null;
let particleMaterials = [];

// Fire-colored gradient for particles
const PARTICLE_COLORS = [
    0xff4400, // Orange-red
    0xff6600, // Orange
    0xffaa00, // Yellow-orange
    0xffcc00, // Yellow
];

export function initParticleSystem() {
    // Create shared geometry for all particles
    particleGeometry = new THREE.SphereGeometry(0.15, 6, 6);

    // Create materials for each color
    PARTICLE_COLORS.forEach(color => {
        particleMaterials.push(new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        }));
    });

    particles = [];
}

export function updateParticleTrail(delta) {
    if (!particleGeometry) {
        initParticleSystem();
    }

    // Only spawn particles when boosted
    if (state.speedBoost > 0 && state.motorcycle && Math.abs(state.speed) > 1) {
        timeSinceLastSpawn += delta;

        // Spawn new particles at regular intervals
        while (timeSinceLastSpawn >= SPAWN_RATE && particles.length < MAX_PARTICLES) {
            spawnParticle();
            timeSinceLastSpawn -= SPAWN_RATE;
        }
    } else {
        timeSinceLastSpawn = 0;
    }

    // Update existing particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.age += delta;

        if (particle.age >= PARTICLE_LIFETIME) {
            // Remove dead particle
            state.scene.remove(particle.mesh);
            particles.splice(i, 1);
        } else {
            // Update particle
            const lifeRatio = particle.age / PARTICLE_LIFETIME;

            // Fade out and shrink
            particle.mesh.material.opacity = 1 - lifeRatio;
            const scale = (1 - lifeRatio * 0.7) * particle.baseScale;
            particle.mesh.scale.set(scale, scale, scale);

            // Rise slightly and drift
            particle.mesh.position.y += delta * 2;
            particle.mesh.position.x += particle.drift.x * delta;
            particle.mesh.position.z += particle.drift.z * delta;
        }
    }
}

function spawnParticle() {
    // Random color from fire palette
    const colorIndex = Math.floor(Math.random() * PARTICLE_COLORS.length);
    const material = particleMaterials[colorIndex].clone();

    const mesh = new THREE.Mesh(particleGeometry, material);

    // Position behind the motorcycle (at the rear wheel area)
    const offsetBack = -1.2; // Behind the bike
    const offsetX = (Math.random() - 0.5) * 0.6; // Slight horizontal spread

    // Calculate world position based on motorcycle rotation
    const cos = Math.cos(state.motorcycle.rotation.y);
    const sin = Math.sin(state.motorcycle.rotation.y);

    mesh.position.set(
        state.motorcycle.position.x + sin * offsetBack + cos * offsetX,
        0.4 + Math.random() * 0.3, // Just above ground
        state.motorcycle.position.z + cos * offsetBack - sin * offsetX
    );

    const particle = {
        mesh: mesh,
        age: 0,
        baseScale: 0.8 + Math.random() * 0.5,
        drift: {
            x: (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 2
        }
    };

    particles.push(particle);
    state.scene.add(mesh);
}

export function clearParticles() {
    particles.forEach(particle => {
        state.scene.remove(particle.mesh);
    });
    particles = [];
}
