// iFood Delivery Rush - The Game!
// A fun Three.js delivery game

// ============= GAME CONFIG =============
const CONFIG = {
    GAME_TIME: 180, // 3 minutes
    CITY_SIZE: 400,
    BUILDING_COUNT: 40,
    CAR_COUNT: 8,
    DELIVERY_BASE_REWARD: 15,
    COMBO_MULTIPLIER: 1.5,
    COMBO_TIMEOUT: 10000, // 10 seconds to maintain combo
    MAX_SPEED: 25,
    ACCELERATION: 0.08,
    BRAKE_POWER: 0.15,
    TURN_SPEED: 0.035,
    FRICTION: 0.03,
};

// ============= GAME STATE =============
let scene, camera, renderer;
let motorcycle, motorcycleGroup;
let clock, mixer;
let buildings = [];
let streetLights = [];
let trafficCars = [];
let restaurants = [];
let customers = [];
let clouds = [];
let currentOrder = null;
let hasFood = false;
let score = 0;
let combo = 1;
let maxCombo = 1;
let comboTimer = null;
let deliveriesCount = 0;
let distanceTraveled = 0;
let lastPosition = { x: 0, z: 0 };
let gameTime = CONFIG.GAME_TIME;
let gameRunning = false;
let speed = 0;
let velocity = { x: 0, z: 0 };
let rotation = 0;

// Controls state
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// Audio context
let audioContext;
let gainNode;
let oscillator;

// ============= INITIALIZATION =============
function init() {
    // Scene setup - bright sunny day
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 100, 400);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 8, 15);

    // Renderer - optimized settings
    renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1); // Fixed pixel ratio for performance
    renderer.shadowMap.enabled = false; // Disable shadows for performance
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Clock
    clock = new THREE.Clock();

    // Lights
    createLights();

    // Sky and clouds
    createSky();

    // City
    createGround();
    createBuildings();
    createStreets();
    createStreetLights();
    createTrafficCars();

    // Player
    createMotorcycle();

    // Game elements
    createRestaurants();
    createCustomers();

    // Event listeners
    setupControls();
    window.addEventListener('resize', onWindowResize);

    // Custom cursor
    document.addEventListener('mousemove', (e) => {
        const cursor = document.getElementById('cursor');
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Hide loading, show start
    document.getElementById('loading').style.display = 'none';
    document.getElementById('start-screen').style.display = 'flex';

    // Start render loop
    animate();
}

// ============= LIGHTS =============
function createLights() {
    // Bright ambient light for daytime
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    // Sun light - warm and bright
    const sunLight = new THREE.DirectionalLight(0xfffacd, 1.0);
    sunLight.position.set(100, 150, 50);
    scene.add(sunLight);

    // Hemisphere light for natural sky/ground lighting
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3d6b3d, 0.4);
    scene.add(hemiLight);
}

// ============= SKY & CLOUDS =============
function createSky() {
    // Create a sky dome
    const skyGeometry = new THREE.SphereGeometry(300, 32, 32);

    // Create gradient texture for sky
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Gradient from light blue at horizon to deeper blue at top
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#4A90D9');    // Deeper blue at top
    gradient.addColorStop(0.4, '#87CEEB');  // Sky blue
    gradient.addColorStop(0.7, '#B0E0E6');  // Powder blue
    gradient.addColorStop(1, '#E0F6FF');    // Very light blue at horizon

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const skyTexture = new THREE.CanvasTexture(canvas);
    const skyMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

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
    scene.add(sun);

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
    scene.add(glow);
}

function createClouds() {
    // Clouds positioned low on the horizon for visibility
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

    scene.add(cloudGroup);
    clouds.push(cloudGroup);
}

// ============= GROUND & STREETS =============
const GRID_SPACING = 80; // Larger blocks
const STREET_WIDTH = 20; // Wide streets
const BLOCK_SIZE = GRID_SPACING - STREET_WIDTH; // Size of each city block

function createGround() {
    // Grass/earth base
    const groundGeometry = new THREE.PlaneGeometry(CONFIG.CITY_SIZE, CONFIG.CITY_SIZE);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x2d4a2d }); // Dark green
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
}

