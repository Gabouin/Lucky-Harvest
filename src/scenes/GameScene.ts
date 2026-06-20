import Phaser from 'phaser';
import { createGame, spinGrid, applyResolution, endRound } from '../engine/game';
import { resolve } from '../engine/resolver';
import { GRID_SIZE, QUOTAS } from '../data/config';
import type { GameState } from '../engine/game';
import type { GridState } from '../data/types';

const CELL = 48; // 16px × 3 = pixel-perfect entier
const GRID_PX = GRID_SIZE * CELL; // 192px
const OY = 24; // ordonnée du bord haut de la grille

const TAG_COLORS: Record<string, number> = {
  culture: 0x5a8a2a,
  animal:  0x8a5a2a,
  minerai: 0x6a6a8a,
  humain:  0x2a5a8a,
  proie:   0x9a8a2a,
};
const COLOR_EMPTY  = 0x2a2a3a;
const COLOR_BORDER = 0x4a4a5a;

const STYLE_CELL: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '7px', color: '#ffffff', fontFamily: 'monospace',
};
const STYLE_HUD: Phaser.Types.GameObjects.Text.TextStyle = {
  fontSize: '9px', color: '#ffffff', fontFamily: 'monospace',
};

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private rng!: () => number;
  private busy = false;

  private ox = 0;
  private cellRects: Phaser.GameObjects.Rectangle[][] = [];
  private cellLabels: Phaser.GameObjects.Text[][] = [];

  private coinText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private quotaText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.ox = Math.floor((width - GRID_PX) / 2);
    this.busy = false;
    this.cellRects = [];
    this.cellLabels = [];

    const { state, rng } = createGame();
    this.state = state;
    this.rng = rng;

    this.buildHUD(width);
    this.buildGrid();
    this.buildSpinButton(width, height);
    this.renderGrid(this.emptyGrid());
    this.refreshHUD();
  }

  // ── Construction ────────────────────────────────────────────────────────

  private buildHUD(width: number): void {
    this.coinText  = this.add.text(6, 7, '', STYLE_HUD);
    this.roundText = this.add.text(width / 2, 7, '', STYLE_HUD).setOrigin(0.5, 0);
    this.quotaText = this.add.text(width - 6, 7, '', { ...STYLE_HUD, color: '#ff9944' })
      .setOrigin(1, 0);
    this.add.graphics().lineStyle(1, 0x444455).lineBetween(0, 20, width, 20);
  }

  private buildGrid(): void {
    for (let row = 0; row < GRID_SIZE; row++) {
      this.cellRects[row]  = [];
      this.cellLabels[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        const cx = this.ox + col * CELL + CELL / 2;
        const cy = OY + row * CELL + CELL / 2;
        const rect = this.add.rectangle(cx, cy, CELL - 1, CELL - 1, COLOR_EMPTY);
        rect.setStrokeStyle(1, COLOR_BORDER);
        this.cellRects[row][col]  = rect;
        this.cellLabels[row][col] = this.add.text(cx, cy, '', STYLE_CELL).setOrigin(0.5);
      }
    }
  }

  private buildSpinButton(width: number, height: number): void {
    const cx = Math.floor(width / 2);
    const cy = height - 16;
    const bg = this.add.rectangle(cx, cy, 84, 18, 0x3d7a2b).setStrokeStyle(1, 0x8bc34a);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerup',   () => this.onSpin());
    bg.on('pointerover', () => bg.setFillStyle(0x5a9a40));
    bg.on('pointerout',  () => bg.setFillStyle(0x3d7a2b));
    this.add.text(cx, cy, 'SPIN', { ...STYLE_HUD, color: '#ccff99' }).setOrigin(0.5);
  }

  // ── Rendu ───────────────────────────────────────────────────────────────

  private emptyGrid(): GridState {
    return Array.from({ length: GRID_SIZE }, () =>
      new Array(GRID_SIZE).fill(null) as GridState[0],
    );
  }

  private renderGrid(grid: GridState): void {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const sym   = grid[row][col];
        const rect  = this.cellRects[row][col];
        const label = this.cellLabels[row][col];
        if (sym === null) {
          rect.setFillStyle(COLOR_EMPTY);
          label.setText('');
        } else {
          rect.setFillStyle(TAG_COLORS[sym.tags[0] ?? ''] ?? COLOR_EMPTY);
          label.setText(sym.name);
        }
      }
    }
  }

  private refreshHUD(): void {
    const idx   = Math.min(this.state.round - 1, QUOTAS.length - 1);
    const quota = QUOTAS[idx]!;
    this.coinText.setText(`Pièces : ${this.state.coins}`);
    this.roundText.setText(`Manche ${this.state.round}`);
    this.quotaText.setText(`Quota : ${quota}`);
  }

  private showGain(amount: number): void {
    const cx = this.scale.width / 2;
    const cy = OY + GRID_PX + 12;
    const t = this.add.text(cx, cy, `+${amount} pièces`, {
      fontSize: '11px', color: '#ffee44', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: t, y: cy - 20, alpha: 0,
      duration: 1200, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  private showGameOver(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(cx, cy, width, height, 0x000000, 0.8);
    this.add.text(cx, cy - 38, 'GAME OVER', {
      fontSize: '22px', color: '#ff4444', fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add.text(cx, cy - 10, `Manche atteinte : ${this.state.round}`, {
      fontSize: '10px', color: '#cccccc', fontFamily: 'monospace',
    }).setOrigin(0.5);

    const replayBg = this.add.rectangle(cx, cy + 20, 104, 18, 0x3d7a2b)
      .setStrokeStyle(1, 0x8bc34a)
      .setInteractive({ useHandCursor: true });
    replayBg.on('pointerup',   () => this.scene.restart());
    replayBg.on('pointerover', () => replayBg.setFillStyle(0x5a9a40));
    replayBg.on('pointerout',  () => replayBg.setFillStyle(0x3d7a2b));
    this.add.text(cx, cy + 20, '[ REJOUER ]', {
      fontSize: '10px', color: '#ccff99', fontFamily: 'monospace',
    }).setOrigin(0.5);
  }

  // ── Logique ─────────────────────────────────────────────────────────────

  private onSpin(): void {
    if (this.busy || this.state.phase === 'gameover') return;
    this.busy = true;

    const grid   = spinGrid(this.state.reserve, this.rng);
    this.renderGrid(grid);

    const result = resolve(grid, { round: this.state.round });
    this.state = applyResolution(this.state, result);
    this.refreshHUD();
    this.showGain(result.totalCoins);

    if (this.state.spinsLeft === 0) {
      const { state: next, outcome } = endRound(this.state);
      this.state = next;
      if (outcome === 'gameover') {
        this.time.delayedCall(1400, () => this.showGameOver());
      } else {
        this.refreshHUD();
        this.time.delayedCall(1400, () => { this.busy = false; });
      }
    } else {
      this.time.delayedCall(1400, () => { this.busy = false; });
    }
  }
}
