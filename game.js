const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const SCALE_X = GAME_WIDTH / BASE_WIDTH;
const SCALE_Y = GAME_HEIGHT / BASE_HEIGHT;

function sx(value) {
    return Math.round(value * SCALE_X);
}

function sy(value) {
    return Math.round(value * SCALE_Y);
}

// Initialize Kaboom
kaboom({
    canvas: document.getElementById("game"),
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    background: [20, 33, 61],
    scale: 1,
    crisp: true,
});

// ============================================
// SET GRAVITY FOR PHYSICS
// ============================================
setGravity(2160);

// ============================================
// SOUND EFFECTS (Web Audio API)
// ============================================
let audioCtx = null;
try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
    console.log("Audio not supported");
}

function playDing() {
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1108, audioCtx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
}

function playJump() {
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {}
}

const BGM_PLAYLIST = [
    "assets/music/moodmode-8-bit-retro-game-music-233964.mp3",
    "assets/music/moodmode-game-8-bit-on-278083.mp3",
    "assets/music/nickpanek-356-8-bit-chiptune-game-music-357518.mp3",
];
let bgmTrackIndex = 0;
const bgm = new Audio(BGM_PLAYLIST[bgmTrackIndex]);
bgm.loop = false;
bgm.preload = "auto";
bgm.volume = 0.34;
let bgmMuted = false;
let bgmStarted = false;

function advanceBgmTrack(autoPlay = true) {
    bgmTrackIndex = (bgmTrackIndex + 1) % BGM_PLAYLIST.length;
    bgm.src = BGM_PLAYLIST[bgmTrackIndex];
    bgm.currentTime = 0;
    if (!autoPlay || bgmMuted) return;
    bgm.play().then(() => {
        bgmStarted = true;
        syncBgmToggle();
    }).catch(() => {
        bgmStarted = false;
    });
}

bgm.addEventListener("ended", () => {
    advanceBgmTrack(true);
});
bgm.addEventListener("error", () => {
    advanceBgmTrack(!bgmMuted && bgmStarted);
});

function syncBgmToggle() {
    const btn = document.getElementById("bgm-toggle");
    if (!btn) return;
    btn.textContent = bgmMuted ? "Music: OFF" : "Music: ON ♫";
}

function startBgm() {
    if (bgmMuted) return;
    if (bgmStarted && !bgm.paused) return;
    bgm.play().then(() => {
        bgmStarted = true;
        syncBgmToggle();
    }).catch(() => {
        bgmStarted = false;
    });
}

function pauseBgm() {
    bgm.pause();
}

function toggleBgm() {
    bgmMuted = !bgmMuted;
    if (bgmMuted) {
        pauseBgm();
    } else {
        startBgm();
    }
    syncBgmToggle();
}

const bgmToggleBtn = document.getElementById("bgm-toggle");
if (bgmToggleBtn) {
    bgmToggleBtn.addEventListener("click", () => {
        toggleBgm();
        const gameCanvas = document.getElementById("game");
        if (gameCanvas) {
            setTimeout(() => gameCanvas.focus(), 0);
        }
    });
    syncBgmToggle();
}

// ============================================
// CLICK HEARTS
// ============================================
document.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") return;
    const buildSequence = document.getElementById("build-sequence");
    const memoryPopup = document.getElementById("memory-popup");
    const letterOverlay = document.getElementById("love-letter-overlay");
    const introVisible = buildSequence && !buildSequence.classList.contains("hidden");
    const memoryVisible = memoryPopup && !memoryPopup.classList.contains("hidden");
    const letterVisible = letterOverlay && !letterOverlay.classList.contains("hidden");
    if (introVisible || memoryVisible || letterVisible) return;

    const hearts = ["♥", "♡", "♥", "♡"];
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const heart = document.createElement("div");
            heart.className = "click-heart";
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.left = (e.clientX - 12 + (Math.random() - 0.5) * 40) + "px";
            heart.style.top = (e.clientY - 12) + "px";
            heart.style.color = `hsl(${340 + Math.random() * 30}, 85%, ${65 + Math.random() * 15}%)`;
            heart.style.fontSize = (20 + Math.random() * 14) + "px";
            document.body.appendChild(heart);
            setTimeout(() => heart.remove(), 1500);
        }, i * 60);
    }
});

// ============================================
// MEMORIES DATA
// ============================================
function memoryPhoto(file, fallbackMonth, fallbackColor) {
    const fallback = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="360" height="270"><rect width="360" height="270" fill="${fallbackColor}"/><text x="180" y="110" text-anchor="middle" font-size="22" fill="#fff" font-family="Georgia">${fallbackMonth}</text><text x="180" y="160" text-anchor="middle" font-size="42" fill="#fff">♥</text><text x="180" y="216" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.75)" font-family="Arial">Add your personal photo here</text></svg>`)}`;
    return file || fallback;
}

function memoryGallery(file, fallbackMonth, fallbackColor, captions) {
    const photo = memoryPhoto(file, fallbackMonth, fallbackColor);
    return [
        { src: photo, caption: captions[0] },
        { src: photo, caption: captions[1] },
        { src: photo, caption: captions[2] },
    ];
}

const MEMORIES = [
    {
        month: "January",
        title: "Cubbon Park",
        message: "For me, my most precious memory from Jan is our Cubbon Park visit, jum hum log gaye the CTR aur tereko Ghee zyada laga, my inner state battling tower research and Blr and how you were my real rock during that time. I remember that I felt that I loved you for the first time in this month - and funnily, you were not even there, at the coldplay concert. That day made me a Pankushku paglu.",
        photo: memoryPhoto("assets/photos/month-01.jpg", "January", "#5f6a8a"),
        photos: memoryGallery("assets/photos/month-01.jpg", "January", "#5f6a8a", ["Cubbon Park morning walk", "Bench-side bakbak sessions", "Best laugh in the park: yours"]),
    },
    {
        month: "February",
        title: "Valentine's Day",
        message: "That valentine jahan tu raat ko aagayi thi, jab humne dono ne sath me lego banaya tha, Khushi ko visit kiya tha Irani me and I gave you a backpack ride. The timelapse of us building that lego, watching Tees Mar Khan and haha first time we got high together ACCHE SE NOT DRY KISS AWKWARD WAY ME.",
        photo: memoryPhoto("assets/photos/month-02.jpg", "February", "#8b5a7c"),
        photos: memoryGallery("assets/photos/month-02.jpg", "February", "#8b5a7c", ["Valentine photo spam mode", "Bas one more picture, promise", "Lost track of time, found more love"]),
    },
    {
        month: "March",
        title: "Boating Adventures",
        message: "Hamari holi lmao. This is the biggest month, isnt it? for us - first time we said I love you to each other (thanks Amey party) when I proposed to you via paper rings, when you proposed me first like always. Holi, making out in Moti Mahal washroom, just the most 'us' month of all time haha",
        photo: memoryPhoto("assets/photos/month-03.jpg", "March", "#7ca87c"),
        photos: memoryGallery("assets/photos/month-03.jpg", "March", "#7ca87c", ["Sunset yacht adventure", "Wind, water, and your smile", "My heart did parkour that evening"]),
    },
    {
        month: "April",
        title: "Kolkata Calls",
        message: "Iss month tu Kolkata me thi, mujhe akela chodd ke. Hamare roz ke convos jab tu metro se chidd ke jati thi, batati thi ki teri founder kitni bitchy hai, and ofc our boat ride in that lake and gurudwara visit - AND MERA DELHI CAPITALS MANGO JAMUN SZN ",
        photo: memoryPhoto("assets/photos/month-04.jpg", "April", "#c9a0dc"),
        photos: memoryGallery("assets/photos/month-04.jpg", "April", "#c9a0dc", ["Kolkata calls every night", "Distance but same silly jokes", "You made far feel near"]),
    },
    {
        month: "May",
        title: "Still Missing You",
        message: "May was countdown mode: one more day, one more goodnight, one SECOND closer to you. When you came back and I dragged you to High Street. That longing I had to hug you again, to feel you again. God. I was so sos os soooooo over the fuckiong mooon when I saw your cab enter. Fuck...no more long distance ever ok.",
        photo: memoryPhoto("assets/photos/month-05.jpg", "May", "#6b8cff"),
        photos: memoryGallery("assets/photos/month-05.jpg", "May", "#6b8cff", ["Countdown to meeting again", "One more goodnight, one less day", "Missing you, always choosing you"]),
    },
    {
        month: "June",
        title: "Summer Together",
        message: "Kitni garmi hoti thi re, fir bhi hum chippak ke sote the hamesha lol. Making Anushkutella for you, our walks around HSR all the time, that park where me made a duggu friend. Just chill, nice slow month for us",
        photo: memoryPhoto("assets/photos/month-06.jpg", "June", "#ffa07a"),
        photos: memoryGallery("assets/photos/month-06.jpg", "June", "#ffa07a", ["Summer heat, mango treat", "Finally side-by-side afternoons", "Ordinary day, core memory"]),
    },
    {
        month: "July",
        title: "Candlelight Concert",
        message: "Candlelight concerttttttttttt aaaaaaaaaa I planned it so much I really really really wanted to go there with you it was sooi much fun then dancing in biergarten. I love you baby so much so fucking much.",
        photo: memoryPhoto("assets/photos/month-07.jpg", "July", "#20b2aa"),
        photos: memoryGallery("assets/photos/month-07.jpg", "July", "#20b2aa", ["Candlelight concert glow", "Violins + your hand in mine", "Soft music, softer eyes"]),
    },
    {
        month: "August",
        title: "My Birthday Month",
        message: "Best birthday gift wasn't cake, it was you saying 'mera motichoor ka ladooo' and meaning it. Made me feel more loved than I ever have in my life. IRL sarthak will handle this one better wink ALSO POPPPPPPYYYYYYYYYYYYYYYYYY.",
        photo: memoryPhoto("assets/photos/month-08.jpg", "August", "#f4a460"),
        photos: memoryGallery("assets/photos/month-08.jpg", "August", "#f4a460", ["Birthday month with you", "Cake, chaos, and your grin", "Best gift: 'aaj ka din tera hai'"]),
    },
    {
        month: "September",
        title: "Festive September",
        message: "Haha navratri ka kitna dekhte the ISS SAAL karenge. Iss month MAI GHAR AGAYA THA APNI BABY SE DOOR. sadlyf",
        photo: memoryPhoto("assets/photos/month-09.jpg", "September", "#cd853f"),
        photos: memoryGallery("assets/photos/month-09.jpg", "September", "#cd853f", ["Festive lights everywhere", "Dhol beats and matching steps", "Crowd loud, us louder"]),
    },
    {
        month: "October",
        title: "Spooky Season",
        message: "Tere sang ek Diwali toh banti hai shawtty",
        photo: memoryPhoto("assets/photos/month-10.jpg", "October", "#8b668b"),
        photos: memoryGallery("assets/photos/month-10.jpg", "October", "#8b668b", ["Spooky movie night", "You grabbed my arm every jump", "I acted brave, badly"]),
    },
    {
        month: "November",
        title: "Your Birthday!",
        message: "Your birthday felt like a festival to me. Sabh logo ko organise, making cards, making sure YOU FELT MORE LOVED THAN EVER WAS AND IS AND WILL BE MY ONLY GOAL",
        photo: memoryPhoto("assets/photos/month-11.jpg", "November", "#b8860b"),
        photos: memoryGallery("assets/photos/month-11.jpg", "November", "#b8860b", ["Happy birthday, Anushku", "You looked unreal that day", "Whole month felt like celebration"]),
    },
    {
        month: "December",
        title: "Holiday Magic",
        message: "December lights, CHRISTMAS CHRISTMAS winter air, and that calm feeling of 'haan, this is home'.",
        photo: memoryPhoto("assets/photos/month-12.jpg", "December", "#4a6fa5"),
        photos: memoryGallery("assets/photos/month-12.jpg", "December", "#4a6fa5", ["Winter lights and long talks", "Cold air, warm hoodie hugs", "Home feels like you"]),
    },
];

// ============================================
// GAME CONSTANTS
// ============================================
const GROUND_Y = sy(500);
const JUMP_FORCE = 780;
const MOVE_SPEED = 335;
const MOVEMENT_TUNING = {
    coyoteTime: 0.13,
    jumpBufferTime: 0.14,
    jumpCutMultiplier: 0.55,
    wallSlideSpeed: sy(235),
    wallJumpX: sx(480),
    wallJumpLockTime: 0.16,
    speedBoostMultiplier: 1.26,
};

// ============================================
// LEVEL CONFIGURATIONS (Jan → Dec)
// ============================================
const LEVEL_CONFIGS = [
    // 0: January - Cubbon Park (sunny park tutorial)
    {
        ground: { segments: [{x:0, w:800}] },
        platforms: [
            {x:200, y:440, w:100},
            {x:350, y:400, w:80},
            {x:500, y:430, w:100},
        ],
        hearts: [{x:150, y:450}, {x:250, y:410}, {x:400, y:370}, {x:520, y:400}, {x:620, y:450}],
        portal: {x:700, y:500},
        boyfriend: {x:740, y:500},
        mechanic: null,
        mechanicConfig: {},
        collectible: {sprite: "heart", label: "Hearts"},
        decorations: [{type:"leaves", count:6}, {type:"clouds", count:4}],
        extras: [{type:"sign", text:"Cubbon Park", x:400, y:GROUND_Y}, {type:"park"}],
    },
    // 1: February - Valentine's Day (hearts, romantic)
    {
        ground: { segments: [{x:0, w:800}] },
        platforms: [
            {x:140, y:430, w:96},
            {x:255, y:385, w:92},
            {x:390, y:350, w:88},
            {x:525, y:385, w:92},
            {x:640, y:430, w:96},
        ],
        hearts: [{x:230, y:420}, {x:305, y:365}, {x:390, y:332}, {x:475, y:365}, {x:550, y:420}],
        portal: {x:720, y:500},
        boyfriend: {x:740, y:500},
        mechanic: null,
        mechanicConfig: {},
        collectible: {sprite: "heart", label: "Hearts"},
        decorations: [{type:"petals", count:9}, {type:"flowers", count:8}, {type:"fireflies", count:4}],
        extras: [{type:"loveWonderland"}],
    },
    // 2: March - Boating (boat theme!)
    {
        ground: { segments: [{x:0, w:800}] },
        platforms: [
            {x:100, y:430, w:84},
            {x:230, y:440, w:116, type:"moving", moveToX:340, moveToY:440, moveSpeed:0.9},
            {x:280, y:390, w:70},
            {x:420, y:410, w:90},
            {x:560, y:380, w:80},
        ],
        hearts: [{x:140, y:400}, {x:300, y:365}, {x:450, y:380}, {x:590, y:345}, {x:700, y:456}],
        portal: {x:720, y:500},
        boyfriend: {x:740, y:500},
        mechanic: null,
        mechanicConfig: {},
        collectible: {sprite: "anchor-item", label: "Anchors"},
        decorations: [{type:"clouds", count:8}, {type:"petals", count:4}],
        extras: [{type:"waves"}],
    },
    // 3: April - Missing You (Kolkata, gentle wind)
    {
        ground: { segments: [{x:0, w:800}] },
        platforms: [
            {x:180, y:430, w:80},
            {x:320, y:400, w:70},
            {x:460, y:420, w:80},
            {x:580, y:390, w:80},
        ],
        hearts: [{x:150, y:400}, {x:250, y:430}, {x:380, y:370}, {x:520, y:390}, {x:650, y:450}],
        portal: {x:720, y:500},
        boyfriend: {x:740, y:500},
        mechanic: "wind",
        mechanicConfig: {windDirection:1, windStrength:35},
        collectible: {sprite: "letter-item", label: "Letters"},
        decorations: [{type:"petals", count:4}, {type:"clouds", count:5}],
        extras: [{type:"sign", text:"Kolkata →", x:400, y:GROUND_Y}, {type:"kolkataTram"}],
    },
    // 4: May - Still Missing You (Kolkata, first gap)
    {
        ground: { segments: [{x:0, w:350}, {x:500, w:300}] },
        platforms: [
            {x:370, y:440, w:80},
            {x:200, y:410, w:80},
            {x:580, y:420, w:80},
        ],
        hearts: [{x:180, y:380}, {x:300, y:440}, {x:410, y:410}, {x:550, y:440}, {x:650, y:390}],
        portal: {x:720, y:500},
        boyfriend: {x:740, y:500},
        mechanic: null,
        mechanicConfig: {},
        collectible: {sprite: "letter-item", label: "Letters"},
        decorations: [{type:"butterflies", count:4}, {type:"clouds", count:5}, {type:"petals", count:3}],
        extras: [{type:"sign", text:"Miss you!", x:150, y:GROUND_Y}, {type:"kolkataMonsoon"}],
    },
    // 5: June - Summer Together (flowery, moving platform)
    {
        ground: { segments: [{x:0, w:300}, {x:500, w:300}] },
        platforms: [
            {x:350, y:460, w:100, type:"moving", moveToX:450, moveToY:460, moveSpeed:1.2},
            {x:200, y:410, w:80},
            {x:600, y:420, w:80},
        ],
        hearts: [{x:180, y:380}, {x:260, y:440}, {x:400, y:430}, {x:560, y:440}, {x:650, y:390}],
        portal: {x:720, y:500},
        boyfriend: {x:740, y:500},
        mechanic: null,
        mechanicConfig: {},
        collectible: {sprite: "flower-item", label: "Flowers"},
        decorations: [{type:"flowers", count:9}, {type:"butterflies", count:5}, {type:"fireflies", count:3}],
        extras: [{type:"summerMango"}],
    },
    // 6: July - Candlelight Concert (candles, multi-gap)
    {
        ground: { segments: [{x:0, w:200}, {x:350, w:100}, {x:600, w:200}] },
        platforms: [
            {x:230, y:440, w:70},
            {x:320, y:400, w:70},
            {x:450, y:430, w:70},
            {x:530, y:390, w:80},
        ],
        hearts: [{x:100, y:440}, {x:260, y:410}, {x:370, y:370}, {x:490, y:400}, {x:560, y:360}],
        portal: {x:720, y:500},
        boyfriend: {x:740, y:500},
        mechanic: null,
        mechanicConfig: {},
        collectible: {sprite: "candle-item", label: "Candles"},
        decorations: [{type:"fireflies", count:10}],
        extras: [{type:"candles"}, {type:"concertStage"}],
    },
    // 7: August - Sarthak's Birthday (moving platforms, birthday cap)
    {
        ground: { segments: [{x:0, w:180}, {x:440, w:120}, {x:680, w:120}] },
        platforms: [
            {x:240, y:470, w:90, type:"moving", moveToX:360, moveToY:470, moveSpeed:0.8},
            {x:580, y:460, w:80, type:"moving", moveToX:640, moveToY:420, moveSpeed:1.0},
            {x:300, y:400, w:70},
            {x:500, y:410, w:70},
        ],
        hearts: [{x:100, y:440}, {x:280, y:440}, {x:390, y:370}, {x:520, y:380}, {x:700, y:440}],
        portal: {x:740, y:500},
        boyfriend: {x:760, y:500},
        mechanic: null,
        mechanicConfig: {},
        collectible: {sprite: "cake-item", label: "Cakes"},
        decorations: [{type:"fireflies", count:8}, {type:"petals", count:4}],
        extras: [{type:"birthdayCap"}, {type:"birthday"}],
    },
    // 8: September - Navratri Nights (festive, wind)
    {
        ground: { segments: [{x:0, w:250}, {x:400, w:150}, {x:650, w:150}] },
        platforms: [
            {x:280, y:440, w:80},
            {x:380, y:400, w:70},
            {x:520, y:430, w:70},
            {x:600, y:390, w:80},
        ],
        hearts: [{x:130, y:440}, {x:310, y:410}, {x:430, y:370}, {x:560, y:400}, {x:680, y:450}],
        portal: {x:730, y:500},
        boyfriend: {x:750, y:500},
        mechanic: "wind",
        mechanicConfig: {windDirection:-1, windStrength:30, gustStrength:14, gustSpeed:1.9},
        collectible: {sprite: "diya-item", label: "Diyas"},
        decorations: [{type:"fireflies", count:8}, {type:"petals", count:5}],
        extras: [{type:"navratri"}, {type:"festivalCrowd"}],
    },
    // 9: October - Spooky Season (vertical climb, jack-o-lanterns, bats)
    {
        ground: { segments: [{x:0, w:200}, {x:550, w:250}] },
        platforms: [
            {x:220, y:440, w:80},
            {x:320, y:390, w:80},
            {x:250, y:340, w:70},
            {x:370, y:300, w:80},
            {x:470, y:350, w:70},
            {x:500, y:420, w:70},
        ],
        hearts: [{x:100, y:440}, {x:260, y:410}, {x:350, y:360}, {x:300, y:310}, {x:420, y:270}],
        portal: {x:700, y:500},
        boyfriend: {x:740, y:500},
        mechanic: null,
        mechanicConfig: {},
        collectible: {sprite: "pumpkin-item", label: "Pumpkins"},
        decorations: [{type:"leaves", count:8}, {type:"fireflies", count:3}],
        extras: [{type:"bats", count:7}, {type:"spooky"}],
    },
    // 10: November - Her Birthday! (cakes, vertical mover)
    {
        ground: { segments: [{x:0, w:200}, {x:350, w:120}, {x:600, w:200}] },
        platforms: [
            {x:240, y:440, w:70},
            {x:420, y:400, w:80, type:"moving", moveToX:420, moveToY:340, moveSpeed:0.7},
            {x:520, y:420, w:70},
            {x:300, y:380, w:70},
        ],
        hearts: [{x:120, y:440}, {x:280, y:410}, {x:380, y:370}, {x:460, y:320}, {x:650, y:440}],
        portal: {x:730, y:500},
        boyfriend: {x:750, y:500},
        mechanic: null,
        mechanicConfig: {},
        collectible: {sprite: "cake-item", label: "Cakes"},
        decorations: [{type:"flowers", count:6}, {type:"petals", count:7}, {type:"fireflies", count:5}],
        extras: [{type:"birthday"}, {type:"birthdayBanner"}],
    },
    // 11: December - Holiday Magic (christmas trees, ice + mover)
    {
        ground: { segments: [{x:0, w:180}, {x:320, w:100}, {x:550, w:100}, {x:700, w:100}] },
        platforms: [
            {x:210, y:440, w:70},
            {x:350, y:400, w:70},
            {x:430, y:360, w:70},
            {x:500, y:400, w:70, type:"moving", moveToX:560, moveToY:400, moveSpeed:0.9},
            {x:640, y:430, w:70},
        ],
        hearts: [{x:100, y:440}, {x:260, y:410}, {x:390, y:370}, {x:470, y:330}, {x:670, y:400}],
        portal: {x:750, y:500},
        boyfriend: {x:770, y:500},
        mechanic: "ice",
        mechanicConfig: {friction: 0.97},
        collectible: {sprite: "xmas-tree-item", label: "Trees"},
        decorations: [{type:"snowflakes", count:14}, {type:"fireflies", count:3}],
        extras: [{type:"christmas"}, {type:"christmasTown"}],
    },
];

function getScaledLevelConfigs() {
    return LEVEL_CONFIGS.map(level => ({
        ...level,
        ground: {
            segments: level.ground.segments.map(seg => ({
                x: sx(seg.x),
                w: sx(seg.w),
            })),
        },
        platforms: level.platforms.map(p => ({
            ...p,
            x: sx(p.x),
            y: sy(p.y),
            w: sx(p.w),
            moveToX: typeof p.moveToX === "number" ? sx(p.moveToX) : p.moveToX,
            moveToY: typeof p.moveToY === "number" ? sy(p.moveToY) : p.moveToY,
        })),
        hearts: level.hearts.map(h => ({ x: sx(h.x), y: sy(h.y) })),
        portal: {
            x: Math.min(sx(730), Math.max(sx(70), sx(level.portal.x))),
            y: sy(level.portal.y),
        },
        boyfriend: {
            x: Math.min(sx(760), Math.max(sx(85), sx(level.boyfriend.x))),
            y: sy(level.boyfriend.y),
        },
    }));
}

const ACTIVE_LEVEL_CONFIGS = getScaledLevelConfigs();

const LEVEL_COMPLEXITY_ADDONS = [
    {
        platforms: [
            { x: 620, y: 360, w: 76 },
            { x: 510, y: 325, w: 70 },
        ],
        hazards: [
            { x: 362, y: 376, w: 46, type: "spikes" },
            { x: 608, y: 500, w: 44, type: "spikes" },
        ],
    },
    {
        platforms: [
            { x: 250, y: 338, w: 72 },
            { x: 410, y: 314, w: 74 },
            { x: 565, y: 294, w: 70 },
        ],
        hazards: [
            { x: 596, y: 336, w: 42, type: "spikes" },
            { x: 336, y: 352, type: "orb", moveToX: 476, moveToY: 334, speed: 1.05 },
        ],
    },
    {
        platforms: [
            { x: 220, y: 330, w: 80, type: "moving", moveToX: 340, moveToY: 330, moveSpeed: 0.9 },
            { x: 520, y: 306, w: 86 },
        ],
        hazards: [
            { x: 434, y: 386, w: 52, type: "spikes" },
            { x: 286, y: 352, type: "orb", moveToX: 392, moveToY: 334, speed: 1.1 },
        ],
    },
    {
        platforms: [
            { x: 250, y: 340, w: 74 },
            { x: 420, y: 310, w: 70, type: "moving", moveToX: 500, moveToY: 290, moveSpeed: 0.9 },
        ],
        hazards: [
            { x: 332, y: 376, w: 46, type: "spikes" },
            { x: 510, y: 396, type: "orb", moveToX: 628, moveToY: 372, speed: 1.0 },
        ],
    },
    {
        platforms: [
            { x: 360, y: 360, w: 80 },
            { x: 450, y: 330, w: 76, type: "moving", moveToX: 520, moveToY: 330, moveSpeed: 0.8 },
        ],
        hazards: [
            { x: 388, y: 416, w: 42, type: "spikes" },
            { x: 598, y: 396, w: 38, type: "spikes" },
            { x: 430, y: 420, type: "orb", moveToX: 546, moveToY: 384, speed: 1.15 },
        ],
    },
    {
        platforms: [
            { x: 300, y: 352, w: 70 },
            { x: 470, y: 326, w: 74, type: "moving", moveToX: 560, moveToY: 326, moveSpeed: 0.95 },
        ],
        hazards: [
            { x: 612, y: 396, w: 40, type: "spikes" },
            { x: 402, y: 430, type: "orb", moveToX: 506, moveToY: 402, speed: 0.95 },
        ],
    },
    {
        platforms: [
            { x: 250, y: 356, w: 66 },
            { x: 405, y: 324, w: 70 },
            { x: 560, y: 296, w: 78 },
        ],
        hazards: [
            { x: 462, y: 406, w: 44, type: "spikes" },
            { x: 542, y: 366, w: 42, type: "spikes" },
            { x: 340, y: 366, type: "orb", moveToX: 488, moveToY: 332, speed: 1.2 },
        ],
    },
    {
        platforms: [
            { x: 200, y: 372, w: 70, type: "moving", moveToX: 330, moveToY: 342, moveSpeed: 1.1 },
            { x: 420, y: 336, w: 70 },
            { x: 610, y: 306, w: 74 },
        ],
        hazards: [
            { x: 312, y: 376, w: 44, type: "spikes" },
            { x: 512, y: 386, w: 42, type: "spikes" },
            { x: 430, y: 418, type: "orb", moveToX: 564, moveToY: 378, speed: 1.15 },
        ],
    },
    {
        platforms: [
            { x: 260, y: 352, w: 70 },
            { x: 500, y: 330, w: 74, type: "moving", moveToX: 580, moveToY: 300, moveSpeed: 1.0 },
        ],
        hazards: [
            { x: 392, y: 376, w: 44, type: "spikes" },
            { x: 612, y: 366, w: 44, type: "spikes" },
            { x: 510, y: 402, type: "orb", moveToX: 620, moveToY: 374, speed: 1.1 },
        ],
    },
    {
        platforms: [
            { x: 360, y: 272, w: 72 },
            { x: 470, y: 238, w: 68 },
            { x: 610, y: 288, w: 72 },
        ],
        hazards: [
            { x: 234, y: 416, w: 40, type: "spikes" },
            { x: 484, y: 326, w: 38, type: "spikes" },
            { x: 360, y: 320, type: "orb", moveToX: 548, moveToY: 284, speed: 1.25 },
        ],
    },
    {
        platforms: [
            { x: 260, y: 350, w: 72 },
            { x: 540, y: 320, w: 72 },
            { x: 420, y: 286, w: 72, type: "moving", moveToX: 500, moveToY: 250, moveSpeed: 0.9 },
        ],
        hazards: [
            { x: 312, y: 356, w: 42, type: "spikes" },
            { x: 536, y: 396, w: 38, type: "spikes" },
            { x: 455, y: 330, type: "orb", moveToX: 640, moveToY: 292, speed: 1.18 },
        ],
    },
    {
        platforms: [
            { x: 260, y: 354, w: 70 },
            { x: 440, y: 320, w: 72 },
            { x: 610, y: 288, w: 70, type: "moving", moveToX: 700, moveToY: 288, moveSpeed: 0.95 },
        ],
        hazards: [
            { x: 362, y: 376, w: 42, type: "spikes" },
            { x: 512, y: 376, w: 42, type: "spikes" },
            { x: 654, y: 406, w: 34, type: "spikes" },
            { x: 470, y: 338, type: "orb", moveToX: 648, moveToY: 294, speed: 1.28 },
        ],
    },
];

function getScaledLevelAddon(monthIndex) {
    const addon = LEVEL_COMPLEXITY_ADDONS[monthIndex] || { platforms: [], hazards: [] };
    return {
        platforms: (addon.platforms || []).map(p => ({
            ...p,
            x: sx(p.x),
            y: sy(p.y),
            w: sx(p.w),
            moveToX: typeof p.moveToX === "number" ? sx(p.moveToX) : p.moveToX,
            moveToY: typeof p.moveToY === "number" ? sy(p.moveToY) : p.moveToY,
        })),
        hazards: (addon.hazards || []).map(h => ({
            ...h,
            x: sx(h.x),
            y: sy(h.y),
            w: typeof h.w === "number" ? sx(h.w) : h.w,
            moveToX: typeof h.moveToX === "number" ? sx(h.moveToX) : h.moveToX,
            moveToY: typeof h.moveToY === "number" ? sy(h.moveToY) : h.moveToY,
            speed: h.speed,
        })),
    };
}

const LEVEL_CHECKPOINTS = [
    [],
    [],
    [{ x: 380, y: 500 }],
    [{ x: 350, y: 500 }],
    [{ x: 580, y: 500 }],
    [{ x: 420, y: 500 }],
    [{ x: 410, y: 500 }],
    [{ x: 520, y: 500 }],
    [{ x: 450, y: 500 }],
    [{ x: 430, y: 500 }, { x: 620, y: 500 }],
    [{ x: 450, y: 500 }],
    [{ x: 420, y: 500 }, { x: 730, y: 500 }],
];

function getScaledLevelCheckpoints(monthIndex) {
    const checkpoints = LEVEL_CHECKPOINTS[monthIndex] || [];
    return checkpoints.map(cp => ({
        x: sx(cp.x),
        y: sy(cp.y),
    }));
}

const MONTH_SPECIAL_OBJECTS = [
    [{ type: "springPad", x: 246, y: 500, power: 1.06 }],
    [{ type: "dashGem", x: 430, y: 350, cooldown: 6.5 }],
    [{ type: "dashGem", x: 610, y: 372, cooldown: 5.8 }],
    [{ type: "springPad", x: 430, y: 500, power: 1.14 }],
    [{ type: "glideZone", x: 390, y: 430, w: 140, h: 130, lift: 220 }],
    [{ type: "dashGem", x: 392, y: 418, cooldown: 5.4 }],
    [{ type: "springPad", x: 526, y: 390, power: 1.2 }],
    [{ type: "dashGem", x: 546, y: 348, cooldown: 5.8 }],
    [{ type: "glideZone", x: 530, y: 402, w: 130, h: 150, lift: 210 }],
    [{ type: "springPad", x: 378, y: 340, power: 1.24 }],
    [{ type: "dashGem", x: 462, y: 314, cooldown: 4.8 }],
    [{ type: "springPad", x: 498, y: 364, power: 1.22 }, { type: "glideZone", x: 648, y: 380, w: 120, h: 150, lift: 205 }],
];

