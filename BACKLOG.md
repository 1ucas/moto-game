# Food Rush - Game Backlog

## Regular Development Tasks
*Ordered by implementation effort (simpler → complex)*

### Low Effort Tasks

#### ~~1. Add motorcycle sound toggle~~ ✅
- ~~**Description:** Add UI control to mute/unmute the engine sound~~
- ~~**Implementation:**~~
  - ~~Add toggle button in settings panel~~
  - ~~Store preference in localStorage~~
  - ~~Control existing `engineSound.gainNode` volume~~
- ~~**Estimated Complexity:** Low~~
- ~~**Files to modify:** `index.html`, `game.js`~~

#### ~~2. Add background music with toggle control~~ ✅
- ~~**Description:** Implement ambient background music with on/off toggle~~
- ~~**Implementation:**~~
  - ~~Create looping background music track (Web Audio API or audio file)~~
  - ~~Add toggle button in settings panel~~
  - ~~Store preference in localStorage~~
  - ~~Ensure music doesn't interfere with engine/delivery sounds~~
- ~~**Estimated Complexity:** Low~~
- ~~**Files to modify:** `index.html`, `game.js`~~

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

#### 4. Improve POI emoji visibility from all angles
- **Description:** Make pickup/delivery location emojis visible from any direction
- **Implementation:**
  - Current issue: 2D emoji sprites are barely visible from certain angles
  - Solution options:
    - **Option A:** Add continuous rotation animation to emojis
    - **Option B:** Duplicate emoji in cross-section pattern (4 directions forming a +)
    - **Option C:** Billboard effect (emoji always faces camera)
  - Apply to both restaurant (orange) and customer (blue) markers
  - Test visibility from all approach angles
  - Ensure performance isn't impacted by animation/duplication
- **Estimated Complexity:** Low
- **Files to modify:** `game.js`
- **Benefits:** Improves navigation and reduces frustration when locating POIs

---

### Medium Effort Tasks

#### 5. Reduce speed when passing through grass
- **Description:** Add terrain-based physics to slow down motorcycle on grass/off-road areas
- **Implementation:**
  - Define grass/terrain zones in city layout
  - Add collision detection for terrain types
  - Reduce MAX_SPEED and increase FRICTION when on grass
  - Add visual/audio feedback when entering grass
- **Estimated Complexity:** Medium
- **Files to modify:** `game.js`
- **Dependencies:** Requires terrain/surface type system

#### 6. Remove single-player option to simplify game logic
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

#### 7. Add jump mechanic (Space key + mobile support)
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

#### 8. Test and optimize for larger map (more concurrent players)
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

#### 9. Change web domain to match game name
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

#### ~~10. Add tutorial/onboarding system for new players~~ ✅
- ~~**Description:** Interactive first-time player experience explaining game mechanics~~
- ~~**Implementation:**~~
  - ~~Create tutorial system with step-by-step instructions~~
  - ~~Don't use an overlay for the tutorial, but use like an "almost full screen" modal with a screenshot or smaller version of the view, explaining the UI elements~~
  - ~~Guide players through:~~
    - ~~Movement controls (WASD/Arrow keys)~~
    - ~~Reading the minimap~~
    - ~~Understanding pickup (orange) vs delivery (blue) markers~~
    - ~~Reading the HUD (score, timer, distance)~~
    - ~~Mobile joystick usage (if applicable)~~
  - ~~Add "Skip Tutorial" option for returning players~~
  - ~~Store tutorial completion in localStorage~~
- ~~**Estimated Complexity:** Medium-High~~
- ~~**Benefits:** Improves new player retention and reduces learning curve~~

#### 11. Add player emotes and horn system
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

#### 12. Sync round timer (server-driven 5 minutes)
- **Description:** Ensure the round timer is authoritative from the server at 5 minutes, and the server validates that a round truly ended when the client says it did.
- **Implementation:**
  - Set server `CONFIG.GAME_TIME` to 300s and expose it in the `init` payload (already present) and any reconnection payloads.
  - Client: consume `gameConfig.gameTime` from the `init` event and drive the HUD timer with it; remove hardcoded client `CONFIG.GAME_TIME` or only use it as a fallback.
  - Server: track round start timestamps per player; when receiving `end-round`, verify that at least `GAME_TIME` seconds have passed (with a small tolerance) before persisting session/leaderboard.
  - Optionally, have the server emit a `round-ended` to the client when time elapses to make termination symmetric.
- **Estimated Complexity:** Medium
- **Files to modify:** `js/config.js`, `js/main.js`, `server/index.js`
- **Risk mitigations:** Add a tolerance window (e.g., 1-2s) for clock drift; log and ignore premature `end-round` calls.

---

## Backlog Summary

- **Total Tasks:** 12 (3 completed)
- **Low Effort:** 4 tasks (~~1~~✅, ~~2~~✅, 3-4)
- **Medium Effort:** 4 tasks (5-6, 11 - emotes system, 12 - timer sync)
- **High Effort:** 2 tasks (7-8)
- **External Dependencies:** 1 task (9)
- **New Proposals:** 3 tasks (~~10 - tutorial~~✅, 11 - emotes, 12 - timer sync)

**Priority Recommendation:** Start with remaining low-effort tasks (3-4) for quick wins, then tackle medium tasks (5-6, 11) before attempting high-complexity features (7-8). Handle domain migration (9) when infrastructure is ready.
