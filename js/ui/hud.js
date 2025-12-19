// ============= HUD DISPLAY =============
// Score, timer, speed, orders panel, and messages

import { state } from '../state.js';

export function updateHUD(endGameCallback) {
    document.getElementById('score').textContent = state.score.toLocaleString('pt-BR');
    document.getElementById('speed').textContent = Math.abs(Math.floor(state.speed));

    // Update timer
    state.gameTime -= 1 / 60;
    if (state.gameTime <= 0) {
        endGameCallback();
        return;
    }

    const minutes = Math.floor(state.gameTime / 60);
    const seconds = Math.floor(state.gameTime % 60);
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (state.gameTime <= 30) {
        timerElement.classList.add('urgent');
    }

    // Update order distances
    updateOrdersPanel();
}

export function updateOrdersPanel() {
    const panel = document.getElementById('orders-panel');
    panel.innerHTML = '';

    if (state.currentOrder) {
        if (!state.hasFood) {
            // Show pickup location
            const pickupCard = document.createElement('div');
            pickupCard.className = 'order-card active pickup';
            pickupCard.innerHTML = `
                <div class="order-type pickup">BUSCAR EM</div>
                <div class="order-name">${state.currentOrder.restaurantEmoji} ${state.currentOrder.restaurant}</div>
                <div class="order-distance">${getDistanceToRestaurant()}m</div>
            `;
            panel.appendChild(pickupCard);
        }

        // Show delivery location
        const deliveryCard = document.createElement('div');
        deliveryCard.className = `order-card ${state.hasFood ? 'active' : ''} delivery`;
        deliveryCard.innerHTML = `
            <div class="order-type delivery">ENTREGAR EM</div>
            <div class="order-name">${state.currentOrder.customerEmoji} ${state.currentOrder.customer}</div>
            <div class="order-distance">${getDistanceToCustomer()}m</div>
        `;
        panel.appendChild(deliveryCard);
    }
}

export function getDistanceToRestaurant() {
    if (!state.currentOrder) return 0;
    const restaurant = state.restaurants.find(r => r.userData.name === state.currentOrder.restaurant);
    if (!restaurant) return 0;
    return Math.floor(state.motorcycle.position.distanceTo(restaurant.position));
}

export function getDistanceToCustomer() {
    if (!state.currentOrder) return 0;
    const customer = state.customers.find(c => c.userData.name === state.currentOrder.customer);
    if (!customer) return 0;
    return Math.floor(state.motorcycle.position.distanceTo(customer.position));
}

export function showMessage(emoji, text, subtext) {
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
