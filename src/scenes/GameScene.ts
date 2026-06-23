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
import { removeWhiteBackground } from '../ui/removeWhiteBackground';

const CELL = 96;
const GRID_PX        = GRID_SIZE * CELL; // 384px — taille de la grille de jeu
const GRID_IMG_PX    = GRID_PX + 176;   // 560px — taille visuelle de l'image de fond
const GRID_IMG_DY    = 22;              // décalage vertical de l'image (sans bouger les cases)
const GRID_CELLS_DX  = 12;             // décalage horizontal des cases (sans bouger l'image)
const OY = 48;

const CV = 'CozyValley_Premium_1.3/CozyValley_Premium_1.3';
const CT = 'CozyTowns_v1';


const S_HUD:  Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '18px', color: '#ffffff', fontFamily: 'Silkscreen' };
const S_SM:   Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '16px', color: '#ffffff', fontFamily: 'Silkscreen' };
const S_TINY: Phaser.Types.GameObjects.Text.TextStyle = { fontSize: '13px', color: '#aaaaaa', fontFamily: 'Silkscreen' };

function spriteScale(fw: number, fh: number): number {
  return Math.max(1, Math.floor(76 / Math.max(fw, fh)));
}

type SynergyPair = { srcRow: number; srcCol: number; tgtRow: number; tgtCol: number };

type TreeRefs = {
  oak1: Phaser.GameObjects.Image; oak2: Phaser.GameObjects.Image; oak3: Phaser.GameObjects.Image;
  ch1:  Phaser.GameObjects.Image; ch2:  Phaser.GameObjects.Image; ch3:  Phaser.GameObjects.Image;
};

function drawBackground(scene: Phaser.Scene): TreeRefs {
  const { width: W, height: H } = scene.scale;
  scene.add.rectangle(W / 2, H / 2, W, H, 0x2d5a1b).setDepth(-2);
  scene.add.rectangle(W / 2, H - H / 6, W, H / 3, 0x1a3a0e).setDepth(-2);
  scene.add.image(0, H - 50, 'barn').setScale(3).setOrigin(0, 1).setDepth(-1);
  scene.add.image(W - 10, H - 50, 'house').setCrop(0, 0, 96, 96).setScale(2.5).setOrigin(1, 1).setDepth(-1);
  const oak1 = scene.add.image(151, 331, 'tree_oak').setCrop(0, 0, 32, 48).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  const oak2 = scene.add.image(238, 308, 'tree_oak').setCrop(0, 0, 32, 48).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  const oak3 = scene.add.image(295, 366, 'tree_oak').setCrop(0, 0, 32, 48).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  const ch1  = scene.add.image(791, 421, 'tree_cherry').setCrop(0, 0, 32, 48).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  const ch2  = scene.add.image(870, 439, 'tree_cherry').setCrop(0, 0, 32, 48).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  const ch3  = scene.add.image(960, 390, 'tree_cherry').setCrop(0, 0, 32, 48).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  const flDefs: [number, number][] = [
    [70,     0], [160,   16], [255,   32], [340,   48],
    [W-340, 32], [W-230, 16], [W-130,  0], [W-50,  48],
  ];
  for (const [fx, cy] of flDefs)
    scene.add.image(fx, H - 108, 'flowers').setCrop(0, cy, 16, 16).setScale(5).setDepth(-1);
  for (let x = 0; x <= W; x += 48)
    scene.add.image(x, H - 50, 'fence_seg').setCrop(16, 0, 16, 16).setScale(3).setOrigin(0, 0.5).setDepth(-1);
  return { oak1, oak2, oak3, ch1, ch2, ch3 };
}

