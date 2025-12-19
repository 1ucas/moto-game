// ============= COLLISION DETECTION =============
// Pickup and delivery collision checks

import { state } from '../state.js';
import { pickupFood, deliverFood } from './orders.js';

export function checkCollisions() {
    const playerPos = state.motorcycle.position;
    const pickupRadius = 4;

    // Check restaurant collisions (pickup)
    if (!state.hasFood && state.currentOrder) {
        const restaurant = state.restaurants.find(r => r.userData.name === state.currentOrder.restaurant);
        if (restaurant) {
            const dist = playerPos.distanceTo(restaurant.position);
            if (dist < pickupRadius) {
                pickupFood();
            }
        }
    }

    // Check customer collisions (delivery)
    if (state.hasFood && state.currentOrder) {
        const customer = state.customers.find(c => c.userData.name === state.currentOrder.customer);
        if (customer) {
            const dist = playerPos.distanceTo(customer.position);
            if (dist < pickupRadius) {
                deliverFood();
            }
        }
    }
}
