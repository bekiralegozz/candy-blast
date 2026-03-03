import { ShapeDefinition } from '../types';

// Each shape is defined as a 2D matrix where 1 = filled, 0 = empty
// color will be assigned randomly at spawn time

const SHAPE_MATRICES: { id: string; matrix: number[][] }[] = [
    // Single
    { id: 'dot', matrix: [[1]] },

    // Lines
    { id: 'h2', matrix: [[1, 1]] },
    { id: 'h3', matrix: [[1, 1, 1]] },
    { id: 'h4', matrix: [[1, 1, 1, 1]] },
    { id: 'h5', matrix: [[1, 1, 1, 1, 1]] },
    { id: 'v2', matrix: [[1], [1]] },
    { id: 'v3', matrix: [[1], [1], [1]] },
    { id: 'v4', matrix: [[1], [1], [1], [1]] },
    { id: 'v5', matrix: [[1], [1], [1], [1], [1]] },

    // Squares
    { id: 'sq2', matrix: [[1, 1], [1, 1]] },
    { id: 'sq3', matrix: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },

    // L-shapes
    { id: 'l1', matrix: [[1, 0], [1, 0], [1, 1]] },
    { id: 'l2', matrix: [[0, 1], [0, 1], [1, 1]] },
    { id: 'l3', matrix: [[1, 1], [1, 0], [1, 0]] },
    { id: 'l4', matrix: [[1, 1], [0, 1], [0, 1]] },

    // T-shapes
    { id: 't1', matrix: [[1, 1, 1], [0, 1, 0]] },
    { id: 't2', matrix: [[0, 1, 0], [1, 1, 1]] },

    // Z/S shapes
    { id: 'z1', matrix: [[1, 1, 0], [0, 1, 1]] },
    { id: 's1', matrix: [[0, 1, 1], [1, 1, 0]] },

    // Corner (big L)
    { id: 'corner1', matrix: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
    { id: 'corner2', matrix: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },
    { id: 'corner3', matrix: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
    { id: 'corner4', matrix: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
];

export function getRandomShape(): ShapeDefinition {
    const idx = Math.floor(Math.random() * SHAPE_MATRICES.length);
    const shape = SHAPE_MATRICES[idx];
    const colorIndex = Math.floor(Math.random() * 7);
    return {
        id: shape.id,
        matrix: shape.matrix,
        color: colorIndex,
    };
}

export function getShapeCellCount(matrix: number[][]): number {
    let count = 0;
    for (const row of matrix) {
        for (const cell of row) {
            if (cell) count++;
        }
    }
    return count;
}

export { SHAPE_MATRICES };
