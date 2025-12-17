# Food Rush - Game Backlog

## Regular Development Tasks
*Ordered by implementation effort (simpler → complex)*

### Low Effort Tasks

#### 1. Add motorcycle sound toggle
- **Description:** Add UI control to mute/unmute the engine sound
- **Implementation:**
  - Add toggle button in settings panel
  - Store preference in localStorage
  - Control existing `engineSound.gainNode` volume
- **Estimated Complexity:** Low
- **Files to modify:** `index.html`, `game.js`

#### 2. Add background music with toggle control
- **Description:** Implement ambient background music with on/off toggle
- **Implementation:**
  - Create looping background music track (Web Audio API or audio file)
  - Add toggle button in settings panel
  - Store preference in localStorage
  - Ensure music doesn't interfere with engine/delivery sounds
- **Estimated Complexity:** Low
- **Files to modify:** `index.html`, `game.js`

#### 3. Tilt motorcycle sideways when turning
- **Description:** Add realistic lean animation when the motorcycle turns
- **Implementation:**
  - Enhance existing `motorcycle.rotation.z` mechanic
  - Apply rotation based on turn direction and speed
  - Use smooth interpolation for natural movement
  - Test visual effect doesn't obstruct player view
- **Estimated Complexity:** Low-Medium
- **Files to modify:** `game.js`
- **Note:** Some tilt already exists, needs enhancement for more realistic effect

---

### Medium Effort Tasks

#### 4. Reduce speed when passing through grass
- **Description:** Add terrain-based physics to slow down motorcycle on grass/off-road areas
- **Implementation:**
  - Define grass/terrain zones in city layout
  - Add collision detection for terrain types
  - Reduce MAX_SPEED and increase FRICTION when on grass
  - Add visual/audio feedback when entering grass
- **Estimated Complexity:** Medium
- **Files to modify:** `game.js`
- **Dependencies:** Requires terrain/surface type system

#### 5. Remove single-player option to simplify game logic
- **Description:** Remove local-only mode and require multiplayer server connection
- **Implementation:**
  - Remove mode selection UI
  - Always initialize Socket.io connection
  - Remove localStorage-only leaderboard logic
  - Update README with server requirement
  - Simplify game initialization flow
- **Estimated Complexity:** Medium
- **Files to modify:** `index.html`, `game.js`, `README.md`
- **Impact:** Breaking change - requires server to play

---

### High Effort Tasks

#### 6. Add jump mechanic (Space key + mobile support)
- **Description:** Allow motorcycle to jump over obstacles using spacebar (mobile: button)
- **Implementation:**
  - Add vertical velocity system (Y-axis physics)
  - Implement gravity and jump arc calculation
  - Add jump cooldown to prevent spam
  - Create mobile jump button in UI
  - Add jump animation and sound effect
  - Test collision detection during jump
- **Estimated Complexity:** High
- **Files to modify:** `index.html`, `game.js`
- **Mobile Consideration:** Add dedicated jump button near joystick

#### 7. Test and optimize for larger map (more concurrent players)
- **Description:** Evaluate performance with larger city and increased player capacity
- **Implementation:**
  - Scale map from current ±200 units to ±400+ units
  - Add more delivery locations (currently 6 restaurants + 6 customers)
  - Test with 16+ concurrent players (currently capped at 8)
  - Profile rendering performance (FPS, draw calls)
  - Optimize:
    - Building render distance (LOD system)
    - Player position update frequency
    - Network message throttling
  - Add server-side performance monitoring
- **Estimated Complexity:** High
- **Files to modify:** `game.js`, `server/index.js`
- **Requires:** Load testing tools, performance profiling

---

## Tasks Requiring External/Extra Processes

#### 8. Change web domain to match game name
- **Description:** Migrate from current domain to game-branded domain (e.g., foodrush.game, motofood.com)
- **Implementation:**
  - Register new domain
  - Configure DNS records
  - Update hosting configuration
  - Set up SSL certificate
  - Update Socket.io server URL in `game.js`
  - Implement domain redirect from old to new
  - Update social media/sharing metadata
- **Estimated Complexity:** Low (technical) + External Dependencies
- **Files to modify:** `game.js` (server URL), `index.html` (meta tags)
- **External Requirements:**
  - Domain purchase
  - DNS configuration
  - Hosting provider setup
  - SSL certificate

---

## New Proposed Tasks

#### 9. Add tutorial/onboarding system for new players
- **Description:** Interactive first-time player experience explaining game mechanics
- **Implementation:**
  - Create overlay tutorial system with step-by-step instructions
  - Guide players through:
    - Movement controls (WASD/Arrow keys)
    - Reading the minimap
    - Understanding pickup (orange) vs delivery (blue) markers
    - Reading the HUD (score, timer, distance)
    - Mobile joystick usage (if applicable)
  - Add "Skip Tutorial" option for returning players
  - Store tutorial completion in localStorage
  - Add practice delivery without time pressure
- **Estimated Complexity:** Medium-High
- **Files to modify:** `index.html`, `game.js`
- **Benefits:** Improves new player retention and reduces learning curve

#### 10. Add player emotes and horn system
- **Description:** Quick reactions and horn sounds for social interaction during gameplay
- **Implementation:**
  - Add emote buttons in UI (number keys 1-5 or dedicated panel)
    - 👍 Nice delivery!
    - 😄 Having fun!
    - 🎉 Celebration!
    - 🏆 Winner!
    - 💨 Speed boost!
  - Implement horn sound (honk) with H key or button
  - Show emote bubbles above player motorcycles (3-second duration)
  - Broadcast emotes to all players via Socket.io
  - Add simple celebration animation when emote is sent
  - Mobile: swipe-able emote panel
- **Estimated Complexity:** Low-Medium
- **Files to modify:** `index.html`, `game.js`, `server/index.js`
- **Benefits:** Enhances team interaction, adds fun social element perfect for team building, encourages player engagement

---

## Backlog Summary

- **Total Tasks:** 10
- **Low Effort:** 3 tasks
- **Medium Effort:** 3 tasks (includes emotes system)
- **High Effort:** 2 tasks
- **External Dependencies:** 1 task
- **New Proposals:** 2 tasks (tutorial + emotes)

**Priority Recommendation:** Start with low-effort tasks (1-3) for quick wins, then tackle medium tasks (4-5, 10) before attempting high-complexity features (6-7, 9). Handle domain migration (8) when infrastructure is ready.
