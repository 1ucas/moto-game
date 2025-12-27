// ============= HUD DISPLAY =============
// Score, timer, speed, orders panel, and messages

import { state } from '../state.js';

export function updateHUD(endGameCallback) {
    document.getElementById('score').textContent = state.score.toLocaleString('pt-BR');
    document.getElementById('speed').textContent = Math.abs(Math.floor(state.speed));

    // Update boost indicator
    const boostIndicator = document.getElementById('boost-indicator');
    if (state.speedBoost > 0) {
        boostIndicator.classList.add('active');
    } else {
        boostIndicator.classList.remove('active');
    }

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

    // Reset classes and show popup
    popup.classList.remove('show', 'hide');
    popup.style.display = 'block';
    popup.offsetHeight; // Force reflow
    popup.classList.add('show');

    // Hide with animation after delay
    setTimeout(() => {
        popup.classList.remove('show');
        popup.classList.add('hide');

        setTimeout(() => {
            popup.style.display = 'none';
            popup.classList.remove('hide');
        }, 300);
    }, 1500);
}

// Flying money animation to score counter
export function showFlyingMoney(amount) {
    const hud = document.getElementById('hud');
    const scorePanel = document.querySelector('.score-panel');

    if (!hud || !scorePanel) return;

    // Calculate number of bills (1 bill per R$2, minimum 1, max 10)
    const billCount = Math.min(10, Math.max(1, Math.ceil(amount / 2)));
    const delayBetweenBills = 80; // ms between each bill

    // Spawn bills with staggered timing
    for (let i = 0; i < billCount; i++) {
        setTimeout(() => {
            spawnFlyingBill(hud, scorePanel, i, billCount);
        }, i * delayBetweenBills);
    }
}

function spawnFlyingBill(hud, scorePanel, index, totalBills) {
    const bill = document.createElement('div');
    bill.className = 'flying-money';
    bill.textContent = '💵';

    // Start position - center of screen with slight random offset
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 40;
    const startX = window.innerWidth / 2 + offsetX;
    const startY = window.innerHeight / 2 + offsetY;

    // End position - score panel
    const scorePanelRect = scorePanel.getBoundingClientRect();
    const endX = scorePanelRect.left + scorePanelRect.width / 2;
    const endY = scorePanelRect.top + scorePanelRect.height / 2;

    // Set initial position
    bill.style.left = `${startX}px`;
    bill.style.top = `${startY}px`;
    bill.style.transform = 'translate(-50%, -50%) scale(1.3)';
    bill.style.fontSize = '1.8rem';

    hud.appendChild(bill);

    // Animate to score panel
    const duration = 600 + Math.random() * 200; // Slight variation in speed
    const startTime = performance.now();
    const arcHeight = -60 - Math.random() * 40; // Random arc height

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);

        // Calculate current position with arc
        const currentX = startX + (endX - startX) * eased;
        const arcY = arcHeight * Math.sin(progress * Math.PI);
        const currentY = startY + (endY - startY) * eased + arcY;

        // Scale down and rotate as it approaches target
        const scale = 1.3 - (0.9 * eased);
        const rotation = progress * 360 * (index % 2 === 0 ? 1 : -1); // Alternate rotation direction

        bill.style.left = `${currentX}px`;
        bill.style.top = `${currentY}px`;
        bill.style.transform = `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`;
        bill.style.opacity = progress > 0.7 ? 1 - ((progress - 0.7) / 0.3) : 1;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            bill.remove();

            // Pulse score panel on last bill
            if (index === totalBills - 1) {
                scorePanel.classList.remove('pulse');
                scorePanel.offsetHeight; // Force reflow
                scorePanel.classList.add('pulse');
                setTimeout(() => {
                    scorePanel.classList.remove('pulse');
                }, 400);
            }
        }
    }

    requestAnimationFrame(animate);
}
