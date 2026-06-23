import Phaser from 'phaser';
import { removeWhiteBackground } from '../ui/removeWhiteBackground';

const CV = 'CozyValley_Premium_1.3/CozyValley_Premium_1.3';
const CT = 'CozyTowns_v1';
const S: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'Silkscreen', color: '#ffffff' };

function txt(
  scene: Phaser.Scene,
  x: number, y: number,
  content: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
  ox = 0.5, oy = 0.5,
): Phaser.GameObjects.Text {
  return scene.add.text(Math.round(x), Math.round(y), content, style)
    .setOrigin(ox, oy)
    .setResolution(window.devicePixelRatio);
}

type BgRefs = {
  barn: Phaser.GameObjects.Image;
  oak1: Phaser.GameObjects.Image;
  oak2: Phaser.GameObjects.Image;
  oak3: Phaser.GameObjects.Image;
  ch1:  Phaser.GameObjects.Image;
  ch2:  Phaser.GameObjects.Image;
  ch3:  Phaser.GameObjects.Image;
};

function drawBackground(scene: Phaser.Scene): BgRefs {
  const { width: W, height: H } = scene.scale;
  scene.add.rectangle(W / 2, H / 2, W, H, 0x2d5a1b).setDepth(-2);
  scene.add.rectangle(W / 2, H - H / 6, W, H / 3, 0x1a3a0e).setDepth(-2);
  const barn = scene.add.image(0, H - 50, 'barn').setScale(3).setOrigin(0, 1).setDepth(-1);
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
  return { barn, oak1, oak2, oak3, ch1, ch2, ch3 };
}

function buildDebugOverlay(scene: Phaser.Scene, refs: BgRefs): void {
  document.getElementById('bg-debug')?.remove();
  const W = scene.scale.width;
  const H = scene.scale.height;

  const panel = document.createElement('div');
  panel.id = 'bg-debug';
  panel.style.cssText = [
    'position:fixed', 'top:0', 'right:0', 'z-index:9999',
    'background:rgba(0,0,0,0.88)', 'color:#fff', 'padding:10px',
    'font:11px monospace', 'width:260px', 'max-height:100vh',
    'overflow-y:auto', 'box-sizing:border-box',
  ].join(';');

  const title = document.createElement('div');
  title.style.cssText = 'font:bold 13px monospace;margin-bottom:6px;color:#aaffaa';
  title.textContent = '🌿 BG DEBUG';
  panel.append(title);

  const entries: { key: keyof BgRefs; label: string }[] = [
    { key: 'barn', label: 'Barn'     },
    { key: 'oak1', label: 'Oak 1'    },
    { key: 'oak2', label: 'Oak 2'    },
    { key: 'oak3', label: 'Oak 3'    },
    { key: 'ch1',  label: 'Cherry 1' },
    { key: 'ch2',  label: 'Cherry 2' },
    { key: 'ch3',  label: 'Cherry 3' },
  ];

  function addSlider(
    container: HTMLElement,
    axis: string,
    maxVal: number,
    initVal: number,
    onUpdate: (v: number) => void,
  ): void {
    const lbl = document.createElement('div');
    lbl.style.cssText = 'color:#ccc;margin-top:2px';
    lbl.textContent = `${axis}: ${Math.round(initVal)}`;
    const sl = document.createElement('input');
    sl.type = 'range';
    sl.min = '0';
    sl.max = String(maxVal);
    sl.value = String(Math.round(initVal));
    sl.style.width = '100%';
    sl.oninput = () => {
      onUpdate(Number(sl.value));
      lbl.textContent = `${axis}: ${sl.value}`;
    };
    container.append(lbl, sl);
  }

  for (const { key, label } of entries) {
    const img = refs[key];
    const sec = document.createElement('div');
    sec.style.cssText = 'border-top:1px solid #444;padding:4px 0';
    const h = document.createElement('b');
    h.textContent = label;
    sec.append(h);
    addSlider(sec, 'X', W, img.x, v => { img.x = v; });
    addSlider(sec, 'Y', H, img.y, v => { img.y = v; });
    panel.append(sec);
  }

  const btn = document.createElement('button');
  btn.textContent = 'Copy coords';
  btn.style.cssText = [
    'margin-top:10px', 'width:100%', 'padding:7px', 'cursor:pointer',
    'background:#3a8a3a', 'border:none', 'color:#fff',
    'font:bold 12px monospace', 'border-radius:4px',
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

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  preload(): void {
    this.load.image('tree_oak',    `${CV}/Tilesets/Trees/Trees_oak.png`);
    this.load.image('tree_cherry', `${CV}/Tilesets/Trees/Trees_cherryblossom.png`);
    this.load.image('barn',        `${CV}/Tilesets/Barn.png`);
    this.load.image('fence_seg',   `${CV}/Tilesets/Woodenfence.png`);
    this.load.image('flowers',     `${CV}/Tilesets/Flowers.png`);
    this.load.image('house',       `${CT}/Housing/Exterior/Houses.png`);
    this.load.image('btn-spin',  'ui/spin.png');
    this.load.image('btn-play',  'ui/play.png');
    this.load.image('btn-buy',   'ui/buy.png');
    this.load.image('btn-htp',   'ui/howtoplay.png');
    this.load.image('grid-full',     'ui/fullgrid.png');
    this.load.image('grid-shop',     'ui/shopgrid.png');
    this.load.image('btn-continue',  'ui/continue.png');
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    for (const k of ['btn-spin','btn-play','btn-buy','btn-htp','grid-full','grid-shop','btn-continue'])
      removeWhiteBackground(this, k);
    const bgRefs = drawBackground(this);
    if (window.location.hash === '#debug') buildDebugOverlay(this, bgRefs);

    txt(this, cx, cy - 150, 'LUCKY HARVEST', { ...S, fontSize: '52px', color: '#ffee44' });
    txt(this, cx, cy - 90,  'A Cozy Farm Spinner', { ...S, fontSize: '22px', color: '#88cc88' });
    txt(this, cx, cy - 40,  'Spin the grid · build synergies · pay the rent',
      { ...S, fontSize: '16px', color: '#8888aa' });

    const playBtn = this.add.image(cx, cy + 40, 'btn-play')
      .setDisplaySize(200, 75)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });
    playBtn.on('pointerdown', () => playBtn.setAlpha(0.7));
    playBtn.on('pointerup',   () => { playBtn.setAlpha(1); this.scene.start('GameScene'); });
    playBtn.on('pointerover', () => playBtn.setAlpha(0.85));
    playBtn.on('pointerout',  () => playBtn.setAlpha(1));

    const helpBtn = this.add.image(cx, cy + 118, 'btn-htp')
      .setDisplaySize(280, 70)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });
    helpBtn.on('pointerdown', () => helpBtn.setAlpha(0.7));
    helpBtn.on('pointerup',   () => { helpBtn.setAlpha(1); this.scene.start('HowToPlayScene'); });
    helpBtn.on('pointerover', () => helpBtn.setAlpha(0.85));
    helpBtn.on('pointerout',  () => helpBtn.setAlpha(1));
  }
}
