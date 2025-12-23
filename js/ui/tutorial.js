// ============= TUTORIAL / ONBOARDING =============
// Step-by-step tutorial for new players

import { TUTORIAL_COMPLETED_KEY } from '../config.js';

// Tutorial steps configuration
const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao Food Rush!',
        description: 'Seu objetivo: entregar comida o mais rápido possível antes do tempo acabar. Quanto mais entregas, mais dinheiro!',
        visual: `
            <div class="tutorial-visual-welcome">
                <span class="tutorial-big-emoji">🏍️💨</span>
                <div class="tutorial-visual-row">
                    <span>🍕</span>
                    <span class="tutorial-arrow">➡️</span>
                    <span>🏠</span>
                    <span class="tutorial-arrow">➡️</span>
                    <span>💰</span>
                </div>
            </div>
        `
    },
    {
        id: 'controls-desktop',
        title: 'Controles',
        description: 'Use as teclas WASD ou as setas do teclado para controlar sua moto.',
        visual: `
            <div class="tutorial-visual-controls">
                <div class="tutorial-keys-row">
                    <div class="tutorial-key">W</div>
                </div>
                <div class="tutorial-keys-row">
                    <div class="tutorial-key">A</div>
                    <div class="tutorial-key">S</div>
                    <div class="tutorial-key">D</div>
                </div>
                <div class="tutorial-keys-hint">
                    <span>W/↑ = Acelerar</span>
                    <span>S/↓ = Frear</span>
                    <span>A/← = Esquerda</span>
                    <span>D/→ = Direita</span>
                </div>
            </div>
        `,
        mobileOnly: false,
        desktopOnly: true
    },
    {
        id: 'controls-mobile',
        title: 'Controles',
        description: 'Use o joystick virtual para controlar sua moto. Arraste na direção que quer ir!',
        visual: `
            <div class="tutorial-visual-joystick">
                <div class="tutorial-joystick-demo">
                    <div class="tutorial-joystick-base">
                        <div class="tutorial-joystick-stick"></div>
                    </div>
                    <div class="tutorial-joystick-arrows">
                        <span class="arrow up">↑</span>
                        <span class="arrow left">←</span>
                        <span class="arrow right">→</span>
                        <span class="arrow down">↓</span>
                    </div>
                </div>
            </div>
        `,
        mobileOnly: true,
        desktopOnly: false
    },
    {
        id: 'hud',
        title: 'Informações na Tela',
        description: 'Fique de olho no seu dinheiro e no tempo restante!',
        visual: `
            <div class="tutorial-visual-hud">
                <div class="tutorial-hud-item">
                    <div class="tutorial-hud-mock score">
                        <span class="label">Dinheiro</span>
                        <span class="value">R$ 150</span>
                    </div>
                    <span class="tutorial-hud-desc">Quanto você ganhou</span>
                </div>
                <div class="tutorial-hud-item">
                    <div class="tutorial-hud-mock timer">
                        <span class="label">Tempo</span>
                        <span class="value">2:45</span>
                    </div>
                    <span class="tutorial-hud-desc">Tempo restante</span>
                </div>
            </div>
        `
    },
    {
        id: 'minimap',
        title: 'Minimapa',
        description: 'O minimapa mostra sua posição e os locais de entrega. A seta vermelha é você!',
        visual: `
            <div class="tutorial-visual-minimap">
                <div class="tutorial-minimap-mock">
                    <span class="tutorial-minimap-label">FRONT</span>
                    <div class="tutorial-minimap-player"></div>
                    <div class="tutorial-minimap-marker orange" style="top: 20%; left: 30%;"></div>
                    <div class="tutorial-minimap-marker blue" style="top: 70%; right: 25%;"></div>
                </div>
                <div class="tutorial-minimap-legend">
                    <span><span class="dot orange"></span> Restaurante</span>
                    <span><span class="dot blue"></span> Cliente</span>
                    <span><span class="dot red"></span> Você</span>
                </div>
            </div>
        `
    },
    {
        id: 'delivery',
        title: 'Como Entregar',
        description: 'Primeiro, vá até o restaurante (laranja) para pegar o pedido. Depois, leve até o cliente (azul) para completar a entrega!',
        visual: `
            <div class="tutorial-visual-delivery">
                <div class="tutorial-delivery-step">
                    <div class="tutorial-delivery-icon orange">
                        <span>🍕</span>
                    </div>
                    <span class="tutorial-step-label">1. Pegue o pedido</span>
                    <span class="tutorial-step-hint">Marcador laranja</span>
                </div>
                <div class="tutorial-delivery-arrow">➡️</div>
                <div class="tutorial-delivery-step">
                    <div class="tutorial-delivery-icon blue">
                        <span>🏠</span>
                    </div>
                    <span class="tutorial-step-label">2. Entregue ao cliente</span>
                    <span class="tutorial-step-hint">Marcador azul</span>
                </div>
            </div>
        `
    }
];

