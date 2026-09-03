import { createCanvas } from 'canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('public/assets/tiles', { recursive: true });
mkdirSync('public/assets/entities', { recursive: true });

function createFloorTile() {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');

  // Base stone colour
  ctx.fillStyle = '#4a4d57';
  ctx.fillRect(0, 0, 32, 32);

  // Mortar lines separating flagstones (2x2 flagstone grid)
  ctx.fillStyle = '#2d2f36';
  ctx.fillRect(0, 15, 32, 2);
  ctx.fillRect(15, 0, 2, 32);

  // Border mortar seams for seamless tiling
  ctx.fillRect(0, 0, 32, 1);
  ctx.fillRect(0, 31, 32, 1);
  ctx.fillRect(0, 0, 1, 32);
  ctx.fillRect(31, 0, 1, 32);

  // Top-left bevel highlights on flagstones
  ctx.fillStyle = '#5d616e';
  // Top-left stone
  ctx.fillRect(1, 1, 14, 1);
  ctx.fillRect(1, 2, 1, 13);
  // Top-right stone
  ctx.fillRect(17, 1, 14, 1);
  ctx.fillRect(17, 2, 1, 13);
  // Bottom-left stone
  ctx.fillRect(1, 17, 14, 1);
  ctx.fillRect(1, 18, 1, 13);
  // Bottom-right stone
  ctx.fillRect(17, 17, 14, 1);
  ctx.fillRect(17, 18, 1, 13);

  // Bottom-right shadows on flagstones
  ctx.fillStyle = '#3a3c44';
  // Top-left stone
  ctx.fillRect(1, 14, 14, 1);
  ctx.fillRect(14, 1, 1, 14);
  // Top-right stone
  ctx.fillRect(17, 14, 14, 1);
  ctx.fillRect(30, 1, 1, 14);
  // Bottom-left stone
  ctx.fillRect(1, 30, 14, 1);
  ctx.fillRect(14, 17, 1, 14);
  // Bottom-right stone
  ctx.fillRect(17, 30, 14, 1);
  ctx.fillRect(30, 17, 1, 14);

  // Flecks/texture details
  ctx.fillStyle = '#555964';
  ctx.fillRect(5, 6, 2, 1);
  ctx.fillRect(23, 8, 1, 2);
  ctx.fillRect(8, 22, 2, 2);
  ctx.fillRect(24, 25, 2, 1);

  return canvas.toBuffer('image/png');
}

function createWallTile() {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');

  // Dark stone background
  ctx.fillStyle = '#1c1e24';
  ctx.fillRect(0, 0, 32, 32);

  // Mortar lines (running bond brick pattern)
  ctx.fillStyle = '#101114';
  // Horizontal mortar
  ctx.fillRect(0, 0, 32, 1);
  ctx.fillRect(0, 10, 32, 1);
  ctx.fillRect(0, 21, 32, 1);
  ctx.fillRect(0, 31, 32, 1);
  // Vertical mortar
  ctx.fillRect(16, 1, 1, 9);
  ctx.fillRect(8, 11, 1, 10);
  ctx.fillRect(24, 11, 1, 10);
  ctx.fillRect(16, 22, 1, 9);

  // Brick highlight edges
  ctx.fillStyle = '#2c2f38';
  // Row 1
  ctx.fillRect(1, 1, 15, 1);
  ctx.fillRect(17, 1, 14, 1);
  // Row 2
  ctx.fillRect(1, 11, 7, 1);
  ctx.fillRect(9, 11, 15, 1);
  ctx.fillRect(25, 11, 6, 1);
  // Row 3
  ctx.fillRect(1, 22, 15, 1);
  ctx.fillRect(17, 22, 14, 1);

  // Brick shadow edges
  ctx.fillStyle = '#15161b';
  // Row 1
  ctx.fillRect(1, 9, 15, 1);
  ctx.fillRect(17, 9, 14, 1);
  // Row 2
  ctx.fillRect(1, 20, 7, 1);
  ctx.fillRect(9, 20, 15, 1);
  ctx.fillRect(25, 20, 6, 1);
  // Row 3
  ctx.fillRect(1, 30, 15, 1);
  ctx.fillRect(17, 30, 14, 1);

  return canvas.toBuffer('image/png');
}

