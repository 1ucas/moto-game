/**
 * Food Rush Multiplayer Server
 *
 * Handles real-time multiplayer functionality:
 * - Player connections and state management
 * - Position synchronization
 * - Delivery assignments and tracking
 * - Session and leaderboard persistence
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// ============================================================
// CONFIGURATION
// ============================================================

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'game.db');
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'foodrush-secret-change-in-production';
const SESSION_COOKIE_NAME = 'foodrush_session';
const SESSION_EXPIRY_YEARS = 5;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'https://shurato.com.br', 'https://www.shurato.com.br'];

// Game configuration (matches client CONFIG)
const CONFIG = {
    GAME_TIME: 180,              // 3 minutes per round
    CITY_SIZE: 400,
    DELIVERY_BASE_REWARD: 15,
    DELIVERY_MAX_BONUS: 10,      // Reward = BASE + random(0, MAX_BONUS)
    PICKUP_RADIUS: 4,            // Distance to collect/deliver
    MOVE_THROTTLE_MS: 50,        // Minimum time between position updates
    MAX_SPEED: 25,               // For movement validation
    POSITION_TOLERANCE: 2,       // Allowed deviation for validation
};

// Actual game locations (from game.js)
const RESTAURANTS = [
    { x: -120, z: -120, name: "Pizza Place", emoji: "🍕" },
    { x: 120, z: -120, name: "Burger King", emoji: "🍔" },
    { x: -120, z: 120, name: "Sushi House", emoji: "🍣" },
    { x: 120, z: 120, name: "Taco Bell", emoji: "🌮" },
    { x: 0, z: -160, name: "Noodle Bar", emoji: "🍜" },
    { x: 0, z: 160, name: "Chicken Spot", emoji: "🍗" },
];

const CUSTOMERS = [
    { x: -160, z: 0, name: "Casa do João", emoji: "🏠" },
    { x: 160, z: 0, name: "Apt. Maria", emoji: "🏢" },
    { x: -40, z: -160, name: "Escritório Tech", emoji: "💼" },
    { x: 40, z: 160, name: "Festa da Ana", emoji: "🎉" },
    { x: 160, z: -120, name: "Casa do Pedro", emoji: "🏡" },
    { x: -160, z: 120, name: "Dormitório UFC", emoji: "🎓" },
];

// ============================================================
// SERVER SETUP
// ============================================================

const app = express();
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Check if origin is in allowed list or matches GitHub Pages pattern
        if (ALLOWED_ORIGINS.includes(origin) || origin.includes('github.io')) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: function(origin, callback) {
            if (!origin) return callback(null, true);
            if (ALLOWED_ORIGINS.includes(origin) || origin.includes('github.io')) {
                return callback(null, true);
            }
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true
    }
});

// Database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    }
    console.log('Connected to SQLite database');
});

// ============================================================
// IN-MEMORY GAME STATE
// ============================================================

const activePlayers = {};       // socketId -> player state
const lastMoveTime = {};        // socketId -> timestamp
const playerSockets = {};       // socketId -> socket reference

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Calculate distance between two points (x, z coordinates)
 */
function distance(a, b) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.z - b.z, 2));
}

/**
 * Calculate variable reward (15-24)
 */
function calculateReward() {
    return CONFIG.DELIVERY_BASE_REWARD + Math.floor(Math.random() * CONFIG.DELIVERY_MAX_BONUS);
}

/**
 * Validate position is within city bounds
 */
function isValidPosition(pos) {
    const boundary = CONFIG.CITY_SIZE / 2;
    return pos.x >= -boundary && pos.x <= boundary &&
           pos.z >= -boundary && pos.z <= boundary;
}

/**
 * Sanitize player data for broadcasting (remove sensitive info)
 */