function createStreets() {
    const streetMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const sidewalkMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Create street grid
    for (let i = -2; i <= 2; i++) {
        // Horizontal streets
        const hStreet = new THREE.Mesh(
            new THREE.PlaneGeometry(CONFIG.CITY_SIZE, STREET_WIDTH),
            streetMaterial
        );
        hStreet.rotation.x = -Math.PI / 2;
        hStreet.position.set(0, 0.01, i * GRID_SPACING);
        scene.add(hStreet);

        // Vertical streets
        const vStreet = new THREE.Mesh(
            new THREE.PlaneGeometry(STREET_WIDTH, CONFIG.CITY_SIZE),
            streetMaterial
        );
        vStreet.rotation.x = -Math.PI / 2;
        vStreet.position.set(i * GRID_SPACING, 0.01, 0);
        scene.add(vStreet);

        // Center line markings (dashed yellow)
        for (let d = -CONFIG.CITY_SIZE / 2; d < CONFIG.CITY_SIZE / 2; d += 8) {
            const hDash = new THREE.Mesh(
                new THREE.PlaneGeometry(4, 0.3),
                markingMaterial
            );
            hDash.rotation.x = -Math.PI / 2;
            hDash.position.set(d, 0.02, i * GRID_SPACING);
            scene.add(hDash);

            const vDash = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 4),
                markingMaterial
            );
            vDash.rotation.x = -Math.PI / 2;
            vDash.position.set(i * GRID_SPACING, 0.02, d);
            scene.add(vDash);
        }

        // Edge lines (white)
        const hEdge1 = new THREE.Mesh(
            new THREE.PlaneGeometry(CONFIG.CITY_SIZE, 0.2),
            whiteMaterial
        );
        hEdge1.rotation.x = -Math.PI / 2;
        hEdge1.position.set(0, 0.02, i * GRID_SPACING + STREET_WIDTH / 2 - 1);
        scene.add(hEdge1);

        const hEdge2 = hEdge1.clone();
        hEdge2.position.z = i * GRID_SPACING - STREET_WIDTH / 2 + 1;
        scene.add(hEdge2);

        const vEdge1 = new THREE.Mesh(
            new THREE.PlaneGeometry(0.2, CONFIG.CITY_SIZE),
            whiteMaterial
        );
        vEdge1.rotation.x = -Math.PI / 2;
        vEdge1.position.set(i * GRID_SPACING + STREET_WIDTH / 2 - 1, 0.02, 0);
        scene.add(vEdge1);

        const vEdge2 = vEdge1.clone();
        vEdge2.position.x = i * GRID_SPACING - STREET_WIDTH / 2 + 1;
        scene.add(vEdge2);
    }

    // Create city blocks with sidewalks and medians
    createCityBlocks();
}

function createCityBlocks() {
    const sidewalkMaterial = new THREE.MeshBasicMaterial({ color: 0x888888 });
    const grassMaterial = new THREE.MeshBasicMaterial({ color: 0x3d6b3d });
    const flowerColors = [0xff6b9d, 0xffeb3b, 0xff5722, 0x9c27b0, 0x4caf50];

    // Create blocks between streets
    for (let bx = -2; bx < 2; bx++) {
        for (let bz = -2; bz < 2; bz++) {
            const blockCenterX = bx * GRID_SPACING + GRID_SPACING / 2;
            const blockCenterZ = bz * GRID_SPACING + GRID_SPACING / 2;

            // Sidewalk around block
            const sidewalk = new THREE.Mesh(
                new THREE.PlaneGeometry(BLOCK_SIZE + 4, BLOCK_SIZE + 4),
                sidewalkMaterial
            );
            sidewalk.rotation.x = -Math.PI / 2;
            sidewalk.position.set(blockCenterX, 0.02, blockCenterZ);
            scene.add(sidewalk);

            // Inner grass/park area
            const innerGrass = new THREE.Mesh(
                new THREE.PlaneGeometry(BLOCK_SIZE - 4, BLOCK_SIZE - 4),
                grassMaterial
            );
            innerGrass.rotation.x = -Math.PI / 2;
            innerGrass.position.set(blockCenterX, 0.03, blockCenterZ);
            scene.add(innerGrass);

            // Add flowerbeds in some blocks
            if (Math.random() > 0.3) {
                addFlowerbed(blockCenterX, blockCenterZ, flowerColors);
            }
        }
    }

    // Add median strips along streets with flowerbeds
    createMedians(flowerColors);
}

function addFlowerbed(cx, cz, flowerColors) {
    const bedSize = 8 + Math.random() * 6;

    // Flower bed border
    const bed = new THREE.Mesh(
        new THREE.PlaneGeometry(bedSize, bedSize),
        new THREE.MeshBasicMaterial({ color: 0x5d4037 }) // Brown soil
    );
    bed.rotation.x = -Math.PI / 2;
    bed.position.set(cx + (Math.random() - 0.5) * 20, 0.04, cz + (Math.random() - 0.5) * 20);
    scene.add(bed);

    // Add flowers
    const flowerCount = 5 + Math.floor(Math.random() * 8);
    for (let f = 0; f < flowerCount; f++) {
        const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
        const flower = new THREE.Mesh(
            new THREE.SphereGeometry(0.4 + Math.random() * 0.3, 6, 6),
            new THREE.MeshBasicMaterial({ color: flowerColor })
        );
        flower.position.set(
            bed.position.x + (Math.random() - 0.5) * (bedSize - 2),
            0.3,
            bed.position.z + (Math.random() - 0.5) * (bedSize - 2)
        );
        scene.add(flower);
    }
}

function createMedians(flowerColors) {
    const medianMaterial = new THREE.MeshBasicMaterial({ color: 0x4a7c4a });

    // Medians at intersections (roundabout style)
    for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
            // Skip center where player spawns
            if (i === 0 && j === 0) continue;

            const cx = i * GRID_SPACING;
            const cz = j * GRID_SPACING;

            // Small circular median at intersection
            const median = new THREE.Mesh(
                new THREE.CircleGeometry(3, 12),
                medianMaterial
            );
            median.rotation.x = -Math.PI / 2;
            median.position.set(cx, 0.03, cz);
            scene.add(median);

            // Add a small tree or flowers
            if (Math.random() > 0.5) {
                // Tree
                const trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.4, 2, 6),
                    new THREE.MeshBasicMaterial({ color: 0x5d4037 })
                );
                trunk.position.set(cx, 1, cz);
                scene.add(trunk);

                const leaves = new THREE.Mesh(
                    new THREE.SphereGeometry(1.5, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0x2e7d32 })
                );
                leaves.position.set(cx, 2.5, cz);
                scene.add(leaves);
            } else {
                // Flowers
                for (let f = 0; f < 5; f++) {
                    const flower = new THREE.Mesh(
                        new THREE.SphereGeometry(0.3, 6, 6),
                        new THREE.MeshBasicMaterial({
                            color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
                        })
                    );
                    flower.position.set(
                        cx + (Math.random() - 0.5) * 4,
                        0.3,
                        cz + (Math.random() - 0.5) * 4
                    );
                    scene.add(flower);
                }
            }
        }
    }
}

