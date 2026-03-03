import { GRID_COLS, GRID_ROWS, SCORE_PER_CELL, SCORE_LINE_BONUS, COMBO_MULTIPLIER } from '../config';
import { CellPosition, ClearResult, GameState, ShapeDefinition } from '../types';

export function createEmptyGrid(): (number | null)[][] {
    return Array.from({ length: GRID_ROWS }, () =>
        Array.from({ length: GRID_COLS }, () => null)
    );
}

export function canPlaceShape(
    grid: (number | null)[][],
    shape: ShapeDefinition,
    startRow: number,
    startCol: number
): boolean {
    const { matrix } = shape;
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (!matrix[r][c]) continue;
            const gr = startRow + r;
            const gc = startCol + c;
            if (gr < 0 || gr >= GRID_ROWS || gc < 0 || gc >= GRID_COLS) return false;
            if (grid[gr][gc] !== null) return false;
        }
    }
    return true;
}

export function placeShape(
    grid: (number | null)[][],
    shape: ShapeDefinition,
    startRow: number,
    startCol: number
): CellPosition[] {
    const placed: CellPosition[] = [];
    const { matrix } = shape;
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (!matrix[r][c]) continue;
            grid[startRow + r][startCol + c] = shape.color;
            placed.push({ row: startRow + r, col: startCol + c });
        }
    }
    return placed;
}

export function checkAndClear(grid: (number | null)[][]): ClearResult {
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    // Check rows
    for (let r = 0; r < GRID_ROWS; r++) {
        if (grid[r].every((cell) => cell !== null)) {
            fullRows.push(r);
        }
    }

    // Check columns
    for (let c = 0; c < GRID_COLS; c++) {
        let full = true;
        for (let r = 0; r < GRID_ROWS; r++) {
            if (grid[r][c] === null) { full = false; break; }
        }
        if (full) fullCols.push(c);
    }

    // Collect all cells to clear (avoid duplicates)
    const cellSet = new Set<string>();
    const cells: CellPosition[] = [];

    for (const r of fullRows) {
        for (let c = 0; c < GRID_COLS; c++) {
            const key = `${r},${c}`;
            if (!cellSet.has(key)) {
                cellSet.add(key);
                cells.push({ row: r, col: c });
            }
        }
    }

    for (const c of fullCols) {
        for (let r = 0; r < GRID_ROWS; r++) {
            const key = `${r},${c}`;
            if (!cellSet.has(key)) {
                cellSet.add(key);
                cells.push({ row: r, col: c });
            }
        }
    }

    // Clear the cells
    for (const cell of cells) {
        grid[cell.row][cell.col] = null;
    }

    const comboCount = fullRows.length + fullCols.length;

    return { rows: fullRows, cols: fullCols, cells, comboCount };
}

export function calculateScore(clearResult: ClearResult, placedCellCount: number): number {
    const { cells, comboCount } = clearResult;
    let score = placedCellCount * SCORE_PER_CELL;

    if (cells.length > 0) {
        score += cells.length * SCORE_PER_CELL;
        score += comboCount * SCORE_LINE_BONUS;

        // Combo multiplier for 2+ lines
        if (comboCount >= 2) {
            score = Math.floor(score * Math.pow(COMBO_MULTIPLIER, comboCount - 1));
        }
    }

    return score;
}

export function canPlaceAnyShape(
    grid: (number | null)[][],
    shapes: (ShapeDefinition | null)[]
): boolean {
    for (const shape of shapes) {
        if (!shape) continue;
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (canPlaceShape(grid, shape, r, c)) return true;
            }
        }
    }
    return false;
}

export function isGameOver(state: GameState): boolean {
    return !canPlaceAnyShape(state.grid, state.currentShapes);
}