function sanitizePlayer(player) {
    return {
        id: player.id,
        username: player.username,
        position: player.position,
        money: player.money,
        deliveries: player.deliveries,
        hasFood: player.hasFood,
    };
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

/**
 * Generate a secure random session token
 */
function generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Get session expiry date (5 years from now)
 */
function getSessionExpiry() {
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + SESSION_EXPIRY_YEARS);
    return expiry.toISOString();
}

/**
 * Create a new user and auth session
 */
function createUserWithSession(username) {
    return new Promise((resolve, reject) => {
        const uuid = uuidv4();
        const token = generateSessionToken();
        const expiresAt = getSessionExpiry();

        db.serialize(() => {
            // Create user
            db.run(
                'INSERT INTO users (uuid, username) VALUES (?, ?)',
                [uuid, username],
                function(err) {
                    if (err) return reject(err);

                    const userId = this.lastID;

                    // Create auth session
                    db.run(
                        'INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (?, ?, ?)',
                        [token, userId, expiresAt],
                        function(err) {
                            if (err) return reject(err);

                            resolve({
                                token,
                                userId,
                                username,
                                expiresAt: new Date(expiresAt)
                            });
                        }
                    );
                }
            );
        });
    });
}

/**
 * Get user by session token (validates expiry)
 */
function getUserBySessionToken(token) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT u.*, a.expires_at
             FROM auth_sessions a
             JOIN users u ON a.user_id = u.id
             WHERE a.token = ? AND a.expires_at > datetime('now')`,
            [token],
            (err, row) => {
                if (err) return reject(err);
                resolve(row || null);
            }
        );
    });
}

/**
 * Update username for a user
 */
function updateUserUsername(userId, username) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE users SET username = ? WHERE id = ?',
            [username, userId],
            (err) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

/**
 * Set session cookie on response
 */
function setSessionCookie(res, token, expiresAt) {
    res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: true, // Required for SameSite=None
        sameSite: 'none', // Required for cross-site cookies
        expires: expiresAt,
        path: '/'
    });
}

/**
 * Assign a new delivery to a player
 */
function assignNewDelivery(socketId) {
    const player = activePlayers[socketId];
    if (!player) return;

    // Pick random restaurant and customer
    const restaurant = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
    const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];

    player.currentDelivery = {
        restaurant: {
            name: restaurant.name,
            emoji: restaurant.emoji,
            position: { x: restaurant.x, z: restaurant.z }
        },
        customer: {
            name: customer.name,
            emoji: customer.emoji,
            position: { x: customer.x, z: customer.z }
        },
        reward: calculateReward(),
        assignedAt: Date.now()
    };
    player.hasFood = false;

    // Send new delivery to player
    const socket = playerSockets[socketId];
    if (socket) {
        socket.emit('new-delivery', {
            restaurant: player.currentDelivery.restaurant,
            customer: player.currentDelivery.customer
        });
    }
}

/**
 * Get all other players for a given socket
 */
function getOtherPlayers(excludeSocketId) {
    return Object.values(activePlayers)
        .filter(p => p.id !== excludeSocketId)
        .map(sanitizePlayer);
}

// ============================================================
// DATABASE FUNCTIONS
// ============================================================

function createSession(userId) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO sessions (user_id) VALUES (?)',
            [userId],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

function endSession(player) {
    return new Promise((resolve, reject) => {
        const playTime = Math.floor((Date.now() - player.joinedAt) / 1000);

        db.serialize(() => {
            // Update session
            db.run(
                `UPDATE sessions SET
                    ended_at = CURRENT_TIMESTAMP,
                    earnings = ?,
                    deliveries_completed = ?,
                    deliveries_failed = ?,
                    play_time = ?
                WHERE id = ?`,
                [player.money, player.deliveries, player.failed, playTime, player.sessionId],
                (err) => {
                    if (err) console.error('Error updating session:', err);
                }
            );

            // Update user totals
            db.run(
                `UPDATE users SET
                    total_earnings = total_earnings + ?,
                    total_deliveries = total_deliveries + ?,
                    best_session_score = MAX(best_session_score, ?)
                WHERE id = ?`,
                [player.money, player.deliveries, player.money, player.userId],
                (err) => {
                    if (err) console.error('Error updating user:', err);
                    resolve();
                }
            );
        });
    });
}

function getLeaderboard(limit = 10) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT u.username, s.earnings as score, s.deliveries_completed as deliveries, s.ended_at as date
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.ended_at IS NOT NULL AND s.earnings > 0
             ORDER BY s.earnings DESC
             LIMIT ?`,
            [limit],
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            }
        );
    });
}