// ============= BUILDINGS =============
// Landmark positions - buildings should avoid these
const LANDMARK_POSITIONS = [
    // Restaurants
    { x: -120, z: -120 }, { x: 120, z: -120 },
    { x: -120, z: 120 }, { x: 120, z: 120 },
    { x: 0, z: -160 }, { x: 0, z: 160 },
    // Customers
    { x: -160, z: 0 }, { x: 160, z: 0 },
    { x: -40, z: -160 }, { x: 40, z: 160 },
    { x: 160, z: -120 }, { x: -160, z: 120 }
];

function isNearLandmark(x, z, margin = 15) {
    for (const pos of LANDMARK_POSITIONS) {
        const dist = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
        if (dist < margin) return true;
    }
    return false;
}

function isOnStreet(x, z) {
    // Check if position is on a street
    for (let i = -2; i <= 2; i++) {
        const streetPos = i * GRID_SPACING;
        if (Math.abs(x - streetPos) < STREET_WIDTH / 2 + 2) return true;
        if (Math.abs(z - streetPos) < STREET_WIDTH / 2 + 2) return true;
    }
    return false;
}

function createBuildings() {
    const buildingColors = [
        0x2d2d44, 0x3d3d5c, 0x4a4a6a, 0x383850,
        0x2a3a4a, 0x3a2a4a, 0x4a3a3a, 0x3a4a4a
    ];

    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const windowOffMaterial = new THREE.MeshBasicMaterial({ color: 0x222233 });

    // Place buildings in each city block
    for (let bx = -2; bx < 2; bx++) {
        for (let bz = -2; bz < 2; bz++) {
            const blockCenterX = bx * GRID_SPACING + GRID_SPACING / 2;
            const blockCenterZ = bz * GRID_SPACING + GRID_SPACING / 2;

            // Add 0-1 buildings per block (fewer buildings)
            const buildingsInBlock = Math.random() > 0.4 ? 1 : 0;

            for (let b = 0; b < buildingsInBlock; b++) {
                const maxOffset = BLOCK_SIZE / 2 - 12;
                const x = blockCenterX + (Math.random() - 0.5) * maxOffset * 2;
                const z = blockCenterZ + (Math.random() - 0.5) * maxOffset * 2;

                // Skip if near landmark or on street
                if (isNearLandmark(x, z, 20)) continue;
                if (isOnStreet(x, z)) continue;

                const width = 8 + Math.random() * 8;
                const depth = 8 + Math.random() * 8;
                const height = 12 + Math.random() * 25;

                const buildingMaterial = new THREE.MeshBasicMaterial({
                    color: buildingColors[Math.floor(Math.random() * buildingColors.length)]
                });

                const building = new THREE.Mesh(
                    new THREE.BoxGeometry(width, height, depth),
                    buildingMaterial
                );
                building.position.set(x, height / 2, z);
                scene.add(building);

                // Windows
                const windowSpacing = 5;
                for (let wy = 4; wy < height - 2; wy += windowSpacing) {
                    const isLit = Math.random() > 0.4;
                    const win = new THREE.Mesh(
                        new THREE.PlaneGeometry(width * 0.7, 1.5),
                        isLit ? windowMaterial : windowOffMaterial
                    );
                    win.position.set(x, wy, z + depth / 2 + 0.1);
                    scene.add(win);
                }

                buildings.push({ mesh: building, width, depth, x, z });
            }
        }
    }
}

// ============= STREET LIGHTS =============
function createStreetLights() {
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });

    // Place lights along the streets
    for (let i = -2; i <= 2; i++) {
        for (let d = -CONFIG.CITY_SIZE / 2 + 20; d < CONFIG.CITY_SIZE / 2; d += 40) {
            // Lights along horizontal streets
            const pole1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 0.3), poleMat);
            pole1.position.set(d, 3, i * GRID_SPACING + STREET_WIDTH / 2 - 2);
            scene.add(pole1);

            const lamp1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), glowMat);
            lamp1.position.set(d, 6.5, i * GRID_SPACING + STREET_WIDTH / 2 - 2);
            scene.add(lamp1);

            // Lights along vertical streets
            const pole2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 0.3), poleMat);
            pole2.position.set(i * GRID_SPACING + STREET_WIDTH / 2 - 2, 3, d);
            scene.add(pole2);

            const lamp2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), glowMat);
            lamp2.position.set(i * GRID_SPACING + STREET_WIDTH / 2 - 2, 6.5, d);
            scene.add(lamp2);
        }
    }
}

