// ============= CITY BUILDING =============
// Ground, streets, buildings, sidewalks, street lights

import { state } from '../state.js';
import { CONFIG, GRID_SPACING, STREET_WIDTH, BLOCK_SIZE, LANDMARK_POSITIONS } from '../config.js';

const THREE = window.THREE;

export function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(CONFIG.CITY_SIZE, CONFIG.CITY_SIZE);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x2d4a2d });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    state.scene.add(ground);
}

export function createStreets() {
    const streetMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
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
        state.scene.add(hStreet);

        // Vertical streets
        const vStreet = new THREE.Mesh(
            new THREE.PlaneGeometry(STREET_WIDTH, CONFIG.CITY_SIZE),
            streetMaterial
        );
        vStreet.rotation.x = -Math.PI / 2;
        vStreet.position.set(i * GRID_SPACING, 0.01, 0);
        state.scene.add(vStreet);

        // Center line markings (dashed yellow)
        for (let d = -CONFIG.CITY_SIZE / 2; d < CONFIG.CITY_SIZE / 2; d += 8) {
            const hDash = new THREE.Mesh(
                new THREE.PlaneGeometry(4, 0.3),
                markingMaterial
            );
            hDash.rotation.x = -Math.PI / 2;
            hDash.position.set(d, 0.1, i * GRID_SPACING);
            state.scene.add(hDash);

            const vDash = new THREE.Mesh(
                new THREE.PlaneGeometry(0.3, 4),
                markingMaterial
            );
            vDash.rotation.x = -Math.PI / 2;
            vDash.position.set(i * GRID_SPACING, 0.12, d);
            state.scene.add(vDash);
        }

        // Edge lines (white)
        const hEdge1 = new THREE.Mesh(
            new THREE.PlaneGeometry(CONFIG.CITY_SIZE, 0.2),
            whiteMaterial
        );
        hEdge1.rotation.x = -Math.PI / 2;
        hEdge1.position.set(0, 0.15, i * GRID_SPACING + STREET_WIDTH / 2 - 1);
        state.scene.add(hEdge1);

        const hEdge2 = hEdge1.clone();
        hEdge2.position.z = i * GRID_SPACING - STREET_WIDTH / 2 + 1;
        state.scene.add(hEdge2);

        const vEdge1 = new THREE.Mesh(
            new THREE.PlaneGeometry(0.2, CONFIG.CITY_SIZE),
            whiteMaterial
        );
        vEdge1.rotation.x = -Math.PI / 2;
        vEdge1.position.set(i * GRID_SPACING + STREET_WIDTH / 2 - 1, 0.17, 0);
        state.scene.add(vEdge1);

        const vEdge2 = vEdge1.clone();
        vEdge2.position.x = i * GRID_SPACING - STREET_WIDTH / 2 + 1;
        state.scene.add(vEdge2);
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
            state.scene.add(sidewalk);

            // Inner grass/park area
            const innerGrass = new THREE.Mesh(
                new THREE.PlaneGeometry(BLOCK_SIZE - 4, BLOCK_SIZE - 4),
                grassMaterial
            );
            innerGrass.rotation.x = -Math.PI / 2;
            innerGrass.position.set(blockCenterX, 0.04, blockCenterZ);
            state.scene.add(innerGrass);

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
        new THREE.MeshBasicMaterial({ color: 0x5d4037 })
    );
    bed.rotation.x = -Math.PI / 2;
    bed.position.set(cx + (Math.random() - 0.5) * 20, 0.06, cz + (Math.random() - 0.5) * 20);
    state.scene.add(bed);

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
        state.scene.add(flower);
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
            median.position.set(cx, 0.06, cz);
            state.scene.add(median);

            // Add a small tree or flowers
            if (Math.random() > 0.5) {
                // Tree
                const trunk = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.3, 0.4, 2, 6),
                    new THREE.MeshBasicMaterial({ color: 0x5d4037 })
                );
                trunk.position.set(cx, 1, cz);
                state.scene.add(trunk);

                const leaves = new THREE.Mesh(
                    new THREE.SphereGeometry(1.5, 8, 8),
                    new THREE.MeshBasicMaterial({ color: 0x2e7d32 })
                );
                leaves.position.set(cx, 2.5, cz);
                state.scene.add(leaves);
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
                    state.scene.add(flower);
                }
            }
        }
    }
}

function isNearLandmark(x, z, margin = 15) {
    for (const pos of LANDMARK_POSITIONS) {
        const dist = Math.sqrt((x - pos.x) ** 2 + (z - pos.z) ** 2);
        if (dist < margin) return true;
    }
    return false;
}

function isOnStreet(x, z) {
    for (let i = -2; i <= 2; i++) {
        const streetPos = i * GRID_SPACING;
        if (Math.abs(x - streetPos) < STREET_WIDTH / 2 + 2) return true;
        if (Math.abs(z - streetPos) < STREET_WIDTH / 2 + 2) return true;
    }
    return false;
}

export function createBuildings() {
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
                state.scene.add(building);

                // Windows
                const windowSpacing = 5;
                for (let wy = 4; wy < height - 2; wy += windowSpacing) {
                    const isLit = Math.random() > 0.4;
                    const win = new THREE.Mesh(
                        new THREE.PlaneGeometry(width * 0.7, 1.5),
                        isLit ? windowMaterial : windowOffMaterial
                    );
                    win.position.set(x, wy, z + depth / 2 + 0.1);
                    state.scene.add(win);
                }

                state.buildings.push({ mesh: building, width, depth, x, z });
            }
        }
    }
}

export function createStreetLights() {
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffdd88 });

    // Place lights along the streets
    for (let i = -2; i <= 2; i++) {
        for (let d = -CONFIG.CITY_SIZE / 2 + 20; d < CONFIG.CITY_SIZE / 2; d += 40) {
            // Lights along horizontal streets
            const pole1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 0.3), poleMat);
            pole1.position.set(d, 3, i * GRID_SPACING + STREET_WIDTH / 2 - 2);
            state.scene.add(pole1);

            const lamp1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), glowMat);
            lamp1.position.set(d, 6.5, i * GRID_SPACING + STREET_WIDTH / 2 - 2);
            state.scene.add(lamp1);

            // Lights along vertical streets
            const pole2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 0.3), poleMat);
            pole2.position.set(i * GRID_SPACING + STREET_WIDTH / 2 - 2, 3, d);
            state.scene.add(pole2);

            const lamp2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 6), glowMat);
            lamp2.position.set(i * GRID_SPACING + STREET_WIDTH / 2 - 2, 6.5, d);
            state.scene.add(lamp2);
        }
    }
}

export function createSimpleBillboards() {
    const billboardData = [
        { text: "Dirija com cuidado", color: 0xea1d2c, x: -120, z: -50 },
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
        state.scene.add(pole);

        // Billboard background
        const bgMesh = new THREE.Mesh(
            new THREE.BoxGeometry(14, 7, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        bgMesh.position.set(data.x, 28, data.z);
        state.scene.add(bgMesh);

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
        state.scene.add(billboard);
    });
}
