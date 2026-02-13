const { chromium } = require('playwright');
const { spawn } = require('child_process');

(async () => {
  const repo = '/Users/sarthak/workspace/project/valentines';
  const server = spawn('python3', ['-m', 'http.server', '8765'], { cwd: repo, stdio: 'ignore', detached: true });
  await new Promise(r => setTimeout(r, 1200));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', msg => console.log('[console]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[pageerror]', err.message));
  page.on('requestfailed', req => console.log('[requestfailed]', req.url(), req.failure()?.errorText));

  try {
    const resp = await page.goto('http://127.0.0.1:8765', { waitUntil: 'networkidle' });
    console.log('status', resp?.status());
    await page.waitForTimeout(1500);

    const info = await page.evaluate(() => {
      const c = document.getElementById('game');
      return {
        hasKaboomGlobal: typeof kaboom !== 'undefined',
        hasGo: typeof go !== 'undefined',
        canvasWidth: c?.width,
        canvasHeight: c?.height,
        canvasClientWidth: c?.clientWidth,
        canvasClientHeight: c?.clientHeight,
        bodyChildren: document.body.children.length,
      };
    });
    console.log('info', JSON.stringify(info, null, 2));
  } finally {
    await browser.close();
    try { process.kill(-server.pid); } catch {}
  }
})();
