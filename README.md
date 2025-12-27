# Food Rush - Delivery Racing Game

A stylized 3D multiplayer delivery racer built with Three.js. Race your moto through a compact city, pick up orders at restaurants, deliver to customers, and compete on the leaderboard while seeing other couriers in real time.

## How to Play

1. **Start** – Pick a name and hit play
2. **Pickup** – Ride to the orange restaurant marker to collect the order
3. **Deliver** – Follow the blue customer marker to drop it off
4. **Earn** – Rewards are R$15–24 per delivery
5. **Compete** – Finish as many deliveries as possible before time runs out

### Controls

| Input | Action |
|-------|--------|
| W / ↑ | Accelerate |
| S / ↓ | Brake / reverse |
| A / ← | Turn left |
| D / → | Turn right |

**Mobile:** Joystick (left) for steering, throttle/brake buttons (right). Supports multi-touch.

## Features

- **Multiplayer** – Real-time ghost bikes, online player list, 24h leaderboard
- **3D World** – Procedural city with streets, buildings, traffic, billboards, and seasonal decorations
- **Speed Boosters** – Fire pickups grant +15 km/h for 3 seconds
- **Audio** – Engine sounds, 8-bit music, pickup/delivery stingers
- **Mobile Ready** – Responsive controls with joystick preference settings
- **Onboarding** – Tutorial for new players

## Running Locally

```bash
cd server
npm install
npm run init-db   # creates game.db
npm start         # http://localhost:3000
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Three.js, vanilla JS (ES modules) |
| Backend | Express, Socket.io |
| Database | SQLite |
| Deployment | PM2, Nginx reverse proxy |

## Project Structure

```
moto-game/
├── index.html          # UI and Three.js bootstrap
├── js/
│   ├── main.js         # Game loop orchestration
│   ├── config.js       # Tunable constants
│   ├── state.js        # Shared game state
│   ├── world/          # Scene, city, traffic, boosters, particles
│   ├── entities/       # Motorcycle, markers, other players
│   ├── gameplay/       # Collision detection
│   ├── input/          # Keyboard + mobile controls
│   ├── ui/             # HUD, minimap, leaderboard, tutorial
│   ├── multiplayer/    # Socket.io client
│   └── audio/          # Engine, music, effects
└── server/
    ├── index.js        # Express + Socket.io server
    ├── init-db.js      # Database schema
    └── package.json
```

## API Reference

### WebSocket Events

**Client → Server:**
`join`, `move`, `collect-pickup`, `complete-delivery`, `start-round`, `end-round`, `get-leaderboard`

**Server → Client:**
`init`, `player-joined`, `player-left`, `player-moved`, `pickup-success`, `delivery-success`, `new-delivery`, `round-started`, `round-ended`, `leaderboard`

### REST Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Status + online count |
| `GET /api/players/count` | Online players |
| `GET /api/leaderboard` | Top 10 (24h) |
| `POST /api/session` | Create/recover session |
| `POST /api/session/username` | Update username |

## Deployment

Environment variables:
- `PORT` (default 3000)
- `DB_PATH`
- `COOKIE_SECRET`
- `ALLOWED_ORIGINS`
- `WEBHOOK_SECRET`, `REPO_PATH`, `PM2_APP_NAME` (for auto-deploy)

```bash
pm2 start server/index.js --name foodrush
pm2 save && pm2 startup
```

## License

Proprietary - All rights reserved.