function getScaledMonthSpecialObjects(monthIndex) {
    const specials = MONTH_SPECIAL_OBJECTS[monthIndex] || [];
    return specials.map((obj) => ({
        ...obj,
        x: sx(obj.x),
        y: sy(obj.y),
        w: typeof obj.w === "number" ? sx(obj.w) : obj.w,
        h: typeof obj.h === "number" ? sy(obj.h) : obj.h,
        lift: typeof obj.lift === "number" ? sy(obj.lift) : obj.lift,
    }));
}

const MONTH_MISSIONS = [
    { type: "tokens", title: "Park Picnic", description: "Collect park keepsakes", target: 2, points: [[230, 450], [560, 438]], icon: "✦" },
    { type: "combo", title: "Heart Streak", description: "Collect 3 in quick succession", target: 3, windowSec: 4.2 },
    { type: "rings", title: "Sail Through Rings", description: "Pass through all yacht rings", target: 3, points: [[245, 408], [450, 372], [670, 342]], icon: "◌" },
    { type: "tokens", title: "Catch Letters", description: "Retrieve drifting letters", target: 3, points: [[220, 400], [430, 360], [640, 420]], icon: "✉" },
    { type: "airtime", title: "Sky Time", description: "Stay airborne for 7 seconds", target: 7 },
    { type: "ride", title: "Platform Rider", description: "Ride moving platforms for 5 seconds", target: 5 },
    { type: "tokens", title: "Concert Notes", description: "Collect all glowing notes", target: 4, points: [[160, 430], [310, 390], [490, 360], [610, 410]], icon: "♪" },
    { type: "tokens", title: "Birthday Balloons", description: "Pop all party balloons", target: 4, points: [[120, 430], [310, 430], [500, 370], [700, 430]], icon: "◍" },
    { type: "rings", title: "Garba Route", description: "Dance through every loop", target: 4, points: [[150, 430], [330, 395], [540, 390], [690, 435]], icon: "◎" },
    { type: "tokens", title: "Lantern Run", description: "Collect spooky lanterns", target: 3, points: [[240, 410], [370, 310], [500, 370]], icon: "☾" },
    { type: "combo", title: "Birthday Combo", description: "Build a 4-item combo chain", target: 4, windowSec: 4.6 },
    { type: "ride", title: "Ice Rider", description: "Ride moving ice for 6 seconds", target: 6 },
];

function getMissionConfig(monthIndex) {
    const mission = MONTH_MISSIONS[monthIndex];
    if (!mission) return null;
    if (!mission.points) return mission;
    return {
        ...mission,
        points: mission.points.map(([x, y]) => [sx(x), sy(y)]),
    };
}

function emitGameLog(tag, details = {}) {
    window.dispatchEvent(new CustomEvent("game-log", {
        detail: {
            tag,
            t: Date.now(),
            ...details,
        },
    }));
}

// ============================================
// GAME STATE
// ============================================
let memoryTriggered = false;
let heartsCollected = 0;
let selectedCharacterId = "anushku";
let gameCompleted = false;

const CHARACTER_VARIANTS = [
    { id: "anushku", label: "Anushku", dress: "#ff6b8a", shoe: "#ff6b8a", ribbon: "#ff6b8a" },
    { id: "panushku", label: "Panushku", dress: "#8e78ff", shoe: "#8e78ff", ribbon: "#8e78ff" },
    { id: "danushku", label: "Danushku", dress: "#5fbf82", shoe: "#5fbf82", ribbon: "#5fbf82" },
    { id: "tanushku", label: "Tanushku", dress: "#ff9f5c", shoe: "#ff9f5c", ribbon: "#ff9f5c" },
];

const SARTHU_DIALOG_LINES = ["help me", "miss you", "my anushku find me", "save me from kanushku", "maine kisi ka kya bigada hai"];

// ============================================
// LOAD SPRITES
// ============================================

function makePlayerSpriteSvg({ dress, shoe, ribbon }) {
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64" width="48" height="64">
  <ellipse cx="24" cy="18" rx="14" ry="12" fill="#2c1810"/>
  <path d="M10 18 Q6 38 12 50" stroke="#2c1810" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M38 18 Q42 38 36 50" stroke="#2c1810" stroke-width="6" fill="none" stroke-linecap="round"/>
  <ellipse cx="24" cy="20" rx="11" ry="11" fill="#ffecd2"/>
  <ellipse cx="18" cy="24" rx="3" ry="2" fill="#ffb6c1" opacity="0.5"/>
  <ellipse cx="30" cy="24" rx="3" ry="2" fill="#ffb6c1" opacity="0.5"/>
  <ellipse cx="20" cy="20" rx="2" ry="3" fill="#4a3728"/>
  <ellipse cx="28" cy="20" rx="2" ry="3" fill="#4a3728"/>
  <circle cx="21" cy="19" r="1" fill="white"/>
  <circle cx="29" cy="19" r="1" fill="white"/>
  <path d="M22 26 Q24 29 26 26" stroke="#e88a8a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M14 14 Q18 6 24 8 Q30 6 34 14" fill="#2c1810"/>
  <circle cx="36" cy="12" r="3" fill="${ribbon}"/>
  <path d="M16 32 L12 54 L36 54 L32 32 Q24 38 16 32" fill="${dress}"/>
  <circle cx="24" cy="40" r="1.5" fill="white" opacity="0.8"/>
  <circle cx="24" cy="46" r="1.5" fill="white" opacity="0.8"/>
  <rect x="18" y="52" width="5" height="10" rx="2" fill="#ffecd2"/>
  <rect x="25" y="52" width="5" height="10" rx="2" fill="#ffecd2"/>
  <ellipse cx="20.5" cy="62" rx="4" ry="2.5" fill="${shoe}"/>
  <ellipse cx="27.5" cy="62" rx="4" ry="2.5" fill="${shoe}"/>
</svg>
`;
}

function getSelectedPlayerSprite() {
    return `player-${selectedCharacterId}`;
}

function getCharacterLabel(id = selectedCharacterId) {
    const match = CHARACTER_VARIANTS.find(v => v.id === id);
    return match ? match.label : "Anushku";
}

CHARACTER_VARIANTS.forEach((variant) => {
    loadSprite(`player-${variant.id}`, "data:image/svg+xml," + encodeURIComponent(makePlayerSpriteSvg(variant)));
});

// Boy character (Sarthak) waiting at goal
loadSprite("boyfriend", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 64" width="48" height="64">
  <ellipse cx="24" cy="16" rx="12" ry="10" fill="#1a1a1a"/>
  <path d="M14 12 Q18 4 24 6 Q30 4 34 12" fill="#1a1a1a"/>
  <ellipse cx="24" cy="20" rx="10" ry="10" fill="#ffecd2"/>
  <ellipse cx="20" cy="20" rx="2" ry="2.5" fill="#4a3728"/>
  <ellipse cx="28" cy="20" rx="2" ry="2.5" fill="#4a3728"/>
  <circle cx="21" cy="19" r="0.8" fill="white"/>
  <circle cx="29" cy="19" r="0.8" fill="white"/>
  <path d="M22 25 Q24 28 26 25" stroke="#d4846a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M20 10 Q24 5 28 10" stroke="#2a2a2a" stroke-width="2" fill="none"/>
  <path d="M14 30 L12 54 L36 54 L34 30 Q24 36 14 30" fill="#6b8cff"/>
  <line x1="21" y1="38" x2="21" y2="46" stroke="white" stroke-width="1.5"/>
  <line x1="27" y1="38" x2="27" y2="46" stroke="white" stroke-width="1.5"/>
  <rect x="18" y="52" width="5" height="10" rx="2" fill="#3a3a4a"/>
  <rect x="25" y="52" width="5" height="10" rx="2" fill="#3a3a4a"/>
  <ellipse cx="20.5" cy="62" rx="4" ry="2.5" fill="#2a2a2a"/>
  <ellipse cx="27.5" cy="62" rx="4" ry="2.5" fill="#2a2a2a"/>
</svg>
`));

loadSprite("kanushku", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 68" width="52" height="68">
  <ellipse cx="26" cy="16" rx="13" ry="11" fill="#140d1f"/>
  <path d="M13 12 Q18 2 26 5 Q34 2 39 12" fill="#140d1f"/>
  <ellipse cx="26" cy="21" rx="11" ry="11" fill="#f0e4d7"/>
  <ellipse cx="22" cy="21" rx="2" ry="2.4" fill="#392437"/>
  <ellipse cx="30" cy="21" rx="2" ry="2.4" fill="#392437"/>
  <path d="M22 27 Q26 30 30 27" stroke="#b46a8f" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M14 32 L12 58 L40 58 L38 32 Q26 40 14 32" fill="#4e2f63"/>
  <path d="M20 39 L17 48 L26 44 L35 48 L32 39" fill="#6e4790" opacity="0.85"/>
  <rect x="20" y="56" width="5" height="10" rx="2" fill="#2a2035"/>
  <rect x="27" y="56" width="5" height="10" rx="2" fill="#2a2035"/>
  <ellipse cx="22.5" cy="66" rx="4" ry="2.5" fill="#201829"/>
  <ellipse cx="29.5" cy="66" rx="4" ry="2.5" fill="#201829"/>
  <circle cx="40" cy="14" r="3" fill="#ff5b8f"/>
  <path d="M38 10 Q42 6 46 10" stroke="#ff5b8f" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</svg>
`));

// Collectible heart (like Mario coin)
loadSprite("heart", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff9eb5"/>
      <stop offset="100%" style="stop-color:#ff6b8a"/>
    </linearGradient>
  </defs>
  <path d="M16 28 C6 20 2 14 2 9 C2 4 6 2 10 2 C13 2 15 4 16 6 C17 4 19 2 22 2 C26 2 30 4 30 9 C30 14 26 20 16 28Z" fill="url(#hg)"/>
  <ellipse cx="9" cy="9" rx="4" ry="3" fill="white" opacity="0.5"/>
</svg>
`));

// Portal/Goal
loadSprite("portal", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 80" width="60" height="80">
  <path d="M8 80 L8 30 Q8 8 30 8 Q52 8 52 30 L52 80" fill="none" stroke="#ff8fa3" stroke-width="6"/>
  <path d="M14 80 L14 32 Q14 14 30 14 Q46 14 46 32 L46 80" fill="#fff0f5" opacity="0.3"/>
  <circle cx="20" cy="25" r="2" fill="white" opacity="0.8"/>
  <circle cx="40" cy="28" r="1.5" fill="white" opacity="0.8"/>
  <circle cx="30" cy="18" r="2" fill="white" opacity="0.8"/>
</svg>
`));

// ============================================
// THEMED SPRITES
// ============================================

// 1. Anchor collectible (32x32) — nautical anchor in steel blue/navy
loadSprite("anchor-item", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="anc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6baed6"/>
      <stop offset="100%" stop-color="#3a6fa0"/>
    </linearGradient>
  </defs>
  <circle cx="16" cy="5" r="3.5" fill="none" stroke="url(#anc)" stroke-width="2"/>
  <rect x="15" y="8" width="2" height="16" rx="1" fill="url(#anc)"/>
  <rect x="9" y="14" width="14" height="2" rx="1" fill="url(#anc)"/>
  <path d="M8 24 Q8 28 12 28 L12 26 Q10 26 10 24Z" fill="url(#anc)"/>
  <path d="M24 24 Q24 28 20 28 L20 26 Q22 26 22 24Z" fill="url(#anc)"/>
  <path d="M10 24 L8 24" stroke="url(#anc)" stroke-width="2" stroke-linecap="round"/>
  <path d="M22 24 L24 24" stroke="url(#anc)" stroke-width="2" stroke-linecap="round"/>
  <circle cx="16" cy="5" r="1.5" fill="none" stroke="white" stroke-width="0.5" opacity="0.4"/>
  <rect x="15.5" y="9" width="1" height="6" rx="0.5" fill="white" opacity="0.25"/>
</svg>
`));

// 2. Letter/envelope collectible (32x32) — sealed with a heart
loadSprite("letter-item", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="env" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#faf0e0"/>
      <stop offset="100%" stop-color="#e8d5b8"/>
    </linearGradient>
  </defs>
  <rect x="3" y="8" width="26" height="18" rx="2" fill="url(#env)" stroke="#c9b896" stroke-width="0.8"/>
  <path d="M3 8 L16 18 L29 8" fill="none" stroke="#c9b896" stroke-width="0.8" stroke-linejoin="round"/>
  <path d="M3 26 L12 17" fill="none" stroke="#c9b896" stroke-width="0.5"/>
  <path d="M29 26 L20 17" fill="none" stroke="#c9b896" stroke-width="0.5"/>
  <path d="M16 15 C14.5 13 12 13.2 12 15 C12 16.5 14 18 16 19.5 C18 18 20 16.5 20 15 C20 13.2 17.5 13 16 15Z" fill="#ff7b9c"/>
  <path d="M13.5 14.5 Q14 13.8 15 14.2" fill="none" stroke="white" stroke-width="0.5" opacity="0.5"/>
</svg>
`));

// 3. Flower collectible (32x32) — pink petals, yellow center, green stem
loadSprite("flower-item", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <radialGradient id="flp" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffb0c4"/>
      <stop offset="100%" stop-color="#ff7a9a"/>
    </radialGradient>
    <radialGradient id="flc" cx="40%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#fff176"/>
      <stop offset="100%" stop-color="#ffca28"/>
    </radialGradient>
  </defs>
  <rect x="15" y="19" width="2" height="10" rx="1" fill="#4caf50"/>
  <ellipse cx="12" cy="26" rx="3" ry="1.5" fill="#66bb6a" transform="rotate(-30 12 26)"/>
  <ellipse cx="16" cy="8" rx="4" ry="5.5" fill="url(#flp)"/>
  <ellipse cx="16" cy="18" rx="4" ry="5.5" fill="url(#flp)"/>
  <ellipse cx="10" cy="11" rx="4" ry="5.5" fill="url(#flp)" transform="rotate(60 10 11)"/>
  <ellipse cx="22" cy="11" rx="4" ry="5.5" fill="url(#flp)" transform="rotate(-60 22 11)"/>
  <ellipse cx="10" cy="17" rx="4" ry="5.5" fill="url(#flp)" transform="rotate(-60 10 17)"/>
  <ellipse cx="22" cy="17" rx="4" ry="5.5" fill="url(#flp)" transform="rotate(60 22 17)"/>
  <circle cx="16" cy="13" r="4" fill="url(#flc)"/>
  <circle cx="14.5" cy="11.8" r="0.8" fill="white" opacity="0.5"/>
</svg>
`));

// 4. Candle collectible (32x32) — lit candle with warm flame
loadSprite("candle-item", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="cwx" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff8ee"/>
      <stop offset="100%" stop-color="#f0e4d0"/>
    </linearGradient>
    <radialGradient id="cfl" cx="50%" cy="70%" r="50%">
      <stop offset="0%" stop-color="#fff8b0"/>
      <stop offset="40%" stop-color="#ffb830"/>
      <stop offset="100%" stop-color="#ff6f00"/>
    </radialGradient>
    <linearGradient id="cbs" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#d4a840"/>
      <stop offset="100%" stop-color="#a07828"/>
    </linearGradient>
  </defs>
  <rect x="10" y="26" width="12" height="4" rx="1.5" fill="url(#cbs)"/>
  <rect x="11" y="26" width="10" height="1" rx="0.5" fill="#e8c860" opacity="0.6"/>
  <rect x="12" y="10" width="8" height="17" rx="2" fill="url(#cwx)" stroke="#ddd0b8" stroke-width="0.5"/>
  <rect x="13" y="11" width="2" height="14" rx="1" fill="white" opacity="0.2"/>
  <line x1="16" y1="10" x2="16" y2="6" stroke="#444" stroke-width="0.8"/>
  <ellipse cx="16" cy="4" rx="3.5" ry="5" fill="url(#cfl)" opacity="0.9"/>
  <ellipse cx="16" cy="3.5" rx="1.5" ry="2.5" fill="#fff8b0" opacity="0.8"/>
  <ellipse cx="16" cy="4" rx="4.5" ry="5.5" fill="#ff9900" opacity="0.15"/>
</svg>
`));

// 5. Diya collectible (32x32) — Indian clay oil lamp
loadSprite("diya-item", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="dtr" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e09060"/>
      <stop offset="100%" stop-color="#b06040"/>
    </linearGradient>
    <radialGradient id="dfl" cx="50%" cy="80%" r="50%">
      <stop offset="0%" stop-color="#fff8a0"/>
      <stop offset="40%" stop-color="#ffb020"/>
      <stop offset="100%" stop-color="#ff6f00"/>
    </radialGradient>
  </defs>
  <ellipse cx="16" cy="24" rx="13" ry="4" fill="url(#dtr)"/>
  <path d="M3 24 Q3 20 8 18 L24 18 Q29 20 29 24" fill="url(#dtr)"/>
  <ellipse cx="16" cy="18" rx="8" ry="2.5" fill="#c87850"/>
  <ellipse cx="16" cy="18" rx="6" ry="1.8" fill="#b06840" opacity="0.8"/>
  <ellipse cx="16" cy="24" rx="13" ry="2.5" fill="#c07050" opacity="0.6"/>
  <rect x="14.5" y="14" width="3" height="1" rx="0.5" fill="#e09060" opacity="0.6"/>
  <line x1="16" y1="16" x2="16" y2="11" stroke="#555" stroke-width="0.7"/>
  <ellipse cx="16" cy="8" rx="3" ry="4.5" fill="url(#dfl)" opacity="0.9"/>
  <ellipse cx="16" cy="7" rx="1.3" ry="2.2" fill="#fff8a0" opacity="0.85"/>
  <ellipse cx="16" cy="8" rx="4" ry="5" fill="#ff9900" opacity="0.12"/>
  <ellipse cx="11" cy="22" rx="2" ry="0.8" fill="white" opacity="0.15"/>
</svg>
`));

// 6. Pumpkin collectible (32x32) — carved jack-o-lantern
loadSprite("pumpkin-item", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <radialGradient id="pkb" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#ffa030"/>
      <stop offset="100%" stop-color="#e06800"/>
    </radialGradient>
    <radialGradient id="pkg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffcc00" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ff8800" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="16" cy="19" rx="13" ry="11" fill="url(#pkb)"/>
  <ellipse cx="10" cy="19" rx="6" ry="10.5" fill="#ff9020" opacity="0.6"/>
  <ellipse cx="22" cy="19" rx="6" ry="10.5" fill="#ff9020" opacity="0.6"/>
  <path d="M14 6 Q13 2 16 2 Q17 2 16 6" fill="#4a8c2a"/>
  <rect x="15" y="4" width="2" height="5" rx="1" fill="#3e7a22"/>
  <path d="M10 16 L12 13 L14 16Z" fill="#2a1a00"/>
  <path d="M18 16 L20 13 L22 16Z" fill="#2a1a00"/>
  <path d="M9 22 L10.5 20 L12 22 L13.5 20 L15 22 L16.5 20 L18 22 L19.5 20 L21 22 L22.5 20 L23 22" fill="none" stroke="#2a1a00" stroke-width="1.5" stroke-linejoin="round"/>
  <ellipse cx="16" cy="19" rx="8" ry="6" fill="url(#pkg)"/>
</svg>
`));

// 7. Cake collectible (32x32) — birthday cake with candle
loadSprite("cake-item", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="cak" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffcdd8"/>
      <stop offset="100%" stop-color="#ffaabb"/>
    </linearGradient>
    <radialGradient id="ckf" cx="50%" cy="70%" r="50%">
      <stop offset="0%" stop-color="#fff8b0"/>
      <stop offset="100%" stop-color="#ff9800"/>
    </radialGradient>
  </defs>
  <rect x="5" y="16" width="22" height="12" rx="2" fill="url(#cak)"/>
  <rect x="5" y="22" width="22" height="6" rx="2" fill="#ff8fa3"/>
  <path d="M5 17 Q9 14 12 17 Q15 14 18 17 Q21 14 24 17 L27 17 L27 19 Q24 16 21 19 Q18 16 15 19 Q12 16 9 19 L5 19Z" fill="white" opacity="0.85"/>
  <rect x="5" y="20" width="22" height="1.5" rx="0.5" fill="#f8a0b0" opacity="0.5"/>
  <circle cx="10" cy="24" r="0.8" fill="#ff6090"/>
  <circle cx="14" cy="25" r="0.8" fill="#80d0ff"/>
  <circle cx="18" cy="24" r="0.8" fill="#a0ff80"/>
  <circle cx="22" cy="25" r="0.8" fill="#ffe060"/>
  <rect x="15" y="9" width="2" height="7" rx="1" fill="white" stroke="#eee" stroke-width="0.3"/>
  <line x1="16" y1="9" x2="16" y2="6" stroke="#555" stroke-width="0.6"/>
  <ellipse cx="16" cy="4.5" rx="2" ry="3" fill="url(#ckf)"/>
  <ellipse cx="16" cy="4" rx="0.8" ry="1.5" fill="#fff8b0" opacity="0.8"/>
</svg>
`));

// 8. Christmas tree collectible (32x32) — layered green triangles with ornaments
loadSprite("xmas-tree-item", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="xt1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#43a047"/>
      <stop offset="100%" stop-color="#2e7d32"/>
    </linearGradient>
  </defs>
  <rect x="13" y="26" width="6" height="4" rx="1" fill="#6d4c41"/>
  <rect x="14" y="27" width="2" height="3" rx="0.5" fill="#8d6e63" opacity="0.5"/>
  <polygon points="16,3 8,14 24,14" fill="#2e7d32"/>
  <polygon points="16,8 6,20 26,20" fill="#388e3c"/>
  <polygon points="16,14 4,26 28,26" fill="#43a047"/>
  <polygon points="16,3 12,8 20,8" fill="#4caf50" opacity="0.3"/>
  <circle cx="12" cy="17" r="1.5" fill="#ef5350"/>
  <circle cx="20" cy="22" r="1.5" fill="#42a5f5"/>
  <circle cx="14" cy="23" r="1.3" fill="#ffee58"/>
  <circle cx="19" cy="16" r="1.2" fill="#ef5350"/>
  <circle cx="10" cy="22" r="1.2" fill="#42a5f5"/>
  <polygon points="16,0 17,3 15,3" fill="#ffd54f"/>
  <polygon points="16,0 14.5,2.5 17.5,2.5" fill="#ffd54f"/>
  <polygon points="13.5,1.5 16,0 18.5,1.5" fill="#ffecb3" opacity="0.6"/>
</svg>
`));

// 9. Bat decoration (32x20) — dark bat silhouette with red eyes
loadSprite("bat", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20" width="32" height="20">
  <defs>
    <radialGradient id="btb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3a2050"/>
      <stop offset="100%" stop-color="#1a0a2a"/>
    </radialGradient>
  </defs>
  <ellipse cx="16" cy="10" rx="4" ry="3.5" fill="url(#btb)"/>
  <path d="M12 10 Q10 4 6 3 Q4 2 2 5 Q3 4 4 7 Q2 8 1 6 Q0 9 3 11 Q5 13 8 12 Q10 12 12 10Z" fill="url(#btb)"/>
  <path d="M20 10 Q22 4 26 3 Q28 2 30 5 Q29 4 28 7 Q30 8 31 6 Q32 9 29 11 Q27 13 24 12 Q22 12 20 10Z" fill="url(#btb)"/>
  <circle cx="14" cy="9" r="1" fill="#ff3030"/>
  <circle cx="18" cy="9" r="1" fill="#ff3030"/>
  <circle cx="14.3" cy="8.7" r="0.4" fill="white" opacity="0.6"/>
  <circle cx="18.3" cy="8.7" r="0.4" fill="white" opacity="0.6"/>
  <path d="M14 13 Q16 15 18 13" fill="#2a1040" opacity="0.6"/>
</svg>
`));

// 10. Bird decoration (24x16) — small bird in flight
loadSprite("bird", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 16" width="24" height="16">
  <defs>
    <linearGradient id="brb" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6a6a7a"/>
      <stop offset="100%" stop-color="#4a4a5a"/>
    </linearGradient>
  </defs>
  <ellipse cx="12" cy="9" rx="5" ry="3" fill="url(#brb)"/>
  <path d="M7 9 Q4 4 1 3 Q3 5 2 7 Q4 6 7 9Z" fill="#5a5a6a"/>
  <path d="M7 8 Q5 3 2 2" fill="none" stroke="#5a5a6a" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M17 9 Q16 6 18 5 Q18 7 20 6 Q19 8 17 9Z" fill="#6a6a7a" opacity="0.7"/>
  <circle cx="15" cy="8" r="1.8" fill="#555565"/>
  <circle cx="15.8" cy="7.5" r="0.8" fill="#222"/>
  <circle cx="16" cy="7.3" r="0.3" fill="white" opacity="0.7"/>
  <polygon points="17.5,8 20,7.5 17.5,8.5" fill="#e07830"/>
  <path d="M7 11 Q8 12 10 11" fill="none" stroke="#5a5a6a" stroke-width="0.5"/>
</svg>
`));

// 11. Sun decoration (48x48) — warm golden sun with rays
loadSprite("sun-sprite", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <defs>
    <radialGradient id="sng" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff8b0"/>
      <stop offset="50%" stop-color="#ffd54f"/>
      <stop offset="100%" stop-color="#ffca28"/>
    </radialGradient>
    <radialGradient id="sngl" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff3a0" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#ffca28" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="24" cy="24" r="22" fill="url(#sngl)"/>
  <circle cx="24" cy="24" r="16" fill="#ffd54f" opacity="0.25"/>
  <line x1="24" y1="2" x2="24" y2="9" stroke="#ffca28" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="24" y1="39" x2="24" y2="46" stroke="#ffca28" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="2" y1="24" x2="9" y2="24" stroke="#ffca28" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="39" y1="24" x2="46" y2="24" stroke="#ffca28" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="8.4" y1="8.4" x2="13.4" y2="13.4" stroke="#ffca28" stroke-width="2" stroke-linecap="round"/>
  <line x1="34.6" y1="34.6" x2="39.6" y2="39.6" stroke="#ffca28" stroke-width="2" stroke-linecap="round"/>
  <line x1="8.4" y1="39.6" x2="13.4" y2="34.6" stroke="#ffca28" stroke-width="2" stroke-linecap="round"/>
  <line x1="34.6" y1="13.4" x2="39.6" y2="8.4" stroke="#ffca28" stroke-width="2" stroke-linecap="round"/>
  <circle cx="24" cy="24" r="10" fill="url(#sng)"/>
  <circle cx="20" cy="20" r="3" fill="white" opacity="0.35"/>
</svg>
`));

// 12. Boat decoration (48x36) — small sailboat on water
loadSprite("boat-sprite", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 36" width="48" height="36">
  <defs>
    <linearGradient id="bth" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a0704c"/>
      <stop offset="100%" stop-color="#6b4226"/>
    </linearGradient>
    <linearGradient id="bts" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e8e8f0"/>
    </linearGradient>
  </defs>
  <path d="M4 33 Q10 36 24 36 Q38 36 44 33 Q42 28 38 26 L10 26 Q6 28 4 33Z" fill="url(#bth)"/>
  <path d="M6 32 Q10 34 24 34 Q38 34 42 32" fill="none" stroke="#8b5e3c" stroke-width="0.5" opacity="0.5"/>
  <rect x="22" y="5" width="2" height="21" rx="0.5" fill="#6b4226"/>
  <polygon points="24,5 24,24 42,22" fill="url(#bts)" stroke="#ccc" stroke-width="0.5"/>
  <polygon points="22,7 22,23 8,21" fill="url(#bts)" stroke="#ccc" stroke-width="0.5" opacity="0.85"/>
  <path d="M26 10 L38 20" fill="none" stroke="#ddd" stroke-width="0.4" opacity="0.5"/>
  <path d="M1 32 Q6 30 12 32 Q18 34 24 32 Q30 30 36 32 Q42 34 47 32" fill="none" stroke="#5090cc" stroke-width="1.5" opacity="0.5" stroke-linecap="round"/>
  <path d="M0 34 Q6 32 12 34 Q18 36 24 34 Q30 32 36 34 Q42 36 48 34" fill="none" stroke="#5090cc" stroke-width="1" opacity="0.3" stroke-linecap="round"/>
</svg>
`));

// 13. Balloon decoration (20x32) — red party balloon with string
loadSprite("balloon-sprite", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 32" width="20" height="32">
  <defs>
    <radialGradient id="blg" cx="35%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#ff8a80"/>
      <stop offset="50%" stop-color="#ef5350"/>
      <stop offset="100%" stop-color="#c62828"/>
    </radialGradient>
  </defs>
  <ellipse cx="10" cy="11" rx="8" ry="10" fill="url(#blg)"/>
  <ellipse cx="7" cy="7" rx="2.5" ry="3.5" fill="white" opacity="0.3" transform="rotate(-20 7 7)"/>
  <polygon points="8,20 10,22 12,20" fill="#c62828"/>
  <path d="M10 22 Q8 25 11 27 Q9 29 10 32" fill="none" stroke="#c62828" stroke-width="0.8" opacity="0.7"/>
</svg>
`));

// 14. Snowman decoration (32x48) — three stacked circles with accessories
loadSprite("snowman-sprite", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 48" width="32" height="48">
  <defs>
    <radialGradient id="snb" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#dde4ee"/>
    </radialGradient>
  </defs>
  <circle cx="16" cy="39" r="9" fill="url(#snb)" stroke="#c8d0e0" stroke-width="0.5"/>
  <circle cx="16" cy="26" r="7" fill="url(#snb)" stroke="#c8d0e0" stroke-width="0.5"/>
  <circle cx="16" cy="15" r="5.5" fill="url(#snb)" stroke="#c8d0e0" stroke-width="0.5"/>
  <circle cx="14" cy="13.5" r="1" fill="#2a2a2a"/>
  <circle cx="18" cy="13.5" r="1" fill="#2a2a2a"/>
  <polygon points="16,15 20,16 16,16.5" fill="#ff8a30"/>
  <circle cx="13.5" cy="18" r="0.5" fill="#2a2a2a"/>
  <circle cx="14.5" cy="18.8" r="0.5" fill="#2a2a2a"/>
  <circle cx="16" cy="19" r="0.5" fill="#2a2a2a"/>
  <circle cx="17.5" cy="18.8" r="0.5" fill="#2a2a2a"/>
  <circle cx="18.5" cy="18" r="0.5" fill="#2a2a2a"/>
  <circle cx="16" cy="24" r="0.8" fill="#2a2a2a"/>
  <circle cx="16" cy="27" r="0.8" fill="#2a2a2a"/>
  <circle cx="16" cy="30" r="0.8" fill="#2a2a2a"/>
  <line x1="9" y1="26" x2="2" y2="22" stroke="#6d4c41" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="23" y1="26" x2="30" y2="22" stroke="#6d4c41" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="2" y1="22" x2="0" y2="20" stroke="#6d4c41" stroke-width="1" stroke-linecap="round"/>
  <line x1="2" y1="22" x2="1" y2="19" stroke="#6d4c41" stroke-width="1" stroke-linecap="round"/>
  <line x1="30" y1="22" x2="32" y2="20" stroke="#6d4c41" stroke-width="1" stroke-linecap="round"/>
  <line x1="30" y1="22" x2="31" y2="19" stroke="#6d4c41" stroke-width="1" stroke-linecap="round"/>
  <rect x="12" y="7" width="8" height="3" rx="0.5" fill="#1a1a2e"/>
  <rect x="10.5" y="9.5" width="11" height="1.5" rx="0.5" fill="#1a1a2e"/>
  <rect x="14" y="8" width="1.5" height="2" fill="#e04040" opacity="0.8"/>
  <circle cx="12" cy="12" r="1.2" fill="white" opacity="0.3"/>
</svg>
`));

// 15. Party hat decoration (24x28) — colorful cone with pom-pom
loadSprite("party-hat", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 28" width="24" height="28">
  <defs>
    <linearGradient id="phg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff5050"/>
      <stop offset="25%" stop-color="#ffd740"/>
      <stop offset="50%" stop-color="#448aff"/>
      <stop offset="75%" stop-color="#ffd740"/>
      <stop offset="100%" stop-color="#ff5050"/>
    </linearGradient>
  </defs>
  <polygon points="12,2 3,25 21,25" fill="url(#phg)"/>
  <polygon points="12,2 3,25 21,25" fill="none" stroke="#e04040" stroke-width="0.5" opacity="0.4"/>
  <line x1="7" y1="14" x2="17" y2="14" stroke="white" stroke-width="0.8" opacity="0.4"/>
  <line x1="5" y1="20" x2="19" y2="20" stroke="white" stroke-width="0.8" opacity="0.4"/>
  <line x1="9" y1="8" x2="15" y2="8" stroke="white" stroke-width="0.6" opacity="0.3"/>
  <circle cx="12" cy="1.5" r="2" fill="#ffd740"/>
  <circle cx="12" cy="1.5" r="1" fill="#ffe680" opacity="0.7"/>
  <path d="M3 25 Q2 27 4 27" stroke="#888" stroke-width="0.5" fill="none"/>
  <path d="M21 25 Q22 27 20 27" stroke="#888" stroke-width="0.5" fill="none"/>
  <ellipse cx="12" cy="25" rx="9" ry="1.5" fill="#e04040" opacity="0.15"/>
</svg>
`));

