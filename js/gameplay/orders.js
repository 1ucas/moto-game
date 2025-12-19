// ============= ORDER SYSTEM =============
// Food pickup and delivery logic

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { playPickupSound, playDeliverySound } from '../audio/effects.js';
import { showMessage, updateOrdersPanel } from '../ui/hud.js';

export function generateNewOrder() {
    const restaurant = state.restaurants[Math.floor(Math.random() * state.restaurants.length)];
    const customer = state.customers[Math.floor(Math.random() * state.customers.length)];

    state.currentOrder = {
        restaurant: restaurant.userData.name,
        restaurantEmoji: restaurant.userData.emoji,
        customer: customer.userData.name,
        customerEmoji: customer.userData.emoji
    };

    updateOrdersPanel();
}

export function pickupFood() {
    state.hasFood = true;
    playPickupSound();
    showMessage(state.currentOrder.restaurantEmoji, "Pedido Coletado!", `De: ${state.currentOrder.restaurant}`);
    updateOrdersPanel();
}

export function deliverFood() {
    // Calculate reward
    const reward = CONFIG.DELIVERY_BASE_REWARD + Math.floor(Math.random() * 10);

    state.score += reward;
    state.deliveriesCount++;

    // Play celebration sound
    playDeliverySound();

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
    state.hasFood = false;
    state.currentOrder = null;
    generateNewOrder();
}
