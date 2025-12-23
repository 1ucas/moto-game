// ============= MARKERS =============
// Restaurants, customers, and marker creation

import { state } from '../state.js';

const THREE = window.THREE;

export function createRestaurants() {
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
        state.scene.add(restaurantGroup);
        state.restaurants.push(restaurantGroup);
    });
}

export function createCustomers() {
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
        state.scene.add(customerGroup);
        state.customers.push(customerGroup);
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
    const emojiSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: texture, transparent: true })
    );
    emojiSprite.scale.set(2, 2, 1);
    iconGroup.add(emojiSprite);

    iconGroup.position.y = 4;
    group.add(iconGroup);

    group.userData.iconGroup = iconGroup;

    return group;
}

export function updateMarkers(delta) {
    const time = state.clock.getElapsedTime();

    // Simple floating animation for icons
    [...state.restaurants, ...state.customers].forEach(marker => {
        if (marker.userData.iconGroup) {
            marker.userData.iconGroup.position.y = 4 + Math.sin(time * 2) * 0.3;
        }
    });
}