// ============= TRAFFIC CARS =============
function createTrafficCars() {
    const carColors = [0x4444ff, 0xff4444, 0x44ff44, 0xffff44, 0xff44ff, 0x44ffff];

    for (let i = 0; i < CONFIG.CAR_COUNT; i++) {
        const carGroup = new THREE.Group();

        const bodyMat = new THREE.MeshBasicMaterial({
            color: carColors[Math.floor(Math.random() * carColors.length)]
        });

        // Simple car body
        const body = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 4), bodyMat);
        body.position.y = 0.7;
        carGroup.add(body);

        // Car top
        const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2), bodyMat);
        top.position.set(0, 1.5, -0.3);
        carGroup.add(top);

        // Headlights
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        const headlight = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.1), lightMat);
        headlight.position.set(0, 0.5, 2);
        carGroup.add(headlight);

        // Tail lights
        const tailMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const taillight = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.1), tailMat);
        taillight.position.set(0, 0.5, -2);
        carGroup.add(taillight);

        // Position on streets using new grid spacing
        const streetIndex = Math.floor(Math.random() * 5) - 2;
        const isHorizontal = Math.random() > 0.5;
        const streetPos = (Math.random() - 0.5) * CONFIG.CITY_SIZE * 0.8;
        const laneOffset = (Math.random() > 0.5 ? 1 : -1) * 4; // Stay in lane

        if (isHorizontal) {
            carGroup.position.set(streetPos, 0, streetIndex * GRID_SPACING + laneOffset);
            carGroup.rotation.y = laneOffset > 0 ? 0 : Math.PI;
        } else {
            carGroup.position.set(streetIndex * GRID_SPACING + laneOffset, 0, streetPos);
            carGroup.rotation.y = laneOffset > 0 ? Math.PI / 2 : -Math.PI / 2;
        }

        carGroup.userData = {
            speed: 0.03 + Math.random() * 0.05,
            direction: isHorizontal ? 'horizontal' : 'vertical',
            streetIndex: streetIndex
        };

        scene.add(carGroup);
        trafficCars.push(carGroup);
    }
}

// ============= MOTORCYCLE =============
function createMotorcycle() {
    motorcycleGroup = new THREE.Group();

    const blackMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const redMat = new THREE.MeshBasicMaterial({ color: 0xea1d2c });
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffee });

    // Main body frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 1.8), blackMat);
    frame.position.y = 0.6;
    motorcycleGroup.add(frame);

    // Tank (red)
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.8), redMat);
    tank.position.set(0, 0.9, 0.1);
    motorcycleGroup.add(tank);

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.7), blackMat);
    seat.position.set(0, 1, -0.4);
    motorcycleGroup.add(seat);

    // Wheels (simplified cylinders)
    const wheelMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12), wheelMat);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.35, 1);
    motorcycleGroup.add(frontWheel);

    const rearWheel = frontWheel.clone();
    rearWheel.position.z = -0.8;
    motorcycleGroup.add(rearWheel);

    // Headlight
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), whiteMat);
    headlight.position.set(0, 0.9, 1.1);
    motorcycleGroup.add(headlight);

    // Tail light
    const taillight = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.1, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    taillight.position.set(0, 0.85, -1);
    motorcycleGroup.add(taillight);

    // === RIDER (simplified) ===
    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.35), redMat);
    body.position.set(0, 1.5, -0.3);
    motorcycleGroup.add(body);

    // Head with helmet
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), redMat);
    head.position.set(0, 2, -0.2);
    motorcycleGroup.add(head);

    // Visor
    const visor = new THREE.Mesh(
        new THREE.PlaneGeometry(0.25, 0.12),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    visor.position.set(0, 2, -0.01);
    motorcycleGroup.add(visor);

    // Arms
    const armMat = redMat;
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), armMat);
    leftArm.position.set(-0.32, 1.4, 0.1);
    leftArm.rotation.x = -0.8;
    motorcycleGroup.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.x = 0.32;
    motorcycleGroup.add(rightArm);

    // Legs
    const legMat = blackMat;
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.45, 0.15), legMat);
    leftLeg.position.set(-0.15, 1, -0.1);
    leftLeg.rotation.x = -0.3;
    motorcycleGroup.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.15;
    motorcycleGroup.add(rightLeg);

    // === IFOOD BAG ===
    const bagGroup = new THREE.Group();

    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), redMat);
    bag.position.y = 0.35;
    bagGroup.add(bag);

    // Bag lid
    const lid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.52), redMat);
    lid.position.y = 0.75;
    bagGroup.add(lid);

    // iFood logo (white rectangle)
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.15), whiteMat);
    logo.position.set(0, 0.4, 0.26);
    bagGroup.add(logo);

    bagGroup.position.set(0, 1.5, -0.7);
    motorcycleGroup.add(bagGroup);

    motorcycleGroup.userData.bag = bagGroup;

    scene.add(motorcycleGroup);
    motorcycle = motorcycleGroup;
}

