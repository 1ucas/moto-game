// ============= MINIMAP =============
// Heading-up radar display

import { state } from '../state.js';

export function updateMinimap() {
    const minimap = document.getElementById('minimap');
    if (!minimap || !state.motorcycle) return;

    const minimapSize = minimap.offsetWidth || 150;
    const minimapScale = minimapSize / 400;
    const minimapCenter = minimapSize / 2;

    // Clear old markers
    document.querySelectorAll('.minimap-marker').forEach(m => m.remove());

    const playerHeading = state.motorcycle.rotation.y;

    // Transform world position to minimap position (heading-up display)
    function worldToMinimap(targetX, targetZ) {
        const dx = targetX - state.motorcycle.position.x;
        const dz = targetZ - state.motorcycle.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.1) {
            return { left: minimapCenter, top: minimapCenter };
        }

        const worldAngle = Math.atan2(dx, dz);
        const relativeAngle = worldAngle - playerHeading;
        const scaledDist = distance * minimapScale;

        return {
            left: Math.max(5, Math.min(minimapSize - 5, minimapCenter - Math.sin(relativeAngle) * scaledDist)),
            top: Math.max(5, Math.min(minimapSize - 5, minimapCenter - Math.cos(relativeAngle) * scaledDist))
        };
    }

    // Helper to create and position a marker
    function addMarker(x, z, className) {
        const pos = worldToMinimap(x, z);
        const marker = document.createElement('div');
        marker.className = 'minimap-marker ' + className;
        marker.style.left = pos.left + 'px';
        marker.style.top = pos.top + 'px';
        minimap.appendChild(marker);
    }

    // Show markers for current order (restaurant and customer)
    if (state.currentOrder) {
        if (!state.hasFood) {
            const restaurant = state.restaurants.find(r => r.userData.name === state.currentOrder.restaurant);
            if (restaurant) {
                addMarker(restaurant.position.x, restaurant.position.z, 'restaurant');
            }
        }

        const customer = state.customers.find(c => c.userData.name === state.currentOrder.customer);
        if (customer) {
            addMarker(customer.position.x, customer.position.z, 'customer');
        }
    }

    // Show other players in multiplayer mode
    if (state.isMultiplayer && state.otherPlayers) {
        Object.values(state.otherPlayers).forEach(player => {
            if (player.mesh) {
                addMarker(player.mesh.position.x, player.mesh.position.z, 'other-player');
            }
        });
    }
}
