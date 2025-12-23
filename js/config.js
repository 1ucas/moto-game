// ============= GAME CONFIGURATION =============
// Constants and tuning parameters for the game

export const CONFIG = {
    GAME_TIME: 300, // 5 minutes
    CITY_SIZE: 400,
    BUILDING_COUNT: 40,
    CAR_COUNT: 8,
    DELIVERY_BASE_REWARD: 15,
    MAX_SPEED: 25,
    ACCELERATION: 0.08,
    BRAKE_POWER: 0.15,
    TURN_SPEED: 0.035,
    FRICTION: 0.03,
};

// Grid layout constants
export const GRID_SPACING = 80; // Larger blocks
export const STREET_WIDTH = 20; // Wide streets
export const BLOCK_SIZE = GRID_SPACING - STREET_WIDTH; // Size of each city block

// LocalStorage keys (brand-neutral)
export const JOYSTICK_POSITION_KEY = 'foodRushJoystickPosition';
export const ENGINE_SOUND_KEY = 'foodRushEngineSound';
export const MUSIC_KEY = 'foodRushMusic';
export const MP_USERNAME_KEY = 'foodrush_mp_username';
export const MP_NAME_SET_KEY = 'foodrush_name_set';

// Landmark positions - buildings should avoid these
export const LANDMARK_POSITIONS = [
    // Restaurants
    { x: -120, z: -120 }, { x: 120, z: -120 },
    { x: -120, z: 120 }, { x: 120, z: 120 },
    { x: 0, z: -160 }, { x: 0, z: 160 },
    // Customers
    { x: -160, z: 0 }, { x: 160, z: 0 },
    { x: -40, z: -160 }, { x: 40, z: 160 },
    { x: 160, z: -120 }, { x: -160, z: 120 }
];
