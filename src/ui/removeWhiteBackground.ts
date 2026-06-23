import Phaser from 'phaser';

/**
 * BFS flood-fill depuis les 4 bords de la texture pour supprimer le fond blanc
 * sans toucher aux blancs intérieurs du dessin.
 */
export function removeWhiteBackground(scene: Phaser.Scene, key: string): void {
  const src = scene.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const W   = (src as HTMLImageElement).naturalWidth  || (src as HTMLCanvasElement).width;
  const H   = (src as HTMLImageElement).naturalHeight || (src as HTMLCanvasElement).height;

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(src, 0, 0);

  const imageData = ctx.getImageData(0, 0, W, H);
  const d         = imageData.data;
  const visited   = new Uint8Array(W * H);
  const queue: number[] = [];

  const isWhite = (p: number): boolean =>
    d[p * 4] > 220 && d[p * 4 + 1] > 220 && d[p * 4 + 2] > 220;

  const seed = (p: number): void => {
    if (!visited[p] && isWhite(p)) { visited[p] = 1; queue.push(p); }
  };

  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 1; y < H - 1; y++) { seed(y * W); seed(y * W + W - 1); }

  while (queue.length) {
    const p = queue.pop()!;
    d[p * 4 + 3] = 0;
    const x = p % W;
    const y = (p / W) | 0;
    if (y > 0)     seed(p - W);
    if (y < H - 1) seed(p + W);
    if (x > 0)     seed(p - 1);
    if (x < W - 1) seed(p + 1);
  }

  ctx.putImageData(imageData, 0, 0);
  scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}