function createStaircaseTile() {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');

  // Outer stone rim
  ctx.fillStyle = '#3a3d47';
  ctx.fillRect(0, 0, 32, 32);

  // Blue accent glow around entry (staircase interactable colour)
  ctx.fillStyle = '#4d7fd6';
  ctx.fillRect(2, 2, 28, 1);
  ctx.fillRect(2, 3, 1, 26);
  ctx.fillRect(29, 3, 1, 26);
  ctx.fillRect(2, 29, 28, 1);

  // Step 1 (top step)
  ctx.fillStyle = '#64748b';
  ctx.fillRect(4, 4, 24, 5);
  ctx.fillStyle = '#475569';
  ctx.fillRect(4, 9, 24, 2);

  // Step 2
  ctx.fillStyle = '#475569';
  ctx.fillRect(6, 11, 20, 4);
  ctx.fillStyle = '#334155';
  ctx.fillRect(6, 15, 20, 2);

  // Step 3
  ctx.fillStyle = '#334155';
  ctx.fillRect(8, 17, 16, 4);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(8, 21, 16, 2);

  // Step 4
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(10, 23, 12, 3);

  // Abyss at the bottom
  ctx.fillStyle = '#05070a';
  ctx.fillRect(12, 26, 8, 2);

  return canvas.toBuffer('image/png');
}

function createPlayerFrame({
  headOffset = 0,
  leftFootY = 23,
  rightFootY = 23,
  swordOffset = 0,
} = {}) {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');

  // Clear transparent background
  ctx.clearRect(0, 0, 32, 32);

  // Drop shadow beneath feet
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(10, 26, 12, 4);

  // Cape (behind character)
  ctx.fillStyle = '#14532d';
  ctx.fillRect(9, 13 + headOffset, 14, 11);
  ctx.fillStyle = '#166534';
  ctx.fillRect(10, 14 + headOffset, 12, 9);

  // Body / Tunic (forest green)
  ctx.fillStyle = '#15803d';
  ctx.fillRect(11, 12 + headOffset, 10, 10);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(12, 13 + headOffset, 8, 8);

  // Leather belt & gold buckle
  ctx.fillStyle = '#78350f';
  ctx.fillRect(11, 19 + headOffset, 10, 2);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(15, 19 + headOffset, 2, 2);

  // Feet / boots
  ctx.fillStyle = '#451a03';
  ctx.fillRect(11, leftFootY, 3, 4);
  ctx.fillRect(18, rightFootY, 3, 4);

  // Hands / bracers
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(8, 16 + headOffset, 3, 3);
  ctx.fillRect(21, 16 + headOffset + swordOffset, 3, 3);

  // Steel sword held in right hand
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(22, 9 + headOffset + swordOffset, 2, 8);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(22, 6 + headOffset + swordOffset, 2, 3);
  // Sword guard and pommel
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(20, 14 + headOffset + swordOffset, 5, 1);
  ctx.fillRect(22, 17 + headOffset + swordOffset, 2, 1);

  // Head / Helmet (steel)
  ctx.fillStyle = '#64748b';
  ctx.fillRect(11, 5 + headOffset, 10, 8);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(12, 6 + headOffset, 8, 6);
  // Visor slot
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(13, 9 + headOffset, 6, 2);
  // Gold crest on helmet
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(15, 3 + headOffset, 2, 4);

  return canvas.toBuffer('image/png');
}

writeFileSync('public/assets/tiles/floor.png', createFloorTile());
writeFileSync('public/assets/tiles/wall.png', createWallTile());
writeFileSync('public/assets/entities/staircase.png', createStaircaseTile());

// Base player sprite
const basePlayer = createPlayerFrame();
writeFileSync('public/assets/entities/player.png', basePlayer);

// Idle animation frames (2 frames: standing and subtle breathing)
writeFileSync('public/assets/entities/player_idle_0.png', createPlayerFrame({ headOffset: 0 }));
writeFileSync(
  'public/assets/entities/player_idle_1.png',
  createPlayerFrame({ headOffset: -1, swordOffset: -1 }),
);

// Walk animation frames (4 frames: left stride, pass, right stride, pass)
writeFileSync(
  'public/assets/entities/player_walk_0.png',
  createPlayerFrame({ leftFootY: 22, rightFootY: 24, swordOffset: -1 }),
);
writeFileSync(
  'public/assets/entities/player_walk_1.png',
  createPlayerFrame({ leftFootY: 23, rightFootY: 23, swordOffset: 0 }),
);
writeFileSync(
  'public/assets/entities/player_walk_2.png',
  createPlayerFrame({ leftFootY: 24, rightFootY: 22, swordOffset: 1 }),
);
writeFileSync(
  'public/assets/entities/player_walk_3.png',
  createPlayerFrame({ leftFootY: 23, rightFootY: 23, swordOffset: 0 }),
);

console.log('Successfully generated 32x32 pixel art assets:');
console.log(' - public/assets/tiles/floor.png');
console.log(' - public/assets/tiles/wall.png');
console.log(' - public/assets/entities/staircase.png');
console.log(' - public/assets/entities/player.png');
console.log(' - public/assets/entities/player_idle_0.png');
console.log(' - public/assets/entities/player_idle_1.png');
console.log(' - public/assets/entities/player_walk_0.png');
console.log(' - public/assets/entities/player_walk_1.png');
console.log(' - public/assets/entities/player_walk_2.png');
console.log(' - public/assets/entities/player_walk_3.png');
