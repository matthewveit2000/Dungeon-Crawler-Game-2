import puppeteer from 'puppeteer-core';
import path from 'path';
import os from 'os';

async function captureAudit() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-webgl',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('canvas');
  await new Promise((r) => setTimeout(r, 1000));

  // Grant XP and open progression menu
  await page.evaluate(() => {
    window.audit.grantXP(60);
    window.audit.openProgressionMenu();
  });
  await new Promise((r) => setTimeout(r, 500));
  const progPath = path.join(os.tmpdir(), 'game_progression_overlay.png');
  await page.screenshot({ path: progPath });
  console.log(`Progression screenshot saved to: ${progPath}`);

  // Close progression, open inventory
  await page.evaluate(() => {
    window.audit.openProgressionMenu();
    window.audit.openInventory();
  });
  await new Promise((r) => setTimeout(r, 500));
  const invPath = path.join(os.tmpdir(), 'game_inventory_overlay.png');
  await page.screenshot({ path: invPath });
  console.log(`Inventory screenshot saved to: ${invPath}`);

  // Close inventory and teleport to boss
  await page.evaluate(() => {
    window.audit.openInventory();
    window.audit.teleportToBoss();
  });
  await new Promise((r) => setTimeout(r, 1000));
  const bossPath = path.join(os.tmpdir(), 'game_boss_arena.png');
  await page.screenshot({ path: bossPath });
  console.log(`Boss arena screenshot saved to: ${bossPath}`);

  await browser.close();
}

captureAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
