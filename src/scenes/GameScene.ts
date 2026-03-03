import Phaser from 'phaser';
import {
    SCENES, GAME_WIDTH, GAME_HEIGHT,
    GRID_COLS, GRID_ROWS, CELL_SIZE, GRID_GAP, GRID_X, GRID_Y,
    TRAY_Y, TRAY_BLOCK_SCALE, CANDY_COLORS, ANIM,
} from '../config';
import { ShapeDefinition, CellPosition, ClearResult } from '../types';
import { createEmptyGrid, canPlaceShape, placeShape, checkAndClear, calculateScore, canPlaceAnyShape } from '../logic/GridLogic';
import { getRandomShape, getShapeCellCount } from '../data/shapes';

export class GameScene extends Phaser.Scene {
    private grid!: (number | null)[][];
    private gridGraphics!: Phaser.GameObjects.Graphics;
    private cellSprites: (Phaser.GameObjects.Graphics | null)[][] = [];
    private score = 0;
    private highScore = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private highScoreText!: Phaser.GameObjects.Text;
    private currentShapes: (ShapeDefinition | null)[] = [];
    private trayContainers: Phaser.GameObjects.Container[] = [];
    private ghostGraphics!: Phaser.GameObjects.Graphics;
    private dragShape: ShapeDefinition | null = null;
    private dragIndex = -1;
    private dragContainer: Phaser.GameObjects.Container | null = null;
    private particleGraphics!: Phaser.GameObjects.Graphics;

    constructor() {
        super({ key: SCENES.GAME });
    }

    create(): void {
        this.highScore = parseInt(localStorage.getItem('candyblast_highscore') || '0', 10);
        this.score = 0;
        this.grid = createEmptyGrid();
        this.cellSprites = Array.from({ length: GRID_ROWS }, () =>
            Array.from({ length: GRID_COLS }, () => null)
        );

        // Background gradient
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a0a2e, 0x1a0a2e, 0x2d1b69, 0x2d1b69, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Score UI
        this.add.text(GAME_WIDTH / 2, 40, '🍬 CANDY BLAST', {
            fontSize: '24px', fontFamily: 'Arial', color: '#feca57',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.scoreText = this.add.text(GAME_WIDTH / 2, 80, 'Score: 0', {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5);

        this.highScoreText = this.add.text(GAME_WIDTH / 2, 110, `Best: ${this.highScore}`, {
            fontSize: '14px', fontFamily: 'Arial', color: '#a0a0a0',
        }).setOrigin(0.5);

        // Grid background
        this.gridGraphics = this.add.graphics();
        this.drawGrid();

        // Ghost overlay
        this.ghostGraphics = this.add.graphics();
        this.ghostGraphics.setDepth(5);

        // Particle layer
        this.particleGraphics = this.add.graphics();
        this.particleGraphics.setDepth(10);

        // Spawn initial shapes
        this.spawnNewShapes();

        // Input
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
        this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    }

    // ─── Grid Drawing ───

    private drawGrid(): void {
        this.gridGraphics.clear();

        // Grid background panel
        const totalW = GRID_COLS * (CELL_SIZE + GRID_GAP) - GRID_GAP + 16;
        const totalH = GRID_ROWS * (CELL_SIZE + GRID_GAP) - GRID_GAP + 16;
        this.gridGraphics.fillStyle(0x0d0520, 0.8);
        this.gridGraphics.fillRoundedRect(GRID_X - 8, GRID_Y - 8, totalW, totalH, 12);

        // Empty cells
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const x = GRID_X + c * (CELL_SIZE + GRID_GAP);
                const y = GRID_Y + r * (CELL_SIZE + GRID_GAP);
                this.gridGraphics.fillStyle(0x1e1040, 1);
                this.gridGraphics.fillRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 6);
            }
        }
    }

    private drawCell(row: number, col: number, colorIndex: number): void {
        // Remove existing
        this.clearCellSprite(row, col);

        const x = GRID_X + col * (CELL_SIZE + GRID_GAP);
        const y = GRID_Y + row * (CELL_SIZE + GRID_GAP);
        const color = CANDY_COLORS[colorIndex];

        const g = this.add.graphics();
        g.setDepth(2);

        // Base candy
        g.fillStyle(color.hex, 1);
        g.fillRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 8);

        // Glossy highlight
        g.fillStyle(0xffffff, 0.3);
        g.fillRoundedRect(x + 4, y + 3, CELL_SIZE - 8, CELL_SIZE * 0.4, 6);

