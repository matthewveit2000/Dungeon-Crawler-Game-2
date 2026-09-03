import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';

const dcssRoot = 'assets/raw/extracted/crawl-tiles Oct-5-2010';

async function deployDcssArt() {
  console.log('Deploying DCSS CC0 art assets...');

  // 1. Copy tiles
  const floorSrc = path.join(dcssRoot, 'dc-dngn/floor/rect_gray0.png');
  const wallSrc = path.join(dcssRoot, 'dc-dngn/wall/brick_dark0.png');
  const stairsSrc = path.join(dcssRoot, 'dc-dngn/gateways/stone_stairs_down.png');

  fs.copyFileSync(floorSrc, 'public/assets/tiles/floor.png');
  fs.copyFileSync(wallSrc, 'public/assets/tiles/wall.png');
  fs.copyFileSync(stairsSrc, 'public/assets/entities/staircase.png');
  console.log('Copied floor, wall, and staircase tiles.');

  // 2. Load player component layers
  const cloak = await loadImage(path.join(dcssRoot, 'player/cloak/green.png'));
  const base = await loadImage(path.join(dcssRoot, 'player/base/human_m.png'));
  const boots = await loadImage(path.join(dcssRoot, 'player/boots/middle_brown.png'));
  const body = await loadImage(path.join(dcssRoot, 'player/body/bplate_metal1.png'));
  const head = await loadImage(path.join(dcssRoot, 'player/head/fhelm_gray3.png'));
  const sword = await loadImage(path.join(dcssRoot, 'player/hand1/long_sword.png'));

  function renderComposite({
    headOffset = 0,
    bodyOffset = 0,
    leftFootOffset = 0,
    rightFootOffset = 0,
    swordOffset = 0,
  } = {}) {
    const canvas = createCanvas(32, 32);
    const ctx = canvas.getContext('2d');

    // 1. Cloak
    ctx.drawImage(cloak, 0, bodyOffset);
    // 2. Base body & legs
    ctx.drawImage(base, 0, bodyOffset);
    // 3. Boots with walking stride
    ctx.save();
    // Clip left half for left boot
    ctx.beginPath();
    ctx.rect(0, 0, 16, 32);
    ctx.clip();
    ctx.drawImage(boots, 0, leftFootOffset);
    ctx.restore();
    // Clip right half for right boot
    ctx.save();
    ctx.beginPath();
    ctx.rect(16, 0, 16, 32);
    ctx.clip();
    ctx.drawImage(boots, 0, rightFootOffset);
    ctx.restore();

    // 4. Chestplate / Body
    ctx.drawImage(body, 0, bodyOffset);
    // 5. Helmet
    ctx.drawImage(head, 0, headOffset);
    // 6. Longsword
    ctx.drawImage(sword, 0, swordOffset);

    return canvas.toBuffer('image/png');
  }

  // Base player sprite
  const basePlayer = renderComposite();
  fs.writeFileSync('public/assets/entities/player.png', basePlayer);

  // Idle animation (gentle 2-frame breath)
  fs.writeFileSync(
    'public/assets/entities/player_idle_0.png',
    renderComposite({ headOffset: 0, bodyOffset: 0 }),
  );
  fs.writeFileSync(
    'public/assets/entities/player_idle_1.png',
    renderComposite({ headOffset: -1, bodyOffset: -1, swordOffset: -1 }),
  );

  // Walk animation (4-frame walk cycle)
  fs.writeFileSync(
    'public/assets/entities/player_walk_0.png',
    renderComposite({ leftFootOffset: -1, rightFootOffset: 1, swordOffset: 1 }),
  );
  fs.writeFileSync(
    'public/assets/entities/player_walk_1.png',
    renderComposite({ leftFootOffset: 0, rightFootOffset: 0, swordOffset: 0 }),
  );
  fs.writeFileSync(
    'public/assets/entities/player_walk_2.png',
    renderComposite({ leftFootOffset: 1, rightFootOffset: -1, swordOffset: -1 }),
  );
  fs.writeFileSync(
    'public/assets/entities/player_walk_3.png',
    renderComposite({ leftFootOffset: 0, rightFootOffset: 0, swordOffset: 0 }),
  );

  console.log('Generated DCSS player and animation frames.');

  // Save license and readme in assets/raw
  fs.copyFileSync(path.join(dcssRoot, 'LICENSE.txt'), 'assets/raw/DCSS_LICENSE.txt');
  fs.copyFileSync(path.join(dcssRoot, 'README.txt'), 'assets/raw/DCSS_README.txt');

  console.log('Preserved DCSS license and README in assets/raw/.');
}

deployDcssArt().catch(console.error);
