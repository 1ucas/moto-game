/**
 * Database initialization script for Food Rush Multiplayer
 *
 * Run this once to create the database tables:
 *   node init-db.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'game.db');

console.log(`Initializing database at: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    }
});

db.serialize(() => {
    // Users table - persistent player data
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid VARCHAR(36) UNIQUE NOT NULL,
            username VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_earnings INTEGER DEFAULT 0,
            total_deliveries INTEGER DEFAULT 0,
            best_session_score INTEGER DEFAULT 0
        )
    `, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('Users table ready');
    });

    // Sessions table - track each play session
    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP,
            earnings INTEGER DEFAULT 0,
            deliveries_completed INTEGER DEFAULT 0,
            deliveries_failed INTEGER DEFAULT 0,
            play_time INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error('Error creating sessions table:', err);
        else console.log('Sessions table ready');
    });

    // Create index for faster UUID lookups
    db.run(`
        CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid)
    `, (err) => {
        if (err) console.error('Error creating UUID index:', err);
        else console.log('UUID index ready');
    });

    // Create index for leaderboard queries
    db.run(`
        CREATE INDEX IF NOT EXISTS idx_sessions_earnings ON sessions(earnings DESC)
    `, (err) => {
        if (err) console.error('Error creating earnings index:', err);
        else console.log('Earnings index ready');
    });

    // Create index for user sessions lookup
    db.run(`
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)
    `, (err) => {
        if (err) console.error('Error creating user sessions index:', err);
        else console.log('User sessions index ready');
    });

    // Auth sessions table - maps session tokens to users
    db.run(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token VARCHAR(64) UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) console.error('Error creating auth_sessions table:', err);
        else console.log('Auth sessions table ready');
    });

    // Create index for faster token lookups
    db.run(`
        CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(token)
    `, (err) => {
        if (err) console.error('Error creating auth token index:', err);
        else console.log('Auth token index ready');
    });
});

db.close((err) => {
    if (err) {
        console.error('Error closing database:', err);
        process.exit(1);
    }
    console.log('\nDatabase initialization complete!');
    console.log(`Database created at: ${DB_PATH}`);
});