// 16. Garland piece decoration (20x20) — festive bunting/diamond in saffron
loadSprite("garland-piece", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">
  <defs>
    <linearGradient id="grl" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffb347"/>
      <stop offset="100%" stop-color="#ff8800"/>
    </linearGradient>
  </defs>
  <polygon points="10,1 19,10 10,19 1,10" fill="url(#grl)" stroke="#e07700" stroke-width="0.6"/>
  <polygon points="10,4 16,10 10,16 4,10" fill="none" stroke="#fff0cc" stroke-width="0.6" opacity="0.5"/>
  <circle cx="10" cy="10" r="2" fill="#fff0cc" opacity="0.4"/>
  <line x1="10" y1="4" x2="10" y2="16" stroke="#fff0cc" stroke-width="0.4" opacity="0.3"/>
  <line x1="4" y1="10" x2="16" y2="10" stroke="#fff0cc" stroke-width="0.4" opacity="0.3"/>
  <polygon points="10,1 11.5,3 10,4 8.5,3" fill="white" opacity="0.25"/>
</svg>
`));

// 17. Confetti/party popper decoration (24x24) — cone with confetti bursting out
loadSprite("confetti-sprite", "data:image/svg+xml," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <defs>
    <linearGradient id="ppg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffd740"/>
      <stop offset="50%" stop-color="#ff5050"/>
      <stop offset="100%" stop-color="#ffd740"/>
    </linearGradient>
  </defs>
  <polygon points="6,22 10,10 14,22" fill="url(#ppg)" stroke="#e06030" stroke-width="0.5"/>
  <line x1="8" y1="16" x2="12" y2="16" stroke="white" stroke-width="0.6" opacity="0.4"/>
  <line x1="7" y1="19" x2="13" y2="19" stroke="white" stroke-width="0.6" opacity="0.4"/>
  <rect x="3" y="2" width="2.5" height="4" rx="0.5" fill="#ff5050" transform="rotate(-20 4 4)"/>
  <rect x="8" y="0" width="2" height="3.5" rx="0.5" fill="#448aff" transform="rotate(10 9 2)"/>
  <rect x="14" y="1" width="2.5" height="4" rx="0.5" fill="#ffd740" transform="rotate(15 15 3)"/>
  <rect x="17" y="4" width="2" height="3" rx="0.5" fill="#66bb6a" transform="rotate(-10 18 5)"/>
  <rect x="1" y="6" width="2" height="3" rx="0.5" fill="#ab47bc" transform="rotate(25 2 7)"/>
  <circle cx="6" cy="4" r="1.2" fill="#ff80ab"/>
  <circle cx="16" cy="3" r="1" fill="#80d8ff"/>
  <circle cx="11" cy="5" r="1.3" fill="#ffd740"/>
  <circle cx="19" cy="7" r="0.8" fill="#ff5050"/>
  <circle cx="3" cy="9" r="0.9" fill="#66bb6a"/>
  <circle cx="13" cy="7" r="0.7" fill="#ab47bc"/>
  <circle cx="20" cy="2" r="0.8" fill="#ff8a65"/>
</svg>
`));

// ============================================
// END THEMED SPRITES
// ============================================

function svgAsset(svgMarkup) {
    return "data:image/svg+xml," + encodeURIComponent(svgMarkup);
}

function makeFeatureLayer(monthIndex) {
    switch (monthIndex) {
        case 0:
            return `
                <g opacity="0.95">
                    <rect x="80" y="360" width="220" height="180" fill="#6b8f63"/>
                    <rect x="132" y="280" width="14" height="90" fill="#5e4631"/>
                    <ellipse cx="139" cy="255" rx="70" ry="42" fill="#7eb873"/>
                    <rect x="930" y="332" width="220" height="210" fill="#5a7f59"/>
                    <rect x="1010" y="252" width="16" height="96" fill="#5a4330"/>
                    <ellipse cx="1018" cy="230" rx="72" ry="44" fill="#77af68"/>
                    <rect x="500" y="470" width="280" height="10" rx="5" fill="#c9b190"/>
                    <rect x="530" y="482" width="20" height="28" fill="#9c7f5d"/>
                    <rect x="726" y="482" width="20" height="28" fill="#9c7f5d"/>
                </g>
            `;
        case 1:
            return `
                <g opacity="0.9">
                    <path d="M0 420 C180 330 360 390 640 350 C840 320 1060 350 1280 300 L1280 520 L0 520 Z" fill="#885174"/>
                    <circle cx="190" cy="240" r="10" fill="#ffb1c8"/>
                    <circle cx="1070" cy="210" r="12" fill="#ffb1c8"/>
                    <path d="M360 270 C320 215 245 245 245 310 C245 362 294 410 360 455 C426 410 475 362 475 310 C475 245 400 215 360 270 Z" fill="#ff7fa8" opacity="0.32"/>
                    <path d="M930 285 C900 240 835 265 835 320 C835 368 875 404 930 442 C985 404 1025 368 1025 320 C1025 265 960 240 930 285 Z" fill="#ff7fa8" opacity="0.3"/>
                </g>
            `;
        case 2:
            return `
                <g opacity="0.92">
                    <rect x="0" y="392" width="1280" height="178" fill="#7fbbde" opacity="0.5"/>
                    <path d="M180 486 L890 486 L830 526 L250 526 Z" fill="#f1e7dc"/>
                    <rect x="320" y="448" width="8" height="84" fill="#8f6442"/>
                    <polygon points="328,450 510,470 328,530" fill="#fff7ef"/>
                    <polygon points="320,452 180,470 320,526" fill="#fff3e4"/>
                    <rect x="472" y="478" width="160" height="44" rx="8" fill="#f8f5ef"/>
                    <rect x="506" y="488" width="24" height="16" rx="3" fill="#8ec2e4"/>
                    <rect x="538" y="488" width="24" height="16" rx="3" fill="#8ec2e4"/>
                </g>
            `;
        case 3:
            return `
                <g opacity="0.9">
                    <path d="M40 420 L1240 420 L1240 510 L40 510 Z" fill="#6f6a72"/>
                    <path d="M120 420 L240 330 L360 420" fill="none" stroke="#b3864f" stroke-width="8"/>
                    <path d="M360 420 L500 300 L660 420" fill="none" stroke="#b3864f" stroke-width="8"/>
                    <path d="M660 420 L820 325 L980 420" fill="none" stroke="#b3864f" stroke-width="8"/>
                    <path d="M980 420 L1110 345 L1220 420" fill="none" stroke="#b3864f" stroke-width="8"/>
                    <rect x="510" y="442" width="230" height="60" rx="8" fill="#d4b98f"/>
                    <rect x="534" y="458" width="30" height="22" fill="#90acc4"/>
                    <rect x="572" y="458" width="30" height="22" fill="#90acc4"/>
                    <rect x="610" y="458" width="30" height="22" fill="#90acc4"/>
                    <rect x="648" y="458" width="30" height="22" fill="#90acc4"/>
                </g>
            `;
        case 4:
            return `
                <g opacity="0.88">
                    <path d="M0 412 C220 380 450 430 670 404 C910 376 1080 408 1280 388 L1280 540 L0 540 Z" fill="#636b7d"/>
                    <rect x="120" y="420" width="86" height="110" fill="#4f5564"/>
                    <rect x="240" y="388" width="96" height="140" fill="#50596b"/>
                    <rect x="380" y="404" width="92" height="124" fill="#4d5668"/>
                    <rect x="530" y="376" width="102" height="154" fill="#525d71"/>
                    <rect x="690" y="418" width="84" height="112" fill="#4d5666"/>
                    <rect x="820" y="390" width="96" height="140" fill="#50596d"/>
                    <rect x="980" y="410" width="86" height="120" fill="#4c5565"/>
                    <rect x="1120" y="384" width="90" height="146" fill="#50596d"/>
                </g>
            `;
        case 5:
            return `
                <g opacity="0.92">
                    <rect x="0" y="430" width="1280" height="130" fill="#86ca82"/>
                    <rect x="160" y="288" width="16" height="142" fill="#7f5e3f"/>
                    <ellipse cx="168" cy="258" rx="88" ry="54" fill="#6dae5f"/>
                    <circle cx="130" cy="252" r="11" fill="#ffca47"/>
                    <circle cx="190" cy="240" r="11" fill="#ffca47"/>
                    <circle cx="155" cy="274" r="12" fill="#ffca47"/>
                    <rect x="938" y="300" width="16" height="132" fill="#7f5e3f"/>
                    <ellipse cx="946" cy="272" rx="84" ry="52" fill="#67a957"/>
                    <circle cx="910" cy="272" r="11" fill="#ffca47"/>
                    <circle cx="972" cy="254" r="11" fill="#ffca47"/>
                    <circle cx="946" cy="286" r="11" fill="#ffca47"/>
                </g>
            `;
        case 6:
            return `
                <g opacity="0.9">
                    <rect x="0" y="446" width="1280" height="118" fill="#2a1f36"/>
                    <rect x="330" y="408" width="620" height="34" rx="10" fill="#1e1428"/>
                    <rect x="360" y="372" width="560" height="30" rx="8" fill="#352245"/>
                    <rect x="384" y="336" width="516" height="28" rx="7" fill="#442b59"/>
                    <polygon points="420,110 520,410 620,410" fill="#ffb166" opacity="0.12"/>
                    <polygon points="780,90 680,410 580,410" fill="#ff82c2" opacity="0.12"/>
                    <polygon points="1030,120 940,410 850,410" fill="#88adff" opacity="0.12"/>
                </g>
            `;
        case 7:
            return `
                <g opacity="0.92">
                    <rect x="0" y="434" width="1280" height="134" fill="#bb8a63"/>
                    <path d="M120 226 Q250 170 380 226 Q510 170 640 226 Q770 170 900 226 Q1030 170 1160 226" fill="none" stroke="#ffd180" stroke-width="8"/>
                    <circle cx="210" cy="232" r="18" fill="#ff8e94"/>
                    <circle cx="350" cy="236" r="18" fill="#7ac8ff"/>
                    <circle cx="494" cy="228" r="18" fill="#ffe07a"/>
                    <circle cx="640" cy="238" r="18" fill="#9de67c"/>
                    <circle cx="786" cy="228" r="18" fill="#ff8e94"/>
                    <circle cx="932" cy="236" r="18" fill="#7ac8ff"/>
                    <circle cx="1078" cy="232" r="18" fill="#ffe07a"/>
                </g>
            `;
        case 8:
            return `
                <g opacity="0.92">
                    <rect x="0" y="432" width="1280" height="136" fill="#7b4f44"/>
                    <path d="M100 190 Q250 150 400 190 Q550 150 700 190 Q850 150 1000 190 Q1120 150 1220 190" fill="none" stroke="#f9d27a" stroke-width="6"/>
                    <circle cx="220" cy="202" r="12" fill="#ff8f5a"/>
                    <circle cx="380" cy="198" r="12" fill="#73d79b"/>
                    <circle cx="540" cy="202" r="12" fill="#f56fb0"/>
                    <circle cx="700" cy="198" r="12" fill="#ffd668"/>
                    <circle cx="860" cy="202" r="12" fill="#ff8f5a"/>
                    <circle cx="1020" cy="198" r="12" fill="#73d79b"/>
                </g>
            `;
        case 9:
            return `
                <g opacity="0.9">
                    <rect x="0" y="428" width="1280" height="140" fill="#2f1f35"/>
                    <rect x="160" y="300" width="100" height="128" fill="#1b1322"/>
                    <rect x="380" y="268" width="120" height="160" fill="#1b1322"/>
                    <rect x="620" y="312" width="94" height="116" fill="#1b1322"/>
                    <rect x="838" y="248" width="132" height="180" fill="#1b1322"/>
                    <rect x="1080" y="292" width="102" height="136" fill="#1b1322"/>
                    <path d="M820 248 L904 176 L970 248 Z" fill="#21172b"/>
                    <path d="M380 268 L442 206 L500 268 Z" fill="#21172b"/>
                    <path d="M250 428 Q300 350 340 428" fill="none" stroke="#49324f" stroke-width="6"/>
                    <path d="M980 428 Q1030 345 1085 428" fill="none" stroke="#49324f" stroke-width="6"/>
                </g>
            `;
        case 10:
            return `
                <g opacity="0.92">
                    <rect x="0" y="430" width="1280" height="138" fill="#ba8293"/>
                    <rect x="220" y="140" width="840" height="52" rx="16" fill="#f6c6d3" opacity="0.7"/>
                    <text x="640" y="174" text-anchor="middle" font-family="Georgia,serif" font-size="40" fill="#7f3f51" font-weight="700">HAPPY BIRTHDAY ANUSHKU</text>
                    <path d="M160 238 Q280 190 400 238 Q520 190 640 238 Q760 190 880 238 Q1000 190 1120 238" fill="none" stroke="#f7e49d" stroke-width="7"/>
                    <circle cx="300" cy="248" r="16" fill="#ff8e94"/>
                    <circle cx="520" cy="244" r="16" fill="#7ac8ff"/>
                    <circle cx="760" cy="248" r="16" fill="#ffd668"/>
                    <circle cx="980" cy="244" r="16" fill="#9de67c"/>
                </g>
            `;
        case 11:
            return `
                <g opacity="0.93">
                    <rect x="0" y="430" width="1280" height="138" fill="#95a9c7"/>
                    <rect x="140" y="380" width="140" height="74" fill="#dfe8f6"/>
                    <rect x="320" y="360" width="160" height="94" fill="#d6e1f2"/>
                    <rect x="520" y="386" width="150" height="68" fill="#e0e9f7"/>
                    <rect x="720" y="352" width="170" height="102" fill="#d7e2f3"/>
                    <rect x="930" y="376" width="150" height="78" fill="#dce6f5"/>
                    <rect x="1120" y="362" width="126" height="92" fill="#d4e0f1"/>
                    <circle cx="210" cy="396" r="6" fill="#ffd36a"/>
                    <circle cx="410" cy="382" r="6" fill="#ffd36a"/>
                    <circle cx="585" cy="392" r="6" fill="#ffd36a"/>
                    <circle cx="810" cy="374" r="6" fill="#ffd36a"/>
                    <circle cx="998" cy="386" r="6" fill="#ffd36a"/>
                </g>
            `;
        default:
            return "";
    }
}

function makeMonthBackdropSvg(monthIndex) {
    const palettes = [
        { top: "#8fc79c", bottom: "#9ed0df", fog: "#d8ecd0", orb: "#fff3c4" },
        { top: "#506284", bottom: "#f1a7bf", fog: "#f7dbe7", orb: "#ffe2f2" },
        { top: "#ffad73", bottom: "#8ec4e8", fog: "#f8d3c3", orb: "#ffda97" },
        { top: "#c58f69", bottom: "#8ea0b8", fog: "#d9c2a3", orb: "#ffe6b0" },
        { top: "#6f8599", bottom: "#85a58e", fog: "#c8d8cc", orb: "#ebf3df" },
        { top: "#8fd5f0", bottom: "#99da8a", fog: "#d7efbc", orb: "#ffe37f" },
        { top: "#241734", bottom: "#4f2d56", fog: "#6a4567", orb: "#ffe0b0" },
        { top: "#ffb278", bottom: "#d79f79", fog: "#f7d2aa", orb: "#ffe0a8" },
        { top: "#6d5186", bottom: "#8f6780", fog: "#c29db5", orb: "#ffd7a4" },
        { top: "#1f1530", bottom: "#3f2b52", fog: "#5a3e64", orb: "#d9e3ff" },
        { top: "#f2bf93", bottom: "#d69ab0", fog: "#f6d6bc", orb: "#ffe6b6" },
        { top: "#425e8d", bottom: "#8da8ca", fog: "#b7c9df", orb: "#e5f2ff" },
    ];

    const p = palettes[monthIndex] || palettes[0];
    const orb = (monthIndex === 6 || monthIndex === 8 || monthIndex === 9 || monthIndex === 11)
        ? `<circle cx="1030" cy="120" r="58" fill="${p.orb}" opacity="0.22"/>`
        : `<circle cx="250" cy="128" r="72" fill="${p.orb}" opacity="0.26"/>`;

    return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
            <defs>
                <linearGradient id="sky${monthIndex}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${p.top}"/>
                    <stop offset="100%" stop-color="${p.bottom}"/>
                </linearGradient>
                <linearGradient id="fog${monthIndex}" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${p.fog}" stop-opacity="0"/>
                    <stop offset="100%" stop-color="${p.fog}" stop-opacity="0.7"/>
                </linearGradient>
            </defs>
            <rect width="1280" height="720" fill="url(#sky${monthIndex})"/>
            ${orb}
            <rect y="320" width="1280" height="300" fill="url(#fog${monthIndex})"/>
            ${makeFeatureLayer(monthIndex)}
        </svg>
    `;
}

for (let i = 0; i < 12; i++) {
    loadSprite(`scene-backdrop-${i}`, svgAsset(makeMonthBackdropSvg(i)));
}

loadSprite("scene-cloud", svgAsset(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 90" width="180" height="90">
  <rect x="24" y="44" width="130" height="30" rx="15" fill="#ffffff" opacity="0.95"/>
  <ellipse cx="56" cy="45" rx="32" ry="23" fill="#ffffff" opacity="0.95"/>
  <ellipse cx="92" cy="34" rx="36" ry="26" fill="#ffffff" opacity="0.95"/>
  <ellipse cx="128" cy="44" rx="28" ry="21" fill="#ffffff" opacity="0.95"/>
</svg>
`));

function makeTerrainTile(top, mid, base, line) {
    return svgAsset(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
            <rect width="64" height="64" fill="${base}"/>
            <rect width="64" height="16" fill="${top}"/>
            <rect y="16" width="64" height="48" fill="${mid}"/>
            <rect y="16" width="64" height="1" fill="${line}" opacity="0.28"/>
            <rect y="30" width="64" height="1" fill="${line}" opacity="0.08"/>
            <rect y="46" width="64" height="1" fill="${line}" opacity="0.08"/>
            <circle cx="16" cy="36" r="1.2" fill="${line}" opacity="0.12"/>
            <circle cx="44" cy="50" r="1.2" fill="${line}" opacity="0.1"/>
        </svg>
    `);
}

loadSprite("terrain-grass", makeTerrainTile("#76c562", "#6fa24b", "#5d7f3f", "#3f5a2e"));
loadSprite("terrain-earth", makeTerrainTile("#cfb07f", "#9d7853", "#815d42", "#5f4330"));
loadSprite("terrain-frost", makeTerrainTile("#ffe5ef", "#d8bfd8", "#b197b5", "#8a7092"));
loadSprite("terrain-water", makeTerrainTile("#8fd5f2", "#4a86b8", "#3a648e", "#284968"));
loadSprite("terrain-dark", makeTerrainTile("#7e5a98", "#4b3a63", "#322545", "#211a31"));
loadSprite("terrain-snow", makeTerrainTile("#f7fbff", "#d6e2f2", "#b7c7dd", "#8ea2bc"));

function makePlatformSkin(base, edge, detail) {
    return svgAsset(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 20" width="64" height="20">
            <rect width="64" height="20" rx="4" fill="${base}"/>
            <rect width="64" height="4" rx="2" fill="${edge}"/>
            <rect y="16" width="64" height="2" fill="${detail}" opacity="0.35"/>
            <circle cx="12" cy="10" r="1.7" fill="${edge}" opacity="0.45"/>
            <circle cx="32" cy="10" r="1.7" fill="${edge}" opacity="0.45"/>
            <circle cx="52" cy="10" r="1.7" fill="${edge}" opacity="0.45"/>
        </svg>
    `);
}

loadSprite("platform-wood", makePlatformSkin("#8f5f3f", "#e7bc7f", "#5f3d2b"));
loadSprite("platform-stone", makePlatformSkin("#a9b9cd", "#eef5ff", "#63758a"));
loadSprite("platform-ice", makePlatformSkin("#d9e9fb", "#fbffff", "#99b8d6"));
loadSprite("platform-romance", makePlatformSkin("#c87c97", "#ffd3e1", "#7f4d62"));
loadSprite("platform-spooky", makePlatformSkin("#5f4a6f", "#b493cf", "#2d2138"));

loadSprite("prop-bush", svgAsset(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 48" width="72" height="48">
  <ellipse cx="18" cy="30" rx="18" ry="16" fill="#65a55c"/>
  <ellipse cx="36" cy="24" rx="20" ry="18" fill="#6fb866"/>
  <ellipse cx="56" cy="30" rx="16" ry="14" fill="#5f9c56"/>
  <rect x="0" y="36" width="72" height="8" fill="#4f7f47"/>
</svg>
`));

loadSprite("prop-flowerbed", svgAsset(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 44" width="72" height="44">
  <rect y="28" width="72" height="12" rx="5" fill="#4f8d48"/>
  <circle cx="10" cy="26" r="4" fill="#ff8ca9"/>
  <circle cx="24" cy="22" r="4" fill="#ffda67"/>
  <circle cx="36" cy="24" r="4" fill="#8ed6ff"/>
  <circle cx="50" cy="21" r="4" fill="#ff8ca9"/>
  <circle cx="62" cy="25" r="4" fill="#ffd67d"/>
</svg>
`));

loadSprite("prop-spooky", svgAsset(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 52" width="72" height="52">
  <path d="M18 50 Q22 28 34 50" fill="none" stroke="#3c2b45" stroke-width="5"/>
  <path d="M44 50 Q48 24 58 50" fill="none" stroke="#3c2b45" stroke-width="5"/>
  <circle cx="20" cy="18" r="8" fill="#ff923f"/>
  <circle cx="52" cy="14" r="7" fill="#ff923f"/>
</svg>
`));

loadSprite("prop-christmas", svgAsset(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 56" width="72" height="56">
  <polygon points="18,50 30,22 42,50" fill="#4fa55b"/>
  <polygon points="44,50 56,20 68,50" fill="#3f9850"/>
  <circle cx="30" cy="32" r="2" fill="#ffd36a"/>
  <circle cx="56" cy="32" r="2" fill="#ff8ca9"/>
  <rect x="27" y="50" width="6" height="5" fill="#7f5a3d"/>
  <rect x="53" y="50" width="6" height="5" fill="#7f5a3d"/>
</svg>
`));

loadSprite("hazard-spike", svgAsset(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 20" width="24" height="20">
  <defs>
    <linearGradient id="spk" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#d2d8e2"/>
      <stop offset="45%" stop-color="#8c96a8"/>
      <stop offset="100%" stop-color="#424b5c"/>
    </linearGradient>
    <linearGradient id="base" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2b303a"/>
      <stop offset="100%" stop-color="#151922"/>
    </linearGradient>
  </defs>
  <rect y="16.8" width="24" height="3.2" rx="1" fill="url(#base)"/>
  <polygon points="1,20 5.2,6 9.4,20" fill="url(#spk)"/>
  <polygon points="7.2,20 12,2.2 16.8,20" fill="url(#spk)"/>
  <polygon points="14.6,20 19,5.5 23.4,20" fill="url(#spk)"/>
  <polygon points="1,20 5.2,6 9.4,20" fill="none" stroke="#dce2ea" stroke-width="0.65" opacity="0.78"/>
  <polygon points="7.2,20 12,2.2 16.8,20" fill="none" stroke="#e4eaf2" stroke-width="0.65" opacity="0.85"/>
  <polygon points="14.6,20 19,5.5 23.4,20" fill="none" stroke="#dce2ea" stroke-width="0.65" opacity="0.78"/>
  <rect x="0.8" y="16.2" width="22.4" height="0.7" rx="0.3" fill="#8f98a8" opacity="0.72"/>
  <circle cx="4.2" cy="18.4" r="0.65" fill="#9aa4b4" opacity="0.6"/>
  <circle cx="12" cy="18.4" r="0.65" fill="#9aa4b4" opacity="0.6"/>
  <circle cx="19.8" cy="18.4" r="0.65" fill="#9aa4b4" opacity="0.6"/>
</svg>
`));

loadSprite("hazard-orb", svgAsset(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  <defs>
    <radialGradient id="orbHot" cx="45%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff5c8"/>
      <stop offset="45%" stop-color="#ffb957"/>
      <stop offset="100%" stop-color="#ff5e52"/>
    </radialGradient>
  </defs>
  <circle cx="12" cy="12" r="11" fill="#ffb057" opacity="0.18"/>
  <circle cx="12" cy="12" r="8" fill="url(#orbHot)"/>
  <circle cx="12" cy="12" r="4.5" fill="#ffe38a" opacity="0.82"/>
  <circle cx="9" cy="9" r="1.6" fill="#fff7d8" opacity="0.75"/>
</svg>
`));

loadSprite("checkpoint-flag", svgAsset(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 56" width="30" height="56">
  <rect x="13" y="4" width="4" height="48" rx="2" fill="#8f633f"/>
  <rect x="10" y="52" width="10" height="3" rx="1.5" fill="#5f3f2a"/>
  <path d="M17 8 L28 12 L17 18 Z" fill="#ff7da4"/>
  <path d="M18 9 L26 12 L18 16 Z" fill="#ffd0de" opacity="0.6"/>
  <circle cx="15" cy="4" r="2.4" fill="#ffe08a"/>
  <circle cx="15" cy="4" r="1.1" fill="#fff6cc" opacity="0.8"/>
</svg>
`));

loadSprite("spring-pad", svgAsset(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 30" width="64" height="30">
  <rect x="4" y="18" width="56" height="8" rx="4" fill="#8f6a44"/>
  <rect x="8" y="14" width="48" height="8" rx="4" fill="#f39f7a"/>
  <path d="M12 14 C18 8 24 20 30 14 C36 8 42 20 48 14 C52 10 55 14 56 14" fill="none" stroke="#ffd9b0" stroke-width="2"/>
  <circle cx="16" cy="21" r="1.8" fill="#ffdebe" opacity="0.6"/>
  <circle cx="48" cy="21" r="1.8" fill="#ffdebe" opacity="0.6"/>
</svg>
`));