// ============================================================
// SOCKET CONNECTION HANDLING
// ============================================================

io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Store socket reference
    playerSockets[socket.id] = socket;

    // ----------------------------------------------------------
    // JOIN GAME
    // ----------------------------------------------------------
    socket.on('join', async ({ username }) => {
        try {
            // Parse session token from socket handshake cookies
            const cookieHeader = socket.handshake.headers.cookie || '';
            const cookies = {};
            cookieHeader.split(';').forEach(cookie => {
                const [name, value] = cookie.trim().split('=');
                if (name && value) cookies[name] = value;
            });

            const sessionToken = cookies[SESSION_COOKIE_NAME];

            if (!sessionToken) {
                socket.emit('error', { message: 'No session. Please refresh the page.' });
                return;
            }

            // Validate session and get user
            const user = await getUserBySessionToken(sessionToken);

            if (!user) {
                socket.emit('error', { message: 'Invalid or expired session. Please refresh the page.' });
                return;
            }

            // Update username if provided and different
            if (username && username !== user.username) {
                await updateUserUsername(user.id, username);
                user.username = username;
            }

            // Create game session (for tracking this play session's stats)
            const gameSessionId = await createSession(user.id);

            // Initialize player state
            activePlayers[socket.id] = {
                id: socket.id,
                userId: user.id,
                sessionId: gameSessionId,
                username: user.username,
                position: { x: 0, z: 0, rotation: 0 },
                money: 0,
                deliveries: 0,
                failed: 0,
                hasFood: false,
                joinedAt: Date.now(),
                currentDelivery: null,
                // Stats from database
                totalEarnings: user.total_earnings || 0,
                totalDeliveries: user.total_deliveries || 0,
                bestScore: user.best_session_score || 0,
            };

            // Assign first delivery
            assignNewDelivery(socket.id);

            // Send initialization data (no UUID sent to client)
            socket.emit('init', {
                playerId: socket.id,
                player: sanitizePlayer(activePlayers[socket.id]),
                currentDelivery: activePlayers[socket.id].currentDelivery,
                otherPlayers: getOtherPlayers(socket.id),
                gameConfig: {
                    gameTime: CONFIG.GAME_TIME,
                    pickupRadius: CONFIG.PICKUP_RADIUS,
                }
            });

            // Notify other players
            socket.broadcast.emit('player-joined', sanitizePlayer(activePlayers[socket.id]));

            console.log(`Player ${user.username} (${socket.id}) joined the game`);

        } catch (error) {
            console.error('Join error:', error);
            socket.emit('error', { message: 'Failed to join game', details: error.message });
        }
    });

    // ----------------------------------------------------------
    // PLAYER MOVEMENT
    // ----------------------------------------------------------
    socket.on('move', (position) => {
        const player = activePlayers[socket.id];
        if (!player) return;

        // Throttle updates
        const now = Date.now();
        if (now - (lastMoveTime[socket.id] || 0) < CONFIG.MOVE_THROTTLE_MS) return;
        lastMoveTime[socket.id] = now;

        // Validate position format
        if (typeof position.x !== 'number' || typeof position.z !== 'number') return;

        // Clamp to city bounds
        const boundary = CONFIG.CITY_SIZE / 2 - 10;
        const clampedPosition = {
            x: Math.max(-boundary, Math.min(boundary, position.x)),
            z: Math.max(-boundary, Math.min(boundary, position.z)),
            rotation: position.rotation || 0
        };

        // Update position
        player.position = clampedPosition;

        // Broadcast to other players
        socket.broadcast.emit('player-moved', {
            id: socket.id,
            ...clampedPosition
        });
    });

    // ----------------------------------------------------------
    // COLLECT PICKUP (at restaurant)
    // ----------------------------------------------------------
    socket.on('collect-pickup', () => {
        const player = activePlayers[socket.id];
        if (!player || !player.currentDelivery || player.hasFood) return;

        const restaurantPos = player.currentDelivery.restaurant.position;
        const dist = distance(player.position, restaurantPos);

        // Validate player is near restaurant
        if (dist > CONFIG.PICKUP_RADIUS + CONFIG.POSITION_TOLERANCE) {
            socket.emit('pickup-failed', {
                message: 'Muito longe do restaurante',
                distance: Math.floor(dist)
            });
            return;
        }

        // Mark as picked up
        player.hasFood = true;
        player.currentDelivery.pickedUpAt = Date.now();

        socket.emit('pickup-success', {
            customer: player.currentDelivery.customer
        });

        // Notify others that player picked up food
        socket.broadcast.emit('player-updated', {
            id: socket.id,
            hasFood: true
        });

        console.log(`${player.username} picked up order from ${player.currentDelivery.restaurant.name}`);
    });

    // ----------------------------------------------------------
    // COMPLETE DELIVERY (at customer)
    // ----------------------------------------------------------
    socket.on('complete-delivery', () => {
        const player = activePlayers[socket.id];
        if (!player || !player.currentDelivery || !player.hasFood) return;

        const customerPos = player.currentDelivery.customer.position;
        const dist = distance(player.position, customerPos);

        // Validate player is near customer
        if (dist > CONFIG.PICKUP_RADIUS + CONFIG.POSITION_TOLERANCE) {
            socket.emit('delivery-failed', {
                message: 'Muito longe do cliente',
                distance: Math.floor(dist)
            });
            return;
        }

        // Calculate and award reward
        const reward = player.currentDelivery.reward;
        player.money += reward;
        player.deliveries += 1;
        player.hasFood = false;

        socket.emit('delivery-success', {
            reward: reward,
            newTotal: player.money,
            deliveries: player.deliveries
        });

        // Broadcast stats update
        io.emit('player-stats-updated', {
            id: socket.id,
            money: player.money,
            deliveries: player.deliveries
        });

        console.log(`${player.username} delivered to ${player.currentDelivery.customer.name} (+R$${reward})`);

        // Assign new delivery
        assignNewDelivery(socket.id);
    });

    // ----------------------------------------------------------
    // DELIVERY TIMEOUT (round ended or time ran out)
    // ----------------------------------------------------------
    socket.on('delivery-timeout', () => {
        const player = activePlayers[socket.id];
        if (!player) return;

        player.failed += 1;
        player.hasFood = false;

        socket.emit('delivery-timeout-ack', {
            failed: player.failed
        });

        // Assign new delivery
        assignNewDelivery(socket.id);
    });

    // ----------------------------------------------------------
    // END ROUND (game time expired)
    // ----------------------------------------------------------
    socket.on('end-round', async () => {
        const player = activePlayers[socket.id];
        if (!player) return;

        try {
            // Save session to database
            await endSession(player);

            // Get updated leaderboard
            const leaderboard = await getLeaderboard(10);

            socket.emit('round-ended', {
                finalScore: player.money,
                deliveries: player.deliveries,
                failed: player.failed,
                leaderboard: leaderboard
            });

            // Reset player state for new round (if they continue)
            player.money = 0;
            player.deliveries = 0;
            player.failed = 0;
            player.hasFood = false;
            player.currentDelivery = null;

            console.log(`${player.username} ended round with R$${player.money}`);

        } catch (error) {
            console.error('Error ending round:', error);
        }
    });

    // ----------------------------------------------------------
    // START NEW ROUND
    // ----------------------------------------------------------
    socket.on('start-round', async () => {
        const player = activePlayers[socket.id];
        if (!player) return;

        try {
            // Create new session
            const sessionId = await createSession(player.userId);
            player.sessionId = sessionId;
            player.joinedAt = Date.now();

            // Assign first delivery
            assignNewDelivery(socket.id);

            socket.emit('round-started', {
                currentDelivery: player.currentDelivery,
                gameTime: CONFIG.GAME_TIME
            });

        } catch (error) {
            console.error('Error starting round:', error);
        }
    });

    // ----------------------------------------------------------
    // GET LEADERBOARD
    // ----------------------------------------------------------
    socket.on('get-leaderboard', async () => {
        try {
            const leaderboard = await getLeaderboard(10);
            socket.emit('leaderboard', leaderboard);
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            socket.emit('leaderboard', []);
        }
    });

    // ----------------------------------------------------------
    // DISCONNECT
    // ----------------------------------------------------------
    socket.on('disconnect', async () => {
        const player = activePlayers[socket.id];
        if (!player) return;

        try {
            // Save session if player had any progress
            if (player.money > 0 || player.deliveries > 0) {
                await endSession(player);
            }
        } catch (error) {
            console.error('Error ending session on disconnect:', error);
        }

        // Clean up
        delete activePlayers[socket.id];
        delete lastMoveTime[socket.id];
        delete playerSockets[socket.id];

        // Notify others
        io.emit('player-left', socket.id);

        console.log(`Player disconnected: ${socket.id}`);
    });
});

