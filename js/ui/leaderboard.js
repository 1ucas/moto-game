// ============= LEADERBOARD SYSTEM =============
// Local storage rankings and display

import { state } from '../state.js';
import { LEADERBOARD_KEY, MAX_LEADERBOARD_ENTRIES, MP_USERNAME_KEY } from '../config.js';

export function getLeaderboard() {
    try {
        const data = localStorage.getItem(LEADERBOARD_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Error loading leaderboard:', e);
        return [];
    }
}

export function saveLeaderboard(leaderboard) {
    try {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch (e) {
        console.error('Error saving leaderboard:', e);
    }
}

export function getPlayerUsername() {
    return localStorage.getItem(MP_USERNAME_KEY) || 'Entregador';
}

export function addScoreToLeaderboard(scoreData) {
    const leaderboard = getLeaderboard();
    const entry = {
        name: getPlayerUsername(),
        score: scoreData.score,
        deliveries: scoreData.deliveries,
        distance: scoreData.distance,
        date: new Date().toISOString()
    };

    // Track this entry as the last added one
    state.lastAddedEntryDate = entry.date;

    leaderboard.push(entry);
    // Sort by score descending
    leaderboard.sort((a, b) => b.score - a.score);
    // Keep only top entries
    const trimmedLeaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
    saveLeaderboard(trimmedLeaderboard);

    // Return the rank (1-indexed) or -1 if not in top scores
    const rank = trimmedLeaderboard.findIndex(e =>
        e.score === entry.score &&
        e.date === entry.date
    );
    return rank !== -1 ? rank + 1 : -1;
}

export function isNewRecord(score) {
    const leaderboard = getLeaderboard();
    if (leaderboard.length < MAX_LEADERBOARD_ENTRIES) return true;
    return score > leaderboard[leaderboard.length - 1].score;
}

function formatLeaderboardDate(isoDate) {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
}

export function showLeaderboard() {
    const leaderboard = getLeaderboard();
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const leaderboardBody = document.getElementById('leaderboard-body');

    leaderboardBody.innerHTML = '';

    if (leaderboard.length === 0) {
        leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: rgba(255,255,255,0.5);">Nenhum recorde ainda! Jogue para aparecer aqui.</td></tr>';
    } else {
        leaderboard.forEach((entry, index) => {
            const row = document.createElement('tr');
            const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            const positionText = rankEmoji ? rankEmoji : `#${index + 1}`;
            const isCurrentEntry = state.lastAddedEntryDate && entry.date === state.lastAddedEntryDate;
            const playerName = entry.name || 'Entregador';
            row.innerHTML = `
                <td class="rank-cell">${positionText}</td>
                <td class="name-cell">${playerName}</td>
                <td class="score-cell">R$ ${entry.score.toLocaleString('pt-BR')}</td>
                <td>${entry.deliveries}</td>
                <td class="date-cell">${formatLeaderboardDate(entry.date)}${isCurrentEntry ? ' ←' : ''}</td>
            `;
            if (index < 3) {
                row.classList.add('top-rank');
            }
            if (isCurrentEntry) {
                row.classList.add('current-entry');
            }
            leaderboardBody.appendChild(row);
        });
    }

    leaderboardScreen.style.display = 'flex';
}

export function hideLeaderboard() {
    document.getElementById('leaderboard-screen').style.display = 'none';
}
