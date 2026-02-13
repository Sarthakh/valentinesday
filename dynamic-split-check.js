const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const repo = '/Users/sarthak/workspace/project/valentines';
  const outDir = path.join(repo, 'dynamic-split-check');
  fs.mkdirSync(outDir, { recursive: true });
  const views = [
    { w: 1280, h: 820, name: 'v1280' },
    { w: 1720, h: 980, name: 'v1720' },
    { w: 2200, h: 1180, name: 'v2200' },
  ];

  const server = spawn('python3', ['-m', 'http.server', '8765'], { cwd: repo, stdio: 'ignore', detached: true });
  await new Promise(r => setTimeout(r, 1200));

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist', '--enable-webgl', '--enable-unsafe-swiftshader'],
  });

  try {
    for (const v of views) {
      const page = await browser.newPage({ viewport: { width: v.w, height: v.h } });
      await page.goto('http://127.0.0.1:8765', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      await page.click('#intro-start');
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(outDir, `${v.name}.png`), fullPage: true });
      await page.close();
    }
    console.log('ok');
  } finally {
    await browser.close();
    try { process.kill(-server.pid); } catch {}
  }
})();
