import Phaser from 'phaser';
import { SCENES } from '../config';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: SCENES.BOOT });
    }

    preload(): void {
        // Show loading bar
        const { width, height } = this.scale;
        const barW = width * 0.6;
        const barH = 8;
        const barX = (width - barW) / 2;
        const barY = height / 2;

        const bg = this.add.graphics();
        bg.fillStyle(0x333333, 1);
        bg.fillRoundedRect(barX, barY, barW, barH, 4);

        const bar = this.add.graphics();
        this.load.on('progress', (v: number) => {
            bar.clear();
            bar.fillStyle(0xff6b81, 1);
            bar.fillRoundedRect(barX, barY, barW * v, barH, 4);
        });

        this.load.on('complete', () => {
            bar.destroy();
            bg.destroy();
        });

        // TODO: Load assets here when ready
    }

    create(): void {
        this.scene.start(SCENES.GAME);
    }
}
