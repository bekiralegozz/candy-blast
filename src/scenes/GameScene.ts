import Phaser from 'phaser';
import {
    SCENES, GAME_WIDTH, GAME_HEIGHT,
    GRID_COLS, GRID_ROWS, CELL_SIZE, GRID_GAP, GRID_X, GRID_Y,
    TRAY_Y, TRAY_BLOCK_SCALE, CANDY_COLORS, ANIM, THEME,
} from '../config';
import { ShapeDefinition, CellPosition, ClearResult } from '../types';
import { createEmptyGrid, canPlaceShape, placeShape, checkAndClear, calculateScore, canPlaceAnyShape } from '../logic/GridLogic';
import { getRandomShape, getShapeCellCount } from '../data/shapes';
import { HapticService } from '../services/HapticService';

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
        this.highScore = parseInt(localStorage.getItem('royalblast_highscore') || '0', 10);
        this.score = 0;
        this.grid = createEmptyGrid();
        this.cellSprites = Array.from({ length: GRID_ROWS }, () =>
            Array.from({ length: GRID_COLS }, () => null)
        );

        // Royal blue gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(THEME.BG_TOP, THEME.BG_TOP, THEME.BG_BOTTOM, THEME.BG_BOTTOM, 1);
        bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Decorative golden header bar
        const header = this.add.graphics();
        header.fillStyle(THEME.PANEL_BG, 0.9);
        header.fillRoundedRect(20, 15, GAME_WIDTH - 40, 120, 16);
        header.lineStyle(2, THEME.GOLD_DARK, 0.8);
        header.strokeRoundedRect(20, 15, GAME_WIDTH - 40, 120, 16);

        // Crown / Title
        this.add.text(GAME_WIDTH / 2, 42, '👑', {
            fontSize: '28px',
        }).setOrigin(0.5);

        this.add.text(GAME_WIDTH / 2, 72, 'ROYAL BLAST', {
            fontSize: '22px', fontFamily: 'Arial', color: THEME.TEXT_GOLD,
            fontStyle: 'bold',
            stroke: '#8B6914', strokeThickness: 2,
        }).setOrigin(0.5);

        // Score panel
        this.scoreText = this.add.text(GAME_WIDTH / 2, 102, '0', {
            fontSize: '24px', fontFamily: 'Arial', color: THEME.TEXT_PRIMARY,
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.highScoreText = this.add.text(GAME_WIDTH / 2, 125, `★ Best: ${this.highScore}`, {
            fontSize: '12px', fontFamily: 'Arial', color: THEME.TEXT_SECONDARY,
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

        // Tray background panel
        const trayBg = this.add.graphics().setDepth(1);
        trayBg.fillStyle(THEME.PANEL_BG, 0.85);
        trayBg.fillRoundedRect(15, TRAY_Y - 55, GAME_WIDTH - 30, 110, 16);
        trayBg.lineStyle(2, THEME.GOLD_DARK, 0.5);
        trayBg.strokeRoundedRect(15, TRAY_Y - 55, GAME_WIDTH - 30, 110, 16);

        // Spawn initial shapes
        this.spawnNewShapes();

        // Input
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.onPointerMove(p));
        this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onPointerUp(p));
    }

    // ─── Grid Drawing ───

    private drawGrid(): void {
        this.gridGraphics.clear();

        const totalW = GRID_COLS * (CELL_SIZE + GRID_GAP) - GRID_GAP + 20;
        const totalH = GRID_ROWS * (CELL_SIZE + GRID_GAP) - GRID_GAP + 20;

        // Outer gold border
        this.gridGraphics.lineStyle(3, THEME.GOLD_DARK, 0.9);
        this.gridGraphics.strokeRoundedRect(GRID_X - 10, GRID_Y - 10, totalW, totalH, 14);

        // Inner grid panel
        this.gridGraphics.fillStyle(THEME.GRID_BG, 0.95);
        this.gridGraphics.fillRoundedRect(GRID_X - 10, GRID_Y - 10, totalW, totalH, 14);

        // Inner gold trim
        this.gridGraphics.lineStyle(1.5, THEME.GOLD, 0.3);
        this.gridGraphics.strokeRoundedRect(GRID_X - 7, GRID_Y - 7, totalW - 6, totalH - 6, 12);

        // Empty cells with subtle wooden board feel
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const x = GRID_X + c * (CELL_SIZE + GRID_GAP);
                const y = GRID_Y + r * (CELL_SIZE + GRID_GAP);

                // Cell shadow
                this.gridGraphics.fillStyle(0x0a1a2a, 0.5);
                this.gridGraphics.fillRoundedRect(x + 1, y + 1, CELL_SIZE, CELL_SIZE, 6);

                // Cell base
                this.gridGraphics.fillStyle(THEME.GRID_CELL, 1);
                this.gridGraphics.fillRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 6);

                // Subtle inner highlight
                this.gridGraphics.fillStyle(0xffffff, 0.03);
                this.gridGraphics.fillRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE / 2, 5);
            }
        }
    }

    private drawCell(row: number, col: number, colorIndex: number): void {
        this.clearCellSprite(row, col);

        const x = GRID_X + col * (CELL_SIZE + GRID_GAP);
        const y = GRID_Y + row * (CELL_SIZE + GRID_GAP);
        const color = CANDY_COLORS[colorIndex];

        const g = this.add.graphics();
        g.setDepth(2);

        // Shadow underneath
        g.fillStyle(0x000000, 0.3);
        g.fillRoundedRect(x + 2, y + 2, CELL_SIZE, CELL_SIZE, 8);

        // Base gem color (darker bottom)
        g.fillStyle(color.dark, 1);
        g.fillRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 8);

        // Main gem body (slightly inset)
        g.fillStyle(color.hex, 1);
        g.fillRoundedRect(x + 2, y + 1, CELL_SIZE - 4, CELL_SIZE - 3, 7);

        // Top glossy shine
        g.fillStyle(color.light, 0.6);
        g.fillRoundedRect(x + 5, y + 3, CELL_SIZE - 10, CELL_SIZE * 0.32, 5);

        // Specular highlight (gem sparkle)
        g.fillStyle(0xffffff, 0.75);
        g.fillCircle(x + 13, y + 11, 3);
        g.fillStyle(0xffffff, 0.4);
        g.fillCircle(x + 19, y + 8, 1.5);

        // Bottom edge highlight
        g.fillStyle(0xffffff, 0.08);
        g.fillRoundedRect(x + 4, y + CELL_SIZE - 10, CELL_SIZE - 8, 6, 3);

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

                // Mini gem style matching grid cells
                g.fillStyle(color.dark, 1);
                g.fillRoundedRect(x, y, cellS, cellS, 5);
                g.fillStyle(color.hex, 1);
                g.fillRoundedRect(x + 1, y + 1, cellS - 2, cellS - 2, 4);
                g.fillStyle(color.light, 0.5);
                g.fillRoundedRect(x + 3, y + 2, cellS - 6, cellS * 0.35, 3);
                g.fillStyle(0xffffff, 0.6);
                g.fillCircle(x + 7, y + 7, 1.5);
                container.add(g);
            }
        }

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

        this.trayContainers[index].setAlpha(0.3);

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

                // Dragging gem (slightly transparent)
                g.fillStyle(color.dark, 0.7);
                g.fillRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 8);
                g.fillStyle(color.hex, 0.85);
                g.fillRoundedRect(x + 2, y + 1, CELL_SIZE - 4, CELL_SIZE - 3, 7);
                g.fillStyle(color.light, 0.4);
                g.fillRoundedRect(x + 5, y + 3, CELL_SIZE - 10, CELL_SIZE * 0.32, 5);
                this.dragContainer.add(g);
            }
        }

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

        this.ghostGraphics.clear();
        const gridPos = this.getGridPosition(pointer.x + offsetX, pointer.y - 80 + offsetY);
        if (gridPos && canPlaceShape(this.grid, this.dragShape, gridPos.row, gridPos.col)) {
            this.drawGhost(this.dragShape, gridPos.row, gridPos.col);
        }
    }

    private onPointerUp(_pointer: Phaser.Input.Pointer): void {
        if (!this.dragShape || !this.dragContainer) return;

        const cx = this.dragContainer.x;
        const cy = this.dragContainer.y;

        const gridPos = this.getGridPosition(cx, cy);
        let placed = false;

        if (gridPos && canPlaceShape(this.grid, this.dragShape, gridPos.row, gridPos.col)) {
            const placedCells = placeShape(this.grid, this.dragShape, gridPos.row, gridPos.col);
            this.onBlockPlaced(placedCells, this.dragShape);
            HapticService.light();
            placed = true;
        }

        this.dragContainer.destroy();
        this.dragContainer = null;
        this.ghostGraphics.clear();

        if (placed) {
            this.currentShapes[this.dragIndex] = null;
            this.trayContainers[this.dragIndex].setAlpha(0.15);

            if (this.currentShapes.every((s) => s === null)) {
                this.spawnNewShapes();
            }

            if (!canPlaceAnyShape(this.grid, this.currentShapes)) {
                this.time.delayedCall(500, () => this.gameOver());
            }
        } else {
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
                // Golden highlight ghost
                this.ghostGraphics.fillStyle(THEME.GOLD, 0.2);
                this.ghostGraphics.fillRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 6);
                this.ghostGraphics.lineStyle(1.5, THEME.GOLD, 0.5);
                this.ghostGraphics.strokeRoundedRect(x, y, CELL_SIZE, CELL_SIZE, 6);
            }
        }
    }

    // ─── Placement & Clearing ───

    private onBlockPlaced(placedCells: CellPosition[], shape: ShapeDefinition): void {
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

                this.spawnBurstParticles(cell.row, cell.col);
            });
        });

        // Screen shake
        if (comboCount >= 1) {
            const intensity = Math.min(comboCount * 2, 10);
            this.cameras.main.shake(ANIM.SCREEN_SHAKE, intensity * 0.001);
            HapticService.medium();
        }

        // Royal combo text
        if (comboCount >= 2) {
            const texts = ['BRILLIANT!', 'MAJESTIC!', 'ROYAL CRUSH!', '👑 KING\'S BLAST! 👑'];
            const textIdx = Math.min(comboCount - 2, texts.length - 1);
            const comboText = this.add.text(GAME_WIDTH / 2, GRID_Y - 30, texts[textIdx], {
                fontSize: comboCount >= 4 ? '32px' : '24px',
                fontFamily: 'Arial',
                color: THEME.TEXT_GOLD,
                fontStyle: 'bold',
                stroke: '#4a3000',
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

            // Golden sparkle ring for big combos
            if (comboCount >= 3) {
                this.spawnGoldenRing();
                HapticService.heavy();
            }
        }
    }

    private spawnBurstParticles(row: number, col: number): void {
        const cx = GRID_X + col * (CELL_SIZE + GRID_GAP) + CELL_SIZE / 2;
        const cy = GRID_Y + row * (CELL_SIZE + GRID_GAP) + CELL_SIZE / 2;
        const colorIdx = this.grid[row]?.[col];
        const color = CANDY_COLORS[colorIdx ?? Math.floor(Math.random() * 7)];

        // Golden flash
        const flash = this.add.graphics().setDepth(11);
        flash.fillStyle(THEME.GOLD_LIGHT, 0.7);
        flash.fillCircle(cx, cy, CELL_SIZE * 0.6);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scaleX: 1.5, scaleY: 1.5,
            duration: 150,
            onComplete: () => flash.destroy(),
        });

        // Star-shaped particles
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10 + Phaser.Math.FloatBetween(-0.3, 0.3);
            const dist = Phaser.Math.Between(25, 55);
            const size = Phaser.Math.Between(2, 4);
            const isGold = i % 3 === 0;

            const p = this.add.graphics().setDepth(11);
            p.fillStyle(isGold ? THEME.GOLD : color.hex, 1);
            p.fillCircle(cx, cy, size);

            // Add tiny star shape for gold particles
            if (isGold) {
                p.fillStyle(0xffffff, 0.8);
                p.fillCircle(cx, cy, size * 0.5);
            }

            this.tweens.add({
                targets: p,
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist - 15,
                alpha: 0,
                duration: Phaser.Math.Between(250, 450),
                ease: 'Quad.easeOut',
                onComplete: () => p.destroy(),
            });
        }
    }

    private spawnGoldenRing(): void {
        const cx = GAME_WIDTH / 2;
        const cy = GRID_Y + (GRID_ROWS * (CELL_SIZE + GRID_GAP)) / 2;
        const ring = this.add.graphics().setDepth(12);
        ring.lineStyle(3, THEME.GOLD, 0.8);
        ring.strokeCircle(cx, cy, 20);

        this.tweens.add({
            targets: ring,
            scaleX: 6, scaleY: 6,
            alpha: 0,
            duration: 600,
            ease: 'Quad.easeOut',
            onComplete: () => ring.destroy(),
        });
    }

    // ─── Score ───

    private updateScore(): void {
        this.scoreText.setText(`${this.score}`);
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreText.setText(`★ Best: ${this.highScore}`);
            localStorage.setItem('royalblast_highscore', String(this.highScore));
        }
    }

    // ─── Game Over ───

    private gameOver(): void {
        HapticService.error();
        const overlay = this.add.graphics().setDepth(50);
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        overlay.setAlpha(0);
        this.tweens.add({ targets: overlay, alpha: 1, duration: 300 });

        // Royal game over panel
        const panel = this.add.graphics().setDepth(51);
        const panelX = 30, panelY = GAME_HEIGHT / 2 - 120, panelW = GAME_WIDTH - 60, panelH = 260;
        panel.fillStyle(THEME.PANEL_BG, 0.95);
        panel.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
        panel.lineStyle(3, THEME.GOLD_DARK, 0.9);
        panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);
        panel.lineStyle(1.5, THEME.GOLD, 0.3);
        panel.strokeRoundedRect(panelX + 5, panelY + 5, panelW - 10, panelH - 10, 17);

        this.add.text(GAME_WIDTH / 2, panelY + 40, '👑', {
            fontSize: '36px',
        }).setOrigin(0.5).setDepth(52);

        this.add.text(GAME_WIDTH / 2, panelY + 80, 'Game Over', {
            fontSize: '30px', fontFamily: 'Arial', color: THEME.TEXT_GOLD,
            fontStyle: 'bold', stroke: '#4a3000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(52);

        this.add.text(GAME_WIDTH / 2, panelY + 120, `Score: ${this.score}`, {
            fontSize: '24px', fontFamily: 'Arial', color: THEME.TEXT_PRIMARY,
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(52);

        this.add.text(GAME_WIDTH / 2, panelY + 150, `★ Best: ${this.highScore}`, {
            fontSize: '16px', fontFamily: 'Arial', color: THEME.TEXT_SECONDARY,
        }).setOrigin(0.5).setDepth(52);

        // Royal restart button
        const btnBg = this.add.graphics().setDepth(52);
        const btnX = GAME_WIDTH / 2 - 80, btnY = panelY + 185, btnW = 160, btnH = 48;
        btnBg.fillStyle(THEME.GOLD_DARK, 1);
        btnBg.fillRoundedRect(btnX, btnY + 2, btnW, btnH, 12);
        btnBg.fillStyle(THEME.GOLD, 1);
        btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 12);
        btnBg.fillStyle(THEME.GOLD_LIGHT, 0.4);
        btnBg.fillRoundedRect(btnX + 4, btnY + 3, btnW - 8, btnH * 0.45, 8);

        const btn = this.add.text(GAME_WIDTH / 2, btnY + btnH / 2, 'Play Again', {
            fontSize: '18px', fontFamily: 'Arial', color: '#3a2000',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(53).setInteractive({ useHandCursor: true });

        // Make entire button area clickable
        const hitZone = this.add.rectangle(GAME_WIDTH / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0)
            .setDepth(53).setInteractive({ useHandCursor: true });

        const restart = () => this.scene.restart();
        btn.on('pointerdown', restart);
        hitZone.on('pointerdown', restart);
    }
}
