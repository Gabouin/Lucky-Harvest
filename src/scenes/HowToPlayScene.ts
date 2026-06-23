import Phaser from 'phaser';

const CV = 'CozyValley_Premium_1.3/CozyValley_Premium_1.3';
const CT = 'CozyTowns_v1';
const S: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'Silkscreen', color: '#cccccc' };

function drawBackground(scene: Phaser.Scene): void {
  const { width: W, height: H } = scene.scale;
  scene.add.rectangle(W / 2, H / 2, W, H, 0x2d5a1b).setDepth(-2);
  scene.add.rectangle(W / 2, H - H / 6, W, H / 3, 0x1a3a0e).setDepth(-2);
  scene.add.image(0, H - 50, 'barn').setScale(3).setOrigin(0, 1).setDepth(-1);
  scene.add.image(W - 10, H - 50, 'house').setCrop(0, 0, 96, 96).setScale(2.5).setOrigin(1, 1).setDepth(-1);
  scene.add.image(151, 403, 'tree_oak').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  scene.add.image(238, 390, 'tree_oak').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  scene.add.image(295, 421, 'tree_oak').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  scene.add.image(791, 421, 'tree_cherry').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  scene.add.image(870, 439, 'tree_cherry').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  scene.add.image(960, 390, 'tree_cherry').setCrop(0, 0, 32, 32).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  const flDefs: [number, number][] = [
    [70,     0], [160,   16], [255,   32], [340,   48],
    [W-340, 32], [W-230, 16], [W-130,  0], [W-50,  48],
  ];
  for (const [fx, cy] of flDefs)
    scene.add.image(fx, H - 108, 'flowers').setCrop(0, cy, 16, 16).setScale(5).setDepth(-1);
  for (let x = 0; x <= W; x += 48)
    scene.add.image(x, H - 50, 'fence_seg').setCrop(16, 0, 16, 16).setScale(3).setOrigin(0, 0.5).setDepth(-1);
}

const CONTENT: { text: string; style: 'title' | 'bullet' | 'body' | 'gap' }[] = [
  { text: 'HOW TO PLAY',                                              style: 'title'  },
  { text: '',                                                          style: 'gap'    },
  { text: 'Goal: pay the Rent each round.',                            style: 'body'   },
  { text: 'It keeps rising. Reach round 12 to win.',                   style: 'body'   },
  { text: '',                                                          style: 'gap'    },
  { text: 'Press SPIN to fill the grid from your reserve.',            style: 'body'   },
  { text: 'Each symbol earns coins.',                                  style: 'body'   },
  { text: '',                                                          style: 'gap'    },
  { text: 'Neighbors matter:',                                         style: 'body'   },
  { text: '  • Cow next to a crop earns a bonus',                      style: 'bullet' },
  { text: '  • Pickaxe doubles an adjacent ore',                       style: 'bullet' },
  { text: '  • Hen lays Eggs; Rat eats adjacent prey',                 style: 'bullet' },
  { text: '',                                                          style: 'gap'    },
  { text: 'After paying the Rent, visit the Shop:',                    style: 'body'   },
  { text: 'buy a new symbol or remove a weak one.',                    style: 'body'   },
  { text: '',                                                          style: 'gap'    },
  { text: 'Build a theme (livestock / mining / crops)',                style: 'body'   },
  { text: "and don't dilute your reserve.",                            style: 'body'   },
  { text: '',                                                          style: 'gap'    },
  { text: 'Hover over any symbol to read what it does.',               style: 'body'   },
];

export class HowToPlayScene extends Phaser.Scene {
  constructor() { super({ key: 'HowToPlayScene' }); }

  preload(): void {
    this.load.image(     'tree_oak',    `${CV}/Tilesets/Trees/Trees_oak.png`);
    this.load.image(     'tree_cherry', `${CV}/Tilesets/Trees/Trees_cherryblossom.png`);
    this.load.image(     'barn',        `${CV}/Tilesets/Barn.png`);
    this.load.image('fence_seg', `${CV}/Tilesets/Woodenfence.png`);
    this.load.image('flowers',   `${CV}/Tilesets/Flowers.png`);
    this.load.image('house',     `${CT}/Housing/Exterior/Houses.png`);
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    drawBackground(this);
    this.add.rectangle(cx, height / 2, width, height, 0x000000, 0.85);

    let y = 36;
    for (const line of CONTENT) {
      if (line.style === 'gap') { y += 10; continue; }

      const isTitle  = line.style === 'title';
      const isBullet = line.style === 'bullet';
      const color  = isTitle ? '#ffee44' : (isBullet ? '#88ddaa' : '#cccccc');
      const size   = isTitle ? '24px' : '17px';
      const lh     = isTitle ? 38 : 26;

      this.add.text(Math.round(cx), Math.round(y), line.text, { ...S, fontSize: size, color })
        .setOrigin(0.5, 0)
        .setResolution(window.devicePixelRatio);
      y += lh;
    }

    // PLAY button
    const playBg = this.add.rectangle(cx, height - 42, 220, 44, 0x3d7a2b)
      .setStrokeStyle(2, 0x8bc34a)
      .setInteractive({ useHandCursor: true });
    playBg.on('pointerup',   () => this.scene.start('GameScene'));
    playBg.on('pointerover', () => playBg.setFillStyle(0x5a9a40));
    playBg.on('pointerout',  () => playBg.setFillStyle(0x3d7a2b));
    this.add.text(Math.round(cx), height - 42, 'PLAY', {
      fontFamily: 'Silkscreen', fontSize: '24px', color: '#ccff99',
    }).setOrigin(0.5).setResolution(window.devicePixelRatio);
  }
}