loadSprite("dash-gem", svgAsset(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
  <defs>
    <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffd9f0"/>
      <stop offset="100%" stop-color="#f07ca4"/>
    </linearGradient>
  </defs>
  <polygon points="14,2 24,14 14,26 4,14" fill="url(#dg)"/>
  <polygon points="14,5 21,14 14,23 7,14" fill="none" stroke="#fff0f7" stroke-width="1.3" opacity="0.7"/>
  <circle cx="14" cy="14" r="2.2" fill="#fff3f8" opacity="0.8"/>
  <circle cx="10" cy="10" r="1.4" fill="#fff" opacity="0.55"/>
</svg>
`));

const ASSET_MANIFEST = {
    version: "war-room-visuals-v2",
    audio: {
        introTheme: "assets/yellow.mp3",
    },
    spriteGroups: {
        core: ["player-anushku", "player-panushku", "player-danushku", "player-tanushku", "boyfriend", "heart", "portal"],
        collectibles: ["anchor-item", "letter-item", "flower-item", "candle-item", "diya-item", "pumpkin-item", "cake-item", "xmas-tree-item"],
        ambient: ["bat", "bird", "sun-sprite", "boat-sprite", "balloon-sprite", "snowman-sprite", "party-hat", "garland-piece", "confetti-sprite"],
        backgrounds: Array.from({ length: 12 }, (_, i) => `scene-backdrop-${i}`),
        terrain: ["terrain-grass", "terrain-earth", "terrain-frost", "terrain-water", "terrain-dark", "terrain-snow"],
        platforms: ["platform-wood", "platform-stone", "platform-ice", "platform-romance", "platform-spooky"],
        props: ["prop-bush", "prop-flowerbed", "prop-spooky", "prop-christmas"],
        hazards: ["hazard-spike", "hazard-orb"],
        gameplay: ["checkpoint-flag", "spring-pad", "dash-gem"],
    },
};
window.__VALENTINES_ASSET_MANIFEST__ = ASSET_MANIFEST;

// ============================================
// HELPER: Draw stars background
// ============================================
function drawStars(count = 40) {
    for (let i = 0; i < count; i++) {
        const star = add([
            circle(rand(0.9, 2.1)),
            pos(rand(0, width()), rand(0, height() * 0.7)),
            color(255, 255, 255),
            opacity(rand(0.2, 0.7)),
            anchor("center"),
            z(-10),
            "star",
            { speed: rand(1, 3), base: rand(0.2, 0.7) },
        ]);
        star.onUpdate(() => {
            star.opacity = star.base + Math.sin(time() * star.speed) * 0.2;
        });
    }
}

// ============================================
// HELPER: Draw floating hearts
// ============================================
function drawFloatingHearts(count = 12) {
    for (let i = 0; i < count; i++) {
        const h = add([
            text("♥", { size: rand(16, 32) }),
            pos(rand(0, width()), rand(0, height())),
            color(255, rand(120, 180), rand(160, 200)),
            opacity(rand(0.15, 0.35)),
            anchor("center"),
            z(-5),
            "floatingHeart",
            { vy: rand(15, 35), vx: rand(-0.3, 0.3) },
        ]);
        h.onUpdate(() => {
            h.pos.y -= h.vy * dt();
            h.pos.x += Math.sin(time() + i) * h.vx;
            if (h.pos.y < -40) {
                h.pos.y = height() + 40;
                h.pos.x = rand(0, width());
            }
        });
    }
}

// ============================================
// MARIO-STYLE VISUAL HELPERS
// ============================================

function mixColorChannel(a, b, t) {
    return Math.max(0, Math.min(255, Math.round(a + (b - a) * t)));
}

function addCloudCluster(x, y, scaleMult, baseOpacity, depthZ, speed) {
    const cloudCore = add([
        pos(x, y),
        { speed, phase: rand(0, 6), drift: rand(0.2, 0.6), bob: rand(2, 5) },
    ]);
    const slabs = [
        { off: vec2(-36 * scaleMult, -1 * scaleMult), w: 30, h: 14 },
        { off: vec2(-10 * scaleMult, -10 * scaleMult), w: 36, h: 17 },
        { off: vec2(20 * scaleMult, -7 * scaleMult), w: 30, h: 15 },
        { off: vec2(45 * scaleMult, 2 * scaleMult), w: 24, h: 12 },
    ];
    const cloudBits = slabs.map(part => add([
        rect(part.w * scaleMult, part.h * scaleMult, { radius: 6 * scaleMult }),
        pos(x + part.off.x, y + part.off.y),
        anchor("center"),
        color(255, 255, 255),
        opacity(baseOpacity * rand(0.85, 1.15)),
        z(depthZ),
        { off: part.off },
    ]));
    const cloudBase = add([
        rect(92 * scaleMult, 18 * scaleMult, { radius: 7 * scaleMult }),
        pos(x - 42 * scaleMult, y + 3 * scaleMult),
        color(255, 255, 255),
        opacity(baseOpacity * 0.9),
        z(depthZ),
    ]);

    cloudCore.onUpdate(() => {
        cloudCore.pos.x += cloudCore.speed * dt();
        cloudCore.pos.y += Math.sin(time() * cloudCore.drift + cloudCore.phase) * 0.12;
        if (cloudCore.pos.x > width() + 130) cloudCore.pos.x = -130;
    });

    cloudBits.forEach(bit => {
        bit.onUpdate(() => {
            bit.pos = cloudCore.pos.add(bit.off);
            bit.opacity = baseOpacity * (0.9 + Math.sin(time() * 0.7 + cloudCore.phase) * 0.08);
        });
    });

    cloudBase.onUpdate(() => {
        cloudBase.pos = cloudCore.pos.add(vec2(-42 * scaleMult, 3 * scaleMult));
        cloudBase.opacity = baseOpacity * (0.82 + Math.sin(time() * 0.6 + cloudCore.phase) * 0.07);
    });
}

function drawMarchBoatSetPieces(config) {
    config.ground.segments.forEach(seg => {
        // Upper deck with polished wood planks
        add([
            rect(seg.w, 18),
            pos(seg.x, GROUND_Y - 10),
            color(191, 132, 82),
            z(3),
        ]);
        add([
            rect(seg.w, 5),
            pos(seg.x, GROUND_Y - 10),
            color(246, 210, 156),
            z(5),
        ]);
        for (let px = seg.x + 12; px < seg.x + seg.w - 10; px += rand(22, 34)) {
            add([
                rect(2, 16, { radius: 1 }),
                pos(px, GROUND_Y - 9),
                color(146, 96, 58),
                opacity(0.6),
                z(4),
            ]);
        }

        // Yacht hull body
        add([
            rect(seg.w, 86, { radius: 10 }),
            pos(seg.x, GROUND_Y + 14),
            color(248, 247, 243),
            opacity(0.95),
            z(2),
        ]);
        add([
            rect(seg.w, 24),
            pos(seg.x, GROUND_Y + 37),
            color(65, 98, 124),
            opacity(0.92),
            z(2),
        ]);
        add([
            rect(seg.w, 5),
            pos(seg.x, GROUND_Y + 14),
            color(250, 214, 147),
            opacity(0.95),
            z(3),
        ]);

        // Rail posts and gold rail line
        for (let p = seg.x + 38; p < seg.x + seg.w - 20; p += 56) {
            add([
                rect(4, 20, { radius: 2 }),
                pos(p, GROUND_Y - 12),
                anchor("bot"),
                    color(126, 78, 44),
                    z(4),
                ]);
        }
        add([
            rect(seg.w, 3, { radius: 2 }),
            pos(seg.x, GROUND_Y - 30),
            color(237, 188, 118),
            opacity(0.94),
            z(5),
        ]);

        // Rounded porthole windows
        for (let i = 0; i < Math.floor(seg.w / 110); i++) {
            const portX = seg.x + 55 + i * 110;
            add([
                circle(8),
                pos(portX, GROUND_Y + 53),
                color(90, 150, 190),
                outline(2, rgb(220, 178, 112)),
                opacity(0.82),
                z(3),
            ]);
            add([
                circle(2),
                pos(portX - 2, GROUND_Y + 51),
                color(180, 230, 255),
                    opacity(0.6),
                    z(4),
                ]);
        }
    });

    // Mast + romantic sails
    add([
        rect(8, 176, { radius: 3 }),
        pos(390, GROUND_Y - 10),
        anchor("bot"),
        color(153, 102, 60),
        z(6),
    ]);
    add([
        rect(102, 70, { radius: 10 }),
        pos(396, GROUND_Y - 176),
        color(255, 249, 240),
        opacity(0.9),
        z(4),
    ]);
    add([
        rect(88, 60, { radius: 10 }),
        pos(302, GROUND_Y - 160),
        color(255, 247, 236),
        opacity(0.86),
        z(4),
    ]);
    add([
        rect(28, 10, { radius: 2 }),
        pos(398, GROUND_Y - 182),
        color(255, 122, 160),
        z(7),
    ]);
    add([
        text("♥", { size: 13 }),
        pos(402, GROUND_Y - 136),
        color(255, 120, 160),
        opacity(0.9),
        z(7),
    ]);

    // Cabin and romantic string lights
    add([
        rect(112, 52, { radius: 8 }),
        pos(140, GROUND_Y - 62),
        color(245, 242, 232),
        opacity(0.9),
        z(5),
    ]);
    for (let i = 0; i < 3; i++) {
        add([
            rect(20, 16, { radius: 3 }),
            pos(152 + i * 30, GROUND_Y - 48),
            color(124, 174, 205),
            outline(1, rgb(220, 175, 110)),
            opacity(0.85),
            z(6),
        ]);
    }
    for (let i = 0; i < 10; i++) {
        const light = add([
            circle(2.8),
            pos(120 + i * 22, GROUND_Y - 78 + Math.sin(i * 0.8) * 4),
            color(255, 230, 165),
            opacity(0.6),
            z(7),
            { phase: rand(0, 6), baseY: GROUND_Y - 78 + Math.sin(i * 0.8) * 4 },
        ]);
        light.onUpdate(() => {
            light.opacity = 0.45 + Math.sin(time() * 3 + light.phase) * 0.3;
            light.pos.y = light.baseY + Math.sin(time() * 1.2 + light.phase) * 0.4;
        });
    }

    // Sea sparkle/waves below hull
    for (let i = 0; i < 26; i++) {
        const wave = add([
            text("~", { size: rand(11, 18) }),
            pos(rand(0, width()), rand(GROUND_Y + 58, GROUND_Y + 94)),
            color(186, 236, 255),
            opacity(rand(0.2, 0.5)),
            z(1),
            { speed: rand(12, 28), drift: rand(0.9, 1.8), phase: rand(0, 6) },
        ]);
        wave.onUpdate(() => {
            wave.pos.x += wave.speed * dt();
            wave.pos.y += Math.sin(time() * wave.drift + wave.phase) * 0.1;
            if (wave.pos.x > width() + 20) {
                wave.pos.x = -20;
                wave.pos.y = rand(GROUND_Y + 58, GROUND_Y + 94);
            }
        });
    }
    for (let i = 0; i < 10; i++) {
        const sparkle = add([
            circle(rand(1.3, 2.4)),
            pos(rand(10, width() - 10), rand(GROUND_Y + 64, GROUND_Y + 95)),
            color(220, 245, 255),
            opacity(rand(0.25, 0.6)),
            z(2),
            { phase: rand(0, 6), baseOp: rand(0.2, 0.6) },
        ]);
        sparkle.onUpdate(() => {
            sparkle.opacity = sparkle.baseOp + Math.sin(time() * 2.6 + sparkle.phase) * 0.2;
        });
    }
    for (let i = 0; i < 5; i++) {
        const rose = add([
            text("♥", { size: rand(8, 13) }),
            pos(rand(30, width() - 30), rand(GROUND_Y + 58, GROUND_Y + 88)),
            color(255, rand(135, 170), rand(170, 210)),
            opacity(rand(0.18, 0.42)),
            z(2),
            { speed: rand(8, 18), phase: rand(0, 6) },
        ]);
        rose.onUpdate(() => {
            rose.pos.x += rose.speed * dt();
            rose.pos.y += Math.sin(time() * 1.4 + rose.phase) * 0.18;
            if (rose.pos.x > width() + 14) rose.pos.x = -14;
        });
    }

    // Soft reflection tint under yacht line
    add([
        rect(width(), 34),
        pos(0, GROUND_Y + 52),
        color(255, 185, 210),
        opacity(0.08),
        z(1),
    ]);
}

function drawForegroundDepth(monthIndex, config, groundStyle) {
    const propSpriteByMonth = [
        "prop-bush",
        "prop-flowerbed",
        "prop-flowerbed",
        "prop-bush",
        "prop-bush",
        "prop-flowerbed",
        "prop-spooky",
        "prop-flowerbed",
        "prop-flowerbed",
        "prop-spooky",
        "prop-flowerbed",
        "prop-christmas",
    ];
    const propSprite = propSpriteByMonth[monthIndex] || "prop-bush";

    config.ground.segments.forEach(seg => {
        const step = sx(92);
        for (let x = seg.x + sx(32); x < seg.x + seg.w - sx(24); x += step) {
            add([
                sprite(propSprite),
                pos(x, GROUND_Y - sy(2)),
                anchor("bot"),
                scale(vec2(rand(0.58, 0.82))),
                opacity(rand(0.74, 0.95)),
                z(3),
            ]);
        }
    });

    if (monthIndex === 2) {
        add([
            sprite("boat-sprite"),
            pos(sx(160), GROUND_Y + sy(38)),
            anchor("center"),
            scale(vec2(1.6)),
            opacity(0.85),
            z(2),
        ]);
    }

    if (monthIndex === 10) {
        add([
            text("HAPPY BIRTHDAY ANUSHKU", { size: 26 }),
            pos(width() / 2, sy(106)),
            anchor("center"),
            color(255, 233, 196),
            opacity(0.3),
            z(2),
        ]);
    }
}

function drawLayeredSky(sc, monthIndex) {
    add([
        sprite(`scene-backdrop-${monthIndex}`),
        pos(width() / 2, height() / 2),
        anchor("center"),
        z(-140),
    ]);

    // Subtle tint lets HUD remain readable while preserving painted art.
    add([
        rect(width(), height()),
        pos(0, 0),
        color(sc[0], sc[1], sc[2]),
        opacity(0.1),
        z(-139),
    ]);

    // Atmospheric striping for depth (more visible than before).
    const stripCount = 18;
    const stripH = height() / stripCount;
    for (let i = 0; i < stripCount; i++) {
        const t = i / (stripCount - 1);
        const op = 0.06 + t * 0.44;
        add([
            rect(width(), stripH + 1),
            pos(0, i * stripH),
            color(
                mixColorChannel(sc[0], 30, 0.28 + t * 0.2),
                mixColorChannel(sc[1], 34, 0.28 + t * 0.2),
                mixColorChannel(sc[2], 54, 0.28 + t * 0.2),
            ),
            opacity(op * 0.5),
            z(-138),
        ]);
    }
}

function getGroundStyle(monthIndex) {
    const styles = [
        { topColor: [104, 191, 102], bodyColor: [120, 92, 56], type: "grass" },
        { topColor: [255, 191, 212], bodyColor: [170, 112, 134], type: "frost" },
        { topColor: [100, 180, 230], bodyColor: [40, 80, 120], type: "water" },
        { topColor: [170, 162, 118], bodyColor: [110, 94, 72], type: "earth" },
        { topColor: [136, 156, 124], bodyColor: [92, 103, 86], type: "earth" },
        { topColor: [115, 204, 102], bodyColor: [132, 96, 54], type: "grass" },
        { topColor: [124, 95, 150], bodyColor: [60, 44, 82], type: "dark" },
        { topColor: [170, 144, 86], bodyColor: [128, 92, 60], type: "earth" },
        { topColor: [214, 126, 56], bodyColor: [110, 58, 42], type: "earth" },
        { topColor: [146, 88, 122], bodyColor: [74, 46, 62], type: "dark" },
        { topColor: [255, 174, 188], bodyColor: [166, 111, 127], type: "grass" },
        { topColor: [240, 245, 255], bodyColor: [175, 190, 210], type: "snow" },
    ];
    return styles[monthIndex] || styles[0];
}

function getGroundTileSprite(monthIndex, groundStyle) {
    if (monthIndex === 2) return "terrain-water";
    if (monthIndex === 11) return "terrain-snow";
    if (monthIndex === 9 || monthIndex === 6) return "terrain-dark";
    if (monthIndex === 1 || monthIndex === 10) return "terrain-frost";
    if (groundStyle.type === "water") return "terrain-water";
    if (groundStyle.type === "snow") return "terrain-snow";
    if (groundStyle.type === "frost") return "terrain-frost";
    if (groundStyle.type === "dark") return "terrain-dark";
    if (groundStyle.type === "earth") return "terrain-earth";
    return "terrain-grass";
}

function drawMarioGround(segX, segW, groundStyle, monthIndex) {
    // Physics collider stays invisible; visuals come from sprite tiles.
    add([
        rect(segW, sy(100)),
        pos(segX, GROUND_Y),
        color(0, 0, 0),
        opacity(0),
        area(),
        body({ isStatic: true }),
        z(0),
        "ground",
    ]);

    const tileSprite = getGroundTileSprite(monthIndex, groundStyle);
    const tileW = sx(42);
    const tileH = sy(42);
    const tileScale = vec2(tileW / 64, tileH / 64);
    const cols = Math.ceil(segW / tileW) + 1;

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < cols; col++) {
            add([
                sprite(tileSprite),
                pos(segX + col * tileW, GROUND_Y + row * (tileH - 2)),
                anchor("topleft"),
                scale(tileScale),
                z(1),
            ]);
        }
    }
}

function getPlatformColors(groundStyle) {
    const bc = groundStyle.bodyColor;
    return {
        bodyColor: [
            Math.min(255, bc[0] + 50),
            Math.min(255, bc[1] + 50),
            Math.min(255, bc[2] + 60),
        ],
        outlineColor: [
            Math.max(0, bc[0] - 30),
            Math.max(0, bc[1] - 30),
            Math.max(0, bc[2] - 20),
        ],
    };
}

// Moving platform indicators removed — pink outline on the platform itself is sufficient

function drawBackgroundLayers(sc, monthIndex) {
    const isDark = [6, 8, 9, 11].includes(monthIndex);

    const cloudCount = isDark ? 2 : (monthIndex === 2 || monthIndex === 5 ? 7 : 5);
    for (let i = 0; i < cloudCount; i++) {
        const cloud = add([
            sprite("scene-cloud"),
            pos(rand(-80, width() - 80), rand(sy(42), sy(170))),
            scale(vec2(rand(0.66, 1.1))),
            opacity(isDark ? rand(0.16, 0.26) : rand(0.26, 0.44)),
            z(-6),
            { drift: rand(8, 22), phase: rand(0, 6) },
        ]);
        cloud.onUpdate(() => {
            cloud.pos.x += cloud.drift * dt();
            cloud.pos.y += Math.sin(time() * 0.5 + cloud.phase) * 0.08;
            if (cloud.pos.x > width() + sx(90)) cloud.pos.x = -sx(190);
        });
    }

    if (isDark) {
        const starCount = monthIndex === 9 ? 34 : 24;
        for (let i = 0; i < starCount; i++) {
            const star = add([
                circle(rand(1, 2.2)),
                pos(rand(10, width() - 10), rand(12, sy(290))),
                anchor("center"),
                color(255, 255, 240),
                opacity(rand(0.2, 0.6)),
                z(-7),
                { pulse: rand(0.6, 1.8), phase: rand(0, 6) },
            ]);
            star.onUpdate(() => {
                star.opacity = 0.15 + Math.sin(time() * star.pulse + star.phase) * 0.22;
            });
        }
    }
}

function drawEnhancedPortal(portalX, portalY) {
    // Layered glow behind portal
    const portalGlow = add([
        circle(36),
        pos(portalX, portalY - 35),
        anchor("center"),
        color(255, 180, 210),
        opacity(0.12),
        z(4),
    ]);
    portalGlow.onUpdate(() => {
        portalGlow.opacity = 0.08 + Math.sin(time() * 2) * 0.06;
    });

    const portalGlowOuter = add([
        circle(56),
        pos(portalX, portalY - 35),
        anchor("center"),
        color(255, 145, 190),
        opacity(0.06),
        z(3),
    ]);
    portalGlowOuter.onUpdate(() => {
        portalGlowOuter.opacity = 0.035 + Math.sin(time() * 1.5 + 1.3) * 0.03;
    });

    const portal = add([
        sprite("portal"),
        pos(portalX, portalY),
        anchor("bot"),
        area({ scale: 0.8 }),
        z(5),
        "portal",
    ]);
    portal.onUpdate(() => {
        portal.scale = vec2(1 + Math.sin(time() * 3) * 0.12);
    });

    return portal;
}

function drawEnhancedCollectible(spriteName, px, py, idx) {
    const glowPalette = {
        "heart": [255, 190, 220],
        "anchor-item": [155, 208, 255],
        "letter-item": [255, 224, 182],
        "flower-item": [255, 182, 206],
        "candle-item": [255, 210, 126],
        "diya-item": [255, 190, 108],
        "pumpkin-item": [255, 165, 96],
        "cake-item": [255, 194, 236],
        "xmas-tree-item": [170, 230, 188],
    };
    const glowColor = glowPalette[spriteName] || [255, 190, 220];

    const glow = add([
        circle(15),
        pos(px, py),
        anchor("center"),
        color(glowColor[0], glowColor[1], glowColor[2]),
        opacity(0.2),
        z(9),
    ]);

    const item = add([
        sprite(spriteName),
        scale(0.9),
        pos(px, py),
        anchor("center"),
        area({ scale: 1.2 }),
        z(10),
        "collectible",
        { baseY: py, idx: idx, collected: false, glow },
    ]);
    item.onUpdate(() => {
        if (!item.collected) {
            item.pos.y = item.baseY + Math.sin(time() * 3 + item.idx) * 8;
            item.glow.pos = item.pos.clone();
            item.glow.opacity = 0.15 + Math.sin(time() * 4 + item.idx) * 0.08;
            const glowScale = 1 + Math.sin(time() * 3 + item.idx) * 0.15;
            item.glow.scale = vec2(glowScale);
        }
    });

    return item;
}

function spawnCollectionBurst(px, py, spriteName) {
    const burstPalette = {
        "heart": [255, 170, 210],
        "anchor-item": [138, 200, 255],
        "letter-item": [255, 210, 165],
        "flower-item": [255, 170, 210],
        "candle-item": [255, 214, 124],
        "diya-item": [255, 180, 110],
        "pumpkin-item": [255, 154, 86],
        "cake-item": [255, 194, 236],
        "xmas-tree-item": [164, 224, 176],
    };
    const c = burstPalette[spriteName] || [255, 170, 210];
    for (let j = 0; j < 4; j++) {
        const angle = (j / 4) * Math.PI * 2 + rand(-0.3, 0.3);
        const speed = rand(80, 150);
        const spark = add([
            rect(rand(4, 7), rand(4, 7), { radius: 3 }),
            pos(px, py),
            anchor("center"),
            color(
                Math.min(255, c[0] + rand(-20, 20)),
                Math.min(255, c[1] + rand(-20, 20)),
                Math.min(255, c[2] + rand(-20, 20)),
            ),
            opacity(1),
            z(30),
            { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60, life: 0 },
        ]);
        spark.onUpdate(() => {
            spark.life += dt();
            spark.pos.x += spark.vx * dt();
            spark.pos.y += spark.vy * dt();
            spark.vy += 250 * dt();
            spark.opacity = Math.max(0, 1 - spark.life * 2.2);
            if (spark.life > 0.55) destroy(spark);
        });
    }
}

// ============================================
// SEASONAL DECORATIONS
// ============================================
function spawnDecorations(monthIndex) {
    const config = ACTIVE_LEVEL_CONFIGS[monthIndex];
    if (!config.decorations) return;

    config.decorations.forEach(deco => {
        const count = Math.max(1, Math.round((deco.count || 8) * 1.7));
        switch (deco.type) {
            case "snowflakes":
                for (let i = 0; i < count; i++) {
                    const s = add([
                        circle(rand(1.8, 3.8)),
                        pos(rand(0, width()), rand(-50, height())),
                        color(230, 235, 255),
                        opacity(rand(0.3, 0.7)),
                        z(-3),
                        { speed: rand(20, 55), drift: rand(-0.8, 0.8) },
                    ]);
                    s.onUpdate(() => {
                        s.pos.y += s.speed * dt();
                        s.pos.x += Math.sin(time() * 0.8 + i) * s.drift;
                        if (s.pos.y > GROUND_Y) { s.pos.y = -10; s.pos.x = rand(0, width()); }
                    });
                }
                break;
            case "petals":
                for (let i = 0; i < count; i++) {
                    const p = add([
                        rect(rand(4, 8), rand(2, 4), { radius: 2 }),
                        pos(rand(0, width()), rand(-50, height())),
                        color(255, rand(170, 210), rand(190, 220)),
                        opacity(rand(0.3, 0.6)),
                        z(-3),
                        rotate(rand(0, 360)),
                        { speed: rand(25, 52), drift: rand(0.3, 1.2), spin: rand(-70, 70) },
                    ]);
                    p.onUpdate(() => {
                        p.pos.y += p.speed * dt();
                        p.pos.x += p.drift * 30 * dt() + Math.sin(time() + i) * 0.3;
                        p.angle += p.spin * dt();
                        if (p.pos.y > GROUND_Y) { p.pos.y = -10; p.pos.x = rand(0, width()); }
                    });
                }
                break;
            case "flowers":
                for (let i = 0; i < count; i++) {
                    add([
                        sprite("flower-item"),
                        scale(rand(0.4, 0.65)),
                        pos(rand(30, width() - 30), GROUND_Y - rand(2, 8)),
                        anchor("bot"),
                        color(255, rand(150, 220), rand(170, 230)),
                        opacity(rand(0.4, 0.7)),
                        z(-2),
                    ]);
                }
                break;
            case "butterflies":
                for (let i = 0; i < count; i++) {
                    const b = add([
                        rect(rand(7, 11), rand(4, 6), { radius: 4 }),
                        pos(rand(50, width() - 50), rand(200, 420)),
                        scale(1),
                        color(255, rand(180, 255), rand(100, 200)),
                        opacity(rand(0.4, 0.7)),
                        z(-3),
                        { baseX: rand(50, width() - 50), baseY: rand(180, 420), phase: rand(0, 6) },
                    ]);
                    b.onUpdate(() => {
                        b.pos.x = b.baseX + Math.sin(time() * 0.7 + b.phase) * 40;
                        b.pos.y = b.baseY + Math.sin(time() * 1.2 + b.phase) * 20;
                        b.scale.x = 0.8 + Math.sin(time() * 9 + b.phase) * 0.22;
                    });
                }
                break;
            case "clouds":
                for (let i = 0; i < count; i++) {
                    const c = add([
                        rect(rand(60, 110), rand(18, 30), { radius: 10 }),
                        pos(rand(0, width()), rand(30, 150)),
                        color(255, 255, 255),
                        opacity(rand(0.15, 0.3)),
                        z(-4),
                        { speed: rand(8, 24) },
                    ]);
                    c.onUpdate(() => {
                        c.pos.x += c.speed * dt();
                        if (c.pos.x > width() + 50) c.pos.x = -120;
                    });
                }
                break;
            case "fireflies":
                for (let i = 0; i < count; i++) {
                    const f = add([
                        circle(rand(1.8, 3.5)),
                        pos(rand(0, width()), rand(150, 450)),
                        color(255, 230, 100),
                        opacity(0.3),
                        z(-3),
                        { phase: rand(0, 6), baseOp: rand(0.2, 0.58) },
                    ]);
                    f.onUpdate(() => {
                        f.opacity = f.baseOp + Math.sin(time() * 2.5 + f.phase) * 0.3;
                        f.pos.x += Math.sin(time() * 0.5 + f.phase) * 0.3;
                        f.pos.y += Math.cos(time() * 0.4 + f.phase) * 0.2;
                    });
                }
                break;
            case "leaves":
                for (let i = 0; i < count; i++) {
                    const l = add([
                        rect(rand(5, 9), rand(3, 5), { radius: 2 }),
                        pos(rand(0, width()), rand(-50, height())),
                        color(rand(180, 220), rand(120, 170), rand(50, 90)),
                        opacity(rand(0.3, 0.6)),
                        z(-3),
                        rotate(rand(0, 360)),
                        { speed: rand(30, 62), drift: rand(-0.8, -0.2), spin: rand(-90, 90) },
                    ]);
                    l.onUpdate(() => {
                        l.pos.y += l.speed * dt();
                        l.pos.x += l.drift * 20 * dt() + Math.sin(time() * 0.6 + i) * 0.4;
                        l.angle += l.spin * dt();
                        if (l.pos.y > GROUND_Y) { l.pos.y = -10; l.pos.x = rand(0, width()); }
                    });
                }
                break;
        }
    });
}

// ============================================
// BIRDS & SUN (global for all levels)
// ============================================
function spawnBirdsAndSun(monthIndex) {
    // Sun (skip for dark/night months: Jul concert, Sep navratri night, Oct spooky, Dec night)
    const darkMonths = [6, 8, 9, 11];
    if (!darkMonths.includes(monthIndex)) {
        const sunX = rand(550, 720);
        const sunY = rand(40, 100);
        // Sun
        add([
            sprite("sun-sprite"),
            scale(0.8),
            pos(sunX, sunY),
            anchor("center"),
            opacity(0.85),
            z(-7),
        ]);
    }

    // Birds (1-2 flying across the sky)
    const birdCount = Math.floor(rand(1, 3));
    for (let i = 0; i < birdCount; i++) {
        const bird = add([
            sprite("bird"),
            scale(rand(0.5, 0.8)),
            pos(rand(-100, 300), rand(40, 200)),
            opacity(rand(0.4, 0.7)),
            z(-6),
            { speed: rand(30, 60), wingPhase: rand(0, 6) },
        ]);
        bird.onUpdate(() => {
            bird.pos.x += bird.speed * dt();
            bird.pos.y += Math.sin(time() * 3 + bird.wingPhase) * 0.3;
            if (bird.pos.x > width() + 50) {
                bird.pos.x = -30;
                bird.pos.y = rand(40, 200);
            }
        });
    }
}

// ============================================
// MONTH-SPECIFIC EXTRAS
// ============================================
function spawnExtras(config, boyfriendObj) {
    if (!config.extras) return;

    config.extras.forEach(extra => {
        switch (extra.type) {
            case "sign": {
                // Wooden sign post
                const signX = extra.x || 400;
                const signY = extra.y || GROUND_Y;
                // Post
                add([
                    rect(6, 50),
                    pos(signX, signY),
                    anchor("bot"),
                    color(140, 100, 60),
                    z(2),
                ]);
                // Board
                add([
                    rect(extra.text.length * 10 + 20, 28, { radius: 4 }),
                    pos(signX, signY - 50),
                    anchor("center"),
                    color(180, 130, 70),
                    outline(2, rgb(120, 80, 40)),
                    z(2),
                ]);
                // Text
                add([
                    text(extra.text, { size: 13 }),
                    pos(signX, signY - 50),
                    anchor("center"),
                    color(255, 255, 240),
                    z(3),
                ]);
                break;
            }
            case "waves": {
                // Romantic yacht ambiance accents
                for (let i = 0; i < 6; i++) {
                    add([
                        text("~", { size: rand(14, 20) }),
                        pos(rand(30, width() - 30), GROUND_Y + rand(48, 84)),
                        anchor("center"),
                        color(170, 226, 248),
                        opacity(rand(0.26, 0.44)),
                        z(1),
                    ]);
                }
                for (let i = 0; i < 4; i++) {
                    const lantern = add([
                        circle(3.2),
                        pos(130 + i * 180, GROUND_Y - 36),
                        color(255, 230, 170),
                        opacity(0.6),
                        z(7),
                        { phase: rand(0, 6) },
                    ]);
                    lantern.onUpdate(() => {
                        lantern.opacity = 0.45 + Math.sin(time() * 3 + lantern.phase) * 0.28;
                    });
                }
                break;
            }
            case "bats": {
                const batCount = extra.count || 5;
                for (let i = 0; i < batCount; i++) {
                    const bat = add([
                        sprite("bat"),
                        scale(rand(0.6, 1.0)),
                        pos(rand(100, width() - 100), rand(60, 300)),
                        anchor("center"),
                        z(-3),
                        { baseX: rand(100, width() - 100), baseY: rand(60, 300), phase: rand(0, 6), speed: rand(0.5, 1.5) },
                    ]);
                    bat.onUpdate(() => {
                        bat.pos.x = bat.baseX + Math.sin(time() * bat.speed + bat.phase) * 80;
                        bat.pos.y = bat.baseY + Math.cos(time() * bat.speed * 0.7 + bat.phase) * 30;
                    });
                }
                break;
            }
            case "birthdayCap": {
                // Birthday cap on the boyfriend character
                if (boyfriendObj) {
                    // Party hat on boyfriend
                    const hat = add([
                        sprite("party-hat"),
                        scale(0.6),
                        pos(0, 0),
                        anchor("center"),
                        z(7),
                    ]);
                    hat.onUpdate(() => {
                        hat.pos.x = boyfriendObj.pos.x;
                        hat.pos.y = boyfriendObj.pos.y - 50;
                    });
                }
                break;
            }
            case "navratri": {
                // Colorful garland / toran at the top
                const festiveColors = [[255, 100, 50], [255, 200, 0], [0, 200, 100], [200, 50, 200], [255, 150, 0]];
                for (let i = 0; i < 6; i++) {
                    const fc = festiveColors[i % festiveColors.length];
                    add([
                        sprite("garland-piece"),
                        scale(0.6),
                        pos(60 + i * 120, rand(20, 45)),
                        anchor("center"),
                        color(fc[0], fc[1], fc[2]),
                        opacity(rand(0.5, 0.8)),
                        z(-2),
                    ]);
                }
                // Diyas on ground
                for (let i = 0; i < 3; i++) {
                    add([
                        sprite("diya-item"),
                        scale(0.5),
                        pos(rand(80, width() - 80), GROUND_Y - 5),
                        anchor("bot"),
                        opacity(0.8),
                        z(2),
                    ]);
                }
                break;
            }
            case "candles": {
                // Candle flames for concert vibe
                for (let i = 0; i < 4; i++) {
                    add([
                        sprite("candle-item"),
                        scale(rand(0.4, 0.55)),
                        pos(rand(80, 720), GROUND_Y - rand(0, 4)),
                        anchor("bot"),
                        opacity(0.75),
                        z(2),
                    ]);
                }
                break;
            }
            case "christmas": {
                // Christmas trees
                for (let i = 0; i < 2; i++) {
                    add([
                        sprite("xmas-tree-item"),
                        scale(rand(0.7, 0.9)),
                        pos(rand(80, width() - 80), GROUND_Y - 5),
                        anchor("bot"),
                        z(2),
                    ]);
                }
                // Snowman
                add([
                    sprite("snowman-sprite"),
                    scale(0.6),
                    pos(rand(width() * 0.35, width() * 0.65), GROUND_Y - 5),
                    anchor("bot"),
                    z(2),
                ]);
                break;
            }
            case "park": {
                for (let i = 0; i < 5; i++) {
                    const tx = 70 + i * 145;
                    add([
                        rect(12, 78, { radius: 3 }),
                        pos(tx, GROUND_Y - 6),
                        anchor("bot"),
                        color(108, 76, 52),
                        opacity(0.85),
                        z(-1),
                    ]);
                    add([
                        circle(26),
                        pos(tx + 6, GROUND_Y - 82),
                        color(82, 160, 92),
                        opacity(0.46),
                        z(-2),
                    ]);
                }
                break;
            }
            case "loveWonderland": {
                for (let i = 0; i < 12; i++) {
                    const glowHeart = add([
                        text("♥", { size: rand(8, 14) }),
                        pos(rand(20, width() - 20), rand(120, GROUND_Y - 60)),
                        color(255, rand(145, 195), rand(190, 220)),
                        opacity(rand(0.18, 0.4)),
                        z(-3),
                        { phase: rand(0, 6), drift: rand(0.4, 1.1) },
                    ]);
                    glowHeart.onUpdate(() => {
                        glowHeart.pos.y += Math.sin(time() * glowHeart.drift + glowHeart.phase) * 0.3;
                        glowHeart.opacity = 0.18 + Math.sin(time() * 2 + glowHeart.phase) * 0.2;
                    });
                }
                break;
            }
            case "kolkataTram": {
                add([
                    rect(130, 42, { radius: 6 }),
                    pos(122, GROUND_Y - 34),
                    color(204, 187, 133),
                    opacity(0.72),
                    z(-1),
                ]);
                add([
                    rect(130, 3),
                    pos(122, GROUND_Y + 14),
                    color(98, 82, 70),
                    opacity(0.6),
                    z(-1),
                ]);
                for (let i = 0; i < 4; i++) {
                    add([
                        rect(20, 16, { radius: 3 }),
                        pos(132 + i * 27, GROUND_Y - 24),
                        color(122, 166, 196),
                        opacity(0.72),
                        z(0),
                    ]);
                }
                break;
            }
            case "kolkataMonsoon": {
                for (let i = 0; i < 48; i++) {
                    const rain = add([
                        rect(1.8, rand(10, 18), { radius: 1 }),
                        pos(rand(0, width()), rand(-30, height())),
                        color(188, 214, 235),
                        opacity(rand(0.16, 0.4)),
                        z(-3),
                        { speed: rand(170, 280), sway: rand(-0.3, 0.2) },
                    ]);
                    rain.onUpdate(() => {
                        rain.pos.y += rain.speed * dt();
                        rain.pos.x += rain.sway;
                        if (rain.pos.y > GROUND_Y) {
                            rain.pos.y = -10;
                            rain.pos.x = rand(0, width());
                        }
                    });
                }
                break;
            }
            case "summerMango": {
                for (let i = 0; i < 9; i++) {
                    add([
                        circle(rand(4, 6)),
                        pos(rand(70, width() - 70), rand(120, GROUND_Y - 120)),
                        color(255, rand(180, 210), 55),
                        opacity(0.55),
                        z(-2),
                    ]);
                }
                for (let i = 0; i < 3; i++) {
                    const leaf = add([
                        text("V", { size: 18 }),
                        pos(90 + i * 270, GROUND_Y - 110),
                        color(80, 145, 72),
                        opacity(0.36),
                        z(-2),
                    ]);
                    leaf.onUpdate(() => {
                        leaf.angle = Math.sin(time() * 1.5 + i) * 8;
                    });
                }
                break;
            }
            case "concertStage": {
                add([
                    rect(width(), 22),
                    pos(0, GROUND_Y - 8),
                    color(34, 20, 48),
                    opacity(0.42),
                    z(-1),
                ]);
                for (let i = 0; i < 6; i++) {
                    const note = add([
                        text(["♪", "♫"][i % 2], { size: 13 }),
                        pos(120 + i * 105, GROUND_Y - rand(60, 130)),
                        color(255, 218, 170),
                        opacity(0.32),
                        z(-2),
                        { phase: rand(0, 6) },
                    ]);
                    note.onUpdate(() => {
                        note.pos.y += Math.sin(time() * 2 + note.phase) * 0.2;
                    });
                }
                break;
            }
            case "festivalCrowd": {
                for (let i = 0; i < 12; i++) {
                    add([
                        rect(rand(8, 12), rand(16, 24), { radius: 3 }),
                        pos(18 + i * 64, GROUND_Y - 2),
                        anchor("bot"),
                        color(rand(180, 255), rand(90, 200), rand(90, 255)),
                        opacity(0.28),
                        z(-1),
                    ]);
                }
                break;
            }
            case "spooky": {
                for (let i = 0; i < 14; i++) {
                    const mist = add([
                        rect(rand(60, 120), rand(18, 36), { radius: 20 }),
                        pos(rand(-20, width()), rand(GROUND_Y - 70, GROUND_Y - 5)),
                        color(140, 120, 170),
                        opacity(rand(0.06, 0.14)),
                        z(-2),
                        { speed: rand(6, 18) },
                    ]);
                    mist.onUpdate(() => {
                        mist.pos.x += mist.speed * dt();
                        if (mist.pos.x > width() + 70) mist.pos.x = -130;
                    });
                }
                break;
            }
            case "birthdayBanner": {
                add([
                    rect(width() - 140, 30, { radius: 10 }),
                    pos(70, 54),
                    color(255, 165, 188),
                    opacity(0.16),
                    z(-4),
                ]);
                break;
            }
            case "christmasTown": {
                for (let i = 0; i < 6; i++) {
                    const houseX = 50 + i * 126;
                    add([
                        rect(70, 46, { radius: 4 }),
                        pos(houseX, GROUND_Y - 14),
                        anchor("bot"),
                        color(189, 205, 228),
                        opacity(0.34),
                        z(-1),
                    ]);
                    for (let j = 0; j < 2; j++) {
                        add([
                            rect(14, 12, { radius: 2 }),
                            pos(houseX + 14 + j * 24, GROUND_Y - 42),
                            color(255, 230, 150),
                            opacity(0.5),
                            z(0),
                        ]);
                    }
                }
                break;
            }
            case "birthday": {
                // Balloons
                for (let i = 0; i < 3; i++) {
                    const balloon = add([
                        sprite("balloon-sprite"),
                        scale(rand(0.6, 0.85)),
                        pos(rand(80, width() - 80), rand(60, 220)),
                        anchor("center"),
                        z(-3),
                        { baseY: rand(60, 220), phase: rand(0, 6) },
                    ]);
                    balloon.onUpdate(() => {
                        balloon.pos.y = balloon.baseY + Math.sin(time() * 0.8 + balloon.phase) * 12;
                    });
                }
                // Confetti
                add([
                    sprite("confetti-sprite"),
                    scale(0.65),
                    pos(rand(200, 600), rand(80, 180)),
                    anchor("center"),
                    z(-2),
                ]);
                break;
            }
        }
    });
}

// ============================================
// TITLE SCREEN
// ============================================
scene("title", () => {
    // Hide any lingering popups
    document.getElementById("memory-popup").classList.add("hidden");
    document.getElementById("love-letter-overlay").classList.add("hidden");
    document.querySelectorAll(".sparkle").forEach(s => s.remove());

    // Focus canvas for keyboard input
    document.getElementById("game").focus();
    emitGameLog("scene.title.enter", { month: "Title" });
    window.__qaScene = "title";
    camScale(1, 1);
    camPos(width() / 2, height() / 2);

    add([
        rect(width(), height()),
        pos(0, 0),
        anchor("topleft"),
        color(18, 34, 66),
        fixed(),
        z(-100),
    ]);

    const decoHearts = [
        [170, 110, 16],
        [230, 150, 20],
        [1080, 140, 20],
        [1160, 212, 14],
        [220, 600, 14],
        [1030, 590, 16],
    ];
    decoHearts.forEach(([hx, hy, sz]) => {
        add([
            text("♥", { size: sz }),
            pos(hx, hy),
            anchor("center"),
            color(245, 119, 153),
            fixed(),
        ]);
    });

    add([
        text("Sarthu Parthu Rescue Adventure!", { size: 54 }),
        pos(width() / 2, 142),
        anchor("center"),
        color(255, 219, 234),
        fixed(),
    ]);

    add([
        text(`Selected Hero: ${getCharacterLabel()}`, { size: 24 }),
        pos(width() / 2, 216),
        anchor("center"),
        color(237, 226, 198),
        fixed(),
    ]);

    add([
        sprite(getSelectedPlayerSprite()),
        pos(width() / 2 - 88, 332),
        anchor("center"),
        scale(1.45),
        fixed(),
    ]);
    add([
        sprite("boyfriend"),
        pos(width() / 2 + 88, 332),
        anchor("center"),
        scale(1.36),
        fixed(),
    ]);

    const selectBtn = add([
        rect(292, 60, { radius: 14 }),
        pos(width() / 2, 440),
        anchor("center"),
        color(126, 172, 181),
        outline(2, rgb(216, 244, 250)),
        area(),
        scale(1),
        fixed(),
        "selectCharBtn",
    ]);
    const selectLabel = add([
        text("Select Character", { size: 22 }),
        pos(width() / 2, 440),
        anchor("center"),
        color(17, 40, 49),
        fixed(),
    ]);

    const startBtn = add([
        rect(308, 64, { radius: 16 }),
        pos(width() / 2, 522),
        anchor("center"),
        color(245, 119, 153),
        outline(3, rgb(255, 227, 237)),
        area(),
        scale(1),
        fixed(),
        "startAdventureBtn",
    ]);
    const startLabel = add([
        text("Start Game ♥", { size: 25 }),
        pos(width() / 2, 522),
        anchor("center"),
        color(255, 246, 251),
        fixed(),
    ]);

    selectBtn.onUpdate(() => {
        const hover = selectBtn.isHovering();
        selectBtn.scale = hover ? vec2(1.05) : vec2(1);
        selectBtn.color = hover ? rgb(150, 194, 202) : rgb(126, 172, 181);
        selectLabel.color = hover ? rgb(10, 30, 38) : rgb(17, 40, 49);
    });
    startBtn.onUpdate(() => {
        const hover = startBtn.isHovering();
        startBtn.scale = hover ? vec2(1.06) : vec2(1);
        startBtn.color = hover ? rgb(255, 140, 176) : rgb(245, 119, 153);
        startLabel.color = hover ? rgb(255, 255, 255) : rgb(255, 246, 251);
    });

    let journeyStarted = false;
    const startJourney = (method) => {
        if (journeyStarted) return;
        journeyStarted = true;
        if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
        startBgm();
        emitGameLog("run.start", { method });
        go("month", 0);
    };

    onClick("selectCharBtn", () => {
        go("character-select");
    });
    onClick("startAdventureBtn", () => {
        startJourney("click");
    });
    onKeyPress("space", () => {
        startJourney("key");
    });
});

scene("character-select", () => {
    document.getElementById("game").focus();
    window.__qaScene = "character-select";
    camScale(1, 1);
    camPos(width() / 2, height() / 2);
    const canvasEl = document.getElementById("game");
    const pointInRect = (p, rect) => (
        p.x >= rect.x &&
        p.x <= rect.x + rect.w &&
        p.y >= rect.y &&
        p.y <= rect.y + rect.h
    );
    const clientToScenePoint = (clientX, clientY) => {
        if (!canvasEl) return vec2(clientX, clientY);
        const bounds = canvasEl.getBoundingClientRect();
        const scaleX = width() / bounds.width;
        const scaleY = height() / bounds.height;
        return vec2(
            (clientX - bounds.left) * scaleX,
            (clientY - bounds.top) * scaleY,
        );
    };
    const selectCharacter = (characterId) => {
        if (selectedCharacterId === characterId) return;
        selectedCharacterId = characterId;
        emitGameLog("character.selected", { character: getCharacterLabel(characterId) });
    };

    add([
        rect(width(), height()),
        pos(0, 0),
        anchor("topleft"),
        color(20, 36, 70),
        fixed(),
        z(-100),
    ]);

    const decoHearts = [
        [160, 118, 14],
        [1138, 122, 14],
        [188, 640, 14],
        [1094, 640, 14],
    ];
    decoHearts.forEach(([hx, hy, sz]) => {
        add([
            text("♥", { size: sz }),
            pos(hx, hy),
            anchor("center"),
            color(245, 119, 153),
            fixed(),
        ]);
    });

    add([
        text("Choose Your Hero", { size: 48 }),
        pos(width() / 2, 108),
        anchor("center"),
        color(255, 218, 232),
        fixed(),
    ]);
    add([
        text("Pick one and lock it in", { size: 20 }),
        pos(width() / 2, 152),
        anchor("center"),
        color(238, 227, 201),
        fixed(),
    ]);

    const selectedText = add([
        text(`Selected: ${getCharacterLabel()}`, { size: 22 }),
        pos(width() / 2, 188),
        anchor("center"),
        color(255, 228, 200),
        fixed(),
    ]);

    const cards = [];
    const topPad = 236;
    const colGap = 64;
    const rowGap = 30;
    const cardW = 236;
    const cardH = 170;
    const gridW = cardW * 2 + colGap;
    const gridStartX = width() / 2 - gridW / 2 + cardW / 2;
    const gridStartY = topPad + cardH / 2;

    CHARACTER_VARIANTS.forEach((variant, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const x = gridStartX + col * (cardW + colGap);
        const y = gridStartY + row * (cardH + rowGap);
        const optionTag = `charOpt${idx}`;
        const bounds = {
            x: x - cardW / 2,
            y: y - cardH / 2,
            w: cardW,
            h: cardH,
        };

        const panel = add([
            rect(cardW, cardH, { radius: 18 }),
            pos(x, y),
            anchor("center"),
            color(34, 56, 96),
            outline(3, variant.id === selectedCharacterId ? rgb(255, 206, 226) : rgb(148, 176, 219)),
            area(),
            scale(1),
            fixed(),
            optionTag,
        ]);

        const avatar = add([
            sprite(`player-${variant.id}`),
            pos(x, y - cardH * 0.23),
            anchor("center"),
            scale(1.4),
            area(),
            fixed(),
            optionTag,
        ]);

        const name = add([
            text(variant.label, { size: 24 }),
            pos(x, y + cardH * 0.28),
            anchor("center"),
            color(255, 229, 211),
            area(),
            fixed(),
            optionTag,
        ]);

        const selectedTag = add([
            text("SELECTED", { size: 12 }),
            pos(x, y - cardH * 0.39),
            anchor("center"),
            color(255, 241, 219),
            fixed(),
        ]);

        panel.onUpdate(() => {
            const isSelected = selectedCharacterId === variant.id;
            const isHover = pointInRect(mousePos(), bounds);
            panel.scale = isSelected ? vec2(1.05) : isHover ? vec2(1.03) : vec2(1);
            avatar.scale = isSelected ? vec2(1.48) : isHover ? vec2(1.44) : vec2(1.4);

            if (isSelected) {
                panel.color = rgb(86, 56, 80);
                panel.outline.color = rgb(255, 214, 234);
                name.color = rgb(255, 244, 232);
                selectedTag.hidden = false;
                selectedTag.color = rgb(255, 241, 219);
            } else if (isHover) {
                panel.color = rgb(61, 88, 130);
                panel.outline.color = rgb(223, 238, 255);
                name.color = rgb(255, 247, 236);
                selectedTag.hidden = true;
            } else {
                panel.color = rgb(34, 56, 96);
                panel.outline.color = rgb(148, 176, 219);
                name.color = rgb(255, 229, 211);
                selectedTag.hidden = true;
            }
        });

        onClick(optionTag, () => selectCharacter(variant.id));
        cards.push({ bounds, id: variant.id });
    });

    onUpdate(() => {
        selectedText.text = `Selected: ${getCharacterLabel()}`;
    });

    const confirmBtn = add([
        rect(236, 54, { radius: 14 }),
        pos(width() / 2 - 128, height() - 58),
        anchor("center"),
        color(245, 119, 153),
        outline(2, rgb(255, 227, 237)),
        area(),
        scale(1),
        fixed(),
        "charConfirmBtn",
    ]);
    const confirmText = add([
        text("Use Hero", { size: 22 }),
        pos(confirmBtn.pos.x, confirmBtn.pos.y),
        anchor("center"),
        color(255, 245, 251),
        fixed(),
    ]);

    const backBtn = add([
        rect(186, 54, { radius: 14 }),
        pos(width() / 2 + 154, height() - 58),
        anchor("center"),
        color(126, 172, 181),
        outline(2, rgb(216, 245, 250)),
        area(),
        scale(1),
        fixed(),
        "charBackBtn",
    ]);
    const backText = add([
        text("Back", { size: 21 }),
        pos(backBtn.pos.x, backBtn.pos.y),
        anchor("center"),
        color(17, 40, 49),
        fixed(),
    ]);

    const confirmBounds = {
        x: confirmBtn.pos.x - 118,
        y: confirmBtn.pos.y - 27,
        w: 236,
        h: 54,
    };
    const backBounds = {
        x: backBtn.pos.x - 93,
        y: backBtn.pos.y - 27,
        w: 186,
        h: 54,
    };

    confirmBtn.onUpdate(() => {
        const hover = pointInRect(mousePos(), confirmBounds);
        confirmBtn.scale = hover ? vec2(1.05) : vec2(1);
        confirmBtn.color = hover ? rgb(255, 140, 176) : rgb(245, 119, 153);
        confirmText.color = hover ? rgb(255, 255, 255) : rgb(255, 245, 251);
    });
    backBtn.onUpdate(() => {
        const hover = pointInRect(mousePos(), backBounds);
        backBtn.scale = hover ? vec2(1.05) : vec2(1);
        backBtn.color = hover ? rgb(151, 196, 204) : rgb(126, 172, 181);
        backText.color = hover ? rgb(10, 30, 38) : rgb(17, 40, 49);
    });

    let exiting = false;
    let detachPointerRouter = () => {};
    if (canvasEl) {
        const pointerRouter = (evt) => {
            if (window.__qaScene !== "character-select") return;
            const canvasBounds = canvasEl.getBoundingClientRect();
            if (
                evt.clientX < canvasBounds.left ||
                evt.clientX > canvasBounds.right ||
                evt.clientY < canvasBounds.top ||
                evt.clientY > canvasBounds.bottom
            ) {
                return;
            }
            const pointer = clientToScenePoint(evt.clientX, evt.clientY);
            for (const card of cards) {
                if (pointInRect(pointer, card.bounds)) {
                    selectCharacter(card.id);
                    return;
                }
            }
            if (pointInRect(pointer, confirmBounds) || pointInRect(pointer, backBounds)) {
                returnToTitle();
            }
        };
        window.addEventListener("pointerdown", pointerRouter, true);
        detachPointerRouter = () => window.removeEventListener("pointerdown", pointerRouter, true);
    }
    const returnToTitle = () => {
        if (exiting) return;
        detachPointerRouter();
        exiting = true;
        go("title");
    };

    onClick("charConfirmBtn", () => returnToTitle());
    onClick("charBackBtn", () => returnToTitle());

    onKeyPress("enter", () => returnToTitle());
    onKeyPress("space", () => returnToTitle());
    onKeyPress("escape", () => {
        detachPointerRouter();
        go("title");
    });
});

scene("level-select", () => {
    const gameCanvasEl = document.getElementById("game");
    gameCanvasEl.focus();
    window.__qaScene = "level-select";
    const pointInRect = (p, rect) => (
        p.x >= rect.x &&
        p.x <= rect.x + rect.w &&
        p.y >= rect.y &&
        p.y <= rect.y + rect.h
    );
    const clientToScenePoint = (clientX, clientY) => {
        if (!gameCanvasEl) return vec2(clientX, clientY);
        const bounds = gameCanvasEl.getBoundingClientRect();
        const scaleX = width() / bounds.width;
        const scaleY = height() / bounds.height;
        return vec2(
            (clientX - bounds.left) * scaleX,
            (clientY - bounds.top) * scaleY,
        );
    };

    drawLayeredSky([32, 46, 78], 0);
    drawBackgroundLayers([32, 46, 78], 0);
    drawStars(26);

    add([
        text("Level Select", { size: 50 }),
        pos(width() / 2, 84),
        anchor("center"),
        color(255, 220, 236),
    ]);
    add([
        text("Pick any month and jump straight in", { size: 18 }),
        pos(width() / 2, 128),
        anchor("center"),
        color(206, 216, 236),
    ]);

    const cols = 4;
    const btnW = 240;
    const btnH = 56;
    const gapX = 20;
    const gapY = 18;
    const totalW = cols * btnW + (cols - 1) * gapX;
    const startX = (width() - totalW) / 2 + btnW / 2;
    const startY = 196;
    let exiting = false;
    let detachPointerRouter = () => {};
    const levelButtons = [];
    const safeGo = (targetScene, arg) => {
        if (exiting) return;
        exiting = true;
        detachPointerRouter();
        if (typeof arg === "undefined") go(targetScene);
        else go(targetScene, arg);
    };

    MEMORIES.forEach((m, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const bx = startX + col * (btnW + gapX);
        const by = startY + row * (btnH + gapY);
        const tag = `levelBtn-${idx}`;
        const btn = add([
            rect(btnW, btnH, { radius: 14 }),
            pos(bx, by),
            anchor("center"),
            color(27, 42, 70),
            outline(2, rgb(255, 190, 216)),
            area(),
            scale(1),
            tag,
        ]);
        add([
            text(`${idx + 1}. ${m.month}`, { size: 18 }),
            pos(bx, by),
            anchor("center"),
            color(255, 234, 210),
        ]);
        btn.onUpdate(() => {
            btn.scale = btn.isHovering() ? vec2(1.04) : vec2(1);
        });
        levelButtons.push({
            idx,
            bounds: {
                x: bx - btnW / 2,
                y: by - btnH / 2,
                w: btnW,
                h: btnH,
            },
        });
        onClick(tag, () => safeGo("month", idx));
    });

    const bossBtn = add([
        rect(250, 52, { radius: 16 }),
        pos(width() / 2 - 146, height() - 56),
        anchor("center"),
        color(96, 63, 124),
        outline(2, rgb(230, 202, 255)),
        area(),
        scale(1),
        "bossLevelBtn",
    ]);
    add([
        text("Boss: Kanushku", { size: 19 }),
        pos(bossBtn.pos.x, bossBtn.pos.y),
        anchor("center"),
        color(244, 228, 255),
    ]);
    bossBtn.onUpdate(() => {
        bossBtn.scale = bossBtn.isHovering() ? vec2(1.05) : vec2(1);
    });
    const bossBounds = {
        x: bossBtn.pos.x - 125,
        y: bossBtn.pos.y - 26,
        w: 250,
        h: 52,
    };
    onClick("bossLevelBtn", () => safeGo("rescue-boss"));

    const backBtn = add([
        rect(190, 52, { radius: 16 }),
        pos(width() / 2 + 156, height() - 56),
        anchor("center"),
        color(126, 172, 181),
        outline(2, rgb(216, 245, 250)),
        area(),
        "levelBackBtn",
    ]);
    add([
        text("Back", { size: 20 }),
        pos(backBtn.pos.x, backBtn.pos.y),
        anchor("center"),
        color(18, 40, 46),
    ]);
    const backBounds = {
        x: backBtn.pos.x - 95,
        y: backBtn.pos.y - 26,
        w: 190,
        h: 52,
    };
    onClick("levelBackBtn", () => safeGo("title"));

    if (gameCanvasEl) {
        const pointerRouter = (evt) => {
            if (window.__qaScene !== "level-select") return;
            const canvasBounds = gameCanvasEl.getBoundingClientRect();
            if (
                evt.clientX < canvasBounds.left ||
                evt.clientX > canvasBounds.right ||
                evt.clientY < canvasBounds.top ||
                evt.clientY > canvasBounds.bottom
            ) {
                return;
            }
            const pointer = clientToScenePoint(evt.clientX, evt.clientY);
            for (const btn of levelButtons) {
                if (pointInRect(pointer, btn.bounds)) {
                    safeGo("month", btn.idx);
                    return;
                }
            }
            if (pointInRect(pointer, bossBounds)) {
                safeGo("rescue-boss");
                return;
            }
            if (pointInRect(pointer, backBounds)) {
                safeGo("title");
            }
        };
        window.addEventListener("pointerdown", pointerRouter, true);
        detachPointerRouter = () => window.removeEventListener("pointerdown", pointerRouter, true);
    }

    onKeyPress("escape", () => safeGo("title"));
});

// ============================================
// MONTH SCENE (MARIO-STYLE PLATFORMER)
// ============================================
scene("month", (monthIndex) => {
    // Reset state and hide any lingering popups
    memoryTriggered = false;
    heartsCollected = 0;
    document.getElementById("memory-popup").classList.add("hidden");
    document.getElementById("love-letter-overlay").classList.add("hidden");

    // Focus canvas for keyboard input
    const gameCanvasEl = document.getElementById("game");
    gameCanvasEl.focus();
    window.__qaScene = `month-${monthIndex}`;
    const monthPointInRect = (p, rect) => (
        p.x >= rect.x &&
        p.x <= rect.x + rect.w &&
        p.y >= rect.y &&
        p.y <= rect.y + rect.h
    );
    const clientToMonthPoint = (clientX, clientY) => {
        if (!gameCanvasEl) return vec2(clientX, clientY);
        const bounds = gameCanvasEl.getBoundingClientRect();
        const scaleX = width() / bounds.width;
        const scaleY = height() / bounds.height;
        return vec2(
            (clientX - bounds.left) * scaleX,
            (clientY - bounds.top) * scaleY,
        );
    };
    startBgm();

    const memory = MEMORIES[monthIndex];
    emitGameLog("scene.month.enter", { month: memory.month, index: monthIndex });

    // Sky gradient (Jan → Dec order)
    const skyColors = [
        [128, 189, 132], // Jan - bright park morning
        [186, 154, 192], // Feb - love wonderland dusk
        [168, 196, 232], // Mar - sunset harbor sky
        [214, 168, 126], // Apr - Kolkata warm haze
        [150, 170, 146], // May - Kolkata monsoon gray
        [136, 208, 232], // Jun - summer bright sky
        [36, 24, 56],    // Jul - candlelight concert night
        [246, 161, 120], // Aug - birthday sunset glow
        [141, 104, 118], // Sep - festive evening
        [28, 15, 42],    // Oct - deep spooky night
        [235, 180, 146], // Nov - birthday peach evening
        [52, 74, 116],   // Dec - christmas night blue
    ];

    const sc = skyColors[monthIndex];

    // Layered sky
    drawLayeredSky(sc, monthIndex);

    const ambientHeartsByMonth = [4, 10, 5, 4, 4, 6, 4, 7, 5, 3, 8, 6];
    drawFloatingHearts(ambientHeartsByMonth[monthIndex] || 4);

    // Level config
    const config = ACTIVE_LEVEL_CONFIGS[monthIndex];
    const addon = getScaledLevelAddon(monthIndex);
    const sceneCheckpoints = getScaledLevelCheckpoints(monthIndex);
    const sceneSpecials = getScaledMonthSpecialObjects(monthIndex);
    const scenePlatforms = [...config.platforms, ...addon.platforms];
    const sceneHazards = addon.hazards;
    const platformBounds = scenePlatforms.map((p) => ({
        left: p.x - p.w / 2,
        right: p.x + p.w / 2,
        top: p.y - sy(24),
        bottom: p.y + sy(2),
    }));
    const hazardBounds = sceneHazards.map((h) => {
        if (h.type === "orb") {
            const endX = h.moveToX || (h.x + sx(120));
            const endY = h.moveToY || h.y;
            return {
                left: Math.min(h.x, endX) - sx(28),
                right: Math.max(h.x, endX) + sx(28),
                top: Math.min(h.y, endY) - sy(28),
                bottom: Math.max(h.y, endY) + sy(28),
            };
        }
        return {
            left: h.x - sx(10),
            right: h.x + h.w + sx(10),
            top: h.y - sy(26),
            bottom: h.y + sy(18),
        };
    });
    const clampPointToWorld = (point) => ({
        x: Math.max(sx(38), Math.min(width() - sx(38), point.x)),
        y: Math.max(sy(92), Math.min(GROUND_Y - sy(40), point.y)),
    });
    const pointBlockedByPlatform = (point) => platformBounds.some((p) => (
        point.x > (p.left + sx(8)) &&
        point.x < (p.right - sx(8)) &&
        point.y > (p.top - sy(7)) &&
        point.y < (p.bottom + sy(8))
    ));
    const pointBlockedByHazard = (point) => hazardBounds.some((h) => (
        point.x > h.left &&
        point.x < h.right &&
        point.y > (h.top - sy(24)) &&
        point.y < (h.bottom + sy(12))
    ));
    const pointTooClose = (point, used) => used.some((u) => (
        Math.abs(point.x - u.x) < sx(26) &&
        Math.abs(point.y - u.y) < sy(26)
    ));
    const resolveReachablePoint = (source, reserved = []) => {
        const offsets = [
            [0, 0],
            [0, -sy(48)],
            [sx(48), -sy(38)],
            [-sx(48), -sy(38)],
            [sx(90), -sy(44)],
            [-sx(90), -sy(44)],
            [0, -sy(74)],
            [sx(132), -sy(52)],
            [-sx(132), -sy(52)],
            [sx(60), sy(24)],
            [-sx(60), sy(24)],
        ];
        for (const [dx, dy] of offsets) {
            const candidate = clampPointToWorld({ x: source.x + dx, y: source.y + dy });
            if (pointBlockedByPlatform(candidate)) continue;
            if (pointBlockedByHazard(candidate)) continue;
            if (pointTooClose(candidate, reserved)) continue;
            return candidate;
        }
        return clampPointToWorld({ x: source.x, y: source.y - sy(56) });
    };
    const sanitizePointList = (points, reserved = []) => {
        const safePoints = [];
        points.forEach((point) => {
            const safePoint = resolveReachablePoint(point, [...reserved, ...safePoints]);
            safePoints.push(safePoint);
        });
        return safePoints;
    };
    const collectiblePoints = sanitizePointList(config.hearts.map((h) => ({ x: h.x, y: h.y })));

    // Mario-style ground rendering (Section 1)
    const groundStyle = getGroundStyle(monthIndex);
    config.ground.segments.forEach(seg => {
        drawMarioGround(seg.x, seg.w, groundStyle, monthIndex);
    });

    // Mario-style background layers (Section 3: hills, clouds/stars)
    drawBackgroundLayers(sc, monthIndex);
    drawForegroundDepth(monthIndex, config, groundStyle);

    // UI: Month label (Section 7: adaptive outline color to sky brightness)
    const skyBrightness = (sc[0] + sc[1] + sc[2]) / 3;
    const labelOutline = skyBrightness > 150
        ? rgb(200, 100, 130) // darker outline on bright skies
        : rgb(255, 180, 210); // bright outline on dark skies
    add([
        rect(180, 40, { radius: 8 }),
        pos(15, 15),
        color(20, 30, 50),
        opacity(0.85),
        outline(2, labelOutline),
        fixed(),
        z(20),
    ]);
    add([
        text(`♥ ${memory.month}`, { size: 20 }),
        pos(25, 25),
        color(255, 200, 220),
        fixed(),
        z(21),
    ]);

    // UI: Progress bar
    add([
        rect(160, 10, { radius: 5 }),
        pos(width() - 178, 18),
        color(50, 60, 80),
        outline(1, labelOutline),
        fixed(),
        z(20),
    ]);
    add([
        rect(((monthIndex + 1) / 12) * 156, 6, { radius: 3 }),
        pos(width() - 176, 20),
        color(255, 130, 160),
        fixed(),
        z(21),
    ]);
    add([
        text(`${monthIndex + 1}/12`, { size: 12 }),
        pos(width() - 98, 36),
        anchor("center"),
        color(180, 190, 220),
        fixed(),
        z(21),
    ]);

    if (skyBrightness > 150) {
        add([
            rect(160, 62, { radius: 10 }),
            pos(width() - 177, 11),
            color(22, 38, 66),
            opacity(0.52),
            fixed(),
            z(19),
        ]);
    }

    // UI: Collectibles counter (Section 7: right-anchored to prevent width-jump)
    const totalCollectibles = collectiblePoints.length;
    const heartUI = add([
        text(`0/${totalCollectibles} ${config.collectible.label}`, { size: 16 }),
        pos(width() - 15, 60),
        anchor("right"),
        color(255, 220, 200),
        fixed(),
        z(21),
    ]);

    const missionConfig = getMissionConfig(monthIndex);
    let missionProgress = 0;
    let missionComplete = !missionConfig;
    let comboStreak = 0;
    let comboTimer = 0;
    let airtimeSeconds = 0;
    let rideSeconds = 0;
    let missionTokensCollected = 0;

    const missionBackdrop = add([
        rect(460, 34, { radius: 10 }),
        pos(width() / 2, height() - 18),
        anchor("center"),
        color(24, 34, 60),
        opacity(0.68),
        fixed(),
        z(20),
    ]);
    const missionUI = add([
        text("", { size: 14 }),
        pos(width() / 2, height() - 18),
        anchor("center"),
        color(235, 236, 255),
        fixed(),
        z(21),
    ]);
    const missionBadgeBg = add([
        rect(162, 28, { radius: 9 }),
        pos(width() - 96, height() - 52),
        anchor("center"),
        color(24, 34, 60),
        opacity(0.82),
        fixed(),
        z(20),
    ]);
    const missionBadge = add([
        text("Bonus Pending", { size: 13 }),
        pos(width() - 96, height() - 52),
        anchor("center"),
        color(214, 224, 244),
        fixed(),
        z(21),
    ]);

    const updateMissionUI = () => {
        if (!missionConfig) {
            missionUI.text = "Bonus Goal: None";
            missionBadge.text = "No Bonus";
            missionBadge.color = rgb(174, 184, 206);
            missionBadgeBg.color = rgb(33, 46, 74);
            return;
        }
        if (missionConfig.type === "combo") {
            missionUI.text = `Bonus: ${missionConfig.title} ${Math.min(comboStreak, missionConfig.target)}/${missionConfig.target}`;
        } else if (missionConfig.type === "airtime") {
            missionUI.text = `Bonus: ${missionConfig.title} ${airtimeSeconds.toFixed(1)}s/${missionConfig.target}s`;
        } else if (missionConfig.type === "ride") {
            missionUI.text = `Bonus: ${missionConfig.title} ${rideSeconds.toFixed(1)}s/${missionConfig.target}s`;
        } else {
            missionUI.text = `Bonus: ${missionConfig.title} ${missionTokensCollected}/${missionConfig.target}`;
        }
        if (missionComplete) {
            missionUI.text = `Bonus Complete: ${missionConfig.title} ✓`;
            missionBadge.text = "Bonus ✓";
            missionBadge.color = rgb(170, 236, 194);
            missionBadgeBg.color = rgb(34, 66, 70);
        } else {
            missionBadge.text = "Bonus Pending";
            missionBadge.color = rgb(214, 224, 244);
            missionBadgeBg.color = rgb(24, 34, 60);
        }
    };
    updateMissionUI();

    const ghostExpositionLines = [
        "I can feel you getting closer. Keep going.",
        "Every collectible is a clue. I am right ahead.",
        "The water path is right. Follow it to me.",
        "Kolkata lights still remember us. I am waiting.",
        "Distance could not break us. Keep moving.",
        "Summer says you are close now.",
        "Your footsteps reached me through the music.",
        "Birthday wish: rescue complete tonight.",
        "Festive lights are pointing to me.",
        "You are braver than every shadow here.",
        "Happy Birthday, Anushku. I am almost there.",
        "One last push. I am waiting at the end.",
    ];
    const ghostPanelW = Math.min(sx(430), width() - sx(90));
    const ghostPanelH = sy(90);
    const ghostPanelX = width() - sx(24) - ghostPanelW / 2;
    const ghostPanelY = sy(104);
    const ghostDialogPanel = add([
        rect(ghostPanelW, ghostPanelH, { radius: 12 }),
        pos(ghostPanelX, ghostPanelY),
        anchor("center"),
        color(16, 28, 50),
        opacity(0),
        outline(2, rgb(145, 182, 228)),
        fixed(),
        z(34),
    ]);
    const ghostSarthu = add([
        sprite("boyfriend"),
        pos(ghostPanelX - ghostPanelW / 2 + sx(34), ghostPanelY + sy(8)),
        anchor("center"),
        scale(0.7),
        opacity(0),
        fixed(),
        z(35),
    ]);
    const ghostDialogName = add([
        text("Ghost Sarthu", { size: 12 }),
        pos(ghostPanelX - ghostPanelW / 2 + sx(72), ghostPanelY - sy(28)),
        color(170, 216, 255),
        opacity(0),
        fixed(),
        z(35),
    ]);
    const ghostDialogText = add([
        text("", { size: 14, width: ghostPanelW - sx(128), lineSpacing: 4 }),
        pos(ghostPanelX - ghostPanelW / 2 + sx(72), ghostPanelY - sy(8)),
        color(228, 238, 255),
        opacity(0),
        fixed(),
        z(35),
    ]);
    const ghostDialogCloseBtn = add([
        rect(28, 28, { radius: 8 }),
        pos(ghostPanelX + ghostPanelW / 2 - sx(18), ghostPanelY - ghostPanelH / 2 + sy(14)),
        anchor("center"),
        color(44, 62, 92),
        area(),
        opacity(0),
        fixed(),
        z(36),
        "ghostDialogCloseBtn",
    ]);
    const ghostDialogCloseText = add([
        text("×", { size: 20 }),
        pos(ghostDialogCloseBtn.pos.x, ghostDialogCloseBtn.pos.y - sy(1)),
        anchor("center"),
        color(228, 238, 255),
        opacity(0),
        fixed(),
        z(37),
    ]);
    const ghostCloseBounds = {
        x: ghostDialogCloseBtn.pos.x - 14,
        y: ghostDialogCloseBtn.pos.y - 14,
        w: 28,
        h: 28,
    };
    const ghostDialogState = {
        shown: false,
        dismissed: false,
        fullText: "",
        visibleChars: 0,
        ticker: 0,
    };
    let ghostPointerRouter = null;
    const attachGhostClosePointer = () => {
        if (!gameCanvasEl || ghostPointerRouter) return;
        ghostPointerRouter = (evt) => {
            if (!ghostDialogState.shown || window.__qaScene !== `month-${monthIndex}`) return;
            const canvasBounds = gameCanvasEl.getBoundingClientRect();
            if (
                evt.clientX < canvasBounds.left ||
                evt.clientX > canvasBounds.right ||
                evt.clientY < canvasBounds.top ||
                evt.clientY > canvasBounds.bottom
            ) {
                return;
            }
            const pointer = clientToMonthPoint(evt.clientX, evt.clientY);
            if (!monthPointInRect(pointer, ghostCloseBounds)) return;
            evt.preventDefault();
            evt.stopPropagation();
            hideGhostDialog();
        };
        window.addEventListener("pointerdown", ghostPointerRouter, true);
    };
    const detachGhostClosePointer = () => {
        if (!ghostPointerRouter) return;
        window.removeEventListener("pointerdown", ghostPointerRouter, true);
        ghostPointerRouter = null;
    };
    const hideGhostDialog = () => {
        ghostDialogState.shown = false;
        ghostDialogState.dismissed = true;
        ghostDialogPanel.opacity = 0;
        ghostDialogName.opacity = 0;
        ghostDialogText.opacity = 0;
        ghostSarthu.opacity = 0;
        ghostDialogCloseBtn.opacity = 0;
        ghostDialogCloseText.opacity = 0;
        detachGhostClosePointer();
    };
    ghostDialogCloseBtn.onClick(() => {
        if (!ghostDialogState.shown) return;
        hideGhostDialog();
    });
    onClick("ghostDialogCloseBtn", () => {
        if (!ghostDialogState.shown) return;
        hideGhostDialog();
    });
    ghostDialogCloseBtn.onUpdate(() => {
        if (!ghostDialogState.shown) return;
        const hovering = ghostDialogCloseBtn.isHovering();
        ghostDialogCloseBtn.color = hovering ? rgb(60, 84, 120) : rgb(44, 62, 92);
        ghostDialogCloseText.pos = ghostDialogCloseBtn.pos.clone();
    });
    const showGhostDialog = () => {
        if (ghostDialogState.shown || ghostDialogState.dismissed) return;
        ghostDialogState.shown = true;
        ghostDialogState.fullText = ghostExpositionLines[monthIndex] || "I am close. Keep going.";
        ghostDialogState.visibleChars = 0;
        ghostDialogState.ticker = 0;
        ghostDialogPanel.opacity = 0.94;
        ghostDialogText.opacity = 1;
        ghostDialogName.opacity = 1;
        ghostSarthu.opacity = 0.22;
        ghostDialogCloseBtn.opacity = 1;
        ghostDialogCloseText.opacity = 1;
        ghostDialogText.text = "";
        attachGhostClosePointer();
        emitGameLog("ghost.exposition", { month: memory.month });
    };
    ghostDialogText.onUpdate(() => {
        if (!ghostDialogState.shown) return;
        ghostSarthu.opacity = 0.18 + Math.sin(time() * 3.4) * 0.08;
        ghostDialogState.ticker += dt();
        if (ghostDialogState.visibleChars >= ghostDialogState.fullText.length) return;
        const charStep = 0.022;
        while (ghostDialogState.ticker > charStep && ghostDialogState.visibleChars < ghostDialogState.fullText.length) {
            ghostDialogState.ticker -= charStep;
            ghostDialogState.visibleChars += 1;
        }
        ghostDialogText.text = ghostDialogState.fullText.slice(0, ghostDialogState.visibleChars);
    });

    const setMissionComplete = () => {
        if (missionComplete || !missionConfig) return;
        missionComplete = true;
        updateMissionUI();
        emitGameLog("mission.complete", { month: memory.month, mission: missionConfig.title });
        playDing();
    };

    const missionSpawnPoints = missionConfig && (missionConfig.type === "tokens" || missionConfig.type === "rings")
        ? sanitizePointList(
            missionConfig.points.map(([mx, my]) => ({ x: mx, y: my })),
            collectiblePoints,
        ).map((point) => [point.x, point.y])
        : [];
    if (missionSpawnPoints.length > 0) {
        missionSpawnPoints.forEach(([mx, my], idx) => {
            const ringLike = missionConfig.type === "rings";
            const marker = add([
                ringLike ? circle(16) : circle(12),
                pos(mx, my),
                anchor("center"),
                color(ringLike ? 255 : 250, ringLike ? 220 : 235, ringLike ? 140 : 190),
                opacity(ringLike ? 0.35 : 0.55),
                ...(ringLike ? [outline(2, rgb(255, 240, 170))] : []),
                area({ scale: 1.05 }),
                z(11),
                "missionTarget",
                { idx, touched: false, ringLike, baseY: my, phase: rand(0, 6) },
            ]);
            const icon = add([
                text(missionConfig.icon || "✦", { size: ringLike ? 16 : 14 }),
                pos(mx, my),
                anchor("center"),
                color(ringLike ? 255 : 255, ringLike ? 246 : 225, ringLike ? 175 : 210),
                opacity(0.85),
                z(12),
                { marker },
            ]);
            marker.onUpdate(() => {
                if (marker.touched) return;
                marker.pos.y = marker.baseY + Math.sin(time() * 2.4 + marker.phase) * 6;
                marker.opacity = (ringLike ? 0.25 : 0.45) + Math.sin(time() * 3 + marker.phase) * 0.2;
                icon.pos = marker.pos.clone();
            });
            icon.onUpdate(() => {
                if (marker.touched) {
                    icon.opacity = Math.max(0, icon.opacity - dt() * 4);
                    if (icon.opacity <= 0.02) destroy(icon);
                }
            });
        });
    }

    // Portal at end
    drawEnhancedPortal(config.portal.x, config.portal.y);

    // Boyfriend waiting at portal (with per-month behavior)
    const isDistantMonth = (monthIndex === 3 || monthIndex === 4); // Apr, May - missing
    const bf = add([
        sprite("boyfriend"),
        pos(config.boyfriend.x, config.boyfriend.y),
        anchor("bot"),
        scale(0.85),
        opacity(isDistantMonth ? 0.55 : 1),
        z(6),
    ]);
    bf.onUpdate(() => {
        bf.pos.y = config.boyfriend.y + Math.sin(time() * 2) * 3;
        // Apr/May: distant shimmer
        if (isDistantMonth) {
            bf.opacity = 0.5 + Math.sin(time() * 1.5) * 0.15;
        }
    });
    // Nov (10): birthday confetti burst near boyfriend
    if (monthIndex === 10) {
        loop(0.3, () => {
            const c = add([
                text("*", { size: rand(6, 12) }),
                pos(bf.pos.x + rand(-30, 30), bf.pos.y - rand(20, 60)),
                color(rand(200, 255), rand(100, 255), rand(150, 255)),
                opacity(1),
                z(5),
                { timer: 0 },
            ]);
            c.onUpdate(() => {
                c.timer += dt();
                c.pos.y -= 20 * dt();
                c.opacity = Math.max(0, 1 - c.timer);
                if (c.timer > 1) destroy(c);
            });
        });
    }

    let player = null;

    // Sarthu speech bubble (outside ghost box) should only use the two requested lines.
    const speechFar = SARTHU_DIALOG_LINES[0];
    const speechNear = SARTHU_DIALOG_LINES[1];
    const bubbleMsg = speechFar;
    const bubbleW = Math.max(96, bubbleMsg.length * 8 + 26);
    const bubbleBg = add([
        rect(bubbleW, 30, { radius: 8 }),
        pos(config.boyfriend.x, config.boyfriend.y - 85),
        anchor("center"),
        color(255, 255, 255),
        opacity(0.95),
        z(7),
    ]);
    const bubbleText = add([
        text(bubbleMsg, { size: 12 }),
        pos(config.boyfriend.x, config.boyfriend.y - 85),
        anchor("center"),
        color(80, 80, 100),
        z(8),
    ]);
    // Bubble follows boyfriend bob and only appears when player is near.
    bubbleBg.onUpdate(() => {
        const bx = Math.min(bf.pos.x, width() - bubbleW / 2 - 5);
        bubbleBg.pos.x = Math.max(bubbleW / 2 + 5, bx);
        bubbleBg.pos.y = bf.pos.y - 60;
        if (!player) return;
        const dist = Math.abs(player.pos.x - bf.pos.x);
        const visible = dist < sx(300);
        bubbleBg.opacity = visible ? 0.95 : 0;
    });
    bubbleText.onUpdate(() => {
        bubbleText.pos.x = bubbleBg.pos.x;
        bubbleText.pos.y = bubbleBg.pos.y;
        if (!player) return;
        const dist = Math.abs(player.pos.x - bf.pos.x);
        const visible = dist < sx(300);
        if (!visible) {
            bubbleText.opacity = 0;
            return;
        }
        bubbleText.opacity = 1;
        bubbleText.text = dist < sx(140) ? speechNear : speechFar;
    });

    // Floating platforms
    scenePlatforms.forEach(p => {
        const platformSpriteByMonth = [
            "platform-wood",
            "platform-romance",
            "platform-wood",
            "platform-stone",
            "platform-stone",
            "platform-wood",
            "platform-spooky",
            "platform-romance",
            "platform-wood",
            "platform-spooky",
            "platform-romance",
            "platform-ice",
        ];
        const skinSprite = platformSpriteByMonth[monthIndex] || "platform-stone";
        const isMoving = p.type === "moving";
        const colliderH = sy(24);

        const baseComponents = [
            rect(p.w, colliderH),
            pos(p.x, p.y),
            anchor("bot"),
            area(),
            body({ isStatic: true }),
            color(0, 0, 0),
            opacity(0),
            z(1),
            "platform",
        ];

        if (isMoving) {
            baseComponents.push("movingPlatform");
            baseComponents.push({
                startX: p.x,
                startY: p.y,
                endX: p.moveToX ?? p.x,
                endY: p.moveToY ?? p.y,
                speed: p.moveSpeed ?? 1,
                prevPos: vec2(p.x, p.y),
                colliderH,
                platformW: p.w,
            });
        }
        if (!isMoving) {
            baseComponents.push({ colliderH, platformW: p.w });
        }

        const plat = add(baseComponents);
        const skin = add([
            sprite(skinSprite),
            pos(plat.pos.x, plat.pos.y),
            anchor("bot"),
            scale(vec2(p.w / 64, colliderH / 20)),
            z(3),
            { phase: rand(0, 6) },
        ]);

        if (isMoving) {
            plat.onUpdate(() => {
                plat.prevPos = plat.pos.clone();
                const t = (Math.sin(time() * plat.speed) + 1) / 2;
                plat.pos.x = lerp(plat.startX, plat.endX, t);
                plat.pos.y = lerp(plat.startY, plat.endY, t);
                skin.pos = plat.pos.clone();
                skin.opacity = 0.88 + Math.sin(time() * 3 + skin.phase) * 0.09;
            });
        }
    });

    // Hazard rows and moving orbs to increase platforming challenge
    sceneHazards.forEach(h => {
        if (h.type === "spikes") {
            add([
                rect(h.w, sy(10), { radius: sy(2) }),
                pos(h.x, h.y + sy(1)),
                color(36, 41, 50),
                opacity(0.96),
                z(4),
            ]);
            add([
                rect(h.w, sy(2), { radius: 1 }),
                pos(h.x, h.y + sy(1)),
                color(124, 133, 149),
                opacity(0.75),
                z(5),
            ]);

            const stripeW = sx(16);
            for (let sxPos = h.x; sxPos < h.x + h.w; sxPos += stripeW) {
                add([
                    rect(stripeW - sx(3), sy(4), { radius: 1 }),
                    pos(sxPos, h.y + sy(4)),
                    color(23, 27, 35),
                    opacity(0.85),
                    z(5),
                ]);
            }

            const spacing = sx(20);
            const count = Math.max(1, Math.floor(h.w / spacing));
            for (let i = 0; i < count; i++) {
                add([
                    sprite("hazard-spike"),
                    pos(h.x + i * spacing, h.y + sy(1)),
                    anchor("bot"),
                    scale(vec2(sx(22) / 24, sy(22) / 20)),
                    area({ scale: vec2(0.8, 0.72) }),
                    z(6),
                    "hazard",
                ]);
            }
        } else if (h.type === "orb") {
            const orbWarn = add([
                circle(sx(16)),
                pos(h.x, h.y),
                anchor("center"),
                color(255, 188, 88),
                opacity(0.22),
                outline(1, rgb(255, 230, 150)),
                z(5),
                { phase: rand(0, 6) },
            ]);
            const orb = add([
                sprite("hazard-orb"),
                pos(h.x, h.y),
                anchor("center"),
                area({ scale: 0.74 }),
                z(6),
                "hazard",
                {
                    startX: h.x,
                    endX: h.moveToX || (h.x + sx(120)),
                    startY: h.y,
                    endY: h.moveToY || h.y,
                    speed: h.speed || 1,
                },
            ]);
            orb.onUpdate(() => {
                const t = (Math.sin(time() * orb.speed) + 1) / 2;
                orb.pos.x = lerp(orb.startX, orb.endX, t);
                orb.pos.y = lerp(orb.startY, orb.endY, t);
                orbWarn.pos = orb.pos.clone();
                orbWarn.scale = vec2(0.9 + Math.sin(time() * 4 + orbWarn.phase) * 0.2);
                orbWarn.opacity = 0.16 + Math.sin(time() * 5 + orbWarn.phase) * 0.12;
            });
        }
    });

    // Collectibles with glow backing + enhanced bob (Section 5)
    collectiblePoints.forEach((p, i) => {
        drawEnhancedCollectible(config.collectible.sprite, p.x, p.y, i);
    });

    // PLAYER (Anushka)
    const levelStartPos = vec2(sx(60), GROUND_Y - sy(64));
    player = add([
        sprite(getSelectedPlayerSprite()),
        pos(levelStartPos.x, levelStartPos.y),
        anchor("bot"),
        area({ scale: vec2(0.72, 0.98) }),
        body(),
        scale(0.9),
        z(20),
        "player",
    ]);

    // Movement + survivability systems
    let playerVelX = 0;
    let coyoteTimer = 0;
    let jumpBufferTimer = 0;
    let jumpQueuedMethod = "space";
    let jumpHeld = false;
    let wallSlideActive = false;
    let wallTouchDir = 0;
    let wallJumpLock = 0;
    let speedBoostTimer = 0;
    let dashCooldown = 0;
    let lastSafePos = levelStartPos.clone();
    let checkpointPos = lastSafePos.clone();
    let checkpointReached = false;
    let checkpointPulseTimer = 0;
    const MAX_HEALTH = 5;
    let health = MAX_HEALTH;
    let deathCount = 0;
    let failOverlayActive = false;
    let failOverlayNodes = [];
    let failOverlayPointerCleanup = null;
    let damageCooldown = 0;
    let prevFramePos = player.pos.clone();
    const activeGlideZones = [];
    let debugOverlayEnabled = false;
    let debugNodes = [];
    let debugLabel = null;
    const PLAYER_HALF_W = sx(13);
    const PLAYER_COLLIDER_H = sy(58);
    const checkpointHint = add([
        text("", { size: 14 }),
        pos(width() / 2, 108),
        anchor("center"),
        color(255, 236, 198),
        opacity(0),
        fixed(),
        z(30),
    ]);

    const healthBg = add([
        rect(180, 30, { radius: 8 }),
        pos(15, 66),
        color(20, 30, 50),
        opacity(0.78),
        outline(1, labelOutline),
        fixed(),
        z(21),
    ]);
    const healthUI = add([
        text("", { size: 15 }),
        pos(25, 74),
        color(255, 220, 230),
        fixed(),
        z(22),
    ]);
    const updateHealthUI = () => {
        const filled = "♥".repeat(health);
        const empty = "♡".repeat(MAX_HEALTH - health);
        healthUI.text = `Health ${filled}${empty}`;
        healthUI.color = health <= 2 ? rgb(255, 170, 170) : rgb(255, 220, 230);
        healthBg.opacity = health <= 2 ? 0.9 : 0.78;
    };
    updateHealthUI();
    const isPointInRect = (p, rect) => (
        p.x >= rect.x &&
        p.x <= rect.x + rect.w &&
        p.y >= rect.y &&
        p.y <= rect.y + rect.h
    );
    const clientToScenePoint = (clientX, clientY) => {
        const bounds = gameCanvasEl.getBoundingClientRect();
        const scaleX = width() / bounds.width;
        const scaleY = height() / bounds.height;
        return vec2(
            (clientX - bounds.left) * scaleX,
            (clientY - bounds.top) * scaleY,
        );
    };

    const clearFailOverlay = () => {
        if (failOverlayPointerCleanup) {
            failOverlayPointerCleanup();
            failOverlayPointerCleanup = null;
        }
        failOverlayNodes.forEach(node => {
            if (!node) return;
            if (typeof node.exists === "function") {
                if (node.exists()) destroy(node);
            } else {
                destroy(node);
            }
        });
        failOverlayNodes = [];
        failOverlayActive = false;
    };

    const retryAfterFail = () => {
        clearFailOverlay();
        health = MAX_HEALTH;
        damageCooldown = 0;
        checkpointReached = false;
        checkpointPos = levelStartPos.clone();
        lastSafePos = levelStartPos.clone();
        updateHealthUI();
        player.pos = levelStartPos.clone();
        player.vel = vec2(0, 0);
        get("checkpoint").forEach((cp) => {
            cp.activated = false;
            cp.scale = vec2(0.9);
            cp.opacity = 1;
        });
        emitGameLog("level.retry", { month: memory.month, deaths: deathCount });
    };

    const skipAfterFail = () => {
        clearFailOverlay();
        if (memoryTriggered) return;
        memoryTriggered = true;
        emitGameLog("level.skip", { month: memory.month, deaths: deathCount });
        showMemory(monthIndex);
    };

    const showFailOverlay = () => {
        if (failOverlayActive || memoryTriggered) return;
        failOverlayActive = true;

        const veil = add([
            rect(width(), height()),
            pos(0, 0),
            color(8, 12, 24),
            opacity(0.62),
            fixed(),
            z(80),
        ]);
        const panel = add([
            rect(470, 220, { radius: 16 }),
            pos(width() / 2, height() / 2),
            anchor("center"),
            color(22, 34, 58),
            outline(2, rgb(255, 180, 210)),
            fixed(),
            z(81),
        ]);
        const title = add([
            text("You lost all 5 hearts", { size: 30 }),
            pos(width() / 2, height() / 2 - 56),
            anchor("center"),
            color(255, 215, 225),
            fixed(),
            z(82),
        ]);
        const subtitle = add([
            text("Retry with full health or skip this month", { size: 16 }),
            pos(width() / 2, height() / 2 - 16),
            anchor("center"),
            color(206, 215, 235),
            fixed(),
            z(82),
        ]);
        const retryBtn = add([
            rect(170, 44, { radius: 18 }),
            pos(width() / 2 - 102, height() / 2 + 48),
            anchor("center"),
            color(120, 205, 145),
            area(),
            fixed(),
            z(82),
            "retryLevelBtn",
        ]);
        const retryTxt = add([
            text("Retry [R]", { size: 18 }),
            pos(retryBtn.pos.x, retryBtn.pos.y),
            anchor("center"),
            color(20, 40, 25),
            fixed(),
            z(83),
        ]);
        const skipBtn = add([
            rect(170, 44, { radius: 18 }),
            pos(width() / 2 + 102, height() / 2 + 48),
            anchor("center"),
            color(242, 131, 164),
            area(),
            fixed(),
            z(82),
            "skipLevelBtn",
        ]);
        const skipTxt = add([
            text("Skip [K]", { size: 18 }),
            pos(skipBtn.pos.x, skipBtn.pos.y),
            anchor("center"),
            color(54, 18, 34),
            fixed(),
            z(83),
        ]);
        const retryBounds = {
            x: retryBtn.pos.x - 85,
            y: retryBtn.pos.y - 22,
            w: 170,
            h: 44,
        };
        const skipBounds = {
            x: skipBtn.pos.x - 85,
            y: skipBtn.pos.y - 22,
            w: 170,
            h: 44,
        };

        retryBtn.onClick(() => {
            if (!failOverlayActive) return;
            retryAfterFail();
        });
        skipBtn.onClick(() => {
            if (!failOverlayActive) return;
            skipAfterFail();
        });
        retryBtn.onUpdate(() => {
            if (!failOverlayActive) return;
            const hovering = retryBtn.isHovering();
            retryBtn.color = hovering ? rgb(140, 220, 160) : rgb(120, 205, 145);
            retryBtn.scale = hovering ? vec2(1.04) : vec2(1);
        });
        skipBtn.onUpdate(() => {
            if (!failOverlayActive) return;
            const hovering = skipBtn.isHovering();
            skipBtn.color = hovering ? rgb(252, 151, 184) : rgb(242, 131, 164);
            skipBtn.scale = hovering ? vec2(1.04) : vec2(1);
        });
        const overlayPointerRouter = (evt) => {
            if (!failOverlayActive) return;
            const canvasBounds = gameCanvasEl.getBoundingClientRect();
            if (
                evt.clientX < canvasBounds.left ||
                evt.clientX > canvasBounds.right ||
                evt.clientY < canvasBounds.top ||
                evt.clientY > canvasBounds.bottom
            ) {
                return;
            }
            const pointer = clientToScenePoint(evt.clientX, evt.clientY);
            if (isPointInRect(pointer, retryBounds)) {
                retryAfterFail();
                return;
            }
            if (isPointInRect(pointer, skipBounds)) {
                skipAfterFail();
            }
        };
        window.addEventListener("pointerdown", overlayPointerRouter, true);
        failOverlayPointerCleanup = () => window.removeEventListener("pointerdown", overlayPointerRouter, true);

        failOverlayNodes.push(veil, panel, title, subtitle, retryBtn, retryTxt, skipBtn, skipTxt);
    };

    const applyPlayerDamage = (reason = "fall") => {
        if (memoryTriggered || failOverlayActive || damageCooldown > 0) return;

        deathCount++;
        health = Math.max(0, health - 1);
        damageCooldown = 0.85;
        updateHealthUI();
        emitGameLog("player.damage", { month: memory.month, reason, deaths: deathCount, health });

        for (let i = 0; i < 8; i++) {
            const burst = add([
                text(["♥", "✦", "·"][i % 3], { size: rand(8, 13) }),
                pos(player.pos.x, player.pos.y - rand(8, 28)),
                color(255, rand(140, 210), rand(180, 235)),
                opacity(0.88),
                z(25),
                { life: 0, vx: rand(-90, 90), vy: rand(-140, -60) },
            ]);
            burst.onUpdate(() => {
                burst.life += dt();
                burst.pos.x += burst.vx * dt();
                burst.pos.y += burst.vy * dt();
                burst.vy += 260 * dt();
                burst.opacity = Math.max(0, 0.88 - burst.life * 2.2);
                if (burst.life > 0.5) destroy(burst);
            });
        }

        const respawnPos = checkpointReached ? checkpointPos.clone() : lastSafePos.clone();
        player.pos = respawnPos;
        player.vel = vec2(0, 0);
        player.opacity = 0.5;

        if (health <= 0) {
            deathCount = Math.max(5, deathCount);
            showFailOverlay();
        }
    };

    const shouldDamageFromHazard = (hazard) => {
        if (!hazard || !hazard.pos) return true;
        const hzHalfW = (hazard.width || sx(20)) * 0.42;
        if (Math.abs(player.pos.x - hazard.pos.x) > hzHalfW + PLAYER_HALF_W) {
            return false;
        }
        const hazardTop = hazard.pos.y - (hazard.height || sy(18)) * 0.82;
        const feetLevel = player.pos.y;
        return feetLevel >= hazardTop + sy(3);
    };

    const showCheckpointHint = (message) => {
        checkpointHint.text = message;
        checkpointPulseTimer = 2.4;
        checkpointHint.opacity = 1;
    };

    sceneCheckpoints.forEach((cp, idx) => {
        const checkpoint = add([
            sprite("checkpoint-flag"),
            pos(cp.x, cp.y),
            anchor("bot"),
            scale(0.9),
            area({ scale: 0.9 }),
            z(6),
            "checkpoint",
            {
                idx,
                activated: false,
                spawnPos: vec2(cp.x, cp.y - sy(2)),
                pulse: rand(0, 6),
            },
        ]);
        checkpoint.onUpdate(() => {
            if (!checkpoint.activated) return;
            checkpoint.scale = vec2(0.95 + Math.sin(time() * 6 + checkpoint.pulse) * 0.06);
            checkpoint.opacity = 0.8 + Math.sin(time() * 5 + checkpoint.pulse) * 0.2;
        });
    });

    sceneSpecials.forEach((special) => {
        if (special.type === "springPad") {
            const springPad = add([
                sprite("spring-pad"),
                pos(special.x, special.y),
                anchor("bot"),
                scale(vec2(sx(70) / 64, sy(30) / 30)),
                area({ scale: vec2(0.92, 0.68) }),
                z(6),
                "springPad",
                {
                    power: special.power || 1.12,
                    cooldown: 0,
                    pulse: rand(0, 6),
                },
            ]);
            springPad.onUpdate(() => {
                springPad.cooldown = Math.max(0, springPad.cooldown - dt());
                springPad.scale.y = (sy(30) / 30) * (0.96 + Math.sin(time() * 5 + springPad.pulse) * 0.04);
            });
        } else if (special.type === "dashGem") {
            const dashGem = add([
                sprite("dash-gem"),
                pos(special.x, special.y),
                anchor("center"),
                scale(0.9),
                area({ scale: 1.16 }),
                z(11),
                "dashGem",
                {
                    cooldown: 0,
                    cooldownMax: special.cooldown || 6,
                    baseY: special.y,
                    pulse: rand(0, 6),
                },
            ]);
            dashGem.onUpdate(() => {
                if (dashGem.cooldown > 0) {
                    dashGem.cooldown -= dt();
                    dashGem.opacity = 0.2;
                    dashGem.scale = vec2(0.72);
                    if (dashGem.cooldown <= 0) {
                        dashGem.opacity = 1;
                        dashGem.scale = vec2(0.9);
                    }
                    return;
                }
                dashGem.pos.y = dashGem.baseY + Math.sin(time() * 3 + dashGem.pulse) * sy(7);
                dashGem.scale = vec2(0.86 + Math.sin(time() * 3.4 + dashGem.pulse) * 0.07);
                dashGem.opacity = 0.76 + Math.sin(time() * 4 + dashGem.pulse) * 0.2;
            });
        } else if (special.type === "glideZone") {
            const zone = add([
                rect(special.w || sx(120), special.h || sy(130), { radius: sx(12) }),
                pos(special.x, special.y),
                anchor("center"),
                color(182, 220, 255),
                opacity(0.08),
                z(2),
                "glideZone",
                {
                    lift: special.lift || sy(190),
                    pulse: rand(0, 6),
                    zWidth: special.w || sx(120),
                    zHeight: special.h || sy(130),
                },
            ]);
            zone.onUpdate(() => {
                zone.opacity = 0.05 + Math.sin(time() * 2.2 + zone.pulse) * 0.03;
            });
            activeGlideZones.push(zone);
        }
    });

    player.onCollide("checkpoint", (cp) => {
        if (cp.activated) return;
        cp.activated = true;
        checkpointReached = true;
        checkpointPos = cp.spawnPos.clone();
        lastSafePos = cp.spawnPos.clone();
        showCheckpointHint("Checkpoint saved ♥");
        emitGameLog("checkpoint.reached", { month: memory.month, checkpoint: cp.idx + 1 });
    });

    player.onCollide("springPad", (springPad) => {
        if (springPad.cooldown > 0 || failOverlayActive) return;
        if (player.vel.y < -sy(120)) return;
        springPad.cooldown = 0.45;
        player.jump(JUMP_FORCE * springPad.power);
        playJump();
        emitGameLog("spring.boost", { month: memory.month, power: springPad.power });
    });

    player.onCollide("dashGem", (dashGem) => {
        if (dashGem.cooldown > 0 || failOverlayActive) return;
        dashGem.cooldown = dashGem.cooldownMax;
        dashCooldown = 0;
        speedBoostTimer = 2.4;
        showCheckpointHint("Dash recharged ✦");
        emitGameLog("dash.refill", { month: memory.month, duration: speedBoostTimer });
        for (let i = 0; i < 6; i++) {
            const sparkle = add([
                circle(rand(2, 4)),
                pos(dashGem.pos.x, dashGem.pos.y),
                color(255, rand(180, 230), rand(200, 255)),
                opacity(0.85),
                z(22),
                { life: 0, vx: rand(-110, 110), vy: rand(-170, -65) },
            ]);
            sparkle.onUpdate(() => {
                sparkle.life += dt();
                sparkle.pos.x += sparkle.vx * dt();
                sparkle.pos.y += sparkle.vy * dt();
                sparkle.vy += 240 * dt();
                sparkle.opacity = Math.max(0, 0.85 - sparkle.life * 2.5);
                if (sparkle.life > 0.42) destroy(sparkle);
            });
        }
    });

    onKeyPress("r", () => {
        if (failOverlayActive) retryAfterFail();
    });
    onKeyPress("k", () => {
        if (failOverlayActive) skipAfterFail();
    });
    onClick("retryLevelBtn", () => {
        if (failOverlayActive) retryAfterFail();
    });
    onClick("skipLevelBtn", () => {
        if (failOverlayActive) skipAfterFail();
    });

    const queueJump = (method) => {
        if (failOverlayActive) return;
        jumpBufferTimer = MOVEMENT_TUNING.jumpBufferTime;
        jumpQueuedMethod = method;
        jumpHeld = true;
    };

    const doJump = (jumpKind = "ground") => {
        const force = jumpKind === "wall" ? JUMP_FORCE * 0.92 : JUMP_FORCE;
        player.jump(force);
        coyoteTimer = 0;
        jumpBufferTimer = 0;
        playJump();
        emitGameLog("player.jump", { month: memory.month, method: jumpQueuedMethod, kind: jumpKind });
        if (jumpKind === "wall") {
            player.vel.x = -wallTouchDir * MOVEMENT_TUNING.wallJumpX;
            wallJumpLock = MOVEMENT_TUNING.wallJumpLockTime;
            player.flipX = wallTouchDir < 0;
        }
    };

    const detectWallContact = (leftHeld, rightHeld) => {
        const bodyTop = player.pos.y - PLAYER_COLLIDER_H;
        const bodyBottom = player.pos.y - sy(6);
        const probe = sx(10);
        let contact = 0;

        if (player.pos.x <= sx(30) + probe) contact = -1;
        if (player.pos.x >= width() - sx(30) - probe) contact = 1;

        get("platform").forEach((plat) => {
            if (contact !== 0) return;
            const top = plat.pos.y - (plat.colliderH || sy(24));
            const bottom = plat.pos.y + sy(2);
            const platformW = plat.platformW || plat.width || sx(72);
            const left = plat.pos.x - platformW / 2;
            const right = plat.pos.x + platformW / 2;
            const overlapY = bodyBottom > top + sy(2) && bodyTop < bottom - sy(2);
            if (!overlapY) return;
            const nearLeftFace = Math.abs((player.pos.x - PLAYER_HALF_W) - right) < probe;
            const nearRightFace = Math.abs((player.pos.x + PLAYER_HALF_W) - left) < probe;
            if (nearLeftFace) contact = -1;
            if (nearRightFace) contact = 1;
        });

        if (contact === -1 && !leftHeld) return 0;
        if (contact === 1 && !rightHeld) return 0;
        return contact;
    };

    onKeyPress("space", () => queueJump("space"));
    onKeyPress("up", () => queueJump("up"));
    onKeyPress("w", () => queueJump("w"));
    onKeyRelease("space", () => {
        jumpHeld = false;
        if (player.vel.y < 0) player.vel.y *= MOVEMENT_TUNING.jumpCutMultiplier;
    });
    onKeyRelease("up", () => {
        jumpHeld = false;
        if (player.vel.y < 0) player.vel.y *= MOVEMENT_TUNING.jumpCutMultiplier;
    });
    onKeyRelease("w", () => {
        jumpHeld = false;
        if (player.vel.y < 0) player.vel.y *= MOVEMENT_TUNING.jumpCutMultiplier;
    });
    onKeyPress("shift", () => {
        if (failOverlayActive || dashCooldown > 0) return;
        const dir = player.flipX ? -1 : 1;
        const boost = speedBoostTimer > 0 ? MOVEMENT_TUNING.speedBoostMultiplier : 1;
        player.move(dir * MOVE_SPEED * 2.4 * boost, 0);
        player.pos.x += dir * sx(34);
        dashCooldown = 1.25;
        emitGameLog("player.dash", { month: memory.month, dir: dir > 0 ? "right" : "left" });
        for (let i = 0; i < 4; i++) {
            const dashSpark = add([
                circle(rand(2, 4)),
                pos(player.pos.x - dir * rand(4, 18), player.pos.y - rand(14, 42)),
                color(255, rand(170, 230), rand(200, 255)),
                opacity(0.8),
                z(18),
                { life: 0, vx: -dir * rand(60, 140), vy: rand(-20, 25) },
            ]);
            dashSpark.onUpdate(() => {
                dashSpark.life += dt();
                dashSpark.pos.x += dashSpark.vx * dt();
                dashSpark.pos.y += dashSpark.vy * dt();
                dashSpark.opacity = Math.max(0, 0.8 - dashSpark.life * 2.3);
                if (dashSpark.life > 0.45) destroy(dashSpark);
            });
        }
    });

    // Player update: bounds, physics, mission progress, death handling
    player.onUpdate(() => {
        if (failOverlayActive) {
            const lockedPos = checkpointReached ? checkpointPos.clone() : lastSafePos.clone();
            player.pos = lockedPos;
            player.vel = vec2(0, 0);
            prevFramePos = player.pos.clone();
            return;
        }

        const leftHeld = isKeyDown("left") || isKeyDown("a");
        const rightHeld = isKeyDown("right") || isKeyDown("d");
        const groundedAtFrameStart = player.isGrounded();

        damageCooldown = Math.max(0, damageCooldown - dt());
        player.opacity = damageCooldown > 0 ? (0.45 + Math.sin(time() * 28) * 0.25) : 1;
        dashCooldown = Math.max(0, dashCooldown - dt());
        speedBoostTimer = Math.max(0, speedBoostTimer - dt());
        wallJumpLock = Math.max(0, wallJumpLock - dt());
        jumpBufferTimer = Math.max(0, jumpBufferTimer - dt());
        coyoteTimer = groundedAtFrameStart
            ? MOVEMENT_TUNING.coyoteTime
            : Math.max(0, coyoteTimer - dt());
        checkpointPulseTimer = Math.max(0, checkpointPulseTimer - dt());
        checkpointHint.opacity = checkpointPulseTimer > 0 ? Math.min(1, checkpointPulseTimer * 0.9) : 0;
        checkpointHint.pos.y = 108 + Math.sin(time() * 4.2) * 1.2;

        if (comboTimer > 0) {
            comboTimer -= dt();
            if (comboTimer <= 0) {
                comboStreak = 0;
                updateMissionUI();
            }
        }

        const boostMult = speedBoostTimer > 0 ? MOVEMENT_TUNING.speedBoostMultiplier : 1;
        if (config.mechanic === "ice") {
            const ICE_ACCEL = 420;
            const ICE_FRICTION = config.mechanicConfig.friction || 0.98;
            if (wallJumpLock <= 0) {
                if (leftHeld && !rightHeld) playerVelX -= ICE_ACCEL * dt();
                if (rightHeld && !leftHeld) playerVelX += ICE_ACCEL * dt();
            }
            playerVelX = Math.max(-350, Math.min(350, playerVelX));
            playerVelX *= ICE_FRICTION;
            player.move(playerVelX * boostMult, 0);
            if (Math.abs(playerVelX) < 5) playerVelX = 0;
            if (playerVelX < -5) player.flipX = true;
            else if (playerVelX > 5) player.flipX = false;
        } else if (wallJumpLock <= 0) {
            if (leftHeld && !rightHeld) {
                player.move(-MOVE_SPEED * boostMult, 0);
                player.flipX = true;
            } else if (rightHeld && !leftHeld) {
                player.move(MOVE_SPEED * boostMult, 0);
                player.flipX = false;
            }
        }

        if (player.pos.x < sx(30)) player.pos.x = sx(30);
        if (player.pos.x > width() - sx(30)) player.pos.x = width() - sx(30);

        if (config.mechanic === "wind") {
            const wc = config.mechanicConfig;
            const gustStrength = wc.gustStrength || 0;
            const gustSpeed = wc.gustSpeed || 1.6;
            const gust = gustStrength ? Math.sin(time() * gustSpeed) * gustStrength : 0;
            player.move(wc.windDirection * (wc.windStrength + gust), 0);
        }

        wallTouchDir = detectWallContact(leftHeld, rightHeld);
        wallSlideActive = !groundedAtFrameStart && wallTouchDir !== 0 && player.vel.y > 0;
        if (wallSlideActive) {
            player.vel.y = Math.min(player.vel.y, MOVEMENT_TUNING.wallSlideSpeed);
        }

        if (jumpBufferTimer > 0) {
            if (groundedAtFrameStart || coyoteTimer > 0) {
                doJump("ground");
            } else if (wallSlideActive) {
                doJump("wall");
            }
        }

        if (!jumpHeld && player.vel.y < -sy(180)) {
            player.vel.y += sy(1200) * dt();
        }

        let insideGlideZone = false;
        activeGlideZones.forEach((zone) => {
            const halfW = zone.zWidth / 2;
            const halfH = zone.zHeight / 2;
            const insideX = Math.abs(player.pos.x - zone.pos.x) < halfW;
            const insideY = player.pos.y > zone.pos.y - halfH && player.pos.y < zone.pos.y + halfH;
            if (insideX && insideY) {
                insideGlideZone = true;
                player.move(0, -zone.lift);
            }
        });
        if (insideGlideZone && player.vel.y > sy(70)) {
            player.vel.y = sy(70);
        }

        let onMovingPlatform = false;
        get("movingPlatform").forEach(mp => {
            if (player.isGrounded()) {
                const platformTop = mp.pos.y - (mp.colliderH || sy(24));
                const platformW = mp.platformW || mp.width || sx(72);
                const halfW = platformW / 2;
                const onVert = Math.abs(player.pos.y - platformTop) < sy(10) && player.vel.y >= -sy(20);
                const onHoriz = (player.pos.x + PLAYER_HALF_W) > (mp.pos.x - halfW + sx(2)) &&
                                (player.pos.x - PLAYER_HALF_W) < (mp.pos.x + halfW - sx(2));
                if (onVert && onHoriz) {
                    const delta = mp.pos.sub(mp.prevPos);
                    player.pos = player.pos.add(delta);
                    onMovingPlatform = true;
                }
            }
        });

        if (!missionComplete && missionConfig?.type === "airtime" && !player.isGrounded()) {
            airtimeSeconds += dt();
            missionProgress = airtimeSeconds;
            if (airtimeSeconds >= missionConfig.target) setMissionComplete();
            updateMissionUI();
        }
        if (!missionComplete && missionConfig?.type === "ride" && onMovingPlatform) {
            rideSeconds += dt();
            missionProgress = rideSeconds;
            if (rideSeconds >= missionConfig.target) setMissionComplete();
            updateMissionUI();
        }

        // Anti-tunneling landing assist for fast falls through thin platforms.
        if (player.vel.y > sy(120)) {
            get("platform").forEach(plat => {
                const top = plat.pos.y - (plat.colliderH || sy(24));
                const platformW = plat.platformW || plat.width || sx(72);
                const left = plat.pos.x - platformW / 2;
                const right = plat.pos.x + platformW / 2;
                const crossedTop = prevFramePos.y <= top + 1 && player.pos.y >= top + 1;
                const withinX = (player.pos.x + PLAYER_HALF_W) > (left + sx(2)) &&
                                (player.pos.x - PLAYER_HALF_W) < (right - sx(2));
                if (crossedTop && withinX) {
                    player.pos.y = top;
                    player.vel.y = 0;
                }
            });
        }

        // Anti-tunneling underside block for upward movement through platform bottoms.
        if (player.vel.y < -sy(120)) {
            const playerTop = player.pos.y - PLAYER_COLLIDER_H;
            const prevTop = prevFramePos.y - PLAYER_COLLIDER_H;
            get("platform").forEach((plat) => {
                const colliderH = plat.colliderH || sy(24);
                const bottom = plat.pos.y;
                const platformW = plat.platformW || plat.width || sx(72);
                const left = plat.pos.x - platformW / 2;
                const right = plat.pos.x + platformW / 2;
                const crossedBottom = prevTop >= bottom - 1 && playerTop <= bottom - 1;
                const withinX = (player.pos.x + PLAYER_HALF_W) > (left + sx(2)) &&
                                (player.pos.x - PLAYER_HALF_W) < (right - sx(2));
                if (crossedBottom && withinX) {
                    player.pos.y = bottom + PLAYER_COLLIDER_H + sy(1);
                    player.vel.y = sy(55);
                }
            });
        }

        if (player.vel.y > sy(860)) {
            player.vel.y = sy(860);
        }

        if (player.isGrounded()) {
            if (!checkpointReached) {
                lastSafePos = player.pos.clone();
            } else if (Math.abs(player.pos.x - checkpointPos.x) <= sx(320)) {
                lastSafePos = player.pos.clone();
            }
        }

        if (player.pos.y > height() + sy(20)) {
            applyPlayerDamage("fall");
        }

        prevFramePos = player.pos.clone();
    });

    player.onCollide("hazard", (hazard) => {
        if (!shouldDamageFromHazard(hazard)) return;
        applyPlayerDamage("hazard");
    });

    const clearDebugOverlay = () => {
        debugNodes.forEach((node) => {
            if (!node) return;
            if (typeof node.exists === "function") {
                if (node.exists()) destroy(node);
            } else {
                destroy(node);
            }
        });
        debugNodes = [];
        if (debugLabel) {
            destroy(debugLabel);
            debugLabel = null;
        }
    };

    const enableDebugOverlay = () => {
        if (debugLabel) return;
        debugLabel = add([
            rect(360, 26, { radius: 8 }),
            pos(width() / 2, height() - 24),
            anchor("center"),
            color(10, 20, 40),
            opacity(0.8),
            fixed(),
            z(90),
        ]);
        const labelText = add([
            text("DEBUG: hitboxes + normals + checkpoints", { size: 13 }),
            pos(width() / 2, height() - 24),
            anchor("center"),
            color(235, 245, 255),
            fixed(),
            z(91),
        ]);
        debugNodes.push(labelText);

        const playerProbe = add([
            rect(sx(28), sy(60)),
            pos(player.pos.x, player.pos.y),
            anchor("bot"),
            color(92, 194, 255),
            opacity(0.18),
            outline(1, rgb(112, 220, 255)),
            z(88),
        ]);
        playerProbe.onUpdate(() => {
            playerProbe.pos = player.pos.clone();
        });
        debugNodes.push(playerProbe);

        get("platform").forEach((plat) => {
            const hitbox = add([
                rect(plat.width, plat.colliderH || sy(24)),
                pos(plat.pos.x, plat.pos.y),
                anchor("bot"),
                color(255, 186, 120),
                opacity(0.16),
                outline(1, rgb(255, 210, 165)),
                z(88),
            ]);
            const normal = add([
                rect(2, sy(18)),
                pos(plat.pos.x, plat.pos.y - (plat.colliderH || sy(24))),
                anchor("bot"),
                color(255, 245, 120),
                opacity(0.9),
                z(89),
            ]);
            hitbox.onUpdate(() => {
                hitbox.pos = plat.pos.clone();
                normal.pos.x = plat.pos.x;
                normal.pos.y = plat.pos.y - (plat.colliderH || sy(24));
            });
            debugNodes.push(hitbox, normal);
        });

        get("hazard").forEach((hz) => {
            const halo = add([
                circle(Math.max(sx(11), (hz.width || sx(22)) * 0.45)),
                pos(hz.pos.x, hz.pos.y),
                anchor("center"),
                color(255, 118, 118),
                opacity(0.2),
                outline(1, rgb(255, 175, 175)),
                z(88),
            ]);
            halo.onUpdate(() => {
                halo.pos = hz.pos.clone();
            });
            debugNodes.push(halo);
        });

        get("checkpoint").forEach((cp) => {
            const marker = add([
                circle(sx(16)),
                pos(cp.pos.x, cp.pos.y - sy(26)),
                anchor("center"),
                color(180, 255, 195),
                opacity(0.17),
                outline(1, rgb(220, 255, 228)),
                z(88),
            ]);
            marker.onUpdate(() => {
                marker.pos = vec2(cp.pos.x, cp.pos.y - sy(26));
            });
            debugNodes.push(marker);
        });
    };

    const toggleDebugOverlay = () => {
        debugOverlayEnabled = !debugOverlayEnabled;
        if (debugOverlayEnabled) {
            enableDebugOverlay();
        } else {
            clearDebugOverlay();
        }
        emitGameLog("debug.toggle", { month: memory.month, enabled: debugOverlayEnabled });
    };

    onKeyPress("f3", toggleDebugOverlay);
    onKeyPress("`", toggleDebugOverlay);

    // Wind indicator + particles
    if (config.mechanic === "wind") {
        const wc = config.mechanicConfig;
        const windArrow = wc.windDirection > 0 ? "Wind >>>" : "<<< Wind";
        const windLabel = add([
            text(windArrow, { size: 13 }),
            pos(width() / 2, 75),
            anchor("center"),
            color(200, 200, 255),
            opacity(0.7),
            z(20),
            fixed(),
        ]);
        windLabel.onUpdate(() => {
            windLabel.opacity = 0.5 + Math.sin(time() * 3) * 0.2;
        });

        const windParticlePool = [];
        const acquireWindParticle = () => {
            const idle = windParticlePool.find((p) => !p.active);
            if (idle) return idle;
            if (windParticlePool.length >= 40) return windParticlePool[0];
            const p = add([
                text("~", { size: rand(10, 18) }),
                pos(-100, -100),
                color(220, 220, 255),
                opacity(0),
                z(-3),
                { life: 0, active: false, speed: 0 },
            ]);
            p.onUpdate(() => {
                if (!p.active) return;
                p.pos.x += p.speed * dt();
                p.life += dt();
                p.opacity = Math.max(0, p.baseOpacity - p.life * 0.15);
                if (p.life > 3) {
                    p.active = false;
                    p.opacity = 0;
                    p.pos = vec2(-100, -100);
                }
            });
            windParticlePool.push(p);
            return p;
        };

        const spawnWindParticle = () => {
            const particle = acquireWindParticle();
            particle.active = true;
            particle.life = 0;
            particle.speed = wc.windDirection * rand(200, 350);
            particle.baseOpacity = rand(0.3, 0.6);
            particle.pos = vec2(wc.windDirection > 0 ? -10 : width() + 10, rand(100, GROUND_Y - 20));
            particle.opacity = particle.baseOpacity;
        };

        loop(0.15, () => {
            spawnWindParticle();
        });
    }

    // Collect hearts (Section 5: enhanced burst of 8 rect particles)
    player.onCollide("collectible", (heart) => {
        if (!heart.collected) {
            heart.collected = true;
            heartsCollected++;
            heartUI.text = `${heartsCollected}/${totalCollectibles} ${config.collectible.label}`;
            emitGameLog("collectible.collected", {
                month: memory.month,
                collected: heartsCollected,
                total: totalCollectibles,
                item: config.collectible.label,
            });

            if (!missionComplete && missionConfig?.type === "combo") {
                if (comboTimer > 0) comboStreak++;
                else comboStreak = 1;
                comboTimer = missionConfig.windowSec;
                missionProgress = comboStreak;
                if (comboStreak >= missionConfig.target) setMissionComplete();
                updateMissionUI();
            }

            playDing();

            if (heartsCollected >= totalCollectibles) {
                showGhostDialog();
            }

            // Pop animation
            let popTime = 0;
            const startY = heart.pos.y;
            let isDestroyed = false;
            heart.onUpdate(() => {
                if (isDestroyed) return;
                popTime += dt();
                heart.pos.y = startY - (popTime * 150);
                heart.opacity = Math.max(0, 1 - popTime * 3);
                heart.scale = vec2(0.9 + popTime * 2);
                if (popTime > 0.35) {
                    isDestroyed = true;
                    if (heart.glow) destroy(heart.glow);
                    destroy(heart);
                }
            });

            // Enhanced burst (8 rect particles in item color)
            spawnCollectionBurst(heart.pos.x, heart.pos.y, config.collectible.sprite);
        }
    });

    player.onCollide("missionTarget", (target) => {
        if (target.touched || !missionConfig || missionComplete) return;
        target.touched = true;
        missionTokensCollected++;
        missionProgress = missionTokensCollected;
        playDing();
        emitGameLog("mission.token", {
            month: memory.month,
            mission: missionConfig.title,
            progress: missionTokensCollected,
            target: missionConfig.target,
        });
        // Fade out collected mission marker
        wait(0.02, () => {
            let life = 0;
            target.onUpdate(() => {
                life += dt();
                target.opacity = Math.max(0, 0.7 - life * 2);
                target.scale = vec2(1 + life * 1.3);
                if (life > 0.4) destroy(target);
            });
        });
        if (missionTokensCollected >= missionConfig.target) {
            setMissionComplete();
        } else {
            updateMissionUI();
        }
    });

    // "Collect all" reminder (hidden by default)
    const collectReminder = add([
        text(`Collect all ${config.collectible.label} first!`, { size: 15 }),
        pos(width() / 2, 90),
        anchor("center"),
        color(255, 240, 200),
        opacity(0),
        z(50),
        fixed(),
    ]);
    let reminderTimer = 0;

    // Reach portal (must collect all items first)
    let reunionActive = false;
    player.onCollide("portal", () => {
        if (memoryTriggered || reunionActive) return;

        if (heartsCollected < totalCollectibles) {
            // Show reminder
            collectReminder.text = `Collect all ${config.collectible.label} first!`;
            collectReminder.opacity = 1;
            reminderTimer = 2;
            emitGameLog("portal.blocked", { reason: "collectibles", month: memory.month });
            return;
        }

        reunionActive = true;
        memoryTriggered = true;
        hideGhostDialog();
        emitGameLog("portal.opened", { month: memory.month, mission: missionConfig?.title || null });

        // Reunion animation: walk player toward boyfriend
        const targetX = bf.pos.x - 30;
        player.flipX = false;
        const reunionUpdate = onUpdate(() => {
            if (player.pos.x < targetX) {
                player.move(78, 0);
            } else {
                reunionUpdate.cancel();
                const reunionParticles = loop(0.09, () => {
                    const puff = add([
                        circle(rand(2, 4)),
                        pos((player.pos.x + bf.pos.x) / 2 + rand(-42, 42), player.pos.y - rand(26, 78)),
                        color(255, rand(170, 230), rand(190, 240)),
                        opacity(0.82),
                        z(49),
                        { life: 0, vy: rand(-20, -78), vx: rand(-26, 26) },
                    ]);
                    puff.onUpdate(() => {
                        puff.life += dt();
                        puff.pos.x += puff.vx * dt();
                        puff.pos.y += puff.vy * dt();
                        puff.opacity = Math.max(0, 0.82 - puff.life * 1.2);
                        if (puff.life > 0.8) destroy(puff);
                    });
                });

                let reunionHeart = null;
                wait(0.65, () => {
                    reunionHeart = add([
                        sprite("heart"),
                        pos((player.pos.x + bf.pos.x) / 2, player.pos.y - 56),
                        anchor("center"),
                        scale(0.1),
                        z(50),
                    ]);
                    reunionHeart.onUpdate(() => {
                        if (reunionHeart.scale.x < 1.24) {
                            reunionHeart.scale = vec2(reunionHeart.scale.x + dt() * 1.3);
                        }
                    });
                });

                const transitionToMemory = () => {
                    reunionParticles.cancel();
                    const flash = add([
                        rect(width(), height()),
                        color(255, 230, 240),
                        opacity(0),
                        z(100),
                        { fadeTime: 0 },
                    ]);
                    flash.onUpdate(() => {
                        flash.fadeTime += dt();
                        flash.opacity = Math.min(1, flash.fadeTime * 2.5);
                    });
                    wait(0.4, () => showMemory(monthIndex));
                };

                // Month-specific romantic micro-moments before memory reveal.
                if (monthIndex === 10) {
                    const birthdayText = add([
                        text("Happy Birthday Anushku ♥", { size: 30 }),
                        pos(width() / 2, sy(120)),
                        anchor("center"),
                        color(255, 232, 190),
                        opacity(0),
                        z(90),
                    ]);
                    birthdayText.onUpdate(() => {
                        birthdayText.opacity = Math.min(1, birthdayText.opacity + dt() * 2);
                        birthdayText.pos.y += Math.sin(time() * 3.5) * 0.2;
                    });
                    const confettiLoop = loop(0.07, () => {
                        const confetti = add([
                            rect(rand(4, 8), rand(4, 8), { radius: 2 }),
                            pos(width() / 2 + rand(-220, 220), sy(80)),
                            color(rand(220, 255), rand(120, 220), rand(170, 255)),
                            opacity(0.85),
                            z(88),
                            { life: 0, vx: rand(-40, 40), vy: rand(40, 150) },
                        ]);
                        confetti.onUpdate(() => {
                            confetti.life += dt();
                            confetti.pos.x += confetti.vx * dt();
                            confetti.pos.y += confetti.vy * dt();
                            confetti.opacity = Math.max(0, 0.85 - confetti.life * 0.7);
                            if (confetti.life > 1.2) destroy(confetti);
                        });
                    });
                    wait(2.4, () => {
                        confettiLoop.cancel();
                        transitionToMemory();
                    });
                } else if (monthIndex === 11) {
                    const winterText = add([
                        text("Merry us, forever ✨", { size: 28 }),
                        pos(width() / 2, sy(118)),
                        anchor("center"),
                        color(230, 245, 255),
                        opacity(0),
                        z(90),
                    ]);
                    winterText.onUpdate(() => {
                        winterText.opacity = Math.min(1, winterText.opacity + dt() * 1.8);
                        winterText.pos.y += Math.sin(time() * 2.8) * 0.2;
                    });
                    const snowLoop = loop(0.08, () => {
                        const flake = add([
                            circle(rand(2, 4)),
                            pos(rand(20, width() - 20), rand(14, 70)),
                            color(230, 242, 255),
                            opacity(0.8),
                            z(88),
                            { life: 0, vy: rand(60, 140), drift: rand(-22, 22) },
                        ]);
                        flake.onUpdate(() => {
                            flake.life += dt();
                            flake.pos.y += flake.vy * dt();
                            flake.pos.x += flake.drift * dt();
                            flake.opacity = Math.max(0, 0.8 - flake.life * 0.6);
                            if (flake.life > 1.4) destroy(flake);
                        });
                    });
                    wait(2.5, () => {
                        snowLoop.cancel();
                        transitionToMemory();
                    });
                } else {
                    wait(2.1, transitionToMemory);
                }
            }
        });
    });

    // Fade out the reminder
    collectReminder.onUpdate(() => {
        if (reminderTimer > 0) {
            reminderTimer -= dt();
            if (reminderTimer <= 0.5) {
                collectReminder.opacity = Math.max(0, reminderTimer * 2);
            }
        }
    });

    // Mechanic hints
    const hints = {
        0: "Collect all items, then portal. 5 hearts hain, tension mat lo!",
        1: "Heart route follow karo — perfect curve mein collect karna ♥",
        2: "Boat platforms move karte hain. Time your jump, captain!",
        3: "Kolkata breeze push karegi → rhythm pakdo.",
        4: "Gap pe coyote jump use karo, clean landing milegi.",
        5: "Moving platform + spring pad combo = easy height.",
        7: "Dash gem se boost refill hota hai. Save it for clutch.",
        8: "Wind ab gust mein aayegi. Patience + wall slide.",
        9: "Spooky climb: wall slide + wall jump are your best tools.",
        11: "Ground icy hai! Slide hoga — chhote taps se control karo.",
    };
    if (hints[monthIndex]) {
        const hint = add([
            text(hints[monthIndex], { size: 14 }),
            pos(width() / 2, GROUND_Y + 50),
            anchor("center"),
            color(100, 110, 140),
            opacity(1),
            { fadeStarted: false, fadeTime: 0 },
        ]);
        wait(5, () => { hint.fadeStarted = true; });
        hint.onUpdate(() => {
            if (hint.fadeStarted) {
                hint.fadeTime += dt();
                hint.opacity = Math.max(0, 1 - hint.fadeTime);
            }
        });
    }

    // Seasonal decorations
    spawnDecorations(monthIndex);

    // Month-specific extras (signs, bats, birthday cap, etc.)
    spawnExtras(config, bf);

    // Birds and sun (global)
    spawnBirdsAndSun(monthIndex);

    // === Scene transition: fade-in + month intro card ===
    const monthSubtitles = [
        "Cubbon Park, full bakbak mode",   // Jan
        "Dil garden garden day",           // Feb
        "Yacht pe pyaar and sunset",       // Mar
        "Door ho, par dil paas",           // Apr
        "Countdown to your hug",           // May
        "Garmi, mango, and us",            // Jun
        "Music under the stars",           // Jul
        "Birthday chaos, perfect vibes",   // Aug
        "Dancing together, no brakes",     // Sep
        "Nothing scary with you",          // Oct
        "Anushku birthday takeover",       // Nov
        "Winter magic, forever us",        // Dec
    ];
    // Full-screen fade overlay
    const fadeOverlay = add([
        rect(width(), height()),
        pos(0, 0),
        color(0, 0, 0),
        opacity(1),
        z(100),
        fixed(),
    ]);
    // Month name
    const introTitle = add([
        text(memory.month, { size: 42 }),
        pos(width() / 2, height() / 2 - 20),
        anchor("center"),
        color(255, 220, 240),
        opacity(1),
        z(101),
        fixed(),
    ]);
    // Subtitle
    const introSub = add([
        text(monthSubtitles[monthIndex] || "", { size: 18 }),
        pos(width() / 2, height() / 2 + 25),
        anchor("center"),
        color(200, 180, 210),
        opacity(1),
        z(101),
        fixed(),
    ]);
    // Animate: brief hold, then quick fade to keep gameplay readable
    let introTime = 0;
    fadeOverlay.onUpdate(() => {
        introTime += dt();
        if (introTime < 0.65) {
            // Hold — card visible
            fadeOverlay.opacity = 0.45;
        } else if (introTime < 1.25) {
            // Fade out
            const t = (introTime - 0.65) / 0.6;
            fadeOverlay.opacity = 0.45 * (1 - t);
            introTitle.opacity = 1 - t;
            introSub.opacity = 1 - t;
        } else {
            // Done — remove overlay elements
            destroy(fadeOverlay);
            destroy(introTitle);
            destroy(introSub);
        }
    });
});

