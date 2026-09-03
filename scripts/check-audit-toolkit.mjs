#!/usr/bin/env node
/**
 * Guards the Effortless Audit Toolkit.
 *
 * Every command the PM is told to run in a milestone document has to exist in
 * the shipped bundle. The Phase 9 macro-map command was broken by two later
 * phases and stayed broken because nothing checked it, so this runs in CI.
 *
 * It proves the commands are present and wired up. It cannot prove they behave
 * correctly on screen — that is what the PM audit steps are for.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED_COMMANDS = [
  'logInputs',
  'getFPS',
  'getRendererDimensions',
  'spawnTestSquare',
  'spawnPlayer',
  'teleportToStairs',
  'zoomOutMap',
  'getSeed',
  'setSeed',
  'getFloorStats',
  'setTimer',
  'toggleMenu',
  'getZoom',
  'setZoom',
  'damagePlayer',
  'teleportToEnemy',
  'playerAttack',
  'equipWeapon',
  'spawnLoot',
  'generateAffixedItem',
  'spawnLootDrop',
  'openInventory',
  'equipInventoryItem',
  'teleportToCity',
  'testCityDeAggro',
  'addGold',
  'buyVendorItem',
  'sellInventoryItem',
  'teleportToBoss',
  'triggerBossEncounter',
  'killBoss',
  'killTarget',
  'grantXP',
  'getLevelStats',
  'getPointPools',
  'allocatePoint',
  'openProgressionMenu',
  'spendAttributePoint',
  'spendSkillPoint',
];

const DIST = 'dist/assets';
const failures = [];

if (!existsSync(DIST)) {
  console.error(`No build output at ${DIST}. Run "npm run build" first.`);
  process.exit(1);
}

const bundle = readdirSync(DIST)
  .filter((file) => file.endsWith('.js'))
  .map((file) => readFileSync(join(DIST, file), 'utf8'))
  .join('\n');

for (const command of REQUIRED_COMMANDS) {
  if (!bundle.includes(command)) {
    failures.push(`window.audit.${command} is missing from the production bundle`);
  }
}

// Every command a milestone document tells the PM to run must actually exist.
const MILESTONES = '.docs/milestones';
if (existsSync(MILESTONES)) {
  const referenced = new Set();
  // TEMPLATE.md holds illustrative examples, not instructions for a real phase.
  const files = readdirSync(MILESTONES).filter((f) => f.endsWith('.md') && f !== 'TEMPLATE.md');
  for (const file of files) {
    const text = readFileSync(join(MILESTONES, file), 'utf8');
    for (const match of text.matchAll(/window\.audit\.([A-Za-z0-9_]+)/g)) {
      referenced.add(`${match[1]}::${file}`);
    }
  }
  for (const entry of referenced) {
    const [command, file] = entry.split('::');
    if (!REQUIRED_COMMANDS.includes(command)) {
      failures.push(`${file} tells the PM to run window.audit.${command}, which no longer exists`);
    }
  }
}

if (failures.length) {
  console.error('Audit toolkit check failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Audit toolkit intact: ${REQUIRED_COMMANDS.length} commands present and documented.`);
