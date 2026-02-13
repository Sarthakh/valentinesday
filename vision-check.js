const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

(async () => {
  const repo = '/Users/sarthak/workspace/project/valentines';
  const outDir = path.join(repo, 'vision-check');
  fs.mkdirSync(outDir, { recursive: true });

  const server = spawn('python3', ['-m', 'http.server', '8765'], { cwd: repo, stdio: 'ignore', detached: true });
  await new Promise(r => setTimeout(r, 1300));

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-angle=swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist', '--enable-webgl', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1720, height: 980 } });

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

  try {
    await page.goto('http://127.0.0.1:8765', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(outDir, '01_intro.png'), fullPage: true });

    await page.click('#intro-start');
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(outDir, '02_split_title.png'), fullPage: true });

    await page.keyboard.press('Space');
    await page.waitForTimeout(2200);
    await page.evaluate(() => {
      if (typeof go === 'function') go('month', 2);
    });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(outDir, '03_split_march.png'), fullPage: true });

    const state = await page.evaluate(() => ({
      splitMode: document.body.classList.contains('split-mode'),
      introHidden: document.getElementById('intro-overlay')?.classList.contains('hidden'),
      ambientLen: (document.getElementById('ambient-code')?.textContent || '').length,
    }));

    const report = { errors, state, pass: errors.length === 0 && state.splitMode && state.introHidden && state.ambientLen > 120 };
    fs.writeFileSync(path.join(repo, 'vision-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
    try { process.kill(-server.pid); } catch {}
  }
})();
