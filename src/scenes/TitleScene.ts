import Phaser from 'phaser';

const CV = 'CozyValley_Premium_1.3/CozyValley_Premium_1.3';
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

function drawBackground(scene: Phaser.Scene): void {
  const { width: W, height: H } = scene.scale;
  scene.add.rectangle(W / 2, H / 2, W, H, 0x34580a).setDepth(-1);
  scene.add.rectangle(W / 2, H - 27, W, 55, 0x264506).setDepth(-1);
  scene.add.image(-30, H - 286, 'barn').setCrop(0, 0, 64, 64).setScale(4).setOrigin(0, 0).setDepth(-1);
  scene.add.image(30,      H - 220, 'tree_oak').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  scene.add.image(130,     H - 220, 'tree_oak').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  scene.add.image(215,     H - 220, 'tree_oak').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  scene.add.image(W - 340, H - 220, 'tree_cherry').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  scene.add.image(W - 230, H - 220, 'tree_cherry').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  scene.add.image(W - 120, H - 220, 'tree_cherry').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  const flDefs: [number, number][] = [
    [70,     0], [160,   16], [255,   32], [340,   48],
    [W-340, 32], [W-230, 16], [W-130,  0], [W-50,  48],
  ];
  for (const [fx, cy] of flDefs)
    scene.add.image(fx, H - 108, 'flowers').setCrop(0, cy, 16, 16).setScale(5).setDepth(-1);
  for (let x = 0; x <= W; x += 48)
    scene.add.image(x, H - 50, 'fence_seg').setCrop(16, 0, 16, 16).setScale(3).setOrigin(0, 0.5).setDepth(-1);
}

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'TitleScene' }); }

  preload(): void {
    this.load.image(     'tree_oak',    `${CV}/Tilesets/Trees/Trees_oak.png`);
    this.load.image(     'tree_cherry', `${CV}/Tilesets/Trees/Trees_cherryblossom.png`);
    this.load.image(     'barn',        `${CV}/Tilesets/Barn.png`);
    this.load.image('fence_seg', `${CV}/Tilesets/Woodenfence.png`);
    this.load.image('flowers',   `${CV}/Tilesets/Flowers.png`);
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    drawBackground(this);

    txt(this, cx, cy - 150, 'LUCKY HARVEST', { ...S, fontSize: '52px', color: '#ffee44' });
    txt(this, cx, cy - 90,  'A Cozy Farm Spinner', { ...S, fontSize: '22px', color: '#88cc88' });
    txt(this, cx, cy - 40,  'Spin the grid · build synergies · pay the rent',
      { ...S, fontSize: '16px', color: '#8888aa' });

    const playBg = this.add.rectangle(cx, cy + 40, 220, 48, 0x3d7a2b)
      .setStrokeStyle(2, 0x8bc34a)
      .setInteractive({ useHandCursor: true });
    playBg.on('pointerup',   () => this.scene.start('GameScene'));
    playBg.on('pointerover', () => playBg.setFillStyle(0x5a9a40));
    playBg.on('pointerout',  () => playBg.setFillStyle(0x3d7a2b));
    txt(this, cx, cy + 40, 'PLAY', { ...S, fontSize: '26px', color: '#ccff99' });

    const helpBg = this.add.rectangle(cx, cy + 118, 260, 44, 0x1e3a5a)
      .setStrokeStyle(2, 0x4a7aaa)
      .setInteractive({ useHandCursor: true });
    helpBg.on('pointerup',   () => this.scene.start('HowToPlayScene'));
    helpBg.on('pointerover', () => helpBg.setFillStyle(0x2a4a6a));
    helpBg.on('pointerout',  () => helpBg.setFillStyle(0x1e3a5a));
    txt(this, cx, cy + 118, 'HOW TO PLAY', { ...S, fontSize: '20px', color: '#aaddff' });
  }
}
