import Phaser from 'phaser';
import { TitleScene }     from './scenes/TitleScene';
import { HowToPlayScene } from './scenes/HowToPlayScene';
import { GameScene }      from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#34580a',
  parent: 'game',
  pixelArt: true,
  render: {
    antialias: false,
    antialiasGL: false,
    pixelArt: true,
    roundPixels: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540,
  },
  scene: [TitleScene, HowToPlayScene, GameScene],
};

new Phaser.Game(config);