function buildTreeDebugOverlay(scene: Phaser.Scene, refs: TreeRefs): void {
  document.getElementById('tree-debug')?.remove();
  const { width: W, height: H } = scene.scale;
  const panel = document.createElement('div');
  panel.id = 'tree-debug';
  panel.style.cssText = [
    'position:fixed','top:0','right:0','z-index:9999',
    'background:rgba(0,0,0,0.88)','color:#fff','padding:10px',
    'font:11px monospace','width:260px','max-height:100vh',
    'overflow-y:auto','box-sizing:border-box',
  ].join(';');
  const title = document.createElement('div');
  title.style.cssText = 'font:bold 13px monospace;margin-bottom:6px;color:#aaffaa';
  title.textContent = '🌳 TREE DEBUG';
  panel.append(title);

  const entries: { key: keyof TreeRefs; label: string }[] = [
    { key: 'oak1', label: 'Oak 1'    },
    { key: 'oak2', label: 'Oak 2'    },
    { key: 'oak3', label: 'Oak 3'    },
    { key: 'ch1',  label: 'Cherry 1' },
    { key: 'ch2',  label: 'Cherry 2' },
    { key: 'ch3',  label: 'Cherry 3' },
  ];

  function addSlider(container: HTMLElement, axis: string, maxVal: number, initVal: number, onUpdate: (v: number) => void): void {
    const lbl = document.createElement('div');
    lbl.style.cssText = 'color:#ccc;margin-top:2px';
    lbl.textContent = `${axis}: ${Math.round(initVal)}`;
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = '0'; sl.max = String(maxVal);
    sl.value = String(Math.round(initVal)); sl.style.width = '100%';
    sl.oninput = () => { onUpdate(Number(sl.value)); lbl.textContent = `${axis}: ${sl.value}`; };
    container.append(lbl, sl);
  }

  for (const { key, label } of entries) {
    const img = refs[key];
    const sec = document.createElement('div');
    sec.style.cssText = 'border-top:1px solid #444;padding:4px 0';
    const h = document.createElement('b'); h.textContent = label;
    sec.append(h);
    addSlider(sec, 'X', W, img.x, v => { img.x = v; });
    addSlider(sec, 'Y', H, img.y, v => { img.y = v; });
    panel.append(sec);
  }

  const btn = document.createElement('button');
  btn.textContent = 'Copy coords';
  btn.style.cssText = [
    'margin-top:10px','width:100%','padding:7px','cursor:pointer',
    'background:#3a8a3a','border:none','color:#fff',
    'font:bold 12px monospace','border-radius:4px',
  ].join(';');
  btn.onclick = () => {
    const out: Record<string, { x: number; y: number }> = {};
    for (const { key, label } of entries)
      out[label] = { x: Math.round(refs[key].x), y: Math.round(refs[key].y) };
    navigator.clipboard.writeText(JSON.stringify(out, null, 2)).then(() => {
      btn.textContent = 'Copied !';
      setTimeout(() => { btn.textContent = 'Copy coords'; }, 1500);
    });
  };
  panel.append(btn);
  document.body.append(panel);
}

export class GameScene extends Phaser.Scene {
  private state!: GameState;
  private rng!: () => number;
  private busy = false;

  private ox = 0;
  private lastGrid: GridState = [];
  private cellRects:   Phaser.GameObjects.Rectangle[][] = [];
  private cellLabels:  Phaser.GameObjects.Text[][] = [];
  private cellSprites: (Phaser.GameObjects.Image | null)[][] = [];

  private coinText!:  Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private quotaText!: Phaser.GameObjects.Text;

  private shopObjs: Phaser.GameObjects.GameObject[] = [];
  private gridContainer!: Phaser.GameObjects.Container;
  private gridImg!: Phaser.GameObjects.Image;
  private cellDisp = 0;
  private gridOriginX = 0;
  private gridOriginY = 0;

  // ── Tooltip ──────────────────────────────────────────────────────────────
  private tipBg:   Phaser.GameObjects.Rectangle | null = null;
  private tipName: Phaser.GameObjects.Text      | null = null;
  private tipDesc: Phaser.GameObjects.Text      | null = null;

  constructor() { super({ key: 'GameScene' }); }

