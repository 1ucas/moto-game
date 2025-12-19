// ============= TRAFFIC CARS =============
// AI-driven traffic vehicles

import { state } from '../state.js';
import { CONFIG, GRID_SPACING } from '../config.js';

const THREE = window.THREE;

export function createTrafficCars() {
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

        // Position on streets using grid spacing
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

        state.scene.add(carGroup);
        state.trafficCars.push(carGroup);
    }
}

export function updateTrafficCars(delta) {
    state.trafficCars.forEach(car => {
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