// ============= RESTAURANTS & CUSTOMERS =============
function createRestaurants() {
    const restaurantData = [
        { name: "Pizza Place", emoji: "🍕", color: 0xff6600 },
        { name: "Burger King", emoji: "🍔", color: 0xffaa00 },
        { name: "Sushi House", emoji: "🍣", color: 0xff4466 },
        { name: "Taco Bell", emoji: "🌮", color: 0x44ff44 },
        { name: "Noodle Bar", emoji: "🍜", color: 0xffff00 },
        { name: "Chicken Spot", emoji: "🍗", color: 0xff8844 },
    ];

    // Positions on street corners/intersections for easy access
    const positions = [
        { x: -120, z: -120 }, { x: 120, z: -120 },
        { x: -120, z: 120 }, { x: 120, z: 120 },
        { x: 0, z: -160 }, { x: 0, z: 160 }
    ];

    restaurantData.forEach((data, i) => {
        const pos = positions[i];
        const restaurantGroup = createMarker(data.color, data.emoji, true);
        restaurantGroup.position.set(pos.x, 0, pos.z);
        restaurantGroup.userData = { ...data, type: 'restaurant' };
        scene.add(restaurantGroup);
        restaurants.push(restaurantGroup);
    });
}

function createCustomers() {
    const customerData = [
        { name: "Casa do João", emoji: "🏠" },
        { name: "Apt. Maria", emoji: "🏢" },
        { name: "Escritório Tech", emoji: "💼" },
        { name: "Festa da Ana", emoji: "🎉" },
        { name: "Casa do Pedro", emoji: "🏡" },
        { name: "Dormitório UFC", emoji: "🎓" },
    ];

    // Positions along streets for easy delivery
    const positions = [
        { x: -160, z: 0 }, { x: 160, z: 0 },
        { x: -40, z: -160 }, { x: 40, z: 160 },
        { x: 160, z: -120 }, { x: -160, z: 120 }
    ];

    customerData.forEach((data, i) => {
        const pos = positions[i];
        const customerGroup = createMarker(0x00f5ff, data.emoji, false);
        customerGroup.position.set(pos.x, 0, pos.z);
        customerGroup.userData = { ...data, type: 'customer' };
        scene.add(customerGroup);
        customers.push(customerGroup);
    });
}

function createMarker(color, emoji, isRestaurant) {
    const group = new THREE.Group();

    // Simple glowing platform
    const platform = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.5, 0.3, 12),
        new THREE.MeshBasicMaterial({ color: color })
    );
    platform.position.y = 0.15;
    group.add(platform);

    // Floating icon with emoji
    const iconGroup = new THREE.Group();

    // Create a canvas texture for the emoji
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const emojiMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
    );
    iconGroup.add(emojiMesh);

    iconGroup.position.y = 4;
    group.add(iconGroup);

    group.userData.iconGroup = iconGroup;

    return group;
}

// ============= CONTROLS =============
function setupControls() {
    document.addEventListener('keydown', (e) => {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                keys.right = true;
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                keys.right = false;
                break;
        }
    });

    // Mobile virtual joystick
    setupVirtualJoystick();
}

// ============= VIRTUAL JOYSTICK =============
let joystickActive = false;
let joystickTouchId = null;

function setupVirtualJoystick() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');

    if (!joystickBase || !joystickStick) return;

    const baseRect = { width: 140, height: 140 };
    const maxDistance = 40; // Maximum joystick movement radius
    const deadzone = 0.15; // Deadzone threshold (15%)

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

        // Update control keys based on joystick position
        keys.left = normalizedX < -deadzone;
        keys.right = normalizedX > deadzone;
        keys.forward = normalizedY < -deadzone;
        keys.backward = normalizedY > deadzone;
    }

    function resetJoystick() {
        joystickStick.style.transform = 'translate(-50%, -50%)';
        joystickStick.classList.remove('active');
        keys.forward = false;
        keys.backward = false;
        keys.left = false;
        keys.right = false;
        joystickActive = false;
        joystickTouchId = null;
    }

    // Touch events
    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (joystickActive) return;

        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        joystickActive = true;
        joystickStick.classList.add('active');
        handleJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!joystickActive) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === joystickTouchId) {
                e.preventDefault();
                handleJoystickMove(touch.clientX, touch.clientY);
                break;
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === joystickTouchId) {
                resetJoystick();
                break;
            }
        }
    });

    document.addEventListener('touchcancel', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (touch.identifier === joystickTouchId) {
                resetJoystick();
                break;
            }
        }
    });

    // Prevent context menu on long press
    joystickBase.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ============= GAME LOOP =============
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (gameRunning) {
        updateMotorcycle(delta);
        updateCamera();
        updateTrafficCars(delta);
        updateMarkers(delta);
        updateClouds(delta);
        checkCollisions();
        updateHUD();
        updateMinimap();
    } else {
        // Clouds still move on start screen
        updateClouds(delta);
        // Gentle camera rotation on start screen
        const time = clock.getElapsedTime();
        camera.position.x = Math.sin(time * 0.1) * 30;
        camera.position.z = Math.cos(time * 0.1) * 30;
        camera.position.y = 20;
        camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
}

