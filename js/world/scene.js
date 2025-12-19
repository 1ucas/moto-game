// ============= SCENE SETUP =============
// Three.js scene, camera, renderer, lights, sky, and clouds

import { state } from '../state.js';
import { CONFIG } from '../config.js';

const THREE = window.THREE;

export function initScene() {
    // Scene setup - bright sunny day
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x87CEEB);
    state.scene.fog = new THREE.Fog(0x87CEEB, 100, 400);

    // Camera
    state.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    state.camera.position.set(0, 8, 15);

    // Renderer - optimized settings
    state.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(1);
    state.renderer.shadowMap.enabled = false;
    document.getElementById('game-container').appendChild(state.renderer.domElement);

    // Clock
    state.clock = new THREE.Clock();
}

export function createLights() {
    // Bright ambient light for daytime
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    state.scene.add(ambient);

    // Sun light - warm and bright
    const sunLight = new THREE.DirectionalLight(0xfffacd, 1.0);
    sunLight.position.set(100, 150, 50);
    state.scene.add(sunLight);

    // Hemisphere light for natural sky/ground lighting
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3d6b3d, 0.4);
    state.scene.add(hemiLight);
}

export function createSky() {
    // Create a sky dome
    const skyGeometry = new THREE.SphereGeometry(300, 32, 32);

    // Create gradient texture for sky
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Gradient from light blue at horizon to deeper blue at top
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#4A90D9');
    gradient.addColorStop(0.4, '#87CEEB');
    gradient.addColorStop(0.7, '#B0E0E6');
    gradient.addColorStop(1, '#E0F6FF');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const skyTexture = new THREE.CanvasTexture(canvas);
    const skyMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    state.scene.add(sky);

    // Create the sun
    createSun();

    // Create fluffy clouds
    createClouds();
}

function createSun() {
    // Sun glow
    const sunGeometry = new THREE.CircleGeometry(15, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFF88,
        transparent: true,
        opacity: 0.9
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(100, 120, -150);
    sun.lookAt(0, 0, 0);
    state.scene.add(sun);

    // Sun rays/glow effect
    const glowGeometry = new THREE.CircleGeometry(25, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFAA,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(100, 120, -151);
    glow.lookAt(0, 0, 0);
    state.scene.add(glow);
}

function createClouds() {
    const cloudPositions = [
        { x: -150, y: 35, z: -200, scale: 4.0 },
        { x: 80, y: 40, z: -220, scale: 5.0 },
        { x: 200, y: 32, z: -180, scale: 3.5 },
        { x: -220, y: 38, z: -160, scale: 4.5 },
        { x: 0, y: 45, z: -250, scale: 6.0 },
        { x: 150, y: 35, z: -190, scale: 4.2 },
        { x: -80, y: 42, z: -230, scale: 5.5 },
        { x: 250, y: 38, z: -200, scale: 4.0 },
        { x: -250, y: 40, z: -180, scale: 4.8 },
        { x: 50, y: 36, z: -210, scale: 4.5 },
    ];

    cloudPositions.forEach(pos => {
        createCloud(pos.x, pos.y, pos.z, pos.scale);
    });
}

function createCloud(x, y, z, scale) {
    const cloudGroup = new THREE.Group();

    const cloudMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });

    // Create fluffy cloud from multiple spheres
    const puffs = [
        { x: 0, y: 0, z: 0, r: 5 },
        { x: 4, y: 1, z: 0, r: 4 },
        { x: -4, y: 0.5, z: 0, r: 4.5 },
        { x: 2, y: 2, z: 1, r: 3.5 },
        { x: -2, y: 1.5, z: -1, r: 3 },
        { x: 6, y: -0.5, z: 0.5, r: 3 },
        { x: -6, y: 0, z: 0.5, r: 3.5 },
        { x: 0, y: 1, z: 2, r: 3 },
    ];

    puffs.forEach(puff => {
        const geometry = new THREE.SphereGeometry(puff.r, 8, 8);
        const sphere = new THREE.Mesh(geometry, cloudMaterial);
        sphere.position.set(puff.x, puff.y, puff.z);
        cloudGroup.add(sphere);
    });

    cloudGroup.position.set(x, y, z);
    cloudGroup.scale.setScalar(scale);

    // Store for animation
    cloudGroup.userData.originalX = x;
    cloudGroup.userData.speed = 0.5 + Math.random() * 0.5;

    state.scene.add(cloudGroup);
    state.clouds.push(cloudGroup);
}

export function updateClouds(delta) {
    // Slowly drift clouds across the sky
    state.clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed * delta * 2;

        // Wrap around when cloud goes too far
        if (cloud.position.x > 200) {
            cloud.position.x = -200;
        }
    });
}

export function updateCamera() {
    // Third person camera following motorcycle
    const idealOffset = new THREE.Vector3(
        -Math.sin(state.rotation) * 12,
        6 + Math.abs(state.speed) / 20,
        -Math.cos(state.rotation) * 12
    );

    const idealLookat = new THREE.Vector3(
        state.motorcycle.position.x + Math.sin(state.rotation) * 5,
        1,
        state.motorcycle.position.z + Math.cos(state.rotation) * 5
    );

    state.camera.position.lerp(
        new THREE.Vector3(
            state.motorcycle.position.x + idealOffset.x,
            idealOffset.y,
            state.motorcycle.position.z + idealOffset.z
        ),
        0.05
    );

    state.camera.lookAt(idealLookat);
}

export function onWindowResize() {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
}
