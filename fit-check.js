const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function startExperience(page) {
  const buildBegin = page.locator('#build-begin');
  if (await buildBegin.count()) {
    await buildBegin.waitFor({ state: 'visible', timeout: 120000 });
    await page.waitForFunction(() => {
      const btn = document.getElementById('build-begin');
      return !!btn && !btn.disabled;
    }, null, { timeout: 120000 });
    await buildBegin.click();
    await page.waitForTimeout(1100);
    return;
  }

  const introStart = page.locator('#intro-start');
  if (await introStart.count()) {
    await introStart.click();
    await page.waitForTimeout(1000);
    return;
  }

  await page.keyboard.press('Space');
  await page.waitForTimeout(1200);
}

(async () => {
  const repo = '/Users/sarthak/workspace/project/valentines';
  const outDir = path.join(repo, 'fit-check');
  fs.mkdirSync(outDir, { recursive: true });
  const views = [
    { w: 1366, h: 860, name: 'v1366' },
    { w: 1512, h: 920, name: 'v1512' },
    { w: 1720, h: 980, name: 'v1720' },
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
      await startExperience(page);

      await page.evaluate(() => { if (typeof go === 'function') go('month', 2); });
      await page.waitForTimeout(2300);
      await page.screenshot({ path: path.join(outDir, `${v.name}_march.png`), fullPage: true });

      await page.evaluate(() => { if (typeof go === 'function') go('month', 11); });
      await page.waitForTimeout(2300);
      await page.screenshot({ path: path.join(outDir, `${v.name}_december.png`), fullPage: true });

      const edge = await page.evaluate(() => {
        const portals = typeof get === 'function' ? get('portal') : [];
        const p = portals[0];
        const canvas = document.getElementById('game');
        return {
          portalVisible: !!p && !!canvas && p.pos.x < canvas.width - 10,
          portalX: p ? Number(p.pos.x.toFixed(2)) : null,
          canvasWidth: canvas ? canvas.width : null,
        };
      });
      fs.writeFileSync(path.join(outDir, `${v.name}_meta.json`), JSON.stringify(edge, null, 2));
      await page.close();
    }
    console.log('ok');
  } finally {
    await browser.close();
    try { process.kill(-server.pid); } catch {}
  }
})();