function updateMotorcycle(delta) {
    const acceleration = CONFIG.ACCELERATION;
    const maxSpeed = CONFIG.MAX_SPEED;

    // Acceleration
    if (keys.forward) {
        speed = Math.min(speed + acceleration, maxSpeed);
    } else if (keys.backward) {
        speed = Math.max(speed - CONFIG.BRAKE_POWER, -maxSpeed / 3);
    } else {
        // Friction
        speed *= (1 - CONFIG.FRICTION);
        if (Math.abs(speed) < 0.1) speed = 0;
    }

    // Turning (only when moving)
    if (Math.abs(speed) > 1) {
        const turnFactor = Math.min(Math.abs(speed) / 30, 1);
        if (keys.left) {
            rotation += CONFIG.TURN_SPEED * turnFactor;
        }
        if (keys.right) {
            rotation -= CONFIG.TURN_SPEED * turnFactor;
        }
    }

    // Calculate velocity (speed is already in reasonable units)
    velocity.x = Math.sin(rotation) * speed * delta;
    velocity.z = Math.cos(rotation) * speed * delta;

    // Update position
    const newX = motorcycle.position.x + velocity.x;
    const newZ = motorcycle.position.z + velocity.z;

    // Check building collisions
    let canMove = true;
    for (const building of buildings) {
        const halfWidth = building.width / 2 + 1;
        const halfDepth = building.depth / 2 + 1;

        if (newX > building.x - halfWidth && newX < building.x + halfWidth &&
            newZ > building.z - halfDepth && newZ < building.z + halfDepth) {
            canMove = false;
            speed *= -0.3; // Bounce back
            break;
        }
    }

    // Boundary check
    const boundary = CONFIG.CITY_SIZE / 2 - 10;
    if (Math.abs(newX) > boundary || Math.abs(newZ) > boundary) {
        canMove = false;
        speed *= -0.5;
    }

    if (canMove) {
        // Track distance
        distanceTraveled += Math.sqrt(
            Math.pow(newX - motorcycle.position.x, 2) +
            Math.pow(newZ - motorcycle.position.z, 2)
        );

        motorcycle.position.x = newX;
        motorcycle.position.z = newZ;
    }

    // Rotation
    motorcycle.rotation.y = rotation;

    // Tilt when turning
    const targetTilt = (keys.left ? 0.2 : 0) - (keys.right ? 0.2 : 0);
    motorcycle.rotation.z = THREE.MathUtils.lerp(motorcycle.rotation.z, targetTilt * (speed / maxSpeed), 0.1);

    // Bag bounce animation
    if (motorcycle.userData.bag) {
        const bounceAmount = Math.sin(clock.getElapsedTime() * 10) * 0.02 * (speed / maxSpeed);
        motorcycle.userData.bag.rotation.x = bounceAmount;
    }

    // Update engine sound
    updateEngineSound();
}

function updateCamera() {
    // Third person camera following motorcycle
    const idealOffset = new THREE.Vector3(
        -Math.sin(rotation) * 12,
        6 + Math.abs(speed) / 20,
        -Math.cos(rotation) * 12
    );

    const idealLookat = new THREE.Vector3(
        motorcycle.position.x + Math.sin(rotation) * 5,
        1,
        motorcycle.position.z + Math.cos(rotation) * 5
    );

    camera.position.lerp(
        new THREE.Vector3(
            motorcycle.position.x + idealOffset.x,
            idealOffset.y,
            motorcycle.position.z + idealOffset.z
        ),
        0.05
    );

    camera.lookAt(idealLookat);
}

function updateTrafficCars(delta) {
    const gridSpacing = 50;

    trafficCars.forEach(car => {
        const moveSpeed = car.userData.speed * delta * 60;
        const dir = car.rotation.y;

        car.position.x += Math.sin(dir) * moveSpeed;
        car.position.z += Math.cos(dir) * moveSpeed;

        // Wrap around city
        if (car.position.x > CONFIG.CITY_SIZE / 2) car.position.x = -CONFIG.CITY_SIZE / 2;
        if (car.position.x < -CONFIG.CITY_SIZE / 2) car.position.x = CONFIG.CITY_SIZE / 2;
        if (car.position.z > CONFIG.CITY_SIZE / 2) car.position.z = -CONFIG.CITY_SIZE / 2;
        if (car.position.z < -CONFIG.CITY_SIZE / 2) car.position.z = CONFIG.CITY_SIZE / 2;
    });
}

function updateMarkers(delta) {
    const time = clock.getElapsedTime();

    // Simple floating animation for icons
    [...restaurants, ...customers].forEach(marker => {
        if (marker.userData.iconGroup) {
            marker.userData.iconGroup.position.y = 4 + Math.sin(time * 2) * 0.3;
            marker.userData.iconGroup.rotation.y = time;
        }
    });
}

function updateClouds(delta) {
    // Slowly drift clouds across the sky
    clouds.forEach(cloud => {
        cloud.position.x += cloud.userData.speed * delta * 2;

        // Wrap around when cloud goes too far
        if (cloud.position.x > 200) {
            cloud.position.x = -200;
        }
    });
}

function checkCollisions() {
    const playerPos = motorcycle.position;
    const pickupRadius = 4;

    // Check restaurant collisions (pickup)
    if (!hasFood && currentOrder) {
        const restaurant = restaurants.find(r => r.userData.name === currentOrder.restaurant);
        if (restaurant) {
            const dist = playerPos.distanceTo(restaurant.position);
            if (dist < pickupRadius) {
                pickupFood();
            }
        }
    }

    // Check customer collisions (delivery)
    if (hasFood && currentOrder) {
        const customer = customers.find(c => c.userData.name === currentOrder.customer);
        if (customer) {
            const dist = playerPos.distanceTo(customer.position);
            if (dist < pickupRadius) {
                deliverFood();
            }
        }
    }
}