  preload(): void {
    this.load.spritesheet('icons',    `${CV}/Icons/Icons.png`,                   { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('cow',      `${CV}/Animals/Cow/Cow_brownwhite.png`,    { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('chicken',  `${CV}/Animals/Chicken/Chicken_brown.png`, { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('eggs',     `${CV}/Animals/Chicken/Chicken_eggs.png`,  { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('sheep',    `${CV}/Animals/Sheep/Sheep_white.png`,     { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('rat',      `${CV}/Monsters/Rat.png`,                  { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('duck',     `${CV}/Animals/Duck/Duck_white.png`,       { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('goose',    `${CV}/Animals/Goose/Goose_white.png`,     { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('fish',     `${CV}/Animals/Fish/Fish_small.png`,       { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('slime',    `${CV}/Monsters/Slime.png`,                { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('skeleton', `${CV}/Monsters/Skeleton.png`,             { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('char1',    'chars/char1.png',                          { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('char2',    'chars/char2.png',                          { frameWidth: 32, frameHeight: 32 });
    this.load.image(     'tree_oak',    `${CV}/Tilesets/Trees/Trees_oak.png`);
    this.load.image(     'tree_cherry', `${CV}/Tilesets/Trees/Trees_cherryblossom.png`);
    this.load.image(     'barn',        `${CV}/Tilesets/Barn.png`);
    this.load.image('fence_seg', `${CV}/Tilesets/Woodenfence.png`);
    this.load.image('flowers',   `${CV}/Tilesets/Flowers.png`);
    this.load.image('house',     `${CT}/Housing/Exterior/Houses.png`);
    this.load.image('btn-spin',  'ui/spin.png');
    this.load.image('btn-play',  'ui/play.png');
    this.load.image('btn-buy',   'ui/buy.png');
    this.load.image('btn-htp',   'ui/howtoplay.png');
    this.load.image('grid-full',    'ui/fullgrid.png');
    this.load.image('grid-shop',    'ui/shopgrid.png');
    this.load.image('btn-continue', 'ui/continue.png');
  }

  create(): void {
    const { width, height } = this.scale;
    this.ox = Math.floor((width - GRID_PX) / 2);

    this.busy = false;
    this.lastGrid    = this.emptyGrid();
    this.cellRects   = [];
    this.cellLabels  = [];
    this.cellSprites = [];
    this.shopObjs    = [];

    this.createPlaceholderTexture();
    this.createParticleTextures();
    for (const k of ['btn-spin','btn-play','btn-buy','btn-htp','grid-full','grid-shop','btn-continue'])
      removeWhiteBackground(this, k);
    const treeRefs = drawBackground(this);
    if (window.location.hash === '#debug') buildTreeDebugOverlay(this, treeRefs);
    const gridWorldX = Math.round(this.ox + GRID_PX / 2);
    const gridWorldY = Math.round(OY + GRID_PX / 2);
    this.cellDisp    = GRID_PX / GRID_SIZE;
    // Container au CENTRE de la grille — le pivot reste correct pour le spin
    this.gridContainer = this.add.container(gridWorldX, gridWorldY);
    // gridImg plus grande que la grille de jeu — centrée sur le container
    this.gridImg = this.add.image(-GRID_IMG_PX / 2, -GRID_IMG_PX / 2 + GRID_IMG_DY, 'grid-full')
      .setDisplaySize(GRID_IMG_PX, GRID_IMG_PX).setOrigin(0, 0).setDepth(0);
    this.gridContainer.add(this.gridImg);
    // gridOriginX/Y basé sur GRID_PX (cases de jeu), pas GRID_IMG_PX
    this.gridOriginX = -GRID_PX / 2 + GRID_CELLS_DX;
    this.gridOriginY = -GRID_PX / 2;

    const { state, rng } = createGame();
    this.state = state;
    this.rng   = rng;

    this.buildHUD(width);
    this.buildGrid();
    this.buildSpinButton(width, height);
    this.renderGrid(this.emptyGrid());
    this.refreshHUD();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private createPlaceholderTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0x667788);
    g.fillRect(0, 0, 16, 16);
    g.lineStyle(1, 0x9aabb8);
    g.strokeRect(1, 1, 14, 14);
    g.generateTexture('placeholder', 16, 16);
    g.destroy();
  }

  private createParticleTextures(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffcc00);
    g.fillCircle(4, 4, 4);
    g.generateTexture('coinParticle', 9, 9);
    g.destroy();
  }

  private txt(
    x: number, y: number,
    content: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
    originX = 0, originY = 0,
  ): Phaser.GameObjects.Text {
    return this.add.text(Math.round(x), Math.round(y), content, style)
      .setOrigin(originX, originY)
      .setResolution(window.devicePixelRatio);
  }

  // ── Tooltip ──────────────────────────────────────────────────────────────

  private showTooltip(px: number, py: number, name: string, desc: string): void {
    this.hideTooltip();
    const PAD = 10;
    const W   = 300;
    const { width, height } = this.scale;

    const tmpName = this.add.text(0, -2000, name, { fontSize: '18px', color: '#ffee44', fontFamily: 'Silkscreen' }).setResolution(window.devicePixelRatio);
    const tmpDesc = this.add.text(0, -2000, desc, { fontSize: '16px', color: '#cccccc', fontFamily: 'Silkscreen', wordWrap: { width: W - PAD * 2 } }).setResolution(window.devicePixelRatio);
    const nameH = tmpName.height;
    const descH = tmpDesc.height;
    tmpName.destroy();
    tmpDesc.destroy();

    const H = PAD * 2 + nameH + 6 + descH;
    let tx = px + 10;
    let ty = Math.round(py - H / 2);
    if (tx + W > width  - 4) tx = px - W - 10;
    if (ty < 4)               ty = 4;
    if (ty + H > height - 4)  ty = height - H - 4;

    this.tipBg = this.add.rectangle(tx, ty, W, H, 0x0a0a18, 0.96)
      .setOrigin(0, 0).setStrokeStyle(1, 0x666688).setDepth(100);
    this.tipName = this.add.text(tx + PAD, ty + PAD, name,
      { fontSize: '18px', color: '#ffee44', fontFamily: 'Silkscreen' })
      .setResolution(window.devicePixelRatio).setDepth(101);
    this.tipDesc = this.add.text(tx + PAD, ty + PAD + nameH + 6, desc,
      { fontSize: '16px', color: '#cccccc', fontFamily: 'Silkscreen', wordWrap: { width: W - PAD * 2 } })
      .setResolution(window.devicePixelRatio).setDepth(101);
  }

  private hideTooltip(): void {
    this.tipBg?.destroy();   this.tipBg   = null;
    this.tipName?.destroy(); this.tipName = null;
    this.tipDesc?.destroy(); this.tipDesc = null;
  }

  // ── Construction ─────────────────────────────────────────────────────────

  private buildHUD(width: number): void {
    this.add.rectangle(width / 2, 20, width, 40, 0x1a1a1a, 0.82).setDepth(19);
    this.coinText  = this.txt(12, 12, '', S_HUD).setDepth(20);
    this.roundText = this.txt(width / 2, 12, '', S_HUD, 0.5, 0).setDepth(20);
    this.quotaText = this.txt(width - 12, 12, '', { ...S_HUD, color: '#ffaa33' }, 1, 0).setDepth(20);
    this.add.graphics().lineStyle(1, 0x5a3a1a).lineBetween(0, 40, width, 40).setDepth(20);
  }

  private buildGrid(): void {
    this.cellSprites = Array.from({ length: GRID_SIZE }, () =>
      new Array<Phaser.GameObjects.Image | null>(GRID_SIZE).fill(null),
    );
    for (let row = 0; row < GRID_SIZE; row++) {
      this.cellRects[row]  = [];
      this.cellLabels[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        // coords locales au container (origin = coin haut-gauche de gridImg)
        const cx = this.gridOriginX + col * this.cellDisp + this.cellDisp / 2;
        const cy = this.gridOriginY + row * this.cellDisp + this.cellDisp / 2;
        const rect = this.add.rectangle(cx, cy, this.cellDisp, this.cellDisp, 0x000000, 0);
        this.cellRects[row][col] = rect;
        const label = this.txt(cx, cy + 34, '', S_TINY, 0.5, 0).setDepth(2);
        this.cellLabels[row][col] = label;
        this.gridContainer.add([rect, label]);

        const r = row, c = col;
        rect.setInteractive();
        rect.on('pointerover', () => {
          const sym = this.lastGrid[r]?.[c];
          if (sym) {
            const b = rect.getBounds();
            this.showTooltip(b.right + 6, b.centerY, sym.name, sym.description);
          }
        });
        rect.on('pointerout', () => this.hideTooltip());
      }
    }
  }

  private buildSpinButton(width: number, height: number): void {
    const cx = Math.round(width / 2);
    const cy = height - 32;
    const btn = this.add.image(cx, cy, 'btn-spin').setDisplaySize(220, 80).setOrigin(0.5, 0.5);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => btn.setAlpha(0.7));
    btn.on('pointerup',   () => { btn.setAlpha(1); this.onSpin(); });
    btn.on('pointerover', () => btn.setAlpha(0.85));
    btn.on('pointerout',  () => btn.setAlpha(1));
  }

  // ── Grid render ──────────────────────────────────────────────────────────

  private emptyGrid(): GridState {
    return Array.from({ length: GRID_SIZE }, () =>
      new Array(GRID_SIZE).fill(null) as GridState[0],
    );
  }

  private renderGrid(grid: GridState): void {
    this.lastGrid = grid;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const sym   = grid[row][col];
        const label = this.cellLabels[row][col];
        const cx = this.gridOriginX + col * this.cellDisp + this.cellDisp / 2;
        const cy = this.gridOriginY + row * this.cellDisp + this.cellDisp / 2;

        if (this.cellSprites[row][col]) {
          this.cellSprites[row][col]!.destroy();
          this.cellSprites[row][col] = null;
        }

        if (sym === null) {
          label.setText('');
        } else {
          const { key, frame, fw, fh } = sym.spriteRef;
          const scale = spriteScale(fw, fh);
          const img = this.add.image(cx, cy, key, frame ?? 0)
            .setScale(0).setOrigin(0.5).setDepth(1);
          this.cellSprites[row][col] = img;
          this.gridContainer.add(img);
          label.setText(sym.name);

          this.tweens.add({
            targets: img,
            scaleX: scale, scaleY: scale,
            duration: 180, ease: 'Back.Out',
            delay: (row * GRID_SIZE + col) * 30,
          });
        }
      }
    }
    // Labels always on top of sprites within the container
    this.gridContainer.sort('depth');
  }

  private refreshHUD(): void {
    const idx   = Math.min(this.state.round - 1, QUOTAS.length - 1);
    const quota = QUOTAS[idx]!;
    this.coinText.setText(`Coins: ${this.state.coins}`);
    this.roundText.setText(`Round ${this.state.round}`);
    this.quotaText.setText(`Rent: ${quota}`);
  }

  // ── Visual effects ────────────────────────────────────────────────────────

  // Detect onAdjacentTag synergies for flash animation (visual only, no scoring)
  private computeSynergies(grid: GridState): SynergyPair[] {
    const DIRS: readonly [number, number][] = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    const pairs: SynergyPair[] = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const sym = grid[row]?.[col];
        if (!sym) continue;
        for (const { trigger } of sym.effects) {
          if (trigger.kind !== 'onAdjacentTag') continue;
          for (const [dr, dc] of DIRS) {
            const r = row + dr, c = col + dc;
            if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue;
            const n = grid[r]?.[c];
            if (n && n.tags.includes(trigger.tag)) {
              pairs.push({ srcRow: row, srcCol: col, tgtRow: r, tgtCol: c });
            }
          }
        }
      }
    }
    return pairs;
  }

  private flashCell(row: number, col: number, color: number, alpha: number, duration: number): void {
    // coords locales au container
    const cx = Math.round(this.gridOriginX + col * this.cellDisp + this.cellDisp / 2);
    const cy = Math.round(this.gridOriginY + row * this.cellDisp + this.cellDisp / 2);
    const flash = this.add.rectangle(cx, cy, this.cellDisp - 1, this.cellDisp - 1, color, alpha).setDepth(3);
    this.gridContainer.add(flash);
    this.tweens.add({
      targets: flash, alpha: 0,
      duration, ease: 'Linear',
      onComplete: () => flash.destroy(),
    });
  }

  private emitCoinParticles(row: number, col: number): void {
    // conversion local → world pour les particules (hors container)
    const cx = Math.round(this.gridContainer.x + this.gridOriginX + col * this.cellDisp + this.cellDisp / 2);
    const cy = Math.round(this.gridContainer.y + this.gridOriginY + row * this.cellDisp + this.cellDisp / 2);
    const emitter = this.add.particles(cx, cy, 'coinParticle', {
      speed: { min: 50, max: 120 },
      angle: { min: 240, max: 300 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 1,   end: 0 },
      lifespan: 600,
      emitting: false,
    });
    emitter.setDepth(5);
    emitter.explode(7);
    this.time.delayedCall(800, () => emitter.destroy());
  }

  private bounceCoinText(): void {
    this.tweens.killTweensOf(this.coinText);
    this.tweens.add({
      targets: this.coinText,
      scaleX: 1.3, scaleY: 1.3,
      duration: 80,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => this.coinText.setScale(1),
    });
  }

  private showGain(amount: number): void {
    const t = this.txt(12, 24, `+${amount}`, { fontSize: '15px', color: '#44ee88', fontFamily: 'Silkscreen' }, 0, 0.5);
    t.setDepth(22);
    this.tweens.add({
      targets: t, y: -6, alpha: 0,
      duration: 900, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  private showRentPaid(amount: number): void {
    const x = this.scale.width - 12;
    const t = this.txt(x, 24, `−${amount}`, { fontSize: '15px', color: '#ff6666', fontFamily: 'Silkscreen' }, 1, 0.5);
    t.setDepth(22);
    this.tweens.add({
      targets: t, y: -6, alpha: 0,
      duration: 900, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  private showRentFailed(amount: number): void {
    const cx = Math.round(this.scale.width / 2);
    const t = this.txt(cx, 24, `Rent ${amount} — can't pay!`, { fontSize: '15px', color: '#ff2222', fontFamily: 'Silkscreen' }, 0.5, 0.5);
    t.setDepth(22);
    this.tweens.add({
      targets: t, y: -6, alpha: 0,
      duration: 1200, ease: 'Power2',
      onComplete: () => t.destroy(),
    });
  }

  // ── Spin ─────────────────────────────────────────────────────────────────

  private onSpin(): void {
    if (this.busy || this.state.phase !== 'idle') return;
    this.busy = true;
    this.hideTooltip();

    this.cameras.main.shake(200, 0.003);

    // Compute everything upfront (pure); render after wheel animation
    const grid      = spinGrid(this.state.reserve, this.rng);
    const result    = resolve(grid, { round: this.state.round });
    const synergies = this.computeSynergies(grid);
    const nextState = applyResolution(this.state, result);

    this.showSpinWheel(); // 600ms wheel, then symbols pop

    // t=600ms: wheel done → symbols pop in
    this.time.delayedCall(600, () => this.renderGrid(grid));

    // t=1100ms: flash synergies + particles
    this.time.delayedCall(1100, () => {
      for (const { srcRow, srcCol, tgtRow, tgtCol } of synergies) {
        this.flashCell(srcRow, srcCol, 0xffdd44, 0.7, 200);
        this.flashCell(tgtRow, tgtCol, 0x88ff88, 0.7, 200);
      }
      for (const ev of result.events) {
        if (ev.type === 'destroy') this.flashCell(ev.row, ev.col, 0xff4444, 0.7, 300);
        if (ev.type === 'gain')    this.emitCoinParticles(ev.row, ev.col);
      }
    });

    // t=1300ms: HUD coins go up + bounce + "+X" popup
    this.time.delayedCall(1300, () => {
      this.state = nextState;
      this.refreshHUD();
      this.bounceCoinText();
      this.showGain(result.totalCoins);
    });

    if (nextState.spinsLeft > 0) {
      this.time.delayedCall(2000, () => { this.busy = false; });
      return;
    }

    const idx   = Math.min(nextState.round - 1, QUOTAS.length - 1);
    const rent  = QUOTAS[idx]!;
    const { state: afterRound, outcome } = endRound(nextState);

    // t=2100ms: pay rent (800ms after HUD update)
    this.time.delayedCall(2100, () => {
      if (outcome === 'gameover') {
        this.showRentFailed(rent);
        this.state = afterRound;
        this.time.delayedCall(1400, () => this.showGameOver());
      } else {
        this.state = afterRound;
        this.refreshHUD();
        this.bounceCoinText();
        this.showRentPaid(rent);
        if (outcome === 'victory') {
          this.time.delayedCall(1400, () => this.showVictory());
        } else {
          this.state = enterShop(this.state, this.rng);
          this.refreshHUD();
          this.time.delayedCall(400, () => this.openShop());
        }
      }
    });
  }

  private showSpinWheel(): void {
    this.gridContainer.angle = 0;
    this.tweens.add({
      targets: this.gridContainer,
      angle: 720,
      duration: 600,
      ease: 'Cubic.Out',
      onComplete: () => { this.gridContainer.angle = 0; },
    });
  }

  // ── Shop ─────────────────────────────────────────────────────────────────

  private openShop(): void {
    this.hideTooltip();
    for (const row of this.cellRects) for (const rect of row) rect.disableInteractive();
    const { width, height } = this.scale;

    const bgH = height - 42;
    const bg = this.add.rectangle(width / 2, 42 + bgH / 2, width, bgH, 0x0a0a18).setDepth(10);
    this.shopObjs.push(bg);

    this.shopAdd(this.txt(width / 2, 58, '── SHOP ──', { ...S_HUD, color: '#ffcc44' }, 0.5, 0).setDepth(11));

    // ── Offers ───────────────────────────────────────────────────────────
    const offerXs = [160, 480, 800];
    for (let i = 0; i < this.state.shopOffer.length; i++) {
      const item = this.state.shopOffer[i];
      const sym  = SYMBOL_MAP.get(item.symbolId);
      if (!sym) continue;
      const cx     = offerXs[i]!;
      const canBuy = this.state.buysLeft > 0 && this.state.coins >= item.cost;

      const cardRect = this.add.image(cx, 197, 'grid-shop')
        .setDisplaySize(320, 300).setOrigin(0.5, 0.5).setDepth(11);
      const capSym = sym;
      cardRect.setInteractive();
      cardRect.on('pointerover', () => this.showTooltip(cx + 160 + 10, 197, capSym.name, capSym.description));
      cardRect.on('pointerout',  () => this.hideTooltip());
      this.shopAdd(cardRect);

      const { key, frame, fw, fh } = sym.spriteRef;
      const scale = spriteScale(fw, fh);
      this.shopAdd(this.add.image(cx, 163, key, frame ?? 0).setScale(scale).setOrigin(0.5).setDepth(12));

      this.shopAdd(this.txt(cx, 207, sym.name,                { ...S_HUD, color: '#ffffff' }, 0.5, 0.5).setDepth(12));
      this.shopAdd(this.txt(cx, 229, `Rarity: ${sym.rarity}`, { ...S_SM,  color: '#cccccc' }, 0.5, 0.5).setDepth(12));
      this.shopAdd(this.txt(cx, 251, `Cost: ${item.cost}`,    { ...S_SM,  color: canBuy ? '#ffee44' : '#666666' }, 0.5, 0.5).setDepth(12));

      const buyBtn = this.add.image(cx, 318, 'btn-buy')
        .setDisplaySize(160, 65).setOrigin(0.5, 0.5).setDepth(12);
      if (canBuy) {
        buyBtn.setInteractive({ useHandCursor: true });
        const idx = i;
        buyBtn.on('pointerdown', () => buyBtn.setAlpha(0.7));
        buyBtn.on('pointerup',   () => { buyBtn.setAlpha(1); this.onBuy(idx); });
        buyBtn.on('pointerover', () => buyBtn.setAlpha(0.85));
        buyBtn.on('pointerout',  () => buyBtn.setAlpha(1));
      } else {
        buyBtn.setAlpha(0.4);
      }
      this.shopAdd(buyBtn);
    }

    // ── Separator ────────────────────────────────────────────────────────
    this.shopAdd(this.add.graphics().lineStyle(1, 0x5a3a1a).lineBetween(0, 360, width, 360).setDepth(11));

    // ── Remove ───────────────────────────────────────────────────────────
    const canRemove = this.state.removalsLeft > 0;
    const removeColor = canRemove ? '#ccaaff' : '#666666';
    this.shopAdd(this.txt(20, 368, `Remove (${this.state.removalsLeft} left):`, { ...S_SM, color: removeColor }).setDepth(11));

    const reserveMap = new Map<string, number>();
    for (const id of this.state.reserve) reserveMap.set(id, (reserveMap.get(id) ?? 0) + 1);

    const ECOL = 304;
    const EGAP = 12;
    let col = 0, ey = 385;
    for (const [id, count] of reserveMap) {
      const sym = SYMBOL_MAP.get(id);
      if (!sym) continue;
      const ex  = 20 + col * (ECOL + EGAP);
      const ecy = ey + 18;
      const atFloor = this.state.reserve.length <= MIN_RESERVE;
      const canRm   = canRemove && !atFloor;

      const rowRect = this.add.rectangle(ex + ECOL / 2, ecy, ECOL, 36, 0x1e1e2e)
        .setStrokeStyle(1, 0x3a3a5a).setDepth(11);
      const capSym2 = sym;
      rowRect.setInteractive();
      rowRect.on('pointerover', () => this.showTooltip(ex + ECOL + 10, ecy, capSym2.name, capSym2.description));
      rowRect.on('pointerout',  () => this.hideTooltip());
      this.shopAdd(rowRect);

      this.shopAdd(this.txt(ex + 8, ecy, `${sym.name} ×${count}`, { ...S_SM, color: '#dddddd' }, 0, 0.5).setDepth(12));

      const rmFill = canRm ? 0x6a1e1e : 0x222222;
      const rmBtn = this.add.rectangle(ex + ECOL - 22, ecy, 32, 26, rmFill).setStrokeStyle(1, canRm ? 0xcc4444 : 0x333333).setDepth(12);
      if (canRm) {
        rmBtn.setInteractive({ useHandCursor: true });
        const capturedId = id;
        rmBtn.on('pointerup', () => this.onRemove(capturedId));
      }
      this.shopAdd(rmBtn);
      this.shopAdd(this.txt(ex + ECOL - 22, ecy, '−', { fontSize: '16px', color: canRm ? '#ff8888' : '#444444', fontFamily: 'Silkscreen' }, 0.5, 0.5).setDepth(13));

      col++;
      if (col >= 3) { col = 0; ey += 44; }
    }

    // ── Continue button ───────────────────────────────────────────────────
    const exitBtn = this.add.image(width / 2, height - 28, 'btn-continue')
      .setDisplaySize(220, 80).setOrigin(0.5, 0.5).setDepth(11).setInteractive({ useHandCursor: true });
    exitBtn.on('pointerdown', () => exitBtn.setAlpha(0.7));
    exitBtn.on('pointerup',   () => { exitBtn.setAlpha(1); this.onExitShop(); });
    exitBtn.on('pointerover', () => exitBtn.setAlpha(0.85));
    exitBtn.on('pointerout',  () => exitBtn.setAlpha(1));
    this.shopAdd(exitBtn);
  }

  private shopAdd(obj: Phaser.GameObjects.GameObject): void {
    this.shopObjs.push(obj);
  }

  private closeShop(): void {
    this.hideTooltip();
    for (const obj of this.shopObjs) obj.destroy();
    this.shopObjs = [];
    for (const row of this.cellRects) for (const rect of row) rect.setInteractive();
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

  // ── End screens ──────────────────────────────────────────────────────────

  private showGameOver(): void {
    this.cameras.main.shake(400, 0.008);
    const { width, height } = this.scale;
    const cx = Math.round(width / 2), cy = Math.round(height / 2);
    this.add.rectangle(cx, cy, width, height, 0x000000).setDepth(50);
    this.txt(cx, cy - 76, 'GAME OVER', { fontSize: '44px', color: '#ff4444', fontFamily: 'Silkscreen' }, 0.5, 0.5).setDepth(51);
    this.txt(cx, cy - 20, `Round reached: ${this.state.round}`, { fontSize: '20px', color: '#cccccc', fontFamily: 'Silkscreen' }, 0.5, 0.5).setDepth(51);
    const btn = this.add.rectangle(cx, cy + 44, 220, 36, 0x3d7a2b).setStrokeStyle(1, 0x8bc34a).setDepth(51).setInteractive({ useHandCursor: true });
    btn.on('pointerup',   () => this.scene.start('TitleScene'));
    btn.on('pointerover', () => btn.setFillStyle(0x5a9a40));
    btn.on('pointerout',  () => btn.setFillStyle(0x3d7a2b));
    this.txt(cx, cy + 44, '[ PLAY AGAIN ]', { fontSize: '18px', color: '#ccff99', fontFamily: 'Silkscreen' }, 0.5, 0.5).setDepth(52);
  }

  private showVictory(): void {
    const { width, height } = this.scale;
    const cx = Math.round(width / 2), cy = Math.round(height / 2);
    // White flash before overlay
    const flash = this.add.rectangle(cx, cy, width, height, 0xffffff, 0).setDepth(49);
    this.tweens.add({
      targets: flash, alpha: 0.4, duration: 250, ease: 'Power2',
      yoyo: true, onComplete: () => flash.destroy(),
    });
    this.add.rectangle(cx, cy, width, height, 0x000000).setDepth(50);
    this.txt(cx, cy - 80, 'VICTORY!', { fontSize: '44px', color: '#ffee44', fontFamily: 'Silkscreen' }, 0.5, 0.5).setDepth(51);
    this.txt(cx, cy - 28, `${this.state.round - 1} rounds completed!`, { fontSize: '20px', color: '#cccccc', fontFamily: 'Silkscreen' }, 0.5, 0.5).setDepth(51);
    const btn = this.add.rectangle(cx, cy + 40, 220, 36, 0x2a5a8a).setStrokeStyle(1, 0x4a8abc).setDepth(51).setInteractive({ useHandCursor: true });
    btn.on('pointerup',   () => this.scene.start('TitleScene'));
    btn.on('pointerover', () => btn.setFillStyle(0x3a6aaa));
    btn.on('pointerout',  () => btn.setFillStyle(0x2a5a8a));
    this.txt(cx, cy + 40, '[ PLAY AGAIN ]', { fontSize: '18px', color: '#aaddff', fontFamily: 'Silkscreen' }, 0.5, 0.5).setDepth(52);
  }
}