let currentStep = 0;

// ============= LOCAL STORAGE =============
export function hasTutorialBeenCompleted() {
    try {
        return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
    } catch (e) {
        return false;
    }
}

export function markTutorialAsCompleted() {
    try {
        localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
    } catch (e) {
        console.error('Error saving tutorial completion:', e);
    }
}

// ============= DEVICE DETECTION =============
function isMobileDevice() {
    return (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        window.innerWidth <= 768
    );
}

// ============= TUTORIAL NAVIGATION =============
function getFilteredSteps() {
    const isMobile = isMobileDevice();
    return TUTORIAL_STEPS.filter(step => {
        if (step.mobileOnly && !isMobile) return false;
        if (step.desktopOnly && isMobile) return false;
        return true;
    });
}

function renderStep(stepIndex) {
    const steps = getFilteredSteps();
    const step = steps[stepIndex];
    if (!step) return;

    const content = document.getElementById('tutorial-content');
    const dots = document.getElementById('tutorial-dots');
    const prevBtn = document.getElementById('tutorial-prev-btn');
    const nextBtn = document.getElementById('tutorial-next-btn');

    // Update content
    content.innerHTML = `
        <h2 class="tutorial-step-title">${step.title}</h2>
        <div class="tutorial-step-visual">${step.visual}</div>
        <p class="tutorial-step-description">${step.description}</p>
    `;

    // Update dots
    dots.innerHTML = steps.map((_, i) => `
        <span class="tutorial-dot ${i === stepIndex ? 'active' : ''}" data-step="${i}"></span>
    `).join('');

    // Add click handlers to dots
    dots.querySelectorAll('.tutorial-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const targetStep = parseInt(dot.dataset.step, 10);
            currentStep = targetStep;
            renderStep(currentStep);
        });
    });

    // Update buttons
    prevBtn.style.visibility = stepIndex === 0 ? 'hidden' : 'visible';

    if (stepIndex === steps.length - 1) {
        nextBtn.textContent = 'COMEÇAR!';
        nextBtn.classList.add('final');
    } else {
        nextBtn.textContent = 'PRÓXIMO';
        nextBtn.classList.remove('final');
    }
}

function nextStep() {
    const steps = getFilteredSteps();
    if (currentStep < steps.length - 1) {
        currentStep++;
        renderStep(currentStep);
    } else {
        closeTutorial();
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        renderStep(currentStep);
    }
}

function skipTutorial() {
    closeTutorial();
}

// ============= TUTORIAL LIFECYCLE =============
export function openTutorial() {
    const modal = document.getElementById('tutorial-modal');
    if (!modal) return;

    currentStep = 0;
    modal.style.display = 'flex';
    renderStep(currentStep);

    // Setup button handlers
    document.getElementById('tutorial-prev-btn').onclick = prevStep;
    document.getElementById('tutorial-next-btn').onclick = nextStep;
    document.getElementById('tutorial-skip-btn').onclick = skipTutorial;

    // Keyboard navigation
    const handleKeydown = (e) => {
        if (modal.style.display === 'none') {
            document.removeEventListener('keydown', handleKeydown);
            return;
        }
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
            nextStep();
        } else if (e.key === 'ArrowLeft') {
            prevStep();
        } else if (e.key === 'Escape') {
            skipTutorial();
        }
    };
    document.addEventListener('keydown', handleKeydown);
}

export function closeTutorial() {
    const modal = document.getElementById('tutorial-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    markTutorialAsCompleted();
}

// ============= CHECK AND SHOW TUTORIAL =============
export function checkAndShowTutorial() {
    if (!hasTutorialBeenCompleted()) {
        // Small delay to let the start screen render first
        setTimeout(() => {
            openTutorial();
        }, 500);
    }
}
