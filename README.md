# Food Rush - Delivery Racing Game

A stylized 3D delivery racer built with Three.js. You ride a moto through a compact city, pick up orders at restaurants, deliver to customers, and race the clock while seeing other couriers in real time via Socket.io.

## How to Play

**Server required.** The game talks to the multiplayer server for orders, scoring, and presence. Start the server, then open http://localhost:3000 (the server serves the client files).

1) **Start** – pick a name (stored locally) and hit the play button.
2) **Pickup** – ride to the orange restaurant marker to collect the order.
3) **Deliver** – follow the blue customer marker to drop it off.
4) **Earn** – rewards are R$15–24 per delivery.
5) **Repeat** – finish as many deliveries as possible before the round timer ends.

### Controls

| Input | Action |
|-------|--------|
| W / ↑ | Accelerate |
| S / ↓ | Brake / reverse |
| A / ← | Turn left |
| D / → | Turn right |

**Mobile controls** use a dual-control layout:
- **Left side**: Horizontal steering joystick (slide left/right to turn)
- **Right side**: Stacked throttle (top) and brake/reverse (bottom) buttons
- Supports multi-touch for simultaneous steering and acceleration

## Client Features

- **Game loop & timer** – default 5-minute round on the client (set in [js/config.js](js/config.js)); countdown ends the run and submits to the leaderboard.
- **Orders panel** – shows current pickup/delivery, emoji, and live distance; auto-updates when the server assigns a new delivery.
- **Heading-up minimap** – rotates with your bike; shows restaurant/customer markers and other players in multiplayer.
- **HUD** – money, speed, timer with urgent state, distance tracking, boost indicator, and pop-up toasts for pickups/deliveries/records.
- **World** – procedural block grid with streets, sidewalks, flowers, billboards, buildings, AI traffic cars, and seasonal Christmas decorations.
- **Fire boosters** – 5 fire pickups scattered on roads; collecting one gives +15 km/h speed boost and raises max speed to 40+ km/h for 3 seconds; boosters respawn after 10 seconds.
- **Motorcycle physics** – lean animation when turning (proportional to input and speed), boost particle trail when speed-boosted, and collision bounce.
- **Delivery bag** – thermal-style food delivery bag on the rider's back with fork/knife icon, yellow accents, and bounce animation.
- **Audio** – Web Audio engine hum tied to speed, 8-bit background music, and pickup/delivery/record stingers; in-game toggles for engine and music.
- **Onboarding** – tutorial modal for first-time players, name modal, joystick side preference, and sound menu.
- **Multiplayer UI** – online panel showing all players' money, realtime ghost bikes, and a 24h leaderboard modal.

## Configuration

- Client tuning in [js/config.js](js/config.js):
  - `GAME_TIME` = 300s client timer; `CITY_SIZE` = 400; `BUILDING_COUNT` = 40; `CAR_COUNT` = 8;
  - Physics: `MAX_SPEED` 30, `ACCELERATION` 0.08, `BRAKE_POWER` 0.15, `TURN_SPEED` 0.035, `FRICTION` 0.03.
  - Boosters: +15 km/h immediate boost, 3s duration, 10s respawn.
  - Storage keys for joystick side, engine sound, music, username, and tutorial completion.
- Server gameplay constants in [server/index.js](server/index.js) (defaults to 3-minute rounds server-side, pickup radius 4, reward base 15 with bonus up to 10). Align client `GAME_TIME` with server `CONFIG.GAME_TIME` if you want exact parity.

## Project Layout

```
moto-game/
├── index.html          # UI layout, styles, Three.js bootstrap
├── js/
│   ├── main.js         # Entry point and game loop orchestration
│   ├── config.js       # Tunables and constants
│   ├── state.js        # Shared mutable game state
│   ├── world/          # Scene, sky, ground, buildings, traffic, boosters, particles
│   │   ├── scene.js    # Three.js scene setup
│   │   ├── city.js     # Procedural city blocks, streets, decorations
│   │   ├── traffic.js  # AI traffic cars
│   │   ├── boosters.js # Fire speed boost pickups
│   │   └── particles.js # Boost particle trail system
│   ├── entities/       # Motorcycle (with lean + bag), markers, other players
│   ├── gameplay/       # Collision checks
│   ├── input/          # Keyboard + dual mobile controls (joystick + pedals)
│   ├── ui/             # HUD, minimap, leaderboard, preferences, tutorial
│   ├── multiplayer/    # Socket.io client session/auth and events
│   └── audio/          # Engine hum, music, effects
└── server/
    ├── index.js        # Express + Socket.io server, sessions, leaderboard
    ├── init-db.js      # SQLite schema bootstrap
    └── package.json
```

## Gameplay Flow (Multiplayer)

- Frontend connects to the server origin, creates/recovers a session cookie, and emits `join` with the chosen username.
- Server assigns the current delivery (restaurant + customer); the client shows markers and distances.
- Collisions (pickup/delivery radius 4) emit `collect-pickup` / `complete-delivery`; the server validates distance, awards money, and sends `new-delivery` for the next job.
- Every round end (`end-round`) persists the session, recalculates the 24h leaderboard, and resets player state for the next round.

### WebSocket Events

- Client → server: `join`, `move`, `collect-pickup`, `complete-delivery`, `start-round`, `end-round`, `get-leaderboard`.
- Server → client: `init`, `player-joined`, `player-left`, `player-moved`, `pickup-success`, `delivery-success`, `player-updated`, `player-stats-updated`, `new-delivery`, `round-started`, `round-ended`, `leaderboard`.

### REST API

- `GET /health` – status + online count.
- `GET /api/players/count` – online players.
- `GET /api/leaderboard` – top 10 from last 24h.
- `POST /api/session` – create/recover a user session and set cookie.
- `POST /api/session/username` – update the current user’s name.

## Database Schema (SQLite)

- `users` – `id`, `uuid`, `username`, totals (`total_earnings`, `total_deliveries`, `best_session_score`).
- `sessions` – per-play stats (`earnings`, `deliveries_completed`, `deliveries_failed`, `play_time`, timestamps, `user_id`).
- `auth_sessions` – session tokens (`token`, `user_id`, `expires_at`) for cookie auth.

## Running Locally

```bash
cd server
npm install
npm run init-db   # creates game.db with all tables
npm start         # serves the client and Socket.io on http://localhost:3000
```

Open http://localhost:3000 in the browser. The same-origin server is required so cookies work and collisions are validated.

## Deployment Notes

- Environment variables: `PORT` (default 3000), `DB_PATH`, `COOKIE_SECRET`, `ALLOWED_ORIGINS`, `WEBHOOK_SECRET`, `REPO_PATH`, `PM2_APP_NAME`.
- The server serves the static client from the repo root; a reverse proxy (e.g., Nginx) must forward WebSockets to `/socket.io/`.
- PM2 example:

```bash
pm2 start index.js --name foodrush
pm2 save && pm2 startup
```

## License

No License
