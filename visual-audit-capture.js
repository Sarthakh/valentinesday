const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const repo = '/Users/sarthak/workspace/project/valentines';
  const outDir = path.join(repo, 'visual-audit');
  fs.mkdirSync(outDir, { recursive: true });

  const server = spawn('python3', ['-m', 'http.server', '8765'], {
    cwd: repo,
    stdio: 'ignore',
    detached: true,
  });
  await new Promise(r => setTimeout(r, 1500));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    await page.goto('http://127.0.0.1:8765', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, '01_title.png'), fullPage: true });

    await page.keyboard.press('Space');
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(outDir, '02_month0.png'), fullPage: true });

    for (const m of [2, 5, 9, 11]) {
      await page.evaluate((idx) => {
        if (typeof go === 'function') go('month', idx);
      }, m);
      await page.waitForTimeout(1800);
      await page.screenshot({ path: path.join(outDir, `month_${m}.png`), fullPage: true });
    }

    await page.evaluate(() => { if (typeof go === 'function') go('month', 2); });
    await page.waitForTimeout(3200);
    await page.screenshot({ path: path.join(outDir, 'month_2_motion.png'), fullPage: true });

    console.log('screenshots ready in', outDir);
  } finally {
    await browser.close();
    try { process.kill(-server.pid); } catch {}
  }
})();
