import Phaser from 'phaser';

// Remplacer par le nom exact du fichier dans src/assets/ quand tu me le donneras
const SPRITESHEET_KEY = 'tiles';
const SPRITESHEET_FILE = 'cozy-valley.png';
const FRAME_W = 16;
const FRAME_H = 16;

const GRID_COLS = 4;
const GRID_ROWS = 4;
// Chaque tuile 16×16 affichée à ×3 → 48×48 px canvas (net car entier)
const SCALE = 3;
const CELL = FRAME_W * SCALE; // 48 px

// Quelques frames à placer pour vérifier le rendu (indices à ajuster selon le spritesheet réel)
const SAMPLE_SPRITES: { row: number; col: number; frame: number }[] = [
  { row: 0, col: 0, frame: 0 },
  { row: 0, col: 3, frame: 1 },
  { row: 1, col: 2, frame: 2 },
  { row: 2, col: 1, frame: 0 },
  { row: 3, col: 0, frame: 3 },
  { row: 3, col: 3, frame: 1 },
];

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    this.load.spritesheet(SPRITESHEET_KEY, SPRITESHEET_FILE, {
      frameWidth: FRAME_W,
      frameHeight: FRAME_H,
    });
  }

  create(): void {
    const { width, height } = this.scale;
    const gridW = GRID_COLS * CELL;
    const gridH = GRID_ROWS * CELL;

    // Origine entière pour éviter tout sub-pixel
    const ox = Math.floor((width - gridW) / 2);
    const oy = Math.floor((height - gridH) / 2);

    this.drawGrid(ox, oy, gridW, gridH);
    this.placeSampleSprites(ox, oy);
  }

  private drawGrid(ox: number, oy: number, gridW: number, gridH: number): void {
    const gfx = this.add.graphics();

    // Fond de la grille
    gfx.fillStyle(0x3d7a2b);
    gfx.fillRect(ox, oy, gridW, gridH);

    // Bordures de cellules
    gfx.lineStyle(1, 0x2a5a1a);
    for (let r = 0; r <= GRID_ROWS; r++) {
      gfx.lineBetween(ox, oy + r * CELL, ox + gridW, oy + r * CELL);
    }
    for (let c = 0; c <= GRID_COLS; c++) {
      gfx.lineBetween(ox + c * CELL, oy, ox + c * CELL, oy + gridH);
    }

    // Contour extérieur plus visible
    gfx.lineStyle(2, 0x8bc34a);
    gfx.strokeRect(ox, oy, gridW, gridH);
  }

  private placeSampleSprites(ox: number, oy: number): void {
    for (const { row, col, frame } of SAMPLE_SPRITES) {
      const cx = ox + col * CELL + Math.floor(CELL / 2);
      const cy = oy + row * CELL + Math.floor(CELL / 2);
      this.add.image(cx, cy, SPRITESHEET_KEY, frame).setScale(SCALE);
    }
  }
}
