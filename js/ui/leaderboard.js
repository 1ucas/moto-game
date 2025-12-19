// ============= LEADERBOARD SYSTEM =============
// Server-based rankings display

import { state } from '../state.js';

export function updateLeaderboard(leaderboardData) {
    state.leaderboard = leaderboardData || [];
}

export function showLeaderboard() {
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const leaderboardBody = document.getElementById('leaderboard-body');

    leaderboardBody.innerHTML = '';

    if (state.leaderboard.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">Nenhum recorde hoje! Jogue para aparecer aqui.</td></tr>';
    } else {
        state.leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const positionText = rankEmoji ? rankEmoji : `#${index + 1}`;
            row.innerHTML = `
                <td class="rank-cell">${positionText}</td>
                <td class="name-cell">${entry.username || 'Entregador'}</td>
                <td class="score-cell">R$ ${entry.score.toLocaleString('pt-BR')}</td>
                <td>${entry.deliveries}</td>
            `;
            if (index < 3) {
                row.classList.add('top-rank');
            }
            leaderboardBody.appendChild(row);
        });
    }

    leaderboardScreen.style.display = 'flex';
}

export function hideLeaderboard() {
    document.getElementById('leaderboard-screen').style.display = 'none';
}

export async function requestLeaderboard() {
    // Use socket if connected, otherwise fall back to REST API
    if (state.socket && state.socket.connected) {
        state.socket.emit('get-leaderboard');
    } else if (state.multiplayerServerUrl) {
        try {
            const response = await fetch(state.multiplayerServerUrl + '/api/leaderboard');
            if (response.ok) {
                const data = await response.json();
                updateLeaderboard(data);
            }
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error);
        }
    }
}