        // Specular dot
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(x + 12, y + 10, 3);

        this.cellSprites[row][col] = g;
    }

    private clearCellSprite(row: number, col: number): void {
        const existing = this.cellSprites[row][col];
        if (existing) {
            existing.destroy();
            this.cellSprites[row][col] = null;
        }
    }

    private redrawAllCells(): void {
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                this.clearCellSprite(r, c);
                if (this.grid[r][c] !== null) {
                    this.drawCell(r, c, this.grid[r][c]!);
                }
            }
        }
    }

    // ─── Shape Tray ───

    private spawnNewShapes(): void {
        // Clean up old tray
        this.trayContainers.forEach((c) => c.destroy());
        this.trayContainers = [];
        this.currentShapes = [];

        for (let i = 0; i < 3; i++) {
            const shape = getRandomShape();
            this.currentShapes.push(shape);
            this.createTrayBlock(shape, i);
        }
    }

    private createTrayBlock(shape: ShapeDefinition, index: number): void {
        const container = this.add.container(0, 0);
        container.setDepth(3);

        const cellS = CELL_SIZE * TRAY_BLOCK_SCALE;
        const gap = GRID_GAP * TRAY_BLOCK_SCALE;
        const cols = shape.matrix[0].length;
        const rows = shape.matrix.length;
        const shapeW = cols * (cellS + gap) - gap;
        const shapeH = rows * (cellS + gap) - gap;

        // Position in tray (3 blocks evenly spaced)
        const spacing = GAME_WIDTH / 3;
        const cx = spacing * index + spacing / 2;
        const cy = TRAY_Y;
        container.setPosition(cx, cy);

        const color = CANDY_COLORS[shape.color];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!shape.matrix[r][c]) continue;
                const x = c * (cellS + gap) - shapeW / 2;
                const y = r * (cellS + gap) - shapeH / 2;
                const g = this.add.graphics();
                g.fillStyle(color.hex, 1);
                g.fillRoundedRect(x, y, cellS, cellS, 5);
                g.fillStyle(0xffffff, 0.3);
                g.fillRoundedRect(x + 2, y + 2, cellS - 4, cellS * 0.4, 4);
                g.fillStyle(0xffffff, 0.5);
                g.fillCircle(x + 7, y + 7, 2);
                container.add(g);
            }
        }

        // Interactive zone
        const hitArea = this.add.rectangle(0, 0, shapeW + 20, shapeH + 20, 0x000000, 0);
        hitArea.setInteractive({ draggable: false, useHandCursor: true });
        container.add(hitArea);

        hitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.currentShapes[index] === null) return;
            this.startDrag(index, pointer);
        });

        this.trayContainers[index] = container;
    }

    // ─── Drag & Drop ───

    private startDrag(index: number, pointer: Phaser.Input.Pointer): void {
        this.dragShape = this.currentShapes[index];
        this.dragIndex = index;
        if (!this.dragShape) return;

        // Hide tray block
        this.trayContainers[index].setAlpha(0.3);

        // Create dragging visual (full size)
        this.dragContainer = this.add.container(pointer.x, pointer.y - 60);
        this.dragContainer.setDepth(20);

        const color = CANDY_COLORS[this.dragShape.color];
        const rows = this.dragShape.matrix.length;
        const cols = this.dragShape.matrix[0].length;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (!this.dragShape.matrix[r][c]) continue;
                const x = c * (CELL_SIZE + GRID_GAP);
                const y = r * (CELL_SIZE + GRID_GAP);
                const g = this.add.graphics();
                g.fillStyle(color.hex, 0.85);
                g.fillRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 8);
                g.fillStyle(0xffffff, 0.3);
                g.fillRoundedRect(x + 4, y + 3, CELL_SIZE - 8, CELL_SIZE * 0.4, 6);
                this.dragContainer.add(g);
            }
        }

        // Offset so shape center follows finger
        const offsetX = -(cols * (CELL_SIZE + GRID_GAP) - GRID_GAP) / 2;
        const offsetY = -(rows * (CELL_SIZE + GRID_GAP) - GRID_GAP) / 2;
        this.dragContainer.setPosition(pointer.x + offsetX, pointer.y - 80 + offsetY);
    }

    private onPointerMove(pointer: Phaser.Input.Pointer): void {
        if (!this.dragShape || !this.dragContainer) return;

        const cols = this.dragShape.matrix[0].length;
        const rows = this.dragShape.matrix.length;
        const offsetX = -(cols * (CELL_SIZE + GRID_GAP) - GRID_GAP) / 2;
        const offsetY = -(rows * (CELL_SIZE + GRID_GAP) - GRID_GAP) / 2;
        this.dragContainer.setPosition(pointer.x + offsetX, pointer.y - 80 + offsetY);

        // Ghost preview
        this.ghostGraphics.clear();
        const gridPos = this.getGridPosition(pointer.x + offsetX, pointer.y - 80 + offsetY);
        if (gridPos && canPlaceShape(this.grid, this.dragShape, gridPos.row, gridPos.col)) {
            this.drawGhost(this.dragShape, gridPos.row, gridPos.col);
        }
    }

    private onPointerUp(_pointer: Phaser.Input.Pointer): void {
        if (!this.dragShape || !this.dragContainer) return;

        const cols = this.dragShape.matrix[0].length;
        const rows = this.dragShape.matrix.length;
        const cx = this.dragContainer.x;
        const cy = this.dragContainer.y;

        const gridPos = this.getGridPosition(cx, cy);
        let placed = false;

        if (gridPos && canPlaceShape(this.grid, this.dragShape, gridPos.row, gridPos.col)) {
            // Place it!
            const placedCells = placeShape(this.grid, this.dragShape, gridPos.row, gridPos.col);
            this.onBlockPlaced(placedCells, this.dragShape);
            placed = true;
        }

        // Cleanup drag visuals
        this.dragContainer.destroy();
        this.dragContainer = null;
        this.ghostGraphics.clear();

        if (placed) {
            this.currentShapes[this.dragIndex] = null;
            this.trayContainers[this.dragIndex].setAlpha(0.15);

            // Check if all 3 shapes used
            if (this.currentShapes.every((s) => s === null)) {
                this.spawnNewShapes();
            }

            // Check game over
            if (!canPlaceAnyShape(this.grid, this.currentShapes)) {
                this.time.delayedCall(500, () => this.gameOver());
            }
        } else {
            // Return to tray
            this.trayContainers[this.dragIndex].setAlpha(1);
        }

        this.dragShape = null;
        this.dragIndex = -1;
    }

    private getGridPosition(x: number, y: number): CellPosition | null {
        const col = Math.round((x - GRID_X) / (CELL_SIZE + GRID_GAP));
        const row = Math.round((y - GRID_Y) / (CELL_SIZE + GRID_GAP));
        if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
        return { row, col };
    }

    private drawGhost(shape: ShapeDefinition, startRow: number, startCol: number): void {
        const color = CANDY_COLORS[shape.color];
        for (let r = 0; r < shape.matrix.length; r++) {
            for (let c = 0; c < shape.matrix[r].length; c++) {
                if (!shape.matrix[r][c]) continue;
                const x = GRID_X + (startCol + c) * (CELL_SIZE + GRID_GAP);
                const y = GRID_Y + (startRow + r) * (CELL_SIZE + GRID_GAP);
                this.ghostGraphics.fillStyle(color.hex, 0.35);
                this.ghostGraphics.fillRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 8);
            }
        }
    }

    // ─── Placement & Clearing ───

    private onBlockPlaced(placedCells: CellPosition[], shape: ShapeDefinition): void {
        // Draw placed cells with bounce
        for (const cell of placedCells) {
            this.drawCell(cell.row, cell.col, shape.color);
            const sprite = this.cellSprites[cell.row][cell.col];
            if (sprite) {
                sprite.setScale(0.5);
                this.tweens.add({
                    targets: sprite,
                    scaleX: 1, scaleY: 1,
                    duration: ANIM.PLACE_BOUNCE,
                    ease: 'Back.easeOut',
                });
            }
        }

        // Check for clears
        this.time.delayedCall(100, () => {
            const result = checkAndClear(this.grid);
            const cellCount = getShapeCellCount(shape.matrix);
            const points = calculateScore(result, cellCount);
            this.score += points;
            this.updateScore();

            if (result.cells.length > 0) {
                this.playClearAnimation(result);
            }
        });
    }

    private playClearAnimation(result: ClearResult): void {
        const { cells, comboCount } = result;

        // Shake cells before burst
        cells.forEach((cell, i) => {
            const sprite = this.cellSprites[cell.row][cell.col];
            if (!sprite) return;

            // Shake
            this.tweens.add({
                targets: sprite,
                x: sprite.x + Phaser.Math.Between(-3, 3),
                duration: 50,
                yoyo: true,
                repeat: 3,
                delay: i * 10,
            });

            // Burst after shake
            this.time.delayedCall(ANIM.CLEAR_SHAKE + i * ANIM.DOMINO_DELAY, () => {
                if (!sprite.scene) return;

                // Scale up and fade out
                this.tweens.add({
                    targets: sprite,
                    scaleX: 1.4, scaleY: 1.4,
                    alpha: 0,
                    duration: ANIM.CLEAR_BURST,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        this.clearCellSprite(cell.row, cell.col);
                    },
                });

                // Particle burst
                this.spawnBurstParticles(cell.row, cell.col);
            });
        });

        // Screen shake based on combo
        if (comboCount >= 1) {
            const intensity = Math.min(comboCount * 2, 10);
            this.cameras.main.shake(ANIM.SCREEN_SHAKE, intensity * 0.001);
        }

        // Combo text
        if (comboCount >= 2) {
            const texts = ['SWEET!', 'SUGAR RUSH!', 'CANDY BLAST!', '🍬 MEGA BLAST! 🍬'];
            const textIdx = Math.min(comboCount - 2, texts.length - 1);
            const comboText = this.add.text(GAME_WIDTH / 2, GRID_Y - 30, texts[textIdx], {
                fontSize: comboCount >= 4 ? '32px' : '24px',
                fontFamily: 'Arial',
                color: '#feca57',
                fontStyle: 'bold',
                stroke: '#000',
                strokeThickness: 4,
            }).setOrigin(0.5).setDepth(15);

            this.tweens.add({
                targets: comboText,
                y: comboText.y - 50,
                alpha: 0,
                scaleX: 1.5, scaleY: 1.5,
                duration: ANIM.COMBO_TEXT,
                ease: 'Quad.easeOut',
                onComplete: () => comboText.destroy(),
            });
        }
    }

    private spawnBurstParticles(row: number, col: number): void {
        const cx = GRID_X + col * (CELL_SIZE + GRID_GAP) + CELL_SIZE / 2;
        const cy = GRID_Y + row * (CELL_SIZE + GRID_GAP) + CELL_SIZE / 2;
        const colorIdx = this.grid[row]?.[col]; // may already be null after clear
        const color = CANDY_COLORS[colorIdx ?? Math.floor(Math.random() * 7)];

        // Flash
        const flash = this.add.graphics().setDepth(11);
        flash.fillStyle(0xffffff, 0.8);
        flash.fillCircle(cx, cy, CELL_SIZE * 0.6);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 100,
            onComplete: () => flash.destroy(),
        });

        // Particles (simple graphics circles)
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8 + Phaser.Math.FloatBetween(-0.3, 0.3);
            const dist = Phaser.Math.Between(30, 60);
            const size = Phaser.Math.Between(2, 5);

            const p = this.add.graphics().setDepth(11);
            p.fillStyle(color.hex, 1);
            p.fillCircle(cx, cy, size);

            this.tweens.add({
                targets: p,
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist - 20,
                alpha: 0,
                duration: Phaser.Math.Between(300, 500),
                ease: 'Quad.easeOut',
                onComplete: () => p.destroy(),
            });
        }
    }

    // ─── Score ───

    private updateScore(): void {
        this.scoreText.setText(`Score: ${this.score}`);
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreText.setText(`Best: ${this.highScore}`);
            localStorage.setItem('candyblast_highscore', String(this.highScore));
        }
    }

    // ─── Game Over ───

    private gameOver(): void {
        // Overlay
        const overlay = this.add.graphics().setDepth(50);
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        overlay.setAlpha(0);
        this.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

        const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, '😢 Game Over', {
            fontSize: '36px', fontFamily: 'Arial', color: '#ff6b81',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(51);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, `Score: ${this.score}`, {
            fontSize: '28px', fontFamily: 'Arial', color: '#ffffff',
        }).setOrigin(0.5).setDepth(51);

        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, `Best: ${this.highScore}`, {
            fontSize: '18px', fontFamily: 'Arial', color: '#a0a0a0',
        }).setOrigin(0.5).setDepth(51);

        // Restart button
        const btn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, '🔄 Play Again', {
            fontSize: '22px', fontFamily: 'Arial', color: '#feca57',
            fontStyle: 'bold',
            backgroundColor: '#2d1b69',
            padding: { x: 30, y: 15 },
        }).setOrigin(0.5).setDepth(51).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}
