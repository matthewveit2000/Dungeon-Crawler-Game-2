import puppeteer from 'puppeteer-core';
import path from 'path';
import os from 'os';

async function capture() {
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

  page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', (err) => console.error('BROWSER ERROR:', err.message));

  console.log('Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

  // Wait for canvas to be present and rendered
  await page.waitForSelector('canvas');
  // Wait 1 second for PixiJS to render several frames
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const outPath = path.join(os.tmpdir(), 'game_actual.png');
  await page.screenshot({ path: outPath });
  console.log(`Screenshot saved to: ${outPath}`);

  await browser.close();
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