function pickupFood() {
    hasFood = true;
    playPickupSound();
    showMessage(currentOrder.restaurantEmoji, "Pedido Coletado!", `De: ${currentOrder.restaurant}`);
    updateOrdersPanel();
}

function deliverFood() {
    // Calculate reward with combo
    const baseReward = CONFIG.DELIVERY_BASE_REWARD + Math.floor(Math.random() * 10);
    const reward = Math.floor(baseReward * combo);

    score += reward;
    deliveriesCount++;

    // Play celebration sound
    playDeliverySound();

    // Update combo
    combo = Math.min(combo + 0.5, 5);
    maxCombo = Math.max(maxCombo, combo);

    // Reset combo timer
    if (comboTimer) clearTimeout(comboTimer);
    comboTimer = setTimeout(() => {
        combo = 1;
        updateComboDisplay();
    }, CONFIG.COMBO_TIMEOUT);

    updateComboDisplay();

    // Funny Brazilian delivery messages
    const messages = [
        { text: "Entrega Realizada!", emoji: "🎉" },
        { text: "Boa entrega, motoboy!", emoji: "🔥" },
        { text: "Cliente feliz!", emoji: "😋" },
        { text: "Mandou bem!", emoji: "💪" },
        { text: "Rapidinho!", emoji: "⚡" },
        { text: "Comida quentinha!", emoji: "🍕" },
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    showMessage(msg.emoji, msg.text, `+R$ ${reward},00`);

    // Reset and generate new order
    hasFood = false;
    currentOrder = null;
    generateNewOrder();
}

function generateNewOrder() {
    const restaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];

    currentOrder = {
        restaurant: restaurant.userData.name,
        restaurantEmoji: restaurant.userData.emoji,
        customer: customer.userData.name,
        customerEmoji: customer.userData.emoji
    };

    updateOrdersPanel();
}

function updateOrdersPanel() {
    const panel = document.getElementById('orders-panel');
    panel.innerHTML = '';

    if (currentOrder) {
        if (!hasFood) {
            // Show pickup location
            const pickupCard = document.createElement('div');
            pickupCard.className = 'order-card active pickup';
            pickupCard.innerHTML = `
                <div class="order-type pickup">BUSCAR EM</div>
                <div class="order-name">${currentOrder.restaurantEmoji} ${currentOrder.restaurant}</div>
                <div class="order-distance">${getDistanceToRestaurant()}m</div>
            `;
            panel.appendChild(pickupCard);
        }

        // Show delivery location
        const deliveryCard = document.createElement('div');
        deliveryCard.className = `order-card ${hasFood ? 'active' : ''} delivery`;
        deliveryCard.innerHTML = `
            <div class="order-type delivery">ENTREGAR EM</div>
            <div class="order-name">${currentOrder.customerEmoji} ${currentOrder.customer}</div>
            <div class="order-distance">${getDistanceToCustomer()}m</div>
        `;
        panel.appendChild(deliveryCard);
    }
}

function getDistanceToRestaurant() {
    if (!currentOrder) return 0;
    const restaurant = restaurants.find(r => r.userData.name === currentOrder.restaurant);
    if (!restaurant) return 0;
    return Math.floor(motorcycle.position.distanceTo(restaurant.position));
}

function getDistanceToCustomer() {
    if (!currentOrder) return 0;
    const customer = customers.find(c => c.userData.name === currentOrder.customer);
    if (!customer) return 0;
    return Math.floor(motorcycle.position.distanceTo(customer.position));
}

function updateHUD() {
    document.getElementById('score').textContent = score.toLocaleString('pt-BR');
    document.getElementById('speed').textContent = Math.abs(Math.floor(speed));

    // Update timer
    gameTime -= 1 / 60;
    if (gameTime <= 0) {
        endGame();
        return;
    }

    const minutes = Math.floor(gameTime / 60);
    const seconds = Math.floor(gameTime % 60);
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (gameTime <= 30) {
        timerElement.classList.add('urgent');
    }

    // Update order distances
    updateOrdersPanel();
}

function updateMinimap() {
    const minimapScale = 0.35;
    const minimapSize = 150;
    const minimapCenter = minimapSize / 2;

    // Update markers on minimap
    const existingMarkers = document.querySelectorAll('.minimap-marker');
    existingMarkers.forEach(m => m.remove());

    const minimap = document.getElementById('minimap');

    // Only show current order markers (pickup and delivery)
    if (currentOrder) {
        // Show pickup location (restaurant) if we don't have food yet
        if (!hasFood) {
            const restaurant = restaurants.find(r => r.userData.name === currentOrder.restaurant);
            if (restaurant) {
                const relX = (restaurant.position.x - motorcycle.position.x) * minimapScale;
                const relZ = (restaurant.position.z - motorcycle.position.z) * minimapScale;

                const marker = document.createElement('div');
                marker.className = 'minimap-marker restaurant';
                marker.style.left = Math.max(5, Math.min(minimapSize - 5, minimapCenter + relX)) + 'px';
                marker.style.top = Math.max(5, Math.min(minimapSize - 5, minimapCenter + relZ)) + 'px';
                minimap.appendChild(marker);
            }
        }

        // Always show delivery location (customer)
        const customer = customers.find(c => c.userData.name === currentOrder.customer);
        if (customer) {
            const relX = (customer.position.x - motorcycle.position.x) * minimapScale;
            const relZ = (customer.position.z - motorcycle.position.z) * minimapScale;

            const marker = document.createElement('div');
            marker.className = 'minimap-marker customer';
            // Keep marker visible at edge if off-screen
            marker.style.left = Math.max(5, Math.min(minimapSize - 5, minimapCenter + relX)) + 'px';
            marker.style.top = Math.max(5, Math.min(minimapSize - 5, minimapCenter + relZ)) + 'px';
            minimap.appendChild(marker);
        }
    }
}

