(function initLoveCodeExperience() {
    const buildSequence = document.getElementById("build-sequence");
    const buildCanvas = document.getElementById("build-canvas");
    const buildEditorShell = document.getElementById("build-editor-shell");
    const introFx = document.getElementById("intro-fx");
    const canvasTitle = document.getElementById("canvas-title");
    const canvasSubtitle = document.getElementById("canvas-subtitle");
    const legacyHeading = document.getElementById("legacy-heading");
    const legacyHeartWrap = document.getElementById("legacy-heart-wrap");
    const legacyHeartText = document.getElementById("legacy-heart-text");
    const legacyMessage = document.getElementById("legacy-message");
    const buildEditorCode = document.getElementById("build-editor-code");
    const buildBegin = document.getElementById("build-begin");
    const buildSeqSkip = document.getElementById("build-seq-skip");
    const buildSeqReplay = document.getElementById("build-seq-replay");
    const musicToggle = document.getElementById("intro-music-toggle");
    const musicVolume = document.getElementById("intro-music-volume");
    const introOverlay = document.getElementById("intro-overlay");
    const introStart = document.getElementById("intro-start");
    const ambientCode = document.getElementById("ambient-code");
    const buildEditorScroller = buildEditorCode.parentElement;
    const buildEditorHeader = buildEditorShell ? buildEditorShell.querySelector(".build-editor-header") : null;
    const buildEditorTitle = buildEditorShell ? buildEditorShell.querySelector(".build-editor-title") : null;
    const buildEditorBody = buildEditorShell ? buildEditorShell.querySelector(".build-editor-body") : null;
    const buildEditorDotRed = buildEditorShell ? buildEditorShell.querySelector(".build-dot.red") : null;
    const buildEditorDotYellow = buildEditorShell ? buildEditorShell.querySelector(".build-dot.yellow") : null;
    const buildEditorDotGreen = buildEditorShell ? buildEditorShell.querySelector(".build-dot.green") : null;

    if (!buildSequence || !buildCanvas || !buildEditorShell || !buildEditorHeader || !buildEditorTitle || !buildEditorBody || !buildEditorDotRed || !buildEditorDotYellow || !buildEditorDotGreen || !introFx || !canvasTitle || !canvasSubtitle || !legacyHeading || !legacyHeartWrap || !legacyHeartText || !legacyMessage || !buildEditorCode || !buildBegin || !buildSeqSkip || !buildSeqReplay || !musicToggle || !musicVolume || !ambientCode) return;

    const MAX_LINES = 170;
    const runtimeQueue = [];
    let runtimeText = "";
    let fxTimers = [];
    const introAudio = new Audio("assets/yellow.mp3");
    introAudio.loop = true;
    introAudio.volume = Number(musicVolume.value) / 100;
    let musicPlaying = false;
    let musicBound = false;
    let activeRunId = 0;
    let skipRequested = false;
    const EDITOR_TITLE_TEXT = "💝 Anushka.css";
    const MIN_INTRO_TOTAL_MS = 62000;
    const FAKEOUT_REVEAL_WAIT_MS = 30000;

    const OLD_SEQUENCE = [
        { line: "/* Helloooooo Anushkaaaa ❤️", pause: 480 },
        { line: " * So for valentines day, I thought why don't we make the card together?", pause: 520 },
        { line: " * Let me show you how I feel for you looks like in code", pause: 520 },
        { line: " * Ready? Let's begin...", pause: 520 },
        { line: " */", pause: 720 },
        { line: "", pause: 350 },
        { line: "/* Pehele, page banate hai - very plain plain abhi */", pause: 560 },
        { line: "body {", pause: 300 },
        { line: "    background-color: #14213d;", action: showLegacyTint, undo: hideLegacyTint, pause: 360 },
        { line: "    color: #fff;", pause: 300 },
        { line: "    overflow: hidden;", pause: 300 },
        { line: "}", pause: 620 },
        { line: "", pause: 260 },
        { line: "/* Let's style our code editor to make it like Anushka (beautiful) */", action: showEditorShell, pause: 580 },
        { line: "pre { background-color: #669bbc; color: #fdf0d5; border-radius: 12px; }", action: showEditorHeader, pause: 650 },
        { line: "pre::before .dot.red { background: #ff7f90; }", action: showEditorDot("red"), pause: 300 },
        { line: "pre::before .dot.yellow { background: #ffc56a; }", action: showEditorDot("yellow"), pause: 300 },
        { line: "pre::before .dot.green { background: #7fc5a5; }", action: showEditorDot("green"), pause: 320 },
        { line: "pre::before { content: '💝 Anushka.css'; }", action: showEditorTitle, pause: 540 },
        { line: "pre { padding-top: 48px; overflow: auto; }", action: showEditorBody, pause: 620 },
        { line: "", pause: 280 },
        { line: "/* Thoda gaana-shaana lagado yaar... */", action: showMusicPlayer, undo: hideMusicPlayer, pause: 560 },
        { line: ".music-player {", pause: 250 },
        { line: "    position: fixed; top: 20px; left: 20px;", pause: 260 },
        { line: "    background: rgba(239, 35, 60, 0.2);", pause: 280 },
        { line: "    animation: slideIn 0.5s forwards;", pause: 280 },
        { line: "}", pause: 640 },
        { line: "", pause: 300 },
        { line: "/* Now, time to make our card...thoda heading dete hai */", action: showLegacyHeading, undo: hideLegacyHeading, pause: 580 },
        { line: ".valentine-heading { color: #f28482; }", pause: 460 },
        { line: "", pause: 260 },
        { line: "/* A big heart for my strong girl */", action: showLegacyHeart, undo: hideLegacyHeart, pause: 520 },
        { line: "#heart, #echo { position: fixed; width: 300px; height: 300px; }", pause: 430 },
        { line: "#heart::before, #heart::after { background: #ef233c; }", pause: 430 },
        { line: "#heart i::before { content: 'Anushka'; }", pause: 700 },
        { line: "", pause: 260 },
        { line: "/* How about some floating hearts? */", action: startFloatingHearts, undo: clearIntroFx, pause: 620 },
        { line: ".floating-heart:nth-child(1) { left: 10%; animation: float-up 7s linear infinite; }", pause: 360 },
        { line: ".floating-heart:nth-child(2) { left: 25%; animation: float-up 8s linear infinite 1s; }", pause: 360 },
        { line: ".floating-heart:nth-child(3) { left: 40%; animation: float-up 6s linear infinite 2s; }", pause: 720 },
        { line: "", pause: 250 },
        { line: "/* Time to make it beat! */", pause: 520 },
        { line: "#heart, #echo { animation-play-state: running; }", action: startLegacyBeat, undo: stopLegacyBeat, pause: 660 },
        { line: "", pause: 250 },
        { line: "/* Ek cute sa message - from me */", action: () => typeLegacyMessage("You make each morning worth getting up for, and each night worth staying awake for 🫶"), undo: clearLegacyMessage, pause: 780 },
        { line: ".love-message { color: #eac4d5; font-size: 32px; }", pause: 760 },
        { line: "/* There it is... my chotu sa gift for you heehee */", pause: 900 },
    ];

    const NEW_SEQUENCE = [
        { line: "const story = createLoveAdventure({ months: 12, style: 'new-journey' });", pause: 760 },
        { line: "story.mountCanvas({ side: 'left' });", pause: 700 },
        { line: "canvas.fill('#101a35');", action: showLegacyTint, pause: 800 },
        { line: "canvas.effects.add('floatingHearts');", action: startFloatingHearts, pause: 760 },
        { line: "canvas.effects.add('shootingStars');", action: startShootingStars, pause: 760 },
        { line: "const heading = canvas.createHeading('Happy Valentines, My Anushku');", action: typeRealHeading, pause: 820 },
        { line: "const heart = canvas.createHeart();", action: showRealHeartShell, pause: 720 },
        { line: "// this year, I'm gonna take you on an adventure", pause: 620 },
        { line: "const cta = canvas.createButton('Begin Game');", action: showBeginButtonGhost, pause: 720 },
        { line: "cta.bind(startJourney);", pause: 640 },
        { line: "cta.enable();", pause: 980 },
    ];

    function runIsCancelled(runId) {
        return runId !== activeRunId;
    }

    function sleep(ms, runId = activeRunId) {
        if (runIsCancelled(runId)) return Promise.resolve();
        return new Promise((resolve) => setTimeout(resolve, skipRequested ? 0 : ms));
    }

    function scrollBuildEditorToBottom() {
        if (buildEditorScroller) {
            buildEditorScroller.scrollTop = buildEditorScroller.scrollHeight;
            return;
        }
        buildEditorCode.scrollTop = buildEditorCode.scrollHeight;
    }

    function scrollAmbientToBottom() {
        ambientCode.scrollTop = ambientCode.scrollHeight;
    }

    function clip(text) {
        const lines = text.split("\n");
        if (lines.length <= MAX_LINES) return text;
        return lines.slice(lines.length - MAX_LINES).join("\n");
    }

    function enqueue(line) {
        runtimeQueue.push(line + "\n");
    }

    async function typeTo(el, text, speed, runId = activeRunId) {
        for (let i = 0; i < text.length; i++) {
            if (runIsCancelled(runId)) return;
            el.textContent += text[i];
            await sleep(speed, runId);
        }
    }

    async function typeInto(el, text, speed, runId = activeRunId) {
        if (runIsCancelled(runId)) return;
        el.textContent = "";
        await typeTo(el, text, speed, runId);
    }

    async function eraseFrom(el, speed = 14, runId = activeRunId) {
        while (el.textContent.length) {
            if (runIsCancelled(runId)) return;
            el.textContent = el.textContent.slice(0, -1);
            await sleep(speed, runId);
        }
    }

    async function typeLine(line, speed, runId = activeRunId) {
        if (runIsCancelled(runId)) return 0;
        for (let i = 0; i < line.length; i++) {
            if (runIsCancelled(runId)) return 0;
            buildEditorCode.textContent += line[i];
            if (i % 3 === 0) scrollBuildEditorToBottom();
            await sleep(speed, runId);
        }
        if (runIsCancelled(runId)) return 0;
        buildEditorCode.textContent += "\n";
        scrollBuildEditorToBottom();
        return line.length + 1;
    }

    async function eraseChars(count, speed = 12, runId = activeRunId) {
        for (let i = 0; i < count; i++) {
            if (runIsCancelled(runId)) return;
            const text = buildEditorCode.textContent;
            if (!text.length) return;
            buildEditorCode.textContent = text.slice(0, -1);
            if (i % 4 === 0) scrollBuildEditorToBottom();
            await sleep(speed, runId);
        }
        scrollBuildEditorToBottom();
    }

    function resetCanvasScene(options = {}) {
        const keepMusic = !!options.keepMusic;
        canvasTitle.textContent = "";
        canvasSubtitle.textContent = "";
        legacyHeading.textContent = "";
        legacyHeartText.textContent = "Anushka";
        legacyMessage.textContent = "";
        legacyHeading.classList.remove("legacy-visible");
        legacyHeartWrap.classList.remove("legacy-visible");
        legacyMessage.classList.remove("legacy-visible");
        buildCanvas.classList.remove("legacy-beating");
        buildSequence.classList.remove("tinted", "legacy-mode", "real-sequence");
        if (!keepMusic) {
            buildSequence.classList.remove("music-ready");
        }
        clearIntroFx();
        if (!keepMusic) {
            stopMusicLoop();
        }
        buildBegin.disabled = true;
        buildBegin.style.opacity = "0";
        buildBegin.style.transform = "translateY(8px)";
    }

    function resetEditorBuild() {
        buildSequence.classList.remove("editor-shell-built", "editor-header-built", "editor-dot-red-built", "editor-dot-yellow-built", "editor-dot-green-built", "editor-title-built", "editor-body-built");
        buildEditorTitle.textContent = "";
        if (buildEditorScroller) buildEditorScroller.scrollTop = 0;
    }

    function showEditorShell() {
        buildSequence.classList.add("editor-shell-built");
    }

    function showEditorHeader() {
        buildSequence.classList.add("editor-header-built");
    }

    async function showEditorTitle(runId = activeRunId) {
        buildSequence.classList.add("editor-title-built");
        buildEditorTitle.textContent = "";
        await typeTo(buildEditorTitle, EDITOR_TITLE_TEXT, 26, runId);
    }

    function showEditorBody() {
        buildSequence.classList.add("editor-body-built");
    }

    function showEditorDot(which) {
        return () => {
            if (which === "red") buildSequence.classList.add("editor-dot-red-built");
            if (which === "yellow") buildSequence.classList.add("editor-dot-yellow-built");
            if (which === "green") buildSequence.classList.add("editor-dot-green-built");
        };
    }

    function ensureEditorBuilt() {
        buildSequence.classList.add("editor-shell-built", "editor-header-built", "editor-dot-red-built", "editor-dot-yellow-built", "editor-dot-green-built", "editor-title-built", "editor-body-built");
        buildEditorTitle.textContent = EDITOR_TITLE_TEXT;
    }

    function showLegacyTint() {
        buildSequence.classList.add("tinted");
        buildSequence.classList.add("legacy-mode");
    }

    function hideLegacyTint() {
        buildSequence.classList.remove("tinted");
    }

    async function showLegacyHeading(runId = activeRunId) {
        legacyHeading.classList.add("legacy-visible");
        await typeInto(legacyHeading, "Happy Valentine's", 46, runId);
    }

    async function hideLegacyHeading(runId = activeRunId) {
        await eraseFrom(legacyHeading, 20, runId);
        legacyHeading.classList.remove("legacy-visible");
        legacyHeading.textContent = "";
    }

    function showLegacyHeart() {
        legacyHeartWrap.classList.add("legacy-visible");
    }

    function hideLegacyHeart() {
        legacyHeartWrap.classList.remove("legacy-visible");
    }

    async function typeRealHeading(runId = activeRunId) {
        buildSequence.classList.add("real-sequence");
        await typeInto(canvasTitle, "Happy Valentines, My Anushku", 44, runId);
    }

    async function showRealHeartShell(runId = activeRunId) {
        legacyHeartText.textContent = "";
        canvasSubtitle.textContent = "";
        legacyHeartWrap.classList.add("legacy-visible");
        startLegacyBeat();
        await sleep(220, runId);
    }

    async function typeLegacyMessage(msg, runId = activeRunId) {
        legacyMessage.textContent = "";
        legacyMessage.classList.add("legacy-visible");
        for (let i = 0; i < msg.length; i++) {
            if (runIsCancelled(runId)) return;
            legacyMessage.textContent += msg[i];
            await sleep(32, runId);
        }
    }

    async function clearLegacyMessage(runId = activeRunId) {
        await eraseFrom(legacyMessage, 12, runId);
        legacyMessage.classList.remove("legacy-visible");
        legacyMessage.textContent = "";
    }

    function startLegacyBeat() {
        buildCanvas.classList.add("legacy-beating");
    }

    function stopLegacyBeat() {
        buildCanvas.classList.remove("legacy-beating");
    }

    function showBeginButtonGhost() {
        if (buildSequence.classList.contains("real-sequence")) {
            buildBegin.textContent = "Begin Game";
        }
        buildBegin.style.opacity = "0.58";
        buildBegin.style.transform = "translateY(6px)";
    }

    function enableBeginButton() {
        if (buildSequence.classList.contains("real-sequence")) {
            buildBegin.textContent = "Begin Game";
        }
        buildBegin.disabled = false;
        buildBegin.style.opacity = "1";
        buildBegin.style.transform = "translateY(0)";
    }

    function spawnHeart() {
        const heart = document.createElement("span");
        heart.className = "intro-heart";
        heart.textContent = Math.random() > 0.35 ? "♥" : "♡";
        heart.style.left = `${10 + Math.random() * 80}%`;
        heart.style.bottom = `${-8 + Math.random() * 18}px`;
        heart.style.fontSize = `${14 + Math.random() * 22}px`;
        heart.style.animationDuration = `${4.4 + Math.random() * 4.2}s`;
        introFx.appendChild(heart);
        setTimeout(() => heart.remove(), 9000);
    }

    function spawnStar() {
        const star = document.createElement("span");
        star.className = "intro-star";
        star.style.left = `${78 + Math.random() * 24}%`;
        star.style.top = `${-6 + Math.random() * 18}%`;
        introFx.appendChild(star);
        setTimeout(() => star.remove(), 1500);
    }

    function clearIntroFx() {
        fxTimers.forEach((t) => clearInterval(t));
        fxTimers = [];
        introFx.innerHTML = "";
    }

    function startFloatingHearts() {
        clearIntroFx();
        for (let i = 0; i < 7; i++) setTimeout(spawnHeart, i * 180);
        fxTimers.push(setInterval(spawnHeart, 640));
    }

    function startShootingStars() {
        spawnStar();
        fxTimers.push(setInterval(spawnStar, 3200));
        fxTimers.push(setInterval(() => {
            if (Math.random() > 0.6) spawnStar();
        }, 1700));
    }

    function startMusicLoop() {
        if (musicPlaying) return;
        introAudio.play().then(() => {
            musicPlaying = true;
            musicToggle.textContent = "⏸️";
        }).catch(() => {
            musicPlaying = false;
            musicToggle.textContent = "▶️";
        });
    }

    function stopMusicLoop() {
        introAudio.pause();
        musicPlaying = false;
        musicToggle.textContent = "▶️";
    }

    function showMusicPlayer() {
        buildSequence.classList.add("music-ready");
        if (!musicBound) {
            musicToggle.addEventListener("click", () => {
                if (musicPlaying) stopMusicLoop();
                else startMusicLoop();
            });
            musicVolume.addEventListener("input", () => {
                introAudio.volume = Number(musicVolume.value) / 100;
            });
            musicBound = true;
        }
        musicToggle.textContent = "▶️";
    }

    function hideMusicPlayer() {
        buildSequence.classList.remove("music-ready");
        stopMusicLoop();
    }

    async function playSequence(steps, typeSpeed, history, pauseScale = 1, runId = activeRunId) {
        for (const step of steps) {
            if (runIsCancelled(runId)) return;
            const len = await typeLine(step.line, typeSpeed, runId);
            if (runIsCancelled(runId)) return;
            if (typeof step.action === "function") await step.action(runId);
            history.push({ len, undo: step.undo || null });
            await sleep(step.pause * pauseScale, runId);
        }
    }

    function applyFinalBuildState() {
        resetCanvasScene();
        ensureEditorBuilt();
        showLegacyTint();
        startFloatingHearts();
        startShootingStars();
        buildSequence.classList.add("real-sequence");
        canvasTitle.textContent = "Happy Valentines, My Anushku";
        canvasSubtitle.textContent = "";
        legacyHeartWrap.classList.add("legacy-visible");
        legacyHeartText.textContent = "";
        startLegacyBeat();
        buildBegin.disabled = false;
        buildBegin.textContent = "Begin Game";
        buildBegin.style.opacity = "1";
        buildBegin.style.transform = "translateY(0)";
        buildEditorCode.textContent = [
            "const story = createLoveAdventure({ months: 12, style: 'new-journey' });",
            "story.mountCanvas({ side: 'left' });",
            "canvas.fill('#101a35');",
            "canvas.effects.add('floatingHearts');",
            "canvas.effects.add('shootingStars');",
            "const heading = canvas.createHeading('Happy Valentines, My Anushku');",
            "const heart = canvas.createHeart();",
            "// this year, I'm gonna take you on an adventure",
            "const cta = canvas.createButton('Begin Game');",
            "cta.bind(startJourney);",
            "cta.enable();",
        ].join("\n");
        scrollBuildEditorToBottom();
        enqueue("[intro] sequence skipped to built state");
    }

    async function runBuildSequence() {
        const runId = ++activeRunId;
        const sequenceStart = performance.now();
        skipRequested = false;
        document.body.classList.add("preboot");
        buildSequence.classList.add("controls-ready");
        buildSequence.classList.add("phase-blank");
        if (introOverlay) introOverlay.classList.add("hidden");
        resetCanvasScene();
        resetEditorBuild();
        buildEditorCode.textContent = "";

        await sleep(1200, runId);
        if (runIsCancelled(runId)) return;
        buildSequence.classList.remove("phase-blank");
        await sleep(600, runId);
        if (runIsCancelled(runId)) return;

        const oldPhaseStart = performance.now();
        const history = [];

        await playSequence(OLD_SEQUENCE, 10, history, 0.46, runId);
        if (runIsCancelled(runId)) return;

        const elapsedOld = performance.now() - oldPhaseStart;
        if (elapsedOld < 30000) {
            await sleep(30000 - elapsedOld, runId);
        }
        if (runIsCancelled(runId)) return;

        // Hold the completed fakeout card on screen before the reveal line.
        await sleep(FAKEOUT_REVEAL_WAIT_MS, runId);
        if (runIsCancelled(runId)) return;

        const fakeoutText = "Nah, you really thought we were gonna do the same thing?";
        const fakeoutLen = await typeLine(`// ${fakeoutText}`, 19, runId);
        history.push({ len: fakeoutLen, undo: null });
        await typeInto(canvasSubtitle, fakeoutText, 34, runId);
        await sleep(1500, runId);
        if (runIsCancelled(runId)) return;

        for (let i = history.length - 1; i >= 0; i--) {
            if (runIsCancelled(runId)) return;
            const item = history[i];
            await eraseChars(item.len, 2, runId);
            if (typeof item.undo === "function") await item.undo(runId);
            await sleep(42, runId);
        }
        if (runIsCancelled(runId)) return;

        await eraseFrom(canvasSubtitle, 18, runId);
        resetCanvasScene({ keepMusic: true });
        buildEditorCode.textContent = "";
        await sleep(500, runId);
        if (runIsCancelled(runId)) return;

        await typeLine("/* okay, this year is different. building v2... */", 20, runId);
        if (runIsCancelled(runId)) return;
        hideMusicPlayer();
        await sleep(180, runId);
        if (runIsCancelled(runId)) return;
        await typeLine("", 10, runId);
        await playSequence(NEW_SEQUENCE, 18, [], 0.72, runId);
        if (runIsCancelled(runId)) return;
        const elapsedTotal = performance.now() - sequenceStart;
        if (elapsedTotal < MIN_INTRO_TOTAL_MS) {
            await sleep(MIN_INTRO_TOTAL_MS - elapsedTotal, runId);
        }
        if (runIsCancelled(runId)) return;
        enableBeginButton();
        enqueue("[intro] v2 scene built from code");
    }

    function startFromBuiltIntro() {
        if (buildBegin.disabled) return;
        buildBegin.disabled = true;
        stopMusicLoop();
        document.body.classList.remove("preboot");
        document.body.classList.add("game-mode");
        buildSequence.classList.add("hidden");
        if (introOverlay) introOverlay.classList.add("hidden");
        const canvas = document.getElementById("game");
        if (canvas) canvas.focus();
    }

    function flushRuntime() {
        if (!runtimeQueue.length) return;
        ambientCode._cursor = ambientCode._cursor || { chunk: runtimeQueue.shift(), idx: 0 };
        const c = ambientCode._cursor;
        const speed = 4;
        const end = Math.min(c.idx + speed, c.chunk.length);
        runtimeText += c.chunk.slice(c.idx, end);
        c.idx = end;
        runtimeText = clip(runtimeText);
        ambientCode.textContent = runtimeText;
        scrollAmbientToBottom();
        if (c.idx >= c.chunk.length) ambientCode._cursor = null;
    }

    function mapEvent(detail) {
        const at = new Date(detail.t || Date.now()).toLocaleTimeString();
        const month = detail.month || "runtime";
        switch (detail.tag) {
            case "scene.title.enter":
                return `scene.title.mount(); // ${at}`;
            case "run.start":
                return `run.start({ via: \"${detail.method}\" }); // ${at}`;
            case "scene.month.enter":
                return `loadMonth(${detail.index + 1}, \"${month}\");`;
            case "character.selected":
                return `player.select(\"${detail.character}\");`;
            case "player.jump":
                return `player.jump(); // ${month}`;
            case "player.dash":
                return `player.dash(\"${detail.dir}\"); // ${month}`;
            case "collectible.collected":
                return `collect(${detail.collected}/${detail.total}, \"${detail.item}\");`;
            case "mission.token":
                return `mission.progress(\"${detail.mission}\", ${detail.progress}/${detail.target});`;
            case "mission.complete":
                return `mission.complete(\"${detail.mission}\");`;
            case "checkpoint.reached":
                return `checkpoint.save(${detail.checkpoint}); // ${month}`;
            case "spring.boost":
                return `spring.boost(${Number(detail.power || 1).toFixed(2)});`;
            case "dash.refill":
                return `dash.refill(${detail.duration}s);`;
            case "player.damage":
                return `player.damage(\"${detail.reason}\", hp:${detail.health});`;
            case "portal.blocked":
                return `portal.blocked(${JSON.stringify(detail.reason)});`;
            case "portal.opened":
                return `portal.open(); // ${month}`;
            case "memory.open":
                return `memory.open(\"${detail.month}\");`;
            case "memory.close.next":
                return `memory.continue(\"${detail.next}\");`;
            case "memory.close.boss":
                return "mission.rescueBoss();";
            case "scene.boss.enter":
                return "scene.boss.mount();";
            case "boss.hit":
                return `boss.hp(${detail.hp});`;
            case "boss.defeated":
                return "boss.defeated(\"Kanushku\");";
            case "boss.skipped":
                return `boss.skip(${detail.deaths || 0});`;
            case "ghost.exposition":
                return `ghostSarthu.exposition(\"${detail.month}\");`;
            case "scene.finale.enter":
                return "finale.showVictory();";
            case "player.fall":
                return `respawn(${detail.falls});`;
            default:
                return `runtime.emit(\"${detail.tag || "event"}\");`;
        }
    }

    enqueue("[boot] 💝 Anushka.css loaded");
    enqueue("[boot] telemetry channel ready");
    enqueue("[boot] scene title online");

    window.addEventListener("game-log", (evt) => {
        const mapped = mapEvent(evt.detail || {});
        enqueue(mapped);
    });

    let idle = 0;
    setInterval(() => {
        idle += 1;
        enqueue(`renderFrame(); // tick ${idle}`);
    }, 2800);

    setInterval(() => {
        flushRuntime();
    }, 34);

    let lastControlTriggerAt = 0;
    const canTriggerControl = () => {
        const now = performance.now();
        if (now - lastControlTriggerAt < 220) return false;
        lastControlTriggerAt = now;
        return true;
    };
    const bindControl = (el, action) => {
        const handler = (evt) => {
            if (!canTriggerControl()) return;
            if (evt && typeof evt.preventDefault === "function") evt.preventDefault();
            action();
        };
        el.addEventListener("click", handler);
        el.addEventListener("pointerup", handler);
        el.addEventListener("touchend", handler, { passive: false });
    };

    bindControl(buildBegin, () => startFromBuiltIntro());
    if (introStart) {
        bindControl(introStart, () => startFromBuiltIntro());
    }
    bindControl(buildSeqSkip, () => {
        skipRequested = true;
        activeRunId += 1;
        applyFinalBuildState();
    });
    bindControl(buildSeqReplay, () => {
        skipRequested = false;
        activeRunId += 1;
        runBuildSequence();
    });
    runBuildSequence();
})();