// ============================================================
// REST API ENDPOINTS
// ============================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        players: Object.keys(activePlayers).length,
        uptime: process.uptime()
    });
});

// Get online players count
app.get('/api/players/count', (req, res) => {
    res.json({ count: Object.keys(activePlayers).length });
});

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await getLeaderboard(10);
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

// Session management - get or create session
app.post('/api/session', async (req, res) => {
    try {
        const { username } = req.body;
        const sessionToken = req.cookies[SESSION_COOKIE_NAME];

        // Try to get existing user from session
        if (sessionToken) {
            const user = await getUserBySessionToken(sessionToken);
            if (user) {
                // Update username if provided and different
                if (username && username !== user.username) {
                    await updateUserUsername(user.id, username);
                    user.username = username;
                }

                return res.json({
                    isNewUser: false,
                    username: user.username,
                    totalEarnings: user.total_earnings || 0,
                    totalDeliveries: user.total_deliveries || 0,
                    bestScore: user.best_session_score || 0
                });
            }
        }

        // Create new user and session
        const session = await createUserWithSession(username || 'Entregador');
        setSessionCookie(res, session.token, session.expiresAt);

        res.json({
            isNewUser: true,
            username: session.username,
            totalEarnings: 0,
            totalDeliveries: 0,
            bestScore: 0
        });

    } catch (error) {
        console.error('Session error:', error);
        res.status(500).json({ error: 'Failed to manage session' });
    }
});

// Update username
app.post('/api/session/username', async (req, res) => {
    try {
        const { username } = req.body;
        const sessionToken = req.cookies[SESSION_COOKIE_NAME];

        if (!sessionToken) {
            return res.status(401).json({ error: 'No session' });
        }

        const user = await getUserBySessionToken(sessionToken);
        if (!user) {
            return res.status(401).json({ error: 'Invalid session' });
        }

        if (username && username.trim()) {
            await updateUserUsername(user.id, username.trim());
        }

        res.json({ success: true, username: username.trim() });

    } catch (error) {
        console.error('Username update error:', error);
        res.status(500).json({ error: 'Failed to update username' });
    }
});

// ============================================================
// START SERVER
// ============================================================

server.listen(PORT, () => {
    console.log(`Food Rush server running on port ${PORT}`);
    console.log(`WebSocket ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');

    // Close all connections
    io.close(() => {
        db.close(() => {
            console.log('Database closed');
            process.exit(0);
        });
    });
});