// ============================================
// BOSS + FINALE SCENES
// ============================================
scene("rescue-boss", () => {
    document.getElementById("memory-popup").classList.add("hidden");
    document.getElementById("love-letter-overlay").classList.add("hidden");
    document.getElementById("game").focus();
    startBgm();
    emitGameLog("scene.boss.enter", { month: "Rescue Boss" });

    const sky = [28, 20, 44];
    drawLayeredSky(sky, 9);
    drawBackgroundLayers(sky, 9);
    drawStars(34);
    drawFloatingHearts(4);

    const groundStyle = getGroundStyle(9);
    const groundSegments = [
        { x: sx(0), w: sx(210) },
        { x: sx(300), w: sx(220) },
        { x: sx(620), w: sx(180) },
    ];
    groundSegments.forEach((seg) => drawMarioGround(seg.x, seg.w, groundStyle, 9));

    const platforms = [
        { x: sx(246), y: sy(432), w: sx(90) },
        { x: sx(406), y: sy(380), w: sx(92) },
        { x: sx(578), y: sy(338), w: sx(92) },
        { x: sx(720), y: sy(288), w: sx(118) },
        { x: sx(520), y: sy(254), w: sx(90), moving: true, moveToX: sx(628), moveToY: sy(254), speed: 1.05 },
    ];

    platforms.forEach((p) => {
        const colliderH = sy(26);
        const base = add([
            rect(p.w, colliderH),
            pos(p.x, p.y),
            anchor("bot"),
            area(),
            body({ isStatic: true }),
            color(0, 0, 0),
            opacity(0),
            "platform",
            "bossPlatform",
            { colliderH, platformW: p.w, startX: p.x, endX: p.moveToX || p.x, speed: p.speed || 1, prevPos: vec2(p.x, p.y), moving: !!p.moving },
        ]);
        const skin = add([
            sprite("platform-spooky"),
            pos(base.pos.x, base.pos.y),
            anchor("bot"),
            scale(vec2(p.w / 64, colliderH / 20)),
            z(3),
            { phase: rand(0, 6) },
        ]);
        if (p.moving) {
            base.onUpdate(() => {
                base.prevPos = base.pos.clone();
                const t = (Math.sin(time() * base.speed) + 1) / 2;
                base.pos.x = lerp(base.startX, base.endX, t);
                skin.pos = base.pos.clone();
                skin.opacity = 0.82 + Math.sin(time() * 3 + skin.phase) * 0.15;
            });
        } else {
            base.onUpdate(() => {
                skin.pos = base.pos.clone();
            });
        }
    });

    const addSpikeField = (x, y, w) => {
        add([
            rect(w, sy(10), { radius: sy(2) }),
            pos(x, y + sy(1)),
            color(36, 41, 50),
            opacity(0.96),
            z(4),
        ]);
        add([
            rect(w, sy(2), { radius: 1 }),
            pos(x, y + sy(1)),
            color(124, 133, 149),
            opacity(0.75),
            z(5),
        ]);
        const spacing = sx(20);
        const count = Math.max(1, Math.floor(w / spacing));
        for (let i = 0; i < count; i++) {
            add([
                sprite("hazard-spike"),
                pos(x + i * spacing, y + sy(1)),
                anchor("bot"),
                scale(vec2(sx(22) / 24, sy(22) / 20)),
                area({ scale: vec2(0.8, 0.72) }),
                z(6),
                "hazard",
            ]);
        }
    };

    addSpikeField(sx(224), sy(500), sx(56));
    addSpikeField(sx(532), sy(500), sx(66));
    addSpikeField(sx(430), sy(380 - 24), sx(24));

    const orbA = add([
        sprite("hazard-orb"),
        pos(sx(496), sy(344)),
        anchor("center"),
        area({ scale: 0.72 }),
        z(6),
        "hazard",
        { sx0: sx(496), sx1: sx(676), sy0: sy(344), sy1: sy(300), speed: 1.14 },
    ]);
    orbA.onUpdate(() => {
        const t = (Math.sin(time() * orbA.speed) + 1) / 2;
        orbA.pos.x = lerp(orbA.sx0, orbA.sx1, t);
        orbA.pos.y = lerp(orbA.sy0, orbA.sy1, t);
    });

    const player = add([
        sprite(getSelectedPlayerSprite()),
        pos(sx(60), GROUND_Y - sy(64)),
        anchor("bot"),
        area({ scale: vec2(0.72, 0.98) }),
        body(),
        scale(0.9),
        z(20),
        "player",
    ]);

    const boss = add([
        sprite("kanushku"),
        pos(sx(716), sy(244)),
        anchor("bot"),
        scale(1.05),
        area({ scale: vec2(0.78, 0.94) }),
        z(20),
        "boss",
        {
            hp: 16,
            maxHp: 16,
            fireTimer: 1.55,
            burstTimer: 4.2,
            hurtFlash: 0,
            dir: -1,
            minX: sx(536),
            maxX: sx(760),
            speed: sx(82),
        },
    ]);

    add([
        sprite("boyfriend"),
        pos(sx(760), sy(214)),
        anchor("bot"),
        scale(0.9),
        opacity(0.32),
        z(11),
    ]);
    add([
        rect(sx(72), sy(98), { radius: 8 }),
        pos(sx(726), sy(124)),
        outline(2, rgb(210, 210, 245)),
        color(28, 35, 58),
        opacity(0.62),
        z(10),
    ]);

    const missionCard = add([
        rect(sx(560), sy(64), { radius: 14 }),
        pos(width() / 2, sy(48)),
        anchor("center"),
        color(17, 24, 44),
        opacity(0.84),
        outline(2, rgb(248, 170, 208)),
        fixed(),
        z(30),
    ]);
    const missionText = add([
        text("Kanushku abducted Sarthu! Defeat Kanushku to rescue him.", { size: 18 }),
        pos(missionCard.pos.x, missionCard.pos.y),
        anchor("center"),
        color(255, 226, 236),
        fixed(),
        z(31),
    ]);
    wait(3, () => {
        destroy(missionCard);
        destroy(missionText);
    });

    const playerHpBg = add([
        rect(188, 30, { radius: 8 }),
        pos(16, 18),
        color(20, 30, 52),
        outline(1, rgb(255, 196, 220)),
        opacity(0.86),
        fixed(),
        z(31),
    ]);
    const playerHpText = add([
        text("", { size: 15 }),
        pos(26, 26),
        color(255, 220, 230),
        fixed(),
        z(32),
    ]);
    const bossHpBg = add([
        rect(260, 16, { radius: 8 }),
        pos(width() - 280, 20),
        color(32, 38, 56),
        outline(1, rgb(176, 191, 230)),
        fixed(),
        z(31),
    ]);
    const bossHpBar = add([
        rect(256, 12, { radius: 6 }),
        pos(width() - 278, 22),
        color(255, 115, 146),
        fixed(),
        z(32),
    ]);
    const bossHpLabel = add([
        text("Kanushku", { size: 15 }),
        pos(width() - 282, 42),
        color(236, 224, 255),
        fixed(),
        z(32),
    ]);

    const prompt = add([
        text("X to shoot • Space to jump • Shift to dash", { size: 14 }),
        pos(width() / 2, height() - 26),
        anchor("center"),
        color(196, 205, 228),
        fixed(),
        z(31),
    ]);
    prompt.onUpdate(() => {
        prompt.opacity = 0.62 + Math.sin(time() * 2.2) * 0.28;
    });

    const skipBossBtn = add([
        rect(160, 42, { radius: 16 }),
        pos(width() / 2, sy(98)),
        anchor("center"),
        color(126, 172, 181),
        opacity(0),
        area(),
        fixed(),
        z(31),
        "skipBossBtn",
    ]);
    const skipBossText = add([
        text("Skip Boss [K]", { size: 16 }),
        pos(skipBossBtn.pos.x, skipBossBtn.pos.y),
        anchor("center"),
        color(18, 38, 44),
        opacity(0),
        fixed(),
        z(32),
    ]);

    let playerHealth = 5;
    let playerDeaths = 0;
    let damageCooldown = 0;
    let jumpHeld = false;
    let jumpQueued = 0;
    let coyoteTimer = 0;
    let dashCooldown = 0;
    let moveVelX = 0;
    let prevFramePos = player.pos.clone();
    const PLAYER_HALF_W = sx(13);
    const PLAYER_COLLIDER_H = sy(58);
    let bossDefeated = false;
    let bulletCooldown = 0;

    const updateBossUI = () => {
        const ratio = Math.max(0, boss.hp / boss.maxHp);
        bossHpBar.width = Math.max(0, Math.round(256 * ratio));
    };
    const updatePlayerUI = () => {
        const filled = "♥".repeat(playerHealth);
        const empty = "♡".repeat(5 - playerHealth);
        playerHpText.text = `Health ${filled}${empty}`;
        playerHpText.color = playerHealth <= 2 ? rgb(255, 170, 170) : rgb(255, 220, 230);
        if (playerDeaths >= 5) {
            skipBossBtn.opacity = 0.95;
            skipBossText.opacity = 1;
        }
    };
    updateBossUI();
    updatePlayerUI();

    const firePlayerShot = () => {
        if (bossDefeated || bulletCooldown > 0) return;
        bulletCooldown = 0.2;
        const dir = player.flipX ? -1 : 1;
        const shot = add([
            rect(sx(12), sy(6), { radius: 3 }),
            pos(player.pos.x + dir * sx(18), player.pos.y - sy(38)),
            anchor("center"),
            color(255, 214, 154),
            outline(1, rgb(255, 242, 196)),
            area(),
            z(26),
            "playerShot",
            { dir, speed: sx(660), life: 0 },
        ]);
        shot.onUpdate(() => {
            shot.life += dt();
            shot.pos.x += shot.dir * shot.speed * dt();
            if (shot.life > 1.2 || shot.pos.x < -40 || shot.pos.x > width() + 40) destroy(shot);
        });
    };

    const hitPlayer = (reason = "hazard") => {
        if (bossDefeated || damageCooldown > 0) return;
        damageCooldown = 0.9;
        playerHealth = Math.max(0, playerHealth - 1);
        emitGameLog("player.damage", { month: "Boss", reason, health: playerHealth, deaths: playerDeaths });
        for (let i = 0; i < 6; i++) {
            const spark = add([
                text(["♥", "✦", "·"][i % 3], { size: rand(8, 13) }),
                pos(player.pos.x, player.pos.y - rand(10, 28)),
                color(255, rand(140, 210), rand(180, 235)),
                opacity(0.88),
                z(27),
                { life: 0, vx: rand(-90, 90), vy: rand(-150, -80) },
            ]);
            spark.onUpdate(() => {
                spark.life += dt();
                spark.pos.x += spark.vx * dt();
                spark.pos.y += spark.vy * dt();
                spark.vy += 250 * dt();
                spark.opacity = Math.max(0, 0.88 - spark.life * 2.2);
                if (spark.life > 0.5) destroy(spark);
            });
        }
        if (playerHealth <= 0) {
            playerDeaths += 1;
            playerHealth = 5;
            player.pos = vec2(sx(60), GROUND_Y - sy(64));
            player.vel = vec2(0, 0);
        }
        updatePlayerUI();
    };

    const defeatBoss = () => {
        if (bossDefeated) return;
        bossDefeated = true;
        emitGameLog("boss.defeated", { boss: "Kanushku" });
        boss.color = rgb(255, 210, 230);
        boss.opacity = 0.75;
        const pulse = add([
            circle(24),
            pos(boss.pos.x, boss.pos.y - sy(40)),
            anchor("center"),
            color(255, 210, 230),
            opacity(0.9),
            z(40),
            { life: 0 },
        ]);
        pulse.onUpdate(() => {
            pulse.life += dt();
            pulse.scale = vec2(1 + pulse.life * 5.4);
            pulse.opacity = Math.max(0, 0.9 - pulse.life * 1.6);
            if (pulse.life > 0.7) destroy(pulse);
        });
        wait(1.1, () => go("finale"));
    };

    onClick("skipBossBtn", () => {
        if (playerDeaths < 5) return;
        emitGameLog("boss.skipped", { deaths: playerDeaths });
        go("finale");
    });
    onKeyPress("k", () => {
        if (playerDeaths < 5) return;
        emitGameLog("boss.skipped", { deaths: playerDeaths, method: "key" });
        go("finale");
    });

    onKeyPress("space", () => { jumpQueued = 1; jumpHeld = true; });
    onKeyPress("up", () => { jumpQueued = 1; jumpHeld = true; });
    onKeyPress("w", () => { jumpQueued = 1; jumpHeld = true; });
    onKeyRelease("space", () => { jumpHeld = false; if (player.vel.y < 0) player.vel.y *= 0.56; });
    onKeyRelease("up", () => { jumpHeld = false; if (player.vel.y < 0) player.vel.y *= 0.56; });
    onKeyRelease("w", () => { jumpHeld = false; if (player.vel.y < 0) player.vel.y *= 0.56; });
    onKeyPress("shift", () => {
        if (dashCooldown > 0) return;
        dashCooldown = 1.2;
        const dir = player.flipX ? -1 : 1;
        player.move(dir * MOVE_SPEED * 2.2, 0);
        player.pos.x += dir * sx(32);
    });
    onKeyPress("x", firePlayerShot);
    onKeyPress("j", firePlayerShot);

    player.onCollide("hazard", () => {
        hitPlayer("hazard");
    });

    onCollide("playerShot", "boss", (shot, hitBoss) => {
        if (bossDefeated) return;
        destroy(shot);
        hitBoss.hp = Math.max(0, hitBoss.hp - 1);
        hitBoss.hurtFlash = 0.12;
        hitBoss.scale = vec2(1.15, 0.92);
        updateBossUI();
        emitGameLog("boss.hit", { hp: hitBoss.hp });
        if (hitBoss.hp <= 0) defeatBoss();
    });
    onCollide("bossShot", "player", (shot) => {
        destroy(shot);
        hitPlayer("boss-shot");
    });

    boss.onUpdate(() => {
        if (bossDefeated) return;
        boss.hurtFlash = Math.max(0, boss.hurtFlash - dt());
        boss.opacity = boss.hurtFlash > 0 ? 0.42 : 1;
        boss.pos.x += boss.dir * boss.speed * dt();
        if (boss.pos.x < boss.minX) {
            boss.pos.x = boss.minX;
            boss.dir = 1;
        }
        if (boss.pos.x > boss.maxX) {
            boss.pos.x = boss.maxX;
            boss.dir = -1;
        }
        boss.fireTimer -= dt();
        boss.burstTimer -= dt();
        if (boss.fireTimer <= 0) {
            boss.fireTimer = 1.45;
            const toPlayer = player.pos.sub(vec2(boss.pos.x, boss.pos.y - sy(36)));
            const dir = toPlayer.unit();
            const shot = add([
                circle(sx(8)),
                pos(boss.pos.x, boss.pos.y - sy(36)),
                anchor("center"),
                color(245, 110, 155),
                outline(1, rgb(255, 220, 236)),
                area(),
                z(26),
                "bossShot",
                { vel: dir.scale(sx(235)), life: 0 },
            ]);
            shot.onUpdate(() => {
                shot.life += dt();
                shot.pos.x += shot.vel.x * dt();
                shot.pos.y += shot.vel.y * dt();
                if (shot.life > 3) destroy(shot);
            });
        }
        if (boss.burstTimer <= 0) {
            boss.burstTimer = 4.6;
            for (let i = -1; i <= 1; i++) {
                const burst = add([
                    circle(sx(7)),
                    pos(boss.pos.x, boss.pos.y - sy(34)),
                    anchor("center"),
                    color(188, 130, 255),
                    outline(1, rgb(226, 196, 255)),
                    area(),
                    z(26),
                    "bossShot",
                    { vel: vec2(sx(140) * i, sy(190)), life: 0 },
                ]);
                burst.onUpdate(() => {
                    burst.life += dt();
                    burst.pos.x += burst.vel.x * dt();
                    burst.pos.y += burst.vel.y * dt();
                    burst.vel.y += sy(90) * dt();
                    if (burst.life > 2.6) destroy(burst);
                });
            }
        }
    });

    player.onUpdate(() => {
        if (bossDefeated) {
            player.vel = vec2(0, 0);
            return;
        }

        damageCooldown = Math.max(0, damageCooldown - dt());
        bulletCooldown = Math.max(0, bulletCooldown - dt());
        dashCooldown = Math.max(0, dashCooldown - dt());
        player.opacity = damageCooldown > 0 ? (0.45 + Math.sin(time() * 28) * 0.25) : 1;

        const leftHeld = isKeyDown("left") || isKeyDown("a");
        const rightHeld = isKeyDown("right") || isKeyDown("d");
        const grounded = player.isGrounded();
        coyoteTimer = grounded ? 0.12 : Math.max(0, coyoteTimer - dt());

        const accel = grounded ? sx(2600) : sx(1700);
        const drag = grounded ? 0.78 : 0.9;
        if (leftHeld && !rightHeld) {
            moveVelX -= accel * dt();
            player.flipX = true;
        } else if (rightHeld && !leftHeld) {
            moveVelX += accel * dt();
            player.flipX = false;
        }
        moveVelX *= drag;
        moveVelX = Math.max(-sx(360), Math.min(sx(360), moveVelX));
        if (Math.abs(moveVelX) < sx(6)) moveVelX = 0;
        player.move(moveVelX, 0);

        if (jumpQueued > 0) {
            jumpQueued -= dt();
            if (grounded || coyoteTimer > 0) {
                player.jump(JUMP_FORCE * 0.95);
                coyoteTimer = 0;
                jumpQueued = 0;
            }
        }
        if (!jumpHeld && player.vel.y < -sy(170)) {
            player.vel.y += sy(1200) * dt();
        }

        get("bossPlatform").forEach((mp) => {
            if (!mp.moving || !grounded) return;
            const top = mp.pos.y - mp.colliderH;
            const halfW = mp.platformW / 2;
            const onVert = Math.abs(player.pos.y - top) < sy(10) && player.vel.y >= -sy(20);
            const onHoriz = (player.pos.x + PLAYER_HALF_W) > (mp.pos.x - halfW + sx(2)) &&
                (player.pos.x - PLAYER_HALF_W) < (mp.pos.x + halfW - sx(2));
            if (onVert && onHoriz) {
                player.pos = player.pos.add(mp.pos.sub(mp.prevPos));
            }
        });

        if (player.vel.y > sy(120)) {
            get("platform").forEach((plat) => {
                const top = plat.pos.y - (plat.colliderH || sy(24));
                const left = plat.pos.x - (plat.platformW || plat.width || sx(72)) / 2;
                const right = plat.pos.x + (plat.platformW || plat.width || sx(72)) / 2;
                const crossedTop = prevFramePos.y <= top + 1 && player.pos.y >= top + 1;
                const withinX = (player.pos.x + PLAYER_HALF_W) > (left + sx(2)) &&
                    (player.pos.x - PLAYER_HALF_W) < (right - sx(2));
                if (crossedTop && withinX) {
                    player.pos.y = top;
                    player.vel.y = 0;
                }
            });
        }

        if (player.pos.x < sx(24)) player.pos.x = sx(24);
        if (player.pos.x > width() - sx(24)) player.pos.x = width() - sx(24);
        if (player.pos.y > height() + sy(20)) {
            hitPlayer("fall");
            player.pos = vec2(sx(60), GROUND_Y - sy(64));
            player.vel = vec2(0, 0);
        }
        prevFramePos = player.pos.clone();
    });
});

