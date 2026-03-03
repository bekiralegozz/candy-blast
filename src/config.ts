// Grid
export const GRID_COLS = 8;
export const GRID_ROWS = 8;
export const CELL_SIZE = 40;
export const GRID_GAP = 2;
export const GRID_PADDING = 16;

// Game dimensions (portrait mobile)
export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 844;

// Grid position (centered horizontally, upper portion)
export const GRID_X = (GAME_WIDTH - (GRID_COLS * (CELL_SIZE + GRID_GAP) - GRID_GAP)) / 2;
export const GRID_Y = 160;

// Block tray (bottom area)
export const TRAY_Y = 650;
export const TRAY_BLOCK_SCALE = 0.6;

// Royal Match inspired gem/piece colors
export const CANDY_COLORS: { name: string; hex: number; css: string; dark: number; light: number }[] = [
    { name: 'red',    hex: 0xe84545, css: '#e84545', dark: 0xb82e2e, light: 0xff7b7b },  // Ruby
    { name: 'blue',   hex: 0x2b7de9, css: '#2b7de9', dark: 0x1a5bb5, light: 0x6aadff },  // Sapphire
    { name: 'green',  hex: 0x3bb54a, css: '#3bb54a', dark: 0x298a35, light: 0x6de87a },  // Emerald
    { name: 'yellow', hex: 0xf5c842, css: '#f5c842', dark: 0xc9a020, light: 0xffe07a },  // Gold coin
    { name: 'purple', hex: 0x9b59b6, css: '#9b59b6', dark: 0x7a3d96, light: 0xc39ddb },  // Amethyst
    { name: 'orange', hex: 0xf39c12, css: '#f39c12', dark: 0xc87f0a, light: 0xffc04d },  // Amber
    { name: 'cyan',   hex: 0x1abc9c, css: '#1abc9c', dark: 0x13967d, light: 0x55dfc4 },  // Aquamarine
];

// Royal theme palette
export const THEME = {
    BG_TOP: 0x1a3a5c,       // Deep royal blue
    BG_BOTTOM: 0x0d1f33,    // Darker navy
    GRID_BG: 0x152a42,      // Grid panel background
    GRID_CELL: 0x1c3554,    // Empty cell color
    GRID_BORDER: 0xc8951e,  // Gold border
    GOLD: 0xffd700,         // Pure gold
    GOLD_DARK: 0xc8951e,    // Dark gold
    GOLD_LIGHT: 0xffe44d,   // Light gold
    PANEL_BG: 0x1a3050,     // UI panel background
    TEXT_PRIMARY: '#ffffff',
    TEXT_GOLD: '#ffd700',
    TEXT_SECONDARY: '#8cadc4',
    STAR: 0xffd700,
};

// Scoring
export const SCORE_PER_CELL = 10;
export const SCORE_LINE_BONUS = 50;
export const COMBO_MULTIPLIER = 1.5;

// Animation durations (ms)
export const ANIM = {
    PLACE_BOUNCE: 150,
    CLEAR_SHAKE: 300,
    CLEAR_BURST: 200,
    DOMINO_DELAY: 50,
    SCREEN_SHAKE: 200,
    SCORE_POPUP: 800,
    COMBO_TEXT: 1200,
};

// Scene keys
export const SCENES = {
    BOOT: 'BootScene',
    MENU: 'MenuScene',
    GAME: 'GameScene',
    GAME_OVER: 'GameOverScene',
};
