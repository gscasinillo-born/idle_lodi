import Phaser from "phaser";

export function ensureCircleTexture(scene: Phaser.Scene, key: string, color: number, radius: number): string {
  if (scene.textures.exists(key)) return key;
  const size = radius * 2;
  const gfx = scene.make.graphics({ x: 0, y: 0 }, false);
  gfx.fillStyle(color, 1);
  gfx.fillCircle(radius, radius, radius);
  gfx.lineStyle(3, 0x000000, 0.35);
  gfx.strokeCircle(radius, radius, radius - 1);
  gfx.generateTexture(key, size, size);
  gfx.destroy();
  return key;
}