scene("finale", () => {
    emitGameLog("scene.finale.enter", { month: "Finale" });
    gameCompleted = true;
    document.getElementById("memory-popup").classList.add("hidden");
    const gameCanvasEl = document.getElementById("game");
    gameCanvasEl.focus();
    window.__qaScene = "finale";
    const pointInRect = (p, rect) => (
        p.x >= rect.x &&
        p.x <= rect.x + rect.w &&
        p.y >= rect.y &&
        p.y <= rect.y + rect.h
    );
    const clientToScenePoint = (clientX, clientY) => {
        if (!gameCanvasEl) return vec2(clientX, clientY);
        const bounds = gameCanvasEl.getBoundingClientRect();
        const scaleX = width() / bounds.width;
        const scaleY = height() / bounds.height;
        return vec2(
            (clientX - bounds.left) * scaleX,
            (clientY - bounds.top) * scaleY,
        );
    };
    let exiting = false;
    let detachPointerRouter = () => {};
    const safeAction = (fn) => {
        if (exiting) return;
        exiting = true;
        detachPointerRouter();
        fn();
    };
    startBgm();

    drawLayeredSky([18, 30, 58], 11);
    drawBackgroundLayers([18, 30, 58], 11);
    drawStars(60);
    drawFloatingHearts(10);

    const panel = add([
        rect(sx(620), sy(320), { radius: 18 }),
        pos(width() / 2, height() / 2),
        anchor("center"),
        color(18, 30, 56),
        opacity(0.86),
        outline(3, rgb(255, 208, 228)),
    ]);
    panel.onUpdate(() => {
        panel.opacity = 0.8 + Math.sin(time() * 1.6) * 0.06;
    });

    add([
        text("YOU WIN", { size: 66 }),
        pos(width() / 2, height() / 2 - sy(86)),
        anchor("center"),
        color(255, 232, 190),
    ]);
    add([
        text("ANUSHKU HAS SAVED SARTHU", { size: 38 }),
        pos(width() / 2, height() / 2 - sy(22)),
        anchor("center"),
        color(255, 184, 214),
    ]);
    add([
        text("Kanushku defeated. Love cleared every level.", { size: 21 }),
        pos(width() / 2, height() / 2 + sy(36)),
        anchor("center"),
        color(205, 220, 245),
    ]);

    const replayBtn = add([
        rect(sx(242), sy(58), { radius: 20 }),
        pos(width() / 2 - sx(152), height() / 2 + sy(118)),
        anchor("center"),
        color(245, 119, 153),
        outline(2, rgb(255, 228, 236)),
        area(),
        "winReplayBtn",
    ]);
    add([
        text("Replay Adventure", { size: 24 }),
        pos(replayBtn.pos.x, replayBtn.pos.y),
        anchor("center"),
        color(255, 246, 252),
    ]);
    const replayBounds = {
        x: replayBtn.pos.x - sx(121),
        y: replayBtn.pos.y - sy(29),
        w: sx(242),
        h: sy(58),
    };

    const letterBtn = add([
        rect(sx(220), sy(50), { radius: 18 }),
        pos(width() / 2 + sx(142), height() / 2 + sy(118)),
        anchor("center"),
        color(126, 172, 181),
        outline(2, rgb(223, 245, 250)),
        area(),
        "winLetterBtn",
    ]);
    add([
        text("Read Letter", { size: 20 }),
        pos(letterBtn.pos.x, letterBtn.pos.y),
        anchor("center"),
        color(18, 40, 46),
    ]);
    const letterBounds = {
        x: letterBtn.pos.x - sx(110),
        y: letterBtn.pos.y - sy(25),
        w: sx(220),
        h: sy(50),
    };

    const levelSelectBtn = add([
        rect(sx(238), sy(50), { radius: 18 }),
        pos(width() / 2, height() / 2 + sy(188)),
        anchor("center"),
        color(112, 132, 176),
        outline(2, rgb(218, 230, 255)),
        area(),
        "winLevelSelectBtn",
    ]);
    add([
        text("Level Select", { size: 21 }),
        pos(levelSelectBtn.pos.x, levelSelectBtn.pos.y),
        anchor("center"),
        color(236, 246, 255),
    ]);
    const levelSelectBounds = {
        x: levelSelectBtn.pos.x - sx(119),
        y: levelSelectBtn.pos.y - sy(25),
        w: sx(238),
        h: sy(50),
    };

    onClick("winReplayBtn", () => safeAction(() => go("title")));
    onClick("winLetterBtn", () => safeAction(() => showLoveLetter()));
    onClick("winLevelSelectBtn", () => safeAction(() => go("level-select")));

    if (gameCanvasEl) {
        const pointerRouter = (evt) => {
            if (window.__qaScene !== "finale") return;
            const canvasBounds = gameCanvasEl.getBoundingClientRect();
            if (
                evt.clientX < canvasBounds.left ||
                evt.clientX > canvasBounds.right ||
                evt.clientY < canvasBounds.top ||
                evt.clientY > canvasBounds.bottom
            ) {
                return;
            }
            const pointer = clientToScenePoint(evt.clientX, evt.clientY);
            if (pointInRect(pointer, replayBounds)) {
                safeAction(() => go("title"));
                return;
            }
            if (pointInRect(pointer, letterBounds)) {
                safeAction(() => showLoveLetter());
                return;
            }
            if (pointInRect(pointer, levelSelectBounds)) {
                safeAction(() => go("level-select"));
            }
        };
        window.addEventListener("pointerdown", pointerRouter, true);
        detachPointerRouter = () => window.removeEventListener("pointerdown", pointerRouter, true);
    }
});

