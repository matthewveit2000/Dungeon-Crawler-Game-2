#!/usr/bin/env node
/**
 * Enforces the architectural rules in AGENTS.md section 4 and section 7.
 *
 * Every rule here corresponds to a drift found in the Epic 1-3 audit. They are
 * checked automatically because the previous approach — noticing during review —
 * did not work across eleven pull requests.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const failures = [];

function sourceFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path));
    // Tests may reach for anything they need to build a fixture.
    else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) found.push(path);
  }
  return found;
}

// --- Tier 2 must not know how anything is drawn -----------------------------
for (const file of sourceFiles('src/modules')) {
  if (/from ['"]pixi\.js['"]/.test(readFileSync(file, 'utf8'))) {
    failures.push(
      `${relative('.', file)} imports pixi.js. Rendering belongs in Tier 1 (src/engine).`,
    );
  }
}

// --- Randomness must be seeded ----------------------------------------------
for (const file of [...sourceFiles('src/modules'), ...sourceFiles('src/engine')]) {
  if (file.endsWith('Rng.ts')) continue; // The seeded generator itself.
  const text = readFileSync(file, 'utf8');
  if (text.includes('Math.random')) {
    failures.push(
      `${relative('.', file)} calls Math.random directly. Inject an Rng so runs stay reproducible.`,
    );
  }
}

// --- No PixiJS v7 drawing calls ---------------------------------------------
for (const file of sourceFiles('src')) {
  const text = readFileSync(file, 'utf8');
  for (const call of ['beginFill', 'drawRect', 'endFill']) {
    if (text.includes(call)) {
      failures.push(`${relative('.', file)} uses the removed PixiJS v7 call ${call}().`);
    }
  }
}

// --- Bootstrap wires systems together; it does not hold game rules -----------
const MAIN_MAX_LINES = 220;
const mainLines = readFileSync('src/main.ts', 'utf8').split('\n').length;
if (mainLines > MAIN_MAX_LINES) {
  failures.push(
    `src/main.ts is ${mainLines} lines (limit ${MAIN_MAX_LINES}). ` +
      'Game rules drifting into bootstrap belong in a Tier 2 module where they can be tested.',
  );
}

// --- Tier 3 holds the content data ------------------------------------------
const packs = readdirSync('src/packs').filter((f) => f.endsWith('.json'));
if (packs.length === 0) {
  failures.push('src/packs is empty. Tunable values belong in Tier 3 data packs.');
}

if (failures.length) {
  console.error('Architecture check failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Architecture check passed. Tier 3 packs: ${packs.join(', ')}.`);
