const { chromium } = require("playwright");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

async function waitForIntroStart(page) {
    const buildBegin = page.locator("#build-begin");
    if (await buildBegin.count()) {
        await buildBegin.waitFor({ state: "visible", timeout: 120000 });
        await page.waitForFunction(() => {
            const btn = document.getElementById("build-begin");
            return !!btn && !btn.disabled;
        }, null, { timeout: 120000 });
        await buildBegin.click();
        await page.waitForTimeout(1800);
        return "build-sequence";
    }

    const introStart = page.locator("#intro-start");
    if (await introStart.count()) {
        await introStart.click();
        await page.waitForTimeout(1800);
        return "intro-overlay";
    }

    await page.keyboard.press("Space");
    await page.waitForTimeout(2200);
    return "space-fallback";
}

async function monthSanityProbe(page, monthIndex) {
    await page.evaluate((idx) => {
        if (typeof go === "function") go("month", idx);
    }, monthIndex);
    await page.waitForTimeout(2100);

    const state = await page.evaluate(async () => {
        const playerCount = typeof get === "function" ? get("player").length : 0;
        const portalCount = typeof get === "function" ? get("portal").length : 0;
        const collectibleCount = typeof get === "function" ? get("collectible").length : 0;
        const hazardCount = typeof get === "function" ? get("hazard").length : 0;
        const checkpointCount = typeof get === "function" ? get("checkpoint").length : 0;
        const missionTargets = typeof get === "function" ? get("missionTarget").length : 0;

        let collisionProbe = { tested: false };
        if (typeof get === "function" && get("player").length > 0 && get("platform").length > 0) {
            const p = get("player")[0];
            const platforms = get("platform");
            const target = platforms[0];
            const top = target.pos.y - (target.colliderH || 24);
            p.pos = vec2(target.pos.x, top - 130);
            p.vel = vec2(0, 980);
            await new Promise((resolve) => setTimeout(resolve, 650));
            collisionProbe = {
                tested: true,
                landed: p.pos.y <= top + 8,
                playerY: Number(p.pos.y.toFixed(2)),
                platformTop: Number(top.toFixed(2)),
            };
        }

        return {
            playerCount,
            portalCount,
            collectibleCount,
            hazardCount,
            checkpointCount,
            missionTargets,
            collisionProbe,
        };
    });

    return state;
}

(async () => {
    const repo = "/Users/sarthak/workspace/project/valentines";
    const outDir = path.join(repo, "qa-shots");
    fs.mkdirSync(outDir, { recursive: true });

    const server = spawn("python3", ["-m", "http.server", "8765"], {
        cwd: repo,
        stdio: "ignore",
        detached: true,
    });
    await new Promise((resolve) => setTimeout(resolve, 1300));

    const browser = await chromium.launch({
        headless: true,
        args: [
            "--use-angle=swiftshader",
            "--use-gl=angle",
            "--ignore-gpu-blocklist",
            "--enable-webgl",
            "--enable-unsafe-swiftshader",
        ],
    });
    const page = await browser.newPage({ viewport: { width: 1720, height: 980 } });

    const errors = [];
    const ignoredErrorPatterns = [
        /drawingBufferWidth/i,
    ];
    const isIgnorableError = (msg) => ignoredErrorPatterns.some((re) => re.test(msg));

    page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
    page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`[console] ${msg.text()}`);
    });

    try {
        await page.goto("http://127.0.0.1:8765", { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(1200);
        await page.screenshot({ path: path.join(outDir, "title.png"), fullPage: true });

        const startMethod = await waitForIntroStart(page);
        const bootState = await page.evaluate(() => ({
            gameMode: document.body.classList.contains("game-mode"),
            buildHidden: document.getElementById("build-sequence")?.classList.contains("hidden") ?? false,
            canvasWidth: document.getElementById("game")?.width || 0,
            canvasHeight: document.getElementById("game")?.height || 0,
        }));

        const monthReports = [];
        const monthIssues = [];

        for (let i = 0; i < 12; i++) {
            const state = await monthSanityProbe(page, i);
            await page.screenshot({ path: path.join(outDir, `month_${i + 1}.png`), fullPage: true });

            const issues = [];
            if (state.playerCount < 1) issues.push("missing player");
            if (state.portalCount < 1) issues.push("missing portal");
            if (state.collectibleCount < 5) issues.push(`collectibles too low (${state.collectibleCount})`);
            if (i >= 2 && state.checkpointCount < 1) issues.push("missing checkpoint in advanced month");
            if (state.collisionProbe.tested && !state.collisionProbe.landed) {
                issues.push(`collision probe failed (${state.collisionProbe.playerY} > ${state.collisionProbe.platformTop})`);
            }

            if (issues.length) {
                monthIssues.push({ month: i + 1, issues });
            }
            monthReports.push({ month: i + 1, ...state, issues });
        }

        // Debug overlay sanity
        await page.evaluate(() => { if (typeof go === "function") go("month", 2); });
        await page.waitForTimeout(800);
        await page.keyboard.press("F3");
        await page.waitForTimeout(400);
        const debugState = await page.evaluate(() => ({
            hasDebugLabel: !!Array.from(document.querySelectorAll("canvas")).length,
        }));

        // Event telemetry sanity
        await page.evaluate(() => {
            if (typeof emitGameLog === "function") {
                emitGameLog("mission.complete", { month: "QA", mission: "Synthetic Mission" });
                emitGameLog("portal.opened", { month: "QA" });
                emitGameLog("checkpoint.reached", { month: "QA", checkpoint: 1 });
            }
        });
        await page.waitForTimeout(800);

        const ambient = await page.evaluate(() => {
            const runtime = document.getElementById("ambient-code")?.textContent || "";
            return { runtimeLen: runtime.length, runtimeTail: runtime.slice(-260) };
        });

        const actionableErrors = errors.filter((msg) => !isIgnorableError(msg));
        const report = {
            startMethod,
            bootState,
            debugState,
            monthReports,
            monthIssues,
            errors,
            actionableErrors,
            ambient,
            pass: actionableErrors.length === 0 && monthIssues.length === 0 && bootState.gameMode,
        };

        const reportPath = path.join(repo, "qa-report.json");
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(JSON.stringify(report, null, 2));
    } finally {
        await browser.close();
        try {
            process.kill(-server.pid);
        } catch {}
    }
})();