function updateComboDisplay() {
    const comboElement = document.getElementById('combo');
    if (combo > 1) {
        comboElement.textContent = `COMBO x${combo.toFixed(1)}!`;
        comboElement.classList.add('visible');
    } else {
        comboElement.classList.remove('visible');
    }
}

function showMessage(emoji, text, subtext) {
    const popup = document.getElementById('message-popup');
    document.getElementById('message-emoji').textContent = emoji;
    document.getElementById('message-text').textContent = text;
    document.getElementById('message-subtext').textContent = subtext;

    popup.style.display = 'block';
    popup.style.animation = 'none';
    popup.offsetHeight; // Force reflow
    popup.style.animation = 'popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

    setTimeout(() => {
        popup.style.display = 'none';
    }, 2000);
}

// ============= GAME FLOW =============
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0;

        oscillator = audioContext.createOscillator();
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 50;
        oscillator.connect(gainNode);
        oscillator.start();
    } catch (e) {
        console.log('Audio not supported');
    }
}

function updateEngineSound() {
    if (!audioContext || !oscillator) return;

    // Engine frequency based on speed
    const baseFreq = 40;
    const maxFreq = 150;
    const freq = baseFreq + (Math.abs(speed) / CONFIG.MAX_SPEED) * (maxFreq - baseFreq);

    oscillator.frequency.setTargetAtTime(freq, audioContext.currentTime, 0.1);

    // Volume based on speed
    const volume = Math.min(Math.abs(speed) / 30, 0.15);
    gainNode.gain.setTargetAtTime(volume, audioContext.currentTime, 0.1);
}

function playPickupSound() {
    if (!audioContext) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.3);
}

function playDeliverySound() {
    if (!audioContext) return;

    // Happy delivery chime
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;

        const startTime = audioContext.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
    });
}

function startGame() {
    document.getElementById('start-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';

    // Hide cursor during gameplay
    document.body.classList.add('game-active');

    // Initialize audio on user interaction
    initAudio();

    // Reset game state
    score = 0;
    combo = 1;
    maxCombo = 1;
    deliveriesCount = 0;
    distanceTraveled = 0;
    gameTime = CONFIG.GAME_TIME;
    speed = 0;
    rotation = 0;
    hasFood = false;

    // Reset motorcycle position
    motorcycle.position.set(0, 0, 0);
    motorcycle.rotation.set(0, 0, 0);

    // Generate first order
    generateNewOrder();

    gameRunning = true;

    // Show welcome message based on device type
    setTimeout(() => {
        const isTouchDevice = isMobileDevice();
        if (isTouchDevice) {
            showMessage("🏍️", "Bora trabalhar!", "Use o joystick para dirigir");
        } else {
            showMessage("🏍️", "Bora trabalhar!", "Use WASD ou setas para dirigir");
        }
    }, 500);
}

// Detect if user is on a mobile/touch device
function isMobileDevice() {
    return (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        window.innerWidth <= 768
    );
}

function endGame() {
    gameRunning = false;

    // Show cursor again
    document.body.classList.remove('game-active');

    document.getElementById('hud').style.display = 'none';
    document.getElementById('game-over').style.display = 'flex';

    // Update stats
    document.getElementById('final-score').textContent = score.toLocaleString('pt-BR');
    document.getElementById('stat-deliveries').textContent = deliveriesCount;
    document.getElementById('stat-distance').textContent = (distanceTraveled / 1000).toFixed(1);
    document.getElementById('stat-max-combo').textContent = `x${maxCombo.toFixed(1)}`;
}

function restartGame() {
    document.getElementById('game-over').style.display = 'none';
    startGame();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============= ENVIRONMENT EFFECTS =============
function createSimpleBillboards() {
    const billboardData = [
        { text: "iFood", color: 0xea1d2c, x: -120, z: -50 },
        { text: "FOME?", color: 0xffcc00, x: 120, z: 50 },
        { text: "PEDALE!", color: 0x00aa00, x: 0, z: -120 },
    ];

    billboardData.forEach(data => {
        // Billboard pole
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 25, 8),
            new THREE.MeshBasicMaterial({ color: 0x666666 })
        );
        pole.position.set(data.x, 12.5, data.z);
        scene.add(pole);

        // Billboard background
        const bgMesh = new THREE.Mesh(
            new THREE.BoxGeometry(14, 7, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        bgMesh.position.set(data.x, 28, data.z);
        scene.add(bgMesh);

        // Billboard text
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, 256, 128);
        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(data.text, 128, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const billboard = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 6),
            new THREE.MeshBasicMaterial({ map: texture })
        );
        billboard.position.set(data.x, 28, data.z + 0.3);
        scene.add(billboard);
    });
}

// ============= ENHANCED INIT =============
function enhanceGame() {
    createSimpleBillboards();
}

// ============= START =============
init();
enhanceGame();
