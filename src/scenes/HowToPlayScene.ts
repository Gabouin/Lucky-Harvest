import Phaser from 'phaser';
import { removeWhiteBackground } from '../ui/removeWhiteBackground';

const CV = 'CozyValley_Premium_1.3/CozyValley_Premium_1.3';
const CT = 'CozyTowns_v1';
const S: Phaser.Types.GameObjects.Text.TextStyle = { fontFamily: 'Silkscreen', color: '#cccccc' };

function drawBackground(scene: Phaser.Scene): void {
  const { width: W, height: H } = scene.scale;
  scene.add.rectangle(W / 2, H / 2, W, H, 0x2d5a1b).setDepth(-2);
  scene.add.rectangle(W / 2, H - H / 6, W, H / 3, 0x1a3a0e).setDepth(-2);
  scene.add.image(0, H - 50, 'barn').setScale(3).setOrigin(0, 1).setDepth(-1);
  scene.add.image(W - 10, H - 50, 'house').setCrop(0, 0, 96, 96).setScale(2.5).setOrigin(1, 1).setDepth(-1);
  for (const [tx, ty, key] of [
    [151, 331, 'tree_oak'], [238, 308, 'tree_oak'], [295, 366, 'tree_oak'],
    [791, 421, 'tree_cherry'], [870, 439, 'tree_cherry'], [960, 390, 'tree_cherry'],
  ] as [number, number, string][]) {
    scene.add.image(tx, ty, key).setCrop(0, 0, 32, 48).setScale(4).setOrigin(0.5, 1).setDepth(-1);
  }
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

    for (const k of ['btn-spin','btn-play','btn-buy','btn-htp','grid-full','grid-shop','btn-continue'])
      removeWhiteBackground(this, k);
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
    const playBtn = this.add.image(Math.round(cx), height - 42, 'btn-play')
      .setDisplaySize(200, 75)
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true });
    playBtn.on('pointerdown', () => playBtn.setAlpha(0.7));
    playBtn.on('pointerup',   () => { playBtn.setAlpha(1); this.scene.start('GameScene'); });
    playBtn.on('pointerover', () => playBtn.setAlpha(0.85));
    playBtn.on('pointerout',  () => playBtn.setAlpha(1));
  }
}
