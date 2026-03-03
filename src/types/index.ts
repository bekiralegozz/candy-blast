export interface CellPosition {
    row: number;
    col: number;
}

export interface ShapeDefinition {
    id: string;
    matrix: number[][];
    color: number; // index into CANDY_COLORS
}

export interface PlacedBlock {
    row: number;
    col: number;
    colorIndex: number;
}

export interface ClearResult {
    rows: number[];
    cols: number[];
    cells: CellPosition[];
    comboCount: number;
}

export interface GameState {
    grid: (number | null)[][]; // null = empty, number = color index
    score: number;
    highScore: number;
    currentShapes: (ShapeDefinition | null)[];
    isGameOver: boolean;
}
