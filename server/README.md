# Food Rush Multiplayer Server

WebSocket server for the Food Rush multiplayer game.

## Quick Start

```bash
# Install dependencies
npm install

# Initialize the database
npm run init-db

# Start the server
npm start
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `DB_PATH` - Path to SQLite database (default: ./game.db)

## API Endpoints

- `GET /health` - Health check with player count and uptime
- `GET /api/players/count` - Get current online player count
- `GET /api/leaderboard` - Get top 10 scores

## WebSocket Events

### Client -> Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{uuid, username}` | Join the game |
| `move` | `{x, z, rotation}` | Update position |
| `collect-pickup` | - | Collect food at restaurant |
| `complete-delivery` | - | Deliver food to customer |
| `delivery-timeout` | - | Delivery failed (time out) |
| `end-round` | - | Game round ended |
| `start-round` | - | Start a new round |
| `get-leaderboard` | - | Request leaderboard |

### Server -> Client

| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{playerId, uuid, player, otherPlayers, ...}` | Initial game state |
| `player-joined` | `{id, username, position, ...}` | New player joined |
| `player-left` | `socketId` | Player disconnected |
| `player-moved` | `{id, x, z, rotation}` | Player position update |
| `player-stats-updated` | `{id, money, deliveries}` | Player stats changed |
| `new-delivery` | `{restaurant, customer}` | New delivery assigned |
| `pickup-success` | `{customer}` | Food collected |
| `delivery-success` | `{reward, newTotal, deliveries}` | Delivery completed |
| `round-ended` | `{finalScore, deliveries, leaderboard}` | Round finished |
| `leaderboard` | `[{username, score, deliveries, date}]` | Leaderboard data |

## Production Deployment

See the main README for nginx configuration and PM2 setup.
