import Phaser from 'phaser';
import {
  createGame, spinGrid, applyResolution, endRound,
  enterShop, buySymbol, removeSymbol, exitShop,
} from '../engine/game';
import { resolve } from '../engine/resolver';
import { GRID_SIZE, QUOTAS, MIN_RESERVE } from '../data/config';
import { SYMBOL_MAP } from '../data/symbols';
import type { GameState } from '../engine/game';
import type { GridState } from '../data/types';

const CELL = 48;
const GRID_PX = GRID_SIZE * CELL; // 192px
const OY = 24;

const TAG_COLORS: Record<string, number> = {
  culture: 0x5a8a2a,
  animal:  0x8a5a2a,
  minerai: 0x6a6a8a,
  humain:  0x2a5a8a,
  proie:   0x9a8a2a,
};
const COLOR_EMPTY  = 0x2a2a3a;
const COLOR_BORDER = 0x4a4a5a;

const S_CELL: Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '7px', color: '#ffffff', fontFamily: 'monospace' };
const S_HUD:  Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '9px', color: '#ffffff', fontFamily: 'monospace' };
const S_SM:   Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '8px', color: '#ffffff', fontFamily: 'monospace' };

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private rng!: () => number;
  private busy = false;

  private ox = 0;
  private cellRects:  Phaser.GameObjects.Rectangle[][] = [];
  private cellLabels: Phaser.GameObjects.Text[][] = [];

  private coinText!:  Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private quotaText!: Phaser.GameObjects.Text;

  private shopObjs: Phaser.GameObjects.GameObject[] = [];

  constructor() { super({ key: 'GameScene' }); }

  create(): void {
    const { width, height } = this.scale;
    this.ox = Math.floor((width - GRID_PX) / 2);
    this.busy = false;
    this.cellRects  = [];
    this.cellLabels = [];
    this.shopObjs   = [];

    const { state, rng } = createGame();
    this.state = state;
    this.rng   = rng;

    this.buildHUD(width);
    this.buildGrid();
    this.buildSpinButton(width, height);
    this.renderGrid(this.emptyGrid());
    this.refreshHUD();
  }

  // ── Construction ────────────────────────────────────────────────────────

  private buildHUD(width: number): void {
    this.coinText  = this.add.text(6, 7, '', S_HUD).setDepth(20);
    this.roundText = this.add.text(width / 2, 7, '', S_HUD).setOrigin(0.5, 0).setDepth(20);
    this.quotaText = this.add.text(width - 6, 7, '', { ...S_HUD, color: '#ff9944' }).setOrigin(1, 0).setDepth(20);
    this.add.graphics().lineStyle(1, 0x444455).lineBetween(0, 20, width, 20).setDepth(20);
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
        this.cellLabels[row][col] = this.add.text(cx, cy, '', S_CELL).setOrigin(0.5);
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
    this.add.text(cx, cy, 'SPIN', { ...S_HUD, color: '#ccff99' }).setOrigin(0.5);
  }

  // ── Rendu grille ────────────────────────────────────────────────────────

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

  // ── Spin ────────────────────────────────────────────────────────────────

  private onSpin(): void {
    if (this.busy || this.state.phase !== 'idle') return;
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
      } else if (outcome === 'victory') {
        this.time.delayedCall(1400, () => this.showVictory());
      } else {
        // 'continue' → boutique
        this.state = enterShop(this.state, this.rng);
        this.refreshHUD();
        this.time.delayedCall(1400, () => this.openShop());
      }
    } else {
      this.time.delayedCall(1400, () => { this.busy = false; });
    }
  }

  // ── Boutique ────────────────────────────────────────────────────────────

  private openShop(): void {
    const { width, height } = this.scale;

    // Fond semi-transparent (sous la barre HUD)
    const bgH = height - 21;
    const bg = this.add.rectangle(width / 2, 21 + bgH / 2, width, bgH, 0x0a0a18, 0.92).setDepth(10);
    this.shopObjs.push(bg);

    this.shopAdd(this.add.text(width / 2, 26, '── BOUTIQUE ──', { ...S_HUD, color: '#ffcc44' }).setOrigin(0.5, 0).setDepth(11));

    // ── Offres ─────────────────────────────────────────────────────────
    const offerXs = [80, 240, 400];
    for (let i = 0; i < this.state.shopOffer.length; i++) {
      const item = this.state.shopOffer[i];
      const sym  = SYMBOL_MAP.get(item.symbolId);
      if (!sym) continue;
      const cx = offerXs[i]!;
      const canBuy = this.state.buysLeft > 0 && this.state.coins >= item.cost;

      const cardColor = TAG_COLORS[sym.tags[0] ?? ''] ?? COLOR_EMPTY;
      this.shopAdd(this.add.rectangle(cx, 59, 128, 56, cardColor, 0.9).setStrokeStyle(1, 0x888888).setDepth(11));
      this.shopAdd(this.add.text(cx, 40, sym.name, { ...S_HUD, color: '#ffffff' }).setOrigin(0.5).setDepth(12));
      this.shopAdd(this.add.text(cx, 55, `Rareté : ${sym.rarity}`, { ...S_SM, color: '#aaaaaa' }).setOrigin(0.5).setDepth(12));
      this.shopAdd(this.add.text(cx, 68, `Coût : ${item.cost}`, { ...S_SM, color: canBuy ? '#ffee44' : '#666666' }).setOrigin(0.5).setDepth(12));

      const btnFill = canBuy ? 0x3d7a2b : 0x2a2a2a;
      const btnBorder = canBuy ? 0x8bc34a : 0x444444;
      const btn = this.add.rectangle(cx, 83, 90, 13, btnFill).setStrokeStyle(1, btnBorder).setDepth(12);
      if (canBuy) {
        btn.setInteractive({ useHandCursor: true });
        const idx = i;
        btn.on('pointerup',   () => this.onBuy(idx));
        btn.on('pointerover', () => btn.setFillStyle(0x5a9a40));
        btn.on('pointerout',  () => btn.setFillStyle(btnFill));
      }
      this.shopAdd(btn);
      this.shopAdd(this.add.text(cx, 83, 'ACHETER', { fontSize: '7px', color: canBuy ? '#ccff99' : '#555555', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(13));
    }

    // ── Séparateur ─────────────────────────────────────────────────────
    this.shopAdd(this.add.graphics().lineStyle(1, 0x333355).lineBetween(0, 98, width, 98).setDepth(11));

    // ── Retrait ────────────────────────────────────────────────────────
    const canRemove = this.state.removalsLeft > 0;
    const removeColor = canRemove ? '#ccaaff' : '#666666';
    this.shopAdd(this.add.text(10, 103, `Retirer (${this.state.removalsLeft} restant) :`, { ...S_SM, color: removeColor }).setDepth(11));

    const reserveMap = new Map<string, number>();
    for (const id of this.state.reserve) reserveMap.set(id, (reserveMap.get(id) ?? 0) + 1);

    const ECOL = 152; // largeur colonne entry
    const EGAP = 6;
    let col = 0, ey = 117;
    for (const [id, count] of reserveMap) {
      const sym = SYMBOL_MAP.get(id);
      if (!sym) continue;
      const ex = 10 + col * (ECOL + EGAP);
      const ecy = ey + 9;
      const atFloor = this.state.reserve.length <= MIN_RESERVE;
      const canRm = canRemove && !atFloor;

      this.shopAdd(this.add.rectangle(ex + ECOL / 2, ecy, ECOL, 18, 0x1e1e2e).setStrokeStyle(1, 0x3a3a5a).setDepth(11));
      this.shopAdd(this.add.text(ex + 4, ecy, `${sym.name} ×${count}`, { ...S_SM, color: '#dddddd' }).setOrigin(0, 0.5).setDepth(12));

      const rmFill = canRm ? 0x6a1e1e : 0x222222;
      const rmBtn = this.add.rectangle(ex + ECOL - 11, ecy, 16, 13, rmFill).setStrokeStyle(1, canRm ? 0xcc4444 : 0x333333).setDepth(12);
      if (canRm) {
        rmBtn.setInteractive({ useHandCursor: true });
        const capturedId = id;
        rmBtn.on('pointerup', () => this.onRemove(capturedId));
      }
      this.shopAdd(rmBtn);
      this.shopAdd(this.add.text(ex + ECOL - 11, ecy, '−', { fontSize: '9px', color: canRm ? '#ff8888' : '#444444', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(13));

      col++;
      if (col >= 3) { col = 0; ey += 22; }
    }

    // ── Bouton Continuer ───────────────────────────────────────────────
    const exitBg = this.add.rectangle(width / 2, height - 14, 120, 18, 0x2a5a2a).setStrokeStyle(1, 0x6ac36a).setDepth(11).setInteractive({ useHandCursor: true });
    exitBg.on('pointerup',   () => this.onExitShop());
    exitBg.on('pointerover', () => exitBg.setFillStyle(0x3a7a3a));
    exitBg.on('pointerout',  () => exitBg.setFillStyle(0x2a5a2a));
    this.shopAdd(exitBg);
    this.shopAdd(this.add.text(width / 2, height - 14, 'CONTINUER →', { ...S_HUD, color: '#aaffaa' }).setOrigin(0.5).setDepth(12));
  }

  private shopAdd(obj: Phaser.GameObjects.GameObject): void {
    this.shopObjs.push(obj);
  }

  private closeShop(): void {
    for (const obj of this.shopObjs) obj.destroy();
    this.shopObjs = [];
    this.busy = false;
  }

  private onBuy(index: number): void {
    const next = buySymbol(this.state, index);
    if (next === this.state) return;
    this.state = next;
    this.refreshHUD();
    this.closeShop();
    this.openShop();
  }

  private onRemove(symbolId: string): void {
    const next = removeSymbol(this.state, symbolId);
    if (next === this.state) return;
    this.state = next;
    this.closeShop();
    this.openShop();
  }

  private onExitShop(): void {
    this.state = exitShop(this.state);
    this.closeShop();
    this.refreshHUD();
  }

  // ── Overlays fin de partie ──────────────────────────────────────────────

  private showGameOver(): void {
    const { width, height } = this.scale;
    const cx = width / 2, cy = height / 2;
    this.add.rectangle(cx, cy, width, height, 0x000000, 0.82);
    this.add.text(cx, cy - 38, 'GAME OVER', { fontSize: '22px', color: '#ff4444', fontFamily: 'monospace' }).setOrigin(0.5);
    this.add.text(cx, cy - 10, `Manche atteinte : ${this.state.round}`, { fontSize: '10px', color: '#cccccc', fontFamily: 'monospace' }).setOrigin(0.5);
    const btn = this.add.rectangle(cx, cy + 22, 104, 18, 0x3d7a2b).setStrokeStyle(1, 0x8bc34a).setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => this.scene.restart());
    btn.on('pointerover', () => btn.setFillStyle(0x5a9a40));
    btn.on('pointerout',  () => btn.setFillStyle(0x3d7a2b));
    this.add.text(cx, cy + 22, '[ REJOUER ]', { fontSize: '10px', color: '#ccff99', fontFamily: 'monospace' }).setOrigin(0.5);
  }

  private showVictory(): void {
    const { width, height } = this.scale;
    const cx = width / 2, cy = height / 2;
    this.add.rectangle(cx, cy, width, height, 0x000000, 0.82);
    this.add.text(cx, cy - 40, 'VICTOIRE !', { fontSize: '22px', color: '#ffee44', fontFamily: 'monospace' }).setOrigin(0.5);
    this.add.text(cx, cy - 14, `${this.state.round - 1} manches complétées !`, { fontSize: '10px', color: '#cccccc', fontFamily: 'monospace' }).setOrigin(0.5);
    const btn = this.add.rectangle(cx, cy + 20, 110, 18, 0x2a5a8a).setStrokeStyle(1, 0x4a8abc).setInteractive({ useHandCursor: true });
    btn.on('pointerup', () => this.scene.restart());
    btn.on('pointerover', () => btn.setFillStyle(0x3a6aaa));
    btn.on('pointerout',  () => btn.setFillStyle(0x2a5a8a));
    this.add.text(cx, cy + 20, '[ REJOUER ]', { fontSize: '10px', color: '#aaddff', fontFamily: 'monospace' }).setOrigin(0.5);
  }
}
