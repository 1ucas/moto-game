# Food Rush - Delivery Racing Game

A multiplayer 3D delivery racing game built with Three.js where you play as a motorcycle courier making deliveries across a vibrant city. Race against the clock to earn as much money as possible in 3 minutes while seeing other players on the map!

## Play the Game

**Server Required:** This game requires a multiplayer server to run. See the [Backend Setup](#backend-multiplayer-server) section below.

Once the server is running, open the game in a modern web browser.

### Controls

| Input | Action |
|-------|--------|
| `W` / `↑` | Accelerate |
| `S` / `↓` | Brake / Reverse |
| `A` / `←` | Turn left |
| `D` / `→` | Turn right |
| Touch | Virtual joystick (mobile) |

### Gameplay

1. **Pickup** - Go to the restaurant (orange marker) to collect the order
2. **Deliver** - Take it to the customer (blue marker)
3. **Earn** - Get R$15-24 per delivery
4. **Repeat** - Complete as many deliveries as possible before time runs out!

---

## Project Structure

```
moto-game/
├── index.html          # Game HTML, styles, and UI
├── game.js             # Game logic (Three.js, physics, controls)
├── README.md           # This file
└── server/             # Multiplayer server (Node.js)
    ├── package.json
    ├── index.js        # Socket.io server
    ├── init-db.js      # Database setup script
    └── .gitignore
```

---

## Frontend (Game Client)

### Technologies

- **Three.js** (r128) - 3D rendering
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Animations, responsive design

### Key Features

- 3D city environment with buildings, traffic, and decorations
- Physics-based motorcycle movement
- Touch controls with virtual joystick for mobile
- Local leaderboard (localStorage)
- Sound effects (Web Audio API)
- Responsive design (desktop & mobile)

### Configuration

Game settings are in `game.js` at the `CONFIG` object:

```javascript
const CONFIG = {
    GAME_TIME: 180,           // Round duration (seconds)
    CITY_SIZE: 400,           // City dimensions
    DELIVERY_BASE_REWARD: 15, // Minimum reward per delivery
    MAX_SPEED: 25,            // Motorcycle top speed
    ACCELERATION: 0.08,       // Acceleration rate
    TURN_SPEED: 0.035,        // Turning sensitivity
};
```

### Game Locations

**Restaurants (Pickup Points):**
| Name | Position (x, z) |
|------|-----------------|
| Pizza Place | (-120, -120) |
| Burger King | (120, -120) |
| Sushi House | (-120, 120) |
| Taco Bell | (120, 120) |
| Noodle Bar | (0, -160) |
| Chicken Spot | (0, 160) |

**Customers (Delivery Points):**
| Name | Position (x, z) |
|------|-----------------|
| Casa do João | (-160, 0) |
| Apt. Maria | (160, 0) |
| Escritório Tech | (-40, -160) |
| Festa da Ana | (40, 160) |
| Casa do Pedro | (160, -120) |
| Dormitório UFC | (-160, 120) |

---

## Backend (Multiplayer Server)

The multiplayer server is required to play the game. It enables players to see each other on the map while completing their own deliveries.

### Technologies

- **Node.js** - Runtime
- **Express** - HTTP server
- **Socket.io** - Real-time WebSocket communication
- **SQLite** - Player persistence

### Setup

```bash
cd server
npm install
npm run init-db   # Create database tables
npm start         # Start server on port 3000
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `DB_PATH` | ./game.db | SQLite database path |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server status and player count |
| `/api/players/count` | GET | Current online players |
| `/api/leaderboard` | GET | Top 10 scores |

### WebSocket Events

**Client → Server:**

| Event | Payload | Description |
|-------|---------|-------------|
| `join` | `{uuid, username}` | Join game session |
| `move` | `{x, z, rotation}` | Position update |
| `collect-pickup` | - | Collect food at restaurant |
| `complete-delivery` | - | Deliver to customer |
| `end-round` | - | Round finished |

**Server → Client:**

| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{playerId, uuid, player, otherPlayers}` | Initial state |
| `player-joined` | `{id, username, position}` | New player |
| `player-left` | `socketId` | Player disconnected |
| `player-moved` | `{id, x, z, rotation}` | Position broadcast |
| `delivery-success` | `{reward, newTotal}` | Delivery completed |

### Database Schema

```sql
-- Players
users (id, uuid, username, total_earnings, total_deliveries, best_session_score)

-- Play sessions
sessions (id, user_id, started_at, ended_at, earnings, deliveries_completed, play_time)
```

---

## Deployment

### Deploy Server to DigitalOcean/VPS

```bash
# Copy files to server
scp -r server/ root@your-server:/var/www/foodrush-server

# SSH and setup
ssh root@your-server
cd /var/www/foodrush-server
npm install
npm run init-db

# Run with PM2
npm install -g pm2
pm2 start index.js --name foodrush
pm2 save && pm2 startup
```

### Configure Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site and add SSL
ln -s /etc/nginx/sites-available/foodrush /etc/nginx/sites-enabled/
certbot --nginx -d your-domain.com
systemctl reload nginx
```

The game will automatically connect to the server when opened.

---

## Monitoring

```bash
# View server logs
pm2 logs foodrush

# Monitor resources
pm2 monit

# Check health
curl https://your-domain.com/health
```

---

## License

MIT