// ============================================
// MEMORY POPUP
// ============================================
let memoryTypewriterTimer = null;

function showMemory(monthIndex) {
    const memory = MEMORIES[monthIndex];
    const popup = document.getElementById("memory-popup");
    const monthText = document.getElementById("memory-month");
    const typedText = document.getElementById("memory-typed-text");
    const fullMessage = memory.popupMessage || memory.message || "";

    if (memoryTypewriterTimer) {
        clearInterval(memoryTypewriterTimer);
        memoryTypewriterTimer = null;
    }

    monthText.textContent = memory.month;
    typedText.textContent = "";
    let charIndex = 0;
    memoryTypewriterTimer = setInterval(() => {
        charIndex += 1;
        typedText.textContent = fullMessage.slice(0, charIndex);
        if (charIndex >= fullMessage.length) {
            clearInterval(memoryTypewriterTimer);
            memoryTypewriterTimer = null;
        }
    }, 22);
    emitGameLog("memory.open", { month: memory.month, title: memory.title });

    popup.classList.remove("hidden");
    popup.classList.remove("closing");

    document.getElementById("close-memory").onclick = () => {
        const closeBtn = document.getElementById("close-memory");
        closeBtn.disabled = true;
        if (memoryTypewriterTimer) {
            clearInterval(memoryTypewriterTimer);
            memoryTypewriterTimer = null;
        }
        popup.classList.add("closing");

        setTimeout(() => {
            popup.classList.add("hidden");
            popup.classList.remove("closing");
            closeBtn.disabled = false;

            if (monthIndex < 11) {
                emitGameLog("memory.close.next", { month: memory.month, next: MEMORIES[monthIndex + 1].month });
                go("month", monthIndex + 1);
            } else {
                emitGameLog("memory.close.boss", { month: memory.month });
                go("rescue-boss");
            }

            setTimeout(() => {
                document.getElementById("game").focus();
            }, 100);
        }, 400);
    };
}

