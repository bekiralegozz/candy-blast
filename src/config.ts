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

// Candy colors
export const CANDY_COLORS: { name: string; hex: number; css: string }[] = [
    { name: 'red',    hex: 0xff4757, css: '#ff4757' },
    { name: 'orange', hex: 0xff9f43, css: '#ff9f43' },
    { name: 'yellow', hex: 0xfeca57, css: '#feca57' },
    { name: 'green',  hex: 0x2ed573, css: '#2ed573' },
    { name: 'blue',   hex: 0x54a0ff, css: '#54a0ff' },
    { name: 'purple', hex: 0xa55eea, css: '#a55eea' },
    { name: 'pink',   hex: 0xff6b81, css: '#ff6b81' },
];

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