// ============================================
// LOVE LETTER (Finale)
// ============================================
const LOVE_LETTER_LINES = [
    { type: "comment", text: "/* For the one who turned my life into color */" },
    { type: "blank" },
    { type: "selector", text: ".my-heart {" },
    { type: "property", property: "belongs-to", value: '"Anushka"' },
    { type: "property", property: "feeling", value: '"still butterflies, every single day"' },
    { type: "property", property: "status", value: '"completely yours, no fallback state"' },
    { type: "close", text: "}" },
    { type: "blank" },
    { type: "selector", text: ".our-year {" },
    { type: "property", property: "jan", value: '"Cubbon Park walks + your impossible laugh"' },
    { type: "property", property: "feb", value: '"you in pink, me pretending I was calm"' },
    { type: "property", property: "mar", value: '"sunset yacht and us against the whole world"' },
    { type: "property", property: "apr_may", value: '"distance mode, but never distant hearts"' },
    { type: "property", property: "jun", value: '"mango season + finally side by side"' },
    { type: "property", property: "jul", value: '"candlelight notes and your hand in mine"' },
    { type: "property", property: "aug", value: '"my birthday became ours because of you"' },
    { type: "property", property: "sep", value: '"festive lights, filmy eyes, full pyaar"' },
    { type: "property", property: "oct", value: '"jump scares outside, safe mode with you"' },
    { type: "property", property: "nov", value: '"happy birthday, meri favorite human"' },
    { type: "property", property: "dec", value: '"winter air, warm heart, always us"' },
    { type: "close", text: "}" },
    { type: "blank" },
    { type: "selector", text: ".us::forever {" },
    { type: "property", property: "content", value: '"every choti si moment with you"' },
    { type: "property", property: "love", value: '"infinite" !important' },
    { type: "property", property: "overflow", value: '"my heart, always and always"' },
    { type: "property", property: "inside_joke", value: '"chai > everything when it is with you"' },
    { type: "close", text: "}" },
    { type: "blank" },
    { type: "comment", text: "/* I love you, Anushka. Happy Valentine's Day. */" },
    { type: "signature", text: "— Forever yours, Sarthak" },
    { type: "raw", text: "Now close this laptop and come find me." },
];

let letterInterval = null;
let lineIdx = 0;
let charIdx = 0;

function showLoveLetter() {
    const overlay = document.getElementById("love-letter-overlay");
    const content = document.getElementById("letter-content");

    content.innerHTML = "";
    lineIdx = 0;
    charIdx = 0;

    overlay.classList.remove("hidden");
    createSparkles();
    typeLetter();

    // Hide skip button initially — reveal after 12 seconds
    const skipBtn = document.getElementById("skip-letter");
    skipBtn.style.opacity = "0";
    skipBtn.style.pointerEvents = "none";
    setTimeout(() => {
        skipBtn.style.opacity = "1";
        skipBtn.style.pointerEvents = "auto";
        skipBtn.style.transition = "opacity 0.5s";
    }, 12000);
    skipBtn.onclick = skipLetter;
    document.getElementById("replay-game").onclick = replayGame;
}

function typeLetter() {
    const content = document.getElementById("letter-content");

    if (letterInterval) clearInterval(letterInterval);

    letterInterval = setInterval(() => {
        if (lineIdx >= LOVE_LETTER_LINES.length) {
            clearInterval(letterInterval);
            const cursor = document.querySelector(".typing-cursor");
            if (cursor) cursor.remove();
            return;
        }

        const line = LOVE_LETTER_LINES[lineIdx];
        let el = document.getElementById(`line-${lineIdx}`);

        if (!el) {
            el = document.createElement("div");
            el.className = "code-line";
            el.id = `line-${lineIdx}`;
            content.appendChild(el);
        }

        if (line.type === "blank") {
            el.innerHTML = "&nbsp;";
            lineIdx++;
            charIdx = 0;
            return;
        }

        const plain = getPlainText(line);

        if (charIdx < plain.length) {
            const partial = plain.substring(0, charIdx + 1);
            el.innerHTML = colorize(line, partial) + '<span class="typing-cursor"></span>';
            charIdx++;
        } else {
            el.innerHTML = colorize(line, plain);
            lineIdx++;
            charIdx = 0;
        }
        // Auto-scroll to keep latest line visible
        content.scrollTop = content.scrollHeight;
    }, 45);
}

function getPlainText(line) {
    if (line.type === "property") return `    ${line.property}: ${line.value};`;
    return line.text || "";
}

function colorize(line, text) {
    switch (line.type) {
        case "comment": return `<span class="code-comment">${text}</span>`;
        case "selector": return `<span class="code-property">${text}</span>`;
        case "close": return `<span class="code-bracket">${text}</span>`;
        case "signature": return `<span class="code-heart">${text}</span>`;
        case "raw": return `<span class="code-heart">${text}</span>`;
        case "property":
            // Simple colorization
            return text.replace(/^(\s*)(\S+)(:)(.+)(;)$/,
                '$1<span class="code-property">$2</span><span class="code-bracket">$3</span><span class="code-string">$4</span><span class="code-bracket">$5</span>'
            ) || text;
        default: return text;
    }
}

function skipLetter() {
    if (letterInterval) clearInterval(letterInterval);

    const content = document.getElementById("letter-content");
    content.innerHTML = "";

    LOVE_LETTER_LINES.forEach((line, i) => {
        const el = document.createElement("div");
        el.className = "code-line";
        el.id = `line-${i}`;
        el.innerHTML = line.type === "blank" ? "&nbsp;" : colorize(line, getPlainText(line));
        content.appendChild(el);
    });
}

function replayGame() {
    document.getElementById("love-letter-overlay").classList.add("hidden");
    document.querySelectorAll(".sparkle").forEach(s => s.remove());
    if (letterInterval) clearInterval(letterInterval);
    go("title");
}

function createSparkles() {
    document.querySelectorAll(".sparkle").forEach(s => s.remove());

    const sparklePalette = [
        "rgba(255, 180, 200, 0.92)",
        "rgba(255, 225, 170, 0.88)",
        "rgba(176, 229, 245, 0.88)",
        "rgba(240, 198, 255, 0.86)",
        "rgba(255, 245, 220, 0.9)",
    ];

    for (let i = 0; i < 100; i++) {
        const s = document.createElement("div");
        s.className = "sparkle";
        s.style.left = Math.random() * 100 + "vw";
        s.style.top = Math.random() * 100 + "vh";
        s.style.animationDelay = Math.random() * 3 + "s";
        // Vary size and color
        const size = 3 + Math.random() * 5;
        s.style.width = size + "px";
        s.style.height = size + "px";
        s.style.background = sparklePalette[Math.floor(Math.random() * sparklePalette.length)];
        document.body.appendChild(s);
    }
}

// ============================================
// START GAME
// ============================================
go("title");
