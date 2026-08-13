/* =========================================================
   CYBER // FALL
   SCRIPT.JS
   TWIN-STICK SHOOTER
   AUTO FIRE + MANUAL AIM
   ENEMY AI + BOSS PHASES
========================================================= */

"use strict";

/* =========================================================
   CANVAS
========================================================= */

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;
let DPR = 1;


/* =========================================================
   DOM
========================================================= */

const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");

const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const comboEl = document.getElementById("combo");
const levelEl = document.getElementById("level");

const stageDisplay = document.getElementById("stage-display");

const hpBar = document.getElementById("hp-bar");
const hpText = document.getElementById("hp-text");

const xpBar = document.getElementById("xp-bar");
const xpText = document.getElementById("xp-text");

const bossContainer = document.getElementById("boss-container");
const bossHpBar = document.getElementById("boss-hp-bar");
const bossPhaseEl = document.getElementById("boss-phase");

const skillsContainer =
    document.getElementById("skills-container");

const notification =
    document.getElementById("notification");

const aimIndicator =
    document.getElementById("aim-indicator");

const mobileControls =
    document.getElementById("mobile-controls");

const movementBase =
    document.getElementById("movement-base");

const movementStick =
    document.getElementById("movement-stick");

const aimBase =
    document.getElementById("aim-base");

const aimStick =
    document.getElementById("aim-stick");

const dashButton =
    document.getElementById("dash-button");

const pcControls =
    document.getElementById("pc-controls");

const levelupScreen =
    document.getElementById("levelup-screen");

const upgradeContainer =
    document.getElementById("upgrade-container");

const stageClearScreen =
    document.getElementById("stage-clear-screen");

const continueStage =
    document.getElementById("continue-stage");

const stageReward =
    document.getElementById("stage-reward");

const gameoverScreen =
    document.getElementById("gameover-screen");

const gameoverTitle =
    document.getElementById("gameover-title");

const gameoverMessage =
    document.getElementById("gameover-message");

const finalScore =
    document.getElementById("final-score");

const restartButton =
    document.getElementById("restart-button");

const menuButton =
    document.getElementById("menu-button");

const bossWarningOverlay =
    document.getElementById("boss-warning-overlay");

const skillWarning =
    document.getElementById("skill-warning");

const skillWarningName =
    document.getElementById("skill-warning-name");

const skillWarningTimer =
    document.getElementById("skill-warning-timer");


/* =========================================================
   GAME STATE
========================================================= */

const game = {

    running: false,

    paused: false,

    difficulty: "normal",

    stage: 1,

    maxStages: 5,

    score: 0,

    combo: 1,

    comboTimer: 0,

    level: 1,

    xp: 0,

    xpRequired: 100,

    kills: 0,

    enemiesSpawned: 0,

    enemiesKilled: 0,

    enemiesRemaining: 0,

    stageStarted: false,

    stageCleared: false,

    bossActive: false,

    bossDefeated: false,

    bossWarning: false,

    stageTimer: 0,

    elapsed: 0,

    screenShake: 0,

    flash: 0,

    lastTime: 0,

    fireTimer: 0,

    spawnTimer: 0,

    enemySpawnDelay: 1.1,

    bullets: [],

    enemyBullets: [],

    enemies: [],

    particles: [],

    pickups: [],

    damageTexts: [],

    effects: [],

    boss: null,

    stars: [],

    explosions: [],

    difficultyData: null,

    pendingStage: null

};


/* =========================================================
   DIFFICULTY
========================================================= */

const difficultyData = {

    easy: {

        name: "EASY",

        playerHp: 160,

        playerSpeed: 280,

        enemyHp: 34,

        enemyDamage: 8,

        enemySpeed: 55,

        enemyFireRate: 2.5,

        spawnMultiplier: 0.75,

        bossMultiplier: 3,

        dropBonus: 0.12

    },

    normal: {

        name: "NORMAL",

        playerHp: 130,

        playerSpeed: 265,

        enemyHp: 42,

        enemyDamage: 11,

        enemySpeed: 70,

        enemyFireRate: 2.1,

        spawnMultiplier: 1,

        bossMultiplier: 4,

        dropBonus: 0.18

    },

    hard: {

        name: "HARD",

        playerHp: 110,

        playerSpeed: 250,

        enemyHp: 50,

        enemyDamage: 15,

        enemySpeed: 86,

        enemyFireRate: 1.7,

        spawnMultiplier: 1.25,

        bossMultiplier: 5,

        dropBonus: 0.25

    }

};


/* =========================================================
   PLAYER
========================================================= */

const player = {

    x: 0,

    y: 0,

    radius: 17,

    hp: 130,

    maxHp: 130,

    speed: 265,

    angle: -Math.PI / 2,

    aimActive: false,

    invulnerable: 0,

    dashCooldown: 0,

    dashTimer: 0,

    dashSpeed: 780,

    dashDuration: 0.16,

    fireRate: 0.19,

    bulletDamage: 18,

    bulletSpeed: 720,

    bulletSize: 4,

    multiShot: 1,

    spread: 0.14,

    projectileType: "normal",

    moveX: 0,

    moveY: 0,

    pet: false,

    petAngle: 0,

    petDistance: 48,

    petDamageMultiplier: 0.75,

    kills: 0

};


/* =========================================================
   SKILLS
========================================================= */

const skills = {

    bomb: 0,

    missile: 0,

    clear: 0,

    moveSpeed: 0,

    fireSpeed: 0,

    multiShot: 0,

    ultraGun: 0,

    elemental: null

};


/* =========================================================
   DROP RATES
========================================================= */

function getDropRates() {

    const stageBonus =
        (game.stage - 1) * 0.035;

    const difficultyBonus =
        game.difficultyData.dropBonus;

    return {

        bomb:
            0.08 +
            stageBonus +
            difficultyBonus * 0.25,

        missile:
            0.08 +
            stageBonus +
            difficultyBonus * 0.25,

        clear:
            0.035 +
            stageBonus * 0.4,

        moveSpeed:
            0.10 +
            stageBonus,

        fireSpeed:
            0.14 +
            stageBonus,

        multiShot:
            0.10 +
            stageBonus,

        ultraGun:
            0.06 +
            stageBonus * 0.5,

        elemental:
            0.16 +
            stageBonus

    };

}


/* =========================================================
   INPUT
========================================================= */

const keys = {};

const mouse = {

    x: 0,

    y: 0,

    active: false

};


const movementJoystick = {

    active: false,

    id: null,

    x: 0,

    y: 0

};


const aimJoystick = {

    active: false,

    id: null,

    x: 0,

    y: 0

};


/* =========================================================
   RESIZE
========================================================= */

function resizeCanvas() {

    DPR = Math.min(
        window.devicePixelRatio || 1,
        2
    );

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W * DPR;
    canvas.height = H * DPR;

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(
        DPR,
        0,
        0,
        DPR,
        0,
        0
    );

    if (player.x === 0) {

        player.x = W / 2;
        player.y = H / 2;

    }

}

window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


/* =========================================================
   BACKGROUND STARS
========================================================= */

function createStars() {

    game.stars = [];

    const amount =
        Math.floor(
            (W * H) / 10000
        );

    for (let i = 0; i < amount; i++) {

        game.stars.push({

            x: Math.random() * W,

            y: Math.random() * H,

            size:
                Math.random() * 1.8 + 0.3,

            speed:
                Math.random() * 15 + 5,

            alpha:
                Math.random() * 0.6 + 0.15

        });

    }

}

createStars();


/* =========================================================
   UTILITIES
========================================================= */

function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );

}


function lerp(a, b, t) {

    return a + (b - a) * t;

}


function distance(a, b) {

    return Math.hypot(
        a.x - b.x,
        a.y - b.y
    );

}


function randomRange(min, max) {

    return Math.random() *
        (max - min) +
        min;

}


function randomInt(min, max) {

    return Math.floor(
        randomRange(min, max + 1)
    );

}


function angleDifference(a, b) {

    return Math.atan2(
        Math.sin(a - b),
        Math.cos(a - b)
    );

}


/* =========================================================
   NOTIFICATION
========================================================= */

let notificationTimer = 0;

function showNotification(text) {

    notification.textContent = text;

    notification.classList.add("show");

    notificationTimer = 1.6;

}


/* =========================================================
   DIFFICULTY BUTTONS
========================================================= */

document
    .querySelectorAll(".difficulty-card")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const difficulty =
                    button.dataset.difficulty;

                startGame(difficulty);

            }
        );

    });


/* =========================================================
   START GAME
========================================================= */

function startGame(difficulty) {

    game.difficulty =
        difficulty;

    game.difficultyData =
        difficultyData[difficulty];

    game.running = true;

    game.paused = false;

    game.stage = 1;

    game.score = 0;

    game.combo = 1;

    game.comboTimer = 0;

    game.level = 1;

    game.xp = 0;

    game.xpRequired = 100;

    game.kills = 0;

    game.enemiesKilled = 0;

    game.enemiesSpawned = 0;

    game.bossActive = false;

    game.bossDefeated = false;

    game.stageCleared = false;

    game.bullets = [];

    game.enemyBullets = [];

    game.enemies = [];

    game.particles = [];

    game.pickups = [];

    game.damageTexts = [];

    game.effects = [];

    game.explosions = [];

    game.boss = null;

    player.x = W / 2;

    player.y = H / 2;

    player.maxHp =
        game.difficultyData.playerHp;

    player.hp =
        player.maxHp;

    player.speed =
        game.difficultyData.playerSpeed;

    player.angle =
        -Math.PI / 2;

    player.fireRate = 0.19;

    player.bulletDamage = 18;

    player.multiShot = 1;

    player.projectileType = "normal";

    player.pet = false;

    player.invulnerable = 0;

    player.dashCooldown = 0;

    Object.keys(skills).forEach(key => {

        skills[key] =
            key === "elemental"
                ? null
                : 0;

    });

    menuScreen.classList.add("hidden");

    gameScreen.classList.remove("hidden");

    bossContainer.classList.add("hidden");

    levelupScreen.classList.add("hidden");

    stageClearScreen.classList.add("hidden");

    gameoverScreen.classList.add("hidden");

    bossWarningOverlay.classList.add("hidden");

    skillWarning.classList.add("hidden");

    mobileControls.style.display =
        "block";

    updateHUD();

    startStage();

    showNotification(
        `${game.difficultyData.name} // STAGE 1`
    );

    game.lastTime =
        performance.now();

    requestAnimationFrame(gameLoop);

}


/* =========================================================
   START STAGE
========================================================= */

function startStage() {

    game.stageStarted = true;

    game.stageCleared = false;

    game.bossActive = false;

    game.bossDefeated = false;

    game.boss = null;

    game.enemies = [];

    game.enemyBullets = [];

    game.bullets = [];

    game.pickups = [];

    game.effects = [];

    game.stageTimer = 0;

    game.enemiesSpawned = 0;

    game.enemiesKilled = 0;

    game.spawnTimer = 0.8;

    game.enemySpawnDelay =
        Math.max(
            0.45,
            1.15 -
            game.stage * 0.08
        );

    bossContainer.classList.add("hidden");

    stageDisplay.textContent =
        `${game.difficultyData.name} · STAGE ${game.stage}`;

    waveEl.textContent =
        game.stage;

    updateHUD();

}


/* =========================================================
   STAGE ENEMY COUNT
========================================================= */

function getStageEnemyCount() {

    const base = {

        easy: 24,

        normal: 30,

        hard: 36

    }[game.difficulty];

    return Math.floor(
        base +
        (game.stage - 1) * 7
    );

}


/* =========================================================
   SPAWN ENEMY
========================================================= */

function spawnEnemy() {

    if (
        game.enemiesSpawned >=
        getStageEnemyCount()
    ) {

        return;

    }

    const edge =
        randomInt(0, 3);

    let x;
    let y;

    const margin = 50;

    if (edge === 0) {

        x = -margin;
        y = Math.random() * H;

    } else if (edge === 1) {

        x = W + margin;
        y = Math.random() * H;

    } else if (edge === 2) {

        x = Math.random() * W;
        y = -margin;

    } else {

        x = Math.random() * W;
        y = H + margin;

    }

    const roll =
        Math.random();

    let type;

    if (game.stage >= 3 && roll < 0.14) {

        type = "elite";

    } else if (roll < 0.35) {

        type = "shooter";

    } else if (roll < 0.62) {

        type = "rusher";

    } else {

        type = "hunter";

    }

    const data =
        createEnemyData(type);

    game.enemies.push({

        x,

        y,

        type,

        radius: data.radius,

        hp: data.hp,

        maxHp: data.hp,

        speed: data.speed,

        damage: data.damage,

        fireTimer:
            randomRange(
                0.5,
                data.fireRate
            ),

        fireRate: data.fireRate,

        color: data.color,

        shootRange: data.shootRange,

        attackCooldown: 0,

        attackDelay: data.attackDelay,

        dashCooldown:
            randomRange(1, 3),

        angle: 0,

        wobble:
            Math.random() * Math.PI * 2,

        hitFlash: 0,

        dead: false

    });

    game.enemiesSpawned++;

}


/* =========================================================
   ENEMY DATA
========================================================= */

function createEnemyData(type) {

    const d =
        game.difficultyData;

    const stageScale =
        1 +
        (game.stage - 1) * 0.08;

    if (type === "rusher") {

        return {

            radius: 15,

            hp:
                d.enemyHp *
                0.85 *
                stageScale,

            speed:
                d.enemySpeed *
                1.45 *
                stageScale,

            damage:
                d.enemyDamage *
                1.15,

            fireRate: 99,

            shootRange: 0,

            attackDelay: 0.7,

            color: "#ff315d"

        };

    }


    if (type === "shooter") {

        return {

            radius: 14,

            hp:
                d.enemyHp *
                0.95 *
                stageScale,

            speed:
                d.enemySpeed *
                0.72 *
                stageScale,

            damage:
                d.enemyDamage,

            fireRate:
                d.enemyFireRate,

            shootRange: 390,

            attackDelay: 1,

            color: "#b15cff"

        };

    }


    if (type === "elite") {

        return {

            radius: 22,

            hp:
                d.enemyHp *
                3.2 *
                stageScale,

            speed:
                d.enemySpeed *
                1.05 *
                stageScale,

            damage:
                d.enemyDamage *
                1.8,

            fireRate:
                d.enemyFireRate *
                0.75,

            shootRange: 460,

            attackDelay: 0.8,

            color: "#ff00c8"

        };

    }


    return {

        radius: 16,

        hp:
            d.enemyHp *
            stageScale,

        speed:
            d.enemySpeed *
            stageScale,

        damage:
            d.enemyDamage,

        fireRate:
            d.enemyFireRate *
            1.4,

        shootRange: 0,

        attackDelay: 0.8,

        color: "#00d9ff"

    };

}


/* =========================================================
   ENEMY AI
========================================================= */

function updateEnemy(enemy, dt) {

    if (enemy.dead) return;

    enemy.hitFlash =
        Math.max(
            0,
            enemy.hitFlash - dt
        );

    enemy.attackCooldown =
        Math.max(
            0,
            enemy.attackCooldown - dt
        );

    enemy.fireTimer =
        Math.max(
            0,
            enemy.fireTimer - dt
        );

    enemy.wobble += dt * 2;

    const dx =
        player.x - enemy.x;

    const dy =
        player.y - enemy.y;

    const dist =
        Math.hypot(dx, dy);

    const dirX =
        dist > 0
            ? dx / dist
            : 0;

    const dirY =
        dist > 0
            ? dy / dist
            : 0;


    /* ---------------------------------------------
       RUSHER
    --------------------------------------------- */

    if (enemy.type === "rusher") {

        enemy.x +=
            dirX *
            enemy.speed *
            dt;

        enemy.y +=
            dirY *
            enemy.speed *
            dt;

    }


    /* ---------------------------------------------
       HUNTER
    --------------------------------------------- */

    else if (enemy.type === "hunter") {

        const side =
            Math.sin(
                enemy.wobble
            ) * 0.55;

        const moveX =
            dirX -
            dirY * side;

        const moveY =
            dirY +
            dirX * side;

        const length =
            Math.hypot(
                moveX,
                moveY
            ) || 1;

        enemy.x +=
            moveX /
            length *
            enemy.speed *
            dt;

        enemy.y +=
            moveY /
            length *
            enemy.speed *
            dt;

    }


    /* ---------------------------------------------
       SHOOTER
    --------------------------------------------- */

    else if (
        enemy.type === "shooter"
    ) {

        if (dist > enemy.shootRange) {

            enemy.x +=
                dirX *
                enemy.speed *
                dt;

            enemy.y +=
                dirY *
                enemy.speed *
                dt;

        } else if (dist < 220) {

            enemy.x -=
                dirX *
                enemy.speed *
                dt;

            enemy.y -=
                dirY *
                enemy.speed *
                dt;

        } else {

            const strafe =
                Math.sin(
                    enemy.wobble
                );

            enemy.x +=
                -dirY *
                enemy.speed *
                0.55 *
                strafe *
                dt;

            enemy.y +=
                dirX *
                enemy.speed *
                0.55 *
                strafe *
                dt;

        }

        if (
            enemy.fireTimer <= 0 &&
            dist < enemy.shootRange
        ) {

            enemyShoot(enemy);

            enemy.fireTimer =
                enemy.fireRate;

        }

    }


    /* ---------------------------------------------
       ELITE
    --------------------------------------------- */

    else if (
        enemy.type === "elite"
    ) {

        if (dist > 270) {

            enemy.x +=
                dirX *
                enemy.speed *
                dt;

            enemy.y +=
                dirY *
                enemy.speed *
                dt;

        } else {

            const side =
                Math.sin(
                    enemy.wobble * 1.8
                );

            enemy.x +=
                -dirY *
                enemy.speed *
                0.8 *
                side *
                dt;

            enemy.y +=
                dirX *
                enemy.speed *
                0.8 *
                side *
                dt;

        }

        if (
            enemy.fireTimer <= 0 &&
            dist < 500
        ) {

            enemyShoot(enemy);

            enemy.fireTimer =
                enemy.fireRate;

        }

    }


    /* ---------------------------------------------
       CONTACT ATTACK
    --------------------------------------------- */

    if (
        dist <
        enemy.radius +
        player.radius +
        4
    ) {

        if (
            enemy.attackCooldown <= 0
        ) {

            damagePlayer(
                enemy.damage
            );

            enemy.attackCooldown =
                enemy.attackDelay;

        }

        const push =
            Math.max(
                0.01,
                enemy.radius +
                player.radius -
                dist
            );

        enemy.x -=
            dirX *
            push *
            0.35;

        enemy.y -=
            dirY *
            push *
            0.35;

    }

}


/* =========================================================
   ENEMY SHOOT
========================================================= */

function enemyShoot(enemy) {

    const angle =
        Math.atan2(
            player.y - enemy.y,
            player.x - enemy.x
        );

    game.enemyBullets.push({

        x:
            enemy.x,

        y:
            enemy.y,

        vx:
            Math.cos(angle) *
            270,

        vy:
            Math.sin(angle) *
            270,

        radius: 5,

        damage:
            enemy.damage,

        life: 4,

        color:
            enemy.color

    });

}


/* =========================================================
   PLAYER AIM
========================================================= */

function updatePlayerAim() {

    /* ---------------------------------------------
       MOBILE AIM JOYSTICK
    --------------------------------------------- */

    if (
        aimJoystick.active
    ) {

        const x =
            aimJoystick.x;

        const y =
            aimJoystick.y;

        if (
            Math.hypot(x, y) >
            0.15
        ) {

            player.angle =
                Math.atan2(
                    y,
                    x
                );

            player.aimActive = true;

        }

        return;

    }


    /* ---------------------------------------------
       PC MOUSE
    --------------------------------------------- */

    if (
        mouse.active
    ) {

        player.angle =
            Math.atan2(
                mouse.y - player.y,
                mouse.x - player.x
            );

    }

}


/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayerMovement(dt) {

    let x = 0;
    let y = 0;


    /* ---------------------------------------------
       MOBILE
    --------------------------------------------- */

    if (
        movementJoystick.active
    ) {

        x =
            movementJoystick.x;

        y =
            movementJoystick.y;

    }


    /* ---------------------------------------------
       PC KEYBOARD FALLBACK
    --------------------------------------------- */

    else {

        if (keys["w"] || keys["ArrowUp"])
            y -= 1;

        if (keys["s"] || keys["ArrowDown"])
            y += 1;

        if (keys["a"] || keys["ArrowLeft"])
            x -= 1;

        if (keys["d"] || keys["ArrowRight"])
            x += 1;

        const length =
            Math.hypot(x, y);

        if (length > 1) {

            x /= length;
            y /= length;

        }

    }


    player.moveX = x;
    player.moveY = y;


    let speed =
        player.speed;

    if (
        player.dashTimer > 0
    ) {

        speed =
            player.dashSpeed;

        player.invulnerable =
            0.05;

    }


    player.x +=
        x *
        speed *
        dt;

    player.y +=
        y *
        speed *
        dt;


    const margin =
        player.radius + 5;

    player.x =
        clamp(
            player.x,
            margin,
            W - margin
        );

    player.y =
        clamp(
            player.y,
            margin,
            H - margin
        );

}


/* =========================================================
   DASH
========================================================= */

function dash() {

    if (
        !game.running ||
        game.paused ||
        player.dashCooldown > 0
    ) {

        return;

    }

    let x =
        player.moveX;

    let y =
        player.moveY;

    if (
        Math.hypot(x, y) <
        0.15
    ) {

        x =
            Math.cos(
                player.angle
            );

        y =
            Math.sin(
                player.angle
            );

    }

    const length =
        Math.hypot(x, y) || 1;

    x /= length;
    y /= length;

    player.moveX = x;
    player.moveY = y;

    player.dashTimer =
        player.dashDuration;

    player.dashCooldown =
        1.15;

    player.invulnerable =
        player.dashDuration;

    createDashEffect();

}


/* =========================================================
   AUTO FIRE
========================================================= */

function updateAutoFire(dt) {

    if (
        !game.running ||
        game.paused
    ) {

        return;

    }

    game.fireTimer -= dt;

    if (
        game.fireTimer <= 0
    ) {

        fireWeapon();

        game.fireTimer =
            player.fireRate;

    }

}


/* =========================================================
   PLAYER FIRE
========================================================= */

function fireWeapon() {

    const count =
        player.multiShot;

    const spread =
        player.multiShot === 1
            ? 0
            : player.spread;

    for (
        let i = 0;
        i < count;
        i++
    ) {

        let offset = 0;

        if (count > 1) {

            offset =
                (
                    i -
                    (count - 1) / 2
                ) *
                spread;

        }

        const angle =
            player.angle +
            offset;

        const speed =
            player.bulletSpeed;

        game.bullets.push({

            x:
                player.x +
                Math.cos(angle) *
                20,

            y:
                player.y +
                Math.sin(angle) *
                20,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            radius:
                player.bulletSize,

            damage:
                player.bulletDamage,

            life: 1.8,

            type:
                player.projectileType,

            angle

        });

    }

    createMuzzleFlash();

}


/* =========================================================
   UPDATE BULLETS
========================================================= */

function updateBullets(dt) {

    for (
        let i =
            game.bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            game.bullets[i];

        bullet.x +=
            bullet.vx *
            dt;

        bullet.y +=
            bullet.vy *
            dt;

        bullet.life -= dt;

        if (
            bullet.life <= 0 ||
            bullet.x < -50 ||
            bullet.x > W + 50 ||
            bullet.y < -50 ||
            bullet.y > H + 50
        ) {

            game.bullets.splice(
                i,
                1
            );

            continue;

        }


        for (
            let j =
                game.enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                game.enemies[j];

            if (enemy.dead)
                continue;

            const dist =
                Math.hypot(
                    bullet.x -
                        enemy.x,
                    bullet.y -
                        enemy.y
                );

            if (
                dist <
                bullet.radius +
                enemy.radius
            ) {

                hitEnemy(
                    enemy,
                    bullet
                );

                game.bullets.splice(
                    i,
                    1
                );

                break;

            }

        }


        if (
            game.bossActive &&
            game.boss &&
            !game.boss.dead
        ) {

            const boss =
                game.boss;

            const dist =
                Math.hypot(
                    bullet.x -
                        boss.x,
                    bullet.y -
                        boss.y
                );

            if (
                dist <
                bullet.radius +
                boss.radius
            ) {

                hitBoss(
                    boss,
                    bullet
                );

                game.bullets.splice(
                    i,
                    1
                );

            }

        }

    }

}


/* =========================================================
   HIT ENEMY
========================================================= */

function hitEnemy(enemy, bullet) {

    let damage =
        bullet.damage;

    if (
        bullet.type === "fire"
    ) {

        damage *= 1.15;

        createElementEffect(
            enemy.x,
            enemy.y,
            "#ff642e"
        );

    }

    if (
        bullet.type === "ice"
    ) {

        damage *= 0.95;

        enemy.speed *= 0.92;

        createElementEffect(
            enemy.x,
            enemy.y,
            "#75eaff"
        );

    }

    if (
        bullet.type === "thunder"
    ) {

        damage *= 1.3;

        createElementEffect(
            enemy.x,
            enemy.y,
            "#eaff00"
        );

    }

    enemy.hp -= damage;

    enemy.hitFlash = 0.08;

    createDamageText(
        enemy.x,
        enemy.y - enemy.radius,
        Math.round(damage)
    );

    createHitParticles(
        enemy.x,
        enemy.y,
        enemy.color
    );

    if (
        enemy.hp <= 0
    ) {

        killEnemy(enemy);

    }

}


/* =========================================================
   KILL ENEMY
========================================================= */

function killEnemy(enemy) {

    if (enemy.dead)
        return;

    enemy.dead = true;

    game.enemiesKilled++;

    game.kills++;

    player.kills++;

    game.score +=
        enemy.type === "elite"
            ? 150
            : 50;

    game.comboTimer = 2.5;

    game.combo =
        Math.min(
            10,
            game.combo + 0.15
        );

    gainXP(
        enemy.type === "elite"
            ? 35
            : 18
    );

    createExplosion(
        enemy.x,
        enemy.y,
        enemy.color,
        enemy.type === "elite"
            ? 32
            : 20
    );

    tryDropPickup(
        enemy.x,
        enemy.y
    );

}


/* =========================================================
   XP
========================================================= */

function gainXP(amount) {

    game.xp += amount;

    while (
        game.xp >=
        game.xpRequired
    ) {

        game.xp -=
            game.xpRequired;

        game.level++;

        game.xpRequired =
            Math.floor(
                game.xpRequired *
                1.28
            );

        openLevelUp();

    }

}


/* =========================================================
   LEVEL UP
========================================================= */

const upgradePool = [

    {
        name: "RAPID FIRE",
        description:
            "Tăng tốc độ bắn 18%",
        apply() {

            player.fireRate *= 0.82;

        }
    },

    {
        name: "OVERDRIVE",
        description:
            "Tăng tốc độ di chuyển 15%",
        apply() {

            player.speed *= 1.15;

        }
    },

    {
        name: "POWER CORE",
        description:
            "Tăng sát thương 25%",
        apply() {

            player.bulletDamage *= 1.25;

        }
    },

    {
        name: "DUAL SHOT",
        description:
            "Bắn thêm một đường đạn",
        apply() {

            player.multiShot =
                Math.max(
                    2,
                    player.multiShot
                );

        }
    },

    {
        name: "TRIPLE SHOT",
        description:
            "Mở rộng thành 3 đường đạn",
        apply() {

            player.multiShot = 3;

        }
    },

    {
        name: "ARMOR",
        description:
            "Tăng HP tối đa 25",
        apply() {

            player.maxHp += 25;

            player.hp += 25;

        }
    },

    {
        name: "ULTRA GUN",
        description:
            "Tăng mạnh sát thương và tốc độ bắn",
        apply() {

            player.bulletDamage *= 1.35;

            player.fireRate *= 0.82;

        }
    }

];


function openLevelUp() {

    game.paused = true;

    upgradeContainer.innerHTML = "";

    const choices =
        [...upgradePool]
            .sort(
                () =>
                    Math.random() -
                    0.5
            )
            .slice(0, 3);

    choices.forEach(upgrade => {

        const card =
            document.createElement(
                "button"
            );

        card.className =
            "upgrade-card";

        card.innerHTML = `

            <span class="upgrade-type">
                SYSTEM UPGRADE
            </span>

            <span class="upgrade-name">
                ${upgrade.name}
            </span>

            <span class="upgrade-description">
                ${upgrade.description}
            </span>

        `;

        card.addEventListener(
            "click",
            () => {

                upgrade.apply();

                levelupScreen.classList.add(
                    "hidden"
                );

                game.paused = false;

                showNotification(
                    upgrade.name
                );

                updateHUD();

            }
        );

        upgradeContainer.appendChild(
            card
        );

    });

    levelupScreen.classList.remove(
        "hidden"
    );

}


/* =========================================================
   PICKUP DROP
========================================================= */

function tryDropPickup(x, y) {

    const rates =
        getDropRates();

    const roll =
        Math.random();

    let cumulative = 0;

    const entries = [

        [
            "bomb",
            rates.bomb
        ],

        [
            "missile",
            rates.missile
        ],

        [
            "clear",
            rates.clear
        ],

        [
            "moveSpeed",
            rates.moveSpeed
        ],

        [
            "fireSpeed",
            rates.fireSpeed
        ],

        [
            "multiShot",
            rates.multiShot
        ],

        [
            "ultraGun",
            rates.ultraGun
        ],

        [
            "elemental",
            rates.elemental
        ]

    ];

    for (
        const [type, rate]
        of entries
    ) {

        cumulative += rate;

        if (
            roll <
            cumulative
        ) {

            game.pickups.push({

                x,

                y,

                type,

                radius: 11,

                life: 12,

                pulse: 0

            });

            return;

        }

    }

}


/* =========================================================
   PICKUP UPDATE
========================================================= */

function updatePickups(dt) {

    for (
        let i =
            game.pickups.length - 1;
        i >= 0;
        i--
    ) {

        const pickup =
            game.pickups[i];

        pickup.life -= dt;

        pickup.pulse +=
            dt * 5;

        if (
            pickup.life <= 0
        ) {

            game.pickups.splice(
                i,
                1
            );

            continue;

        }

        const dist =
            Math.hypot(
                pickup.x -
                    player.x,
                pickup.y -
                    player.y
            );

        if (
            dist <
            pickup.radius +
            player.radius +
            8
        ) {

            collectPickup(
                pickup
            );

            game.pickups.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   COLLECT PICKUP
========================================================= */

function collectPickup(pickup) {

    const type =
        pickup.type;

    if (
        type === "bomb"
    ) {

        skills.bomb++;

        activateBomb();

    }


    else if (
        type === "missile"
    ) {

        skills.missile++;

        activateMissiles();

    }


    else if (
        type === "clear"
    ) {

        skills.clear++;

        activateClear();

    }


    else if (
        type === "moveSpeed"
    ) {

        skills.moveSpeed++;

        player.speed *= 1.12;

        showNotification(
            "MOVE SPEED +12%"
        );

    }


    else if (
        type === "fireSpeed"
    ) {

        skills.fireSpeed++;

        player.fireRate *= 0.87;

        showNotification(
            "FIRE RATE +13%"
        );

    }


    else if (
        type === "multiShot"
    ) {

        skills.multiShot++;

        player.multiShot =
            Math.min(
                3,
                player.multiShot + 1
            );

        showNotification(
            `${player.multiShot} WAY SHOT`
        );

    }


    else if (
        type === "ultraGun"
    ) {

        skills.ultraGun++;

        player.bulletDamage *= 1.35;

        player.fireRate *= 0.88;

        showNotification(
            "ULTRA GUN ONLINE"
        );

    }


    else if (
        type === "elemental"
    ) {

        const types = [
            "fire",
            "ice",
            "thunder"
        ];

        player.projectileType =
            types[
                randomInt(
                    0,
                    types.length - 1
                )
            ];

        skills.elemental =
            player.projectileType;

        showNotification(
            player.projectileType
                .toUpperCase() +
            " AMMO"
        );

    }

}


/* =========================================================
   BOMB
========================================================= */

function activateBomb() {

    const radius =
        260;

    for (
        const enemy
        of game.enemies
    ) {

        if (
            Math.hypot(
                enemy.x -
                    player.x,
                enemy.y -
                    player.y
            ) < radius
        ) {

            enemy.hp -=
                player.bulletDamage *
                4;

            if (
                enemy.hp <= 0
            ) {

                killEnemy(enemy);

            }

        }

    }

    if (
        game.bossActive &&
        game.boss
    ) {

        if (
            Math.hypot(
                game.boss.x -
                    player.x,
                game.boss.y -
                    player.y
            ) < radius
        ) {

            game.boss.hp -=
                player.bulletDamage *
                3;

        }

    }

    createExplosion(
        player.x,
        player.y,
        "#ffb000",
        radius
    );

    game.screenShake = 18;

    showNotification(
        "BOMB!"
    );

}


/* =========================================================
   MISSILES
========================================================= */

function activateMissiles() {

    const targets =
        game.enemies
            .filter(
                enemy =>
                    !enemy.dead
            )
            .sort(
                (a, b) =>
                    distance(player, a) -
                    distance(player, b)
            )
            .slice(0, 5);

    targets.forEach(
        target => {

            target.hp -=
                player.bulletDamage *
                3;

            createExplosion(
                target.x,
                target.y,
                "#ff9d00",
                28
            );

            if (
                target.hp <= 0
            ) {

                killEnemy(target);

            }

        }
    );

    if (
        game.bossActive &&
        game.boss
    ) {

        game.boss.hp -=
            player.bulletDamage *
            2;

    }

    showNotification(
        "MISSILE STRIKE"
    );

}


/* =========================================================
   SCREEN CLEAR
========================================================= */

function activateClear() {

    game.enemies.forEach(
        enemy => {

            if (!enemy.dead) {

                enemy.hp = 0;

                killEnemy(enemy);

            }

        }
    );

    game.enemyBullets = [];

    createExplosion(
        player.x,
        player.y,
        "#00f6ff",
        Math.max(W, H)
    );

    showNotification(
        "SYSTEM PURGE"
    );

}


/* =========================================================
   ENEMY BULLETS
========================================================= */

function updateEnemyBullets(dt) {

    for (
        let i =
            game.enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            game.enemyBullets[i];

        bullet.x +=
            bullet.vx *
            dt;

        bullet.y +=
            bullet.vy *
            dt;

        bullet.life -= dt;

        if (
            bullet.life <= 0 ||
            bullet.x < -100 ||
            bullet.x > W + 100 ||
            bullet.y < -100 ||
            bullet.y > H + 100
        ) {

            game.enemyBullets.splice(
                i,
                1
            );

            continue;

        }

        const dist =
            Math.hypot(
                bullet.x -
                    player.x,
                bullet.y -
                    player.y
            );

        if (
            dist <
            bullet.radius +
            player.radius
        ) {

            damagePlayer(
                bullet.damage
            );

            game.enemyBullets.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   DAMAGE PLAYER
========================================================= */

function damagePlayer(amount) {

    if (
        player.invulnerable > 0 ||
        !game.running ||
        game.paused
    ) {

        return;

    }

    player.hp -= amount;

    player.invulnerable =
        0.45;

    game.combo =
        Math.max(
            1,
            game.combo - 0.5
        );

    game.screenShake =
        Math.min(
            18,
            game.screenShake + 7
        );

    game.flash =
        0.12;

    createDamageText(
        player.x,
        player.y - 25,
        Math.round(amount),
        "#ff315d"
    );

    createHitParticles(
        player.x,
        player.y,
        "#ff315d"
    );

    updateHUD();

    if (
        player.hp <= 0
    ) {

        endGame(false);

    }

}


/* =========================================================
   BOSS
========================================================= */

function spawnBoss() {

    game.bossActive = true;

    game.bossDefeated = false;

    const multiplier =
        game.difficultyData
            .bossMultiplier;

    const normalEnemyHp =
        game.difficultyData.enemyHp *
        (
            1 +
            (game.stage - 1) *
            0.08
        );

    const bossHp =
        normalEnemyHp *
        multiplier *
        (
            1 +
            game.stage * 0.15
        );

    game.boss = {

        x: W / 2,

        y: 100,

        radius: 58,

        hp: bossHp,

        maxHp: bossHp,

        speed:
            70 +
            game.stage * 8,

        phase: 1,

        attackTimer: 2,

        summonTimer: 5,

        dashTimer: 4,

        laserTimer: 7,

        fireTimer: 2,

        dead: false,

        hitFlash: 0,

        teleportTimer: 8,

        skillCooldown: 0

    };

    bossContainer.classList.remove(
        "hidden"
    );

    bossWarningOverlay.classList.remove(
        "hidden"
    );

    game.bossWarning = true;

    setTimeout(
        () => {

            bossWarningOverlay.classList.add(
                "hidden"
            );

            game.bossWarning = false;

        },
        1800
    );

    showNotification(
        "☠ BOSS DETECTED"
    );

}


/* =========================================================
   BOSS UPDATE
========================================================= */

function updateBoss(dt) {

    const boss =
        game.boss;

    if (
        !boss ||
        boss.dead
    ) {

        return;

    }

    boss.hitFlash =
        Math.max(
            0,
            boss.hitFlash - dt
        );

    const hpPercent =
        boss.hp /
        boss.maxHp;


    /* ---------------------------------------------
       PHASE
    --------------------------------------------- */

    let phase = 1;

    if (
        hpPercent <= 0.33
    ) {

        phase = 3;

    } else if (
        hpPercent <= 0.66
    ) {

        phase = 2;

    }

    if (
        phase !== boss.phase
    ) {

        boss.phase = phase;

        showNotification(
            `BOSS PHASE 0${phase}`
        );

        createExplosion(
            boss.x,
            boss.y,
            "#ff00c8",
            90
        );

    }


    /* ---------------------------------------------
       MOVEMENT
    --------------------------------------------- */

    const dx =
        player.x -
        boss.x;

    const dy =
        player.y -
        boss.y;

    const dist =
        Math.hypot(dx, dy);

    const dirX =
        dist > 0
            ? dx / dist
            : 0;

    const dirY =
        dist > 0
            ? dy / dist
            : 0;

    const orbit =
        Math.sin(
            game.elapsed * 0.9
        );


    boss.x +=
        (
            -dirY *
            orbit *
            35 +
            dirX *
            18
        ) *
        dt;

    boss.y +=
        (
            dirX *
            orbit *
            35 +
            dirY *
            18
        ) *
        dt;


    boss.x =
        clamp(
            boss.x,
            boss.radius,
            W - boss.radius
        );

    boss.y =
        clamp(
            boss.y,
            boss.radius + 70,
            H - boss.radius
        );


    /* ---------------------------------------------
       TIMERS
    --------------------------------------------- */

    boss.attackTimer -= dt;

    boss.summonTimer -= dt;

    boss.dashTimer -= dt;

    boss.laserTimer -= dt;

    boss.fireTimer -= dt;

    boss.teleportTimer -= dt;


    /* ---------------------------------------------
       BASIC 360 ATTACK
    --------------------------------------------- */

    if (
        boss.fireTimer <= 0
    ) {

        bossFireCircle(
            boss,
            boss.phase === 1
                ? 10
                : boss.phase === 2
                    ? 14
                    : 18
        );

        boss.fireTimer =
            boss.phase === 1
                ? 2.8
                : boss.phase === 2
                    ? 2.1
                    : 1.5;

    }


    /* ---------------------------------------------
       SUMMON
    --------------------------------------------- */

    if (
        boss.summonTimer <= 0
    ) {

        warnBossSkill(
            "SUMMON HOSTILES",
            1
        );

        setTimeout(
            () => {

                if (
                    game.bossActive &&
                    game.running
                ) {

                    summonBossEnemies(
                        boss.phase + 1
                    );

                }

            },
            900
        );

        boss.summonTimer =
            boss.phase === 1
                ? 7
                : boss.phase === 2
                    ? 5
                    : 3.5;

    }


    /* ---------------------------------------------
       DASH
    --------------------------------------------- */

    if (
        boss.dashTimer <= 0
    ) {

        warnBossSkill(
            "DEMON DASH",
            0.8
        );

        setTimeout(
            () => {

                if (
                    game.bossActive &&
                    game.running
                ) {

                    bossDashAttack(
                        boss
                    );

                }

            },
            750
        );

        boss.dashTimer =
            boss.phase === 1
                ? 6
                : boss.phase === 2
                    ? 4.5
                    : 3;

    }


    /* ---------------------------------------------
       LASER
    --------------------------------------------- */

    if (
        boss.laserTimer <= 0 &&
        boss.phase >= 2
    ) {

        warnBossSkill(
            "DEMON LASER",
            1.2
        );

        setTimeout(
            () => {

                if (
                    game.bossActive &&
                    game.running
                ) {

                    bossLaser(
                        boss
                    );

                }

            },
            1100
        );

        boss.laserTimer =
            boss.phase === 2
                ? 8
                : 5;

    }


    /* ---------------------------------------------
       TELEPORT
    --------------------------------------------- */

    if (
        boss.teleportTimer <= 0 &&
        boss.phase >= 3
    ) {

        boss.x =
            randomRange(
                100,
                W - 100
            );

        boss.y =
            randomRange(
                100,
                H - 180
            );

        createExplosion(
            boss.x,
            boss.y,
            "#ff00c8",
            55
        );

        boss.teleportTimer = 6;

    }


    bossHpBar.style.width =
        `${Math.max(
            0,
            boss.hp /
            boss.maxHp *
            100
        )}%`;

    bossPhaseEl.textContent =
        `PHASE 0${boss.phase}`;

    if (
        hpPercent <= 0.33
    ) {

        bossContainer.classList.add(
            "boss-danger"
        );

    }

    if (
        boss.hp <= 0
    ) {

        killBoss();

    }

}


/* =========================================================
   BOSS CIRCLE FIRE
========================================================= */

function bossFireCircle(
    boss,
    count
) {

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            (
                Math.PI * 2 *
                i /
                count
            ) +
            game.elapsed * 0.3;

        game.enemyBullets.push({

            x:
                boss.x,

            y:
                boss.y,

            vx:
                Math.cos(angle) *
                190,

            vy:
                Math.sin(angle) *
                190,

            radius: 7,

            damage:
                10 +
                game.stage * 2,

            life: 5,

            color:
                "#ff00c8"

        });

    }

}


/* =========================================================
   BOSS DASH
========================================================= */

function bossDashAttack(
    boss
) {

    const angle =
        Math.atan2(
            player.y -
                boss.y,
            player.x -
                boss.x
        );

    const startX =
        boss.x;

    const startY =
        boss.y;

    boss.x +=
        Math.cos(angle) *
        240;

    boss.y +=
        Math.sin(angle) *
        240;

    boss.x =
        clamp(
            boss.x,
            boss.radius,
            W - boss.radius
        );

    boss.y =
        clamp(
            boss.y,
            boss.radius,
            H - boss.radius
        );

    createExplosion(
        startX,
        startY,
        "#ff315d",
        50
    );

    createExplosion(
        boss.x,
        boss.y,
        "#ff00c8",
        45
    );

    const dist =
        Math.hypot(
            player.x -
                boss.x,
            player.y -
                boss.y
        );

    if (
        dist <
        boss.radius +
        player.radius +
        25
    ) {

        damagePlayer(
            25 +
            game.stage * 4
        );

    }

}


/* =========================================================
   BOSS LASER
========================================================= */

function bossLaser(
    boss
) {

    const angle =
        Math.atan2(
            player.y -
                boss.y,
            player.x -
                boss.x
        );

    game.effects.push({

        type: "laser",

        x: boss.x,

        y: boss.y,

        angle,

        length:
            Math.max(W, H) * 1.4,

        width: 14,

        life: 1.25,

        maxLife: 1.25,

        damage:
            28 +
            game.stage * 4

    });

}


/* =========================================================
   BOSS SUMMON
========================================================= */

function summonBossEnemies(
    amount
) {

    for (
        let i = 0;
        i < amount + 1;
        i++
    ) {

        spawnBossMinion();

    }

}


/* =========================================================
   BOSS MINION
========================================================= */

function spawnBossMinion() {

    const angle =
        Math.random() *
        Math.PI *
        2;

    const distance =
        100;

    const type =
        Math.random() <
        0.35
            ? "rusher"
            : "hunter";

    const data =
        createEnemyData(type);

    game.enemies.push({

        x:
            game.boss.x +
            Math.cos(angle) *
            distance,

        y:
            game.boss.y +
            Math.sin(angle) *
            distance,

        type,

        radius:
            data.radius,

        hp:
            data.hp * 0.8,

        maxHp:
            data.hp * 0.8,

        speed:
            data.speed * 1.1,

        damage:
            data.damage,

        fireTimer: 2,

        fireRate:
            data.fireRate,

        shootRange:
            data.shootRange,

        attackCooldown: 0,

        attackDelay:
            data.attackDelay,

        color:
            data.color,

        wobble:
            Math.random() * 6,

        hitFlash: 0,

        dead: false

    });

}


/* =========================================================
   BOSS DAMAGE
========================================================= */

function hitBoss(
    boss,
    bullet
) {

    let damage =
        bullet.damage;

    if (
        bullet.type === "fire"
    ) {

        damage *= 1.1;

    }

    if (
        bullet.type === "thunder"
    ) {

        damage *= 1.2;

    }

    boss.hp -= damage;

    boss.hitFlash =
        0.08;

    createDamageText(
        boss.x,
        boss.y -
            boss.radius,
        Math.round(damage),
        "#ff00c8"
    );

    createHitParticles(
        boss.x,
        boss.y,
        "#ff00c8"
    );

}


/* =========================================================
   KILL BOSS
========================================================= */

function killBoss() {

    if (
        game.bossDefeated
    ) {

        return;

    }

    game.bossDefeated = true;

    game.bossActive = false;

    game.boss.dead = true;

    game.score +=
        1500 *
        game.stage;

    game.enemyBullets = [];

    for (
        let i = 0;
        i < 8;
        i++
    ) {

        createExplosion(
            game.boss.x +
                randomRange(
                    -50,
                    50
                ),
            game.boss.y +
                randomRange(
                    -50,
                    50
                ),
            "#ff00c8",
            randomRange(
                35,
                75
            )
        );

    }

    bossContainer.classList.add(
        "hidden"
    );

    showNotification(
        "☠ BOSS DESTROYED"
    );

    /* ---------------------------------------------
       PET REWARD
       EASY + NORMAL
    --------------------------------------------- */

    if (
        game.difficulty !== "hard" &&
        !player.pet
    ) {

        player.pet = true;

        showNotification(
            "PET COMPANION UNLOCKED"
        );

    }

    setTimeout(
        () => {

            completeStage();

        },
        1800
    );

}


/* =========================================================
   BOSS WARNING SKILL
========================================================= */

let skillWarningTimerId = null;

function warnBossSkill(
    name,
    duration
) {

    clearInterval(
        skillWarningTimerId
    );

    skillWarning.classList.remove(
        "hidden"
    );

    skillWarningName.textContent =
        name;

    let remaining =
        duration;

    skillWarningTimer.textContent =
        remaining.toFixed(1);

    skillWarningTimerId =
        setInterval(
            () => {

                remaining -= 0.1;

                skillWarningTimer.textContent =
                    Math.max(
                        0,
                        remaining
                    ).toFixed(1);

                if (
                    remaining <= 0
                ) {

                    clearInterval(
                        skillWarningTimerId
                    );

                    skillWarning.classList.add(
                        "hidden"
                    );

                }

            },
            100
        );

}


/* =========================================================
   STAGE LOGIC
========================================================= */

function updateStage(dt) {

    if (
        game.bossActive ||
        game.bossDefeated
    ) {

        return;

    }

    const total =
        getStageEnemyCount();

    if (
        game.enemiesSpawned >=
        total &&
        game.enemies.length === 0
    ) {

        if (
            game.stage === 5
        ) {

            spawnBoss();

        } else {

            completeStage();

        }

    }

}


/* =========================================================
   COMPLETE STAGE
========================================================= */

function completeStage() {

    if (
        game.stageCleared
    ) {

        return;

    }

    game.stageCleared = true;

    const reward =
        500 *
        game.stage;

    game.score += reward;

    stageReward.textContent =
        `+${reward} SCORE`;

    stageClearScreen.classList.remove(
        "hidden"
    );

    game.paused = true;

    updateHUD();

}


/* =========================================================
   NEXT STAGE
========================================================= */

continueStage.addEventListener(
    "click",
    () => {

        stageClearScreen.classList.add(
            "hidden"
        );

        game.paused = false;

        if (
            game.stage >=
            game.maxStages
        ) {

            endGame(true);

            return;

        }

        game.stage++;

        startStage();

        showNotification(
            `STAGE ${game.stage}`
        );

    }
);


/* =========================================================
   GAME OVER
========================================================= */

function endGame(victory) {

    game.running = false;

    game.paused = true;

    gameoverScreen.classList.remove(
        "hidden"
    );

    if (victory) {

        gameoverTitle.textContent =
            "SYSTEM VICTORY";

        gameoverMessage.textContent =
            "ALL FIVE STAGES CLEARED";

    } else {

        gameoverTitle.textContent =
            "SYSTEM FAILURE";

        gameoverMessage.textContent =
            "PLAYER DESTROYED";

    }

    finalScore.textContent =
        Math.floor(
            game.score
        );

}


/* =========================================================
   RESTART
========================================================= */

restartButton.addEventListener(
    "click",
    () => {

        gameoverScreen.classList.add(
            "hidden"
        );

        startGame(
            game.difficulty
        );

    }
);


/* =========================================================
   MAIN MENU
========================================================= */

menuButton.addEventListener(
    "click",
    () => {

        game.running = false;

        game.paused = false;

        gameoverScreen.classList.add(
            "hidden"
        );

        gameScreen.classList.add(
            "hidden"
        );

        menuScreen.classList.remove(
            "hidden"
        );

    }
);


/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        keys[event.key] = true;

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            dash();

        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        keys[event.key] = false;

    }
);


/* =========================================================
   MOUSE
========================================================= */

canvas.addEventListener(
    "mousemove",
    event => {

        const rect =
            canvas.getBoundingClientRect();

        mouse.x =
            event.clientX -
            rect.left;

        mouse.y =
            event.clientY -
            rect.top;

        mouse.active = true;

    }
);


canvas.addEventListener(
    "mouseleave",
    () => {

        mouse.active = false;

    }
);


/* =========================================================
   JOYSTICK SYSTEM
========================================================= */

function setupJoystick(
    base,
    stick,
    state
) {

    const maxDistance = 48;

    function update(
        clientX,
        clientY
    ) {

        const rect =
            base.getBoundingClientRect();

        const centerX =
            rect.left +
            rect.width / 2;

        const centerY =
            rect.top +
            rect.height / 2;

        let dx =
            clientX -
            centerX;

        let dy =
            clientY -
            centerY;

        const distance =
            Math.hypot(
                dx,
                dy
            );

        if (
            distance >
            maxDistance
        ) {

            dx =
                dx /
                distance *
                maxDistance;

            dy =
                dy /
                distance *
                maxDistance;

        }

        state.x =
            dx /
            maxDistance;

        state.y =
            dy /
            maxDistance;

        stick.style.transform =
            `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    }


    function reset() {

        state.active = false;

        state.id = null;

        state.x = 0;

        state.y = 0;

        stick.style.transform =
            "translate(-50%, -50%)";

    }


    base.addEventListener(
        "pointerdown",
        event => {

            event.preventDefault();

            state.active = true;

            state.id =
                event.pointerId;

            base.setPointerCapture(
                event.pointerId
            );

            update(
                event.clientX,
                event.clientY
            );

        }
    );


    base.addEventListener(
        "pointermove",
        event => {

            if (
                !state.active ||
                event.pointerId !==
                state.id
            ) {

                return;

            }

            event.preventDefault();

            update(
                event.clientX,
                event.clientY
            );

        }
    );


    base.addEventListener(
        "pointerup",
        event => {

            if (
                event.pointerId ===
                state.id
            ) {

                reset();

            }

        }
    );


    base.addEventListener(
        "pointercancel",
        reset
    );

}


setupJoystick(
    movementBase,
    movementStick,
    movementJoystick
);


setupJoystick(
    aimBase,
    aimStick,
    aimJoystick
);


/* =========================================================
   DASH BUTTON
========================================================= */

dashButton.addEventListener(
    "pointerdown",
    event => {

        event.preventDefault();

        dash();

    }
);


/* =========================================================
   UPDATE PET
========================================================= */

function updatePet(dt) {

    if (!player.pet)
        return;

    player.petAngle +=
        dt * 2.2;

}


/* =========================================================
   PET SHOOT
========================================================= */

let petFireTimer = 0;

function updatePetFire(dt) {

    if (!player.pet)
        return;

    petFireTimer -= dt;

    if (
        petFireTimer > 0
    )
        return;

    petFireTimer = 0.55;

    const petX =
        player.x +
        Math.cos(
            player.petAngle
        ) *
        player.petDistance;

    const petY =
        player.y +
        Math.sin(
            player.petAngle
        ) *
        player.petDistance;

    game.bullets.push({

        x: petX,

        y: petY,

        vx:
            Math.cos(
                player.angle
            ) *
            player.bulletSpeed *
            0.85,

        vy:
            Math.sin(
                player.angle
            ) *
            player.bulletSpeed *
            0.85,

        radius: 3,

        damage:
            player.bulletDamage *
            player.petDamageMultiplier,

        life: 1.4,

        type:
            player.projectileType,

        angle:
            player.angle

    });

}


/* =========================================================
   EFFECTS
========================================================= */

function createHitParticles(
    x,
    y,
    color
) {

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            randomRange(
                40,
                150
            );

        game.particles.push({

            x,

            y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life:
                randomRange(
                    0.25,
                    0.55
                ),

            maxLife: 0.55,

            size:
                randomRange(
                    1,
                    3
                ),

            color

        });

    }

}


function createElementEffect(
    x,
    y,
    color
) {

    game.effects.push({

        type: "element",

        x,

        y,

        radius: 25,

        life: 0.35,

        maxLife: 0.35,

        color

    });

}


function createExplosion(
    x,
    y,
    color,
    size
) {

    game.explosions.push({

        x,

        y,

        radius: 0,

        maxRadius: size,

        life: 0.5,

        maxLife: 0.5,

        color

    });

    for (
        let i = 0;
        i < 15;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;

        const speed =
            randomRange(
                50,
                260
            );

        game.particles.push({

            x,

            y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life:
                randomRange(
                    0.3,
                    0.8
                ),

            maxLife: 0.8,

            size:
                randomRange(
                    1,
                    4
                ),

            color

        });

    }

}


function createMuzzleFlash() {

    game.effects.push({

        type: "muzzle",

        x:
            player.x +
            Math.cos(
                player.angle
            ) *
            20,

        y:
            player.y +
            Math.sin(
                player.angle
            ) *
            20,

        life: 0.08,

        maxLife: 0.08,

        angle:
            player.angle

    });

}


function createDashEffect() {

    for (
        let i = 0;
        i < 8;
        i++
    ) {

        game.particles.push({

            x:
                player.x,

            y:
                player.y,

            vx:
                randomRange(
                    -120,
                    120
                ),

            vy:
                randomRange(
                    -120,
                    120
                ),

            life:
                randomRange(
                    0.15,
                    0.35
                ),

            maxLife: 0.35,

            size:
                randomRange(
                    2,
                    5
                ),

            color:
                "#00f6ff"

        });

    }

}


/* =========================================================
   DAMAGE TEXT
========================================================= */

function createDamageText(
    x,
    y,
    value,
    color = "#ffffff"
) {

    game.damageTexts.push({

        x,

        y,

        value,

        color,

        life: 0.7,

        maxLife: 0.7

    });

}


/* =========================================================
   UPDATE VISUAL EFFECTS
========================================================= */

function updateVisualEffects(dt) {

    for (
        let i =
            game.particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            game.particles[i];

        p.x +=
            p.vx *
            dt;

        p.y +=
            p.vy *
            dt;

        p.vx *=
            0.96;

        p.vy *=
            0.96;

        p.life -= dt;

        if (
            p.life <= 0
        ) {

            game.particles.splice(
                i,
                1
            );

        }

    }


    for (
        let i =
            game.explosions.length - 1;
        i >= 0;
        i--
    ) {

        const e =
            game.explosions[i];

        e.life -= dt;

        const progress =
            1 -
            e.life /
            e.maxLife;

        e.radius =
            e.maxRadius *
            progress;

        if (
            e.life <= 0
        ) {

            game.explosions.splice(
                i,
                1
            );

        }

    }


    for (
        let i =
            game.effects.length - 1;
        i >= 0;
        i--
    ) {

        const e =
            game.effects[i];

        e.life -= dt;

        if (
            e.type === "element"
        ) {

            e.radius +=
                100 * dt;

        }

        if (
            e.life <= 0
        ) {

            game.effects.splice(
                i,
                1
            );

        }

    }


    for (
        let i =
            game.damageTexts.length - 1;
        i >= 0;
        i--
    ) {

        const text =
            game.damageTexts[i];

        text.y -=
            25 * dt;

        text.life -= dt;

        if (
            text.life <= 0
        ) {

            game.damageTexts.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   UPDATE STARS
========================================================= */

function updateStars(dt) {

    for (
        const star
        of game.stars
    ) {

        star.y +=
            star.speed *
            dt;

        if (
            star.y > H
        ) {

            star.y = 0;

            star.x =
                Math.random() *
                W;

        }

    }

}


/* =========================================================
   UPDATE GAME
========================================================= */

function update(dt) {

    if (
        !game.running ||
        game.paused
    ) {

        return;

    }

    game.elapsed += dt;

    player.invulnerable =
        Math.max(
            0,
            player.invulnerable -
            dt
        );

    player.dashCooldown =
        Math.max(
            0,
            player.dashCooldown -
            dt
        );

    player.dashTimer =
        Math.max(
            0,
            player.dashTimer -
            dt
        );

    game.screenShake =
        Math.max(
            0,
            game.screenShake -
            dt * 30
        );

    game.flash =
        Math.max(
            0,
            game.flash -
            dt
        );

    if (
        game.comboTimer > 0
    ) {

        game.comboTimer -= dt;

    } else {

        game.combo =
            Math.max(
                1,
                game.combo -
                dt * 0.5
            );

    }


    updatePlayerAim();

    updatePlayerMovement(dt);

    updateAutoFire(dt);

    updateBullets(dt);

    updateEnemyBullets(dt);

    updatePickups(dt);

    updatePet(dt);

    updatePetFire(dt);

    updateVisualEffects(dt);

    updateStars(dt);


    /* ---------------------------------------------
       ENEMIES
    --------------------------------------------- */

    game.enemies.forEach(
        enemy =>
            updateEnemy(
                enemy,
                dt
            )
    );


    game.enemies =
        game.enemies.filter(
            enemy =>
                !enemy.dead
        );


    /* ---------------------------------------------
       SPAWN
    --------------------------------------------- */

    game.spawnTimer -= dt;

    if (
        game.spawnTimer <= 0 &&
        game.enemiesSpawned <
            getStageEnemyCount()
    ) {

        spawnEnemy();

        const active =
            game.enemies.length;

        const maxActive =
            Math.min(
                12 +
                game.stage * 2,
                22
            );

        game.spawnTimer =
            active >= maxActive
                ? 0.45
                : game.enemySpawnDelay;

    }


    /* ---------------------------------------------
       BOSS
    --------------------------------------------- */

    if (
        game.bossActive
    ) {

        updateBoss(dt);

    }


    updateStage(dt);

    updateHUD();

}


/* =========================================================
   UPDATE HUD
========================================================= */

function updateHUD() {

    scoreEl.textContent =
        Math.floor(
            game.score
        );

    comboEl.textContent =
        `x${game.combo.toFixed(1)}`;

    levelEl.textContent =
        game.level;

    hpBar.style.width =
        `${Math.max(
            0,
            player.hp /
            player.maxHp *
            100
        )}%`;

    hpText.textContent =
        `${Math.max(
            0,
            Math.ceil(player.hp)
        )} / ${Math.ceil(
            player.maxHp
        )}`;

    xpBar.style.width =
        `${Math.min(
            100,
            game.xp /
            game.xpRequired *
            100
        )}%`;

    xpText.textContent =
        `${Math.floor(
            game.xp
        )} / ${game.xpRequired}`;

}


/* =========================================================
   DRAW BACKGROUND
========================================================= */

function drawBackground() {

    ctx.fillStyle =
        "#01040a";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    /* ---------------------------------------------
       GRID
    --------------------------------------------- */

    const gridSize = 45;

    ctx.save();

    ctx.strokeStyle =
        "rgba(0,246,255,0.055)";

    ctx.lineWidth = 1;

    const offset =
        (
            game.elapsed *
            12
        ) %
        gridSize;

    for (
        let x =
            -gridSize +
            offset;
        x < W + gridSize;
        x += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            H
        );

        ctx.stroke();

    }

    for (
        let y =
            -gridSize +
            offset;
        y < H + gridSize;
        y += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            W,
            y
        );

        ctx.stroke();

    }

    ctx.restore();


    /* ---------------------------------------------
       STARS
    --------------------------------------------- */

    for (
        const star
        of game.stars
    ) {

        ctx.globalAlpha =
            star.alpha;

        ctx.fillStyle =
            "#7defff";

        ctx.fillRect(
            star.x,
            star.y,
            star.size,
            star.size
        );

    }

    ctx.globalAlpha = 1;


    /* ---------------------------------------------
       CENTRAL GLOW
    --------------------------------------------- */

    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            0,
            W / 2,
            H / 2,
            Math.max(W, H) * 0.6
        );

    gradient.addColorStop(
        0,
        "rgba(0,246,255,0.025)"
    );

    gradient.addColorStop(
        1,
        "rgba(0,0,0,0)"
    );

    ctx.fillStyle =
        gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

}


/* =========================================================
   DRAW PLAYER
========================================================= */

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.rotate(
        player.angle
    );


    /* ---------------------------------------------
       INVULNERABILITY
    --------------------------------------------- */

    if (
        player.invulnerable > 0 &&
        Math.floor(
            player.invulnerable *
            20
        ) % 2 === 0
    ) {

        ctx.globalAlpha =
            0.35;

    }


    /* ---------------------------------------------
       GLOW
    --------------------------------------------- */

    ctx.shadowBlur = 25;

    ctx.shadowColor =
        "#00f6ff";


    /* ---------------------------------------------
       BODY
    --------------------------------------------- */

    ctx.fillStyle =
        "#06141c";

    ctx.strokeStyle =
        "#00f6ff";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        22,
        0
    );

    ctx.lineTo(
        -13,
        -12
    );

    ctx.lineTo(
        -8,
        0
    );

    ctx.lineTo(
        -13,
        12
    );

    ctx.closePath();

    ctx.fill();

    ctx.stroke();


    /* ---------------------------------------------
       CORE
    --------------------------------------------- */

    ctx.shadowBlur = 12;

    ctx.fillStyle =
        "#dffcff";

    ctx.beginPath();

    ctx.arc(
        2,
        0,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* ---------------------------------------------
       GUN
    --------------------------------------------- */

    ctx.shadowColor =
        "#ff00c8";

    ctx.strokeStyle =
        "#ff00c8";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.moveTo(
        5,
        0
    );

    ctx.lineTo(
        28,
        0
    );

    ctx.stroke();


    ctx.restore();

    /* ---------------------------------------------
       PET
    --------------------------------------------- */

    if (player.pet) {

        const px =
            player.x +
            Math.cos(
                player.petAngle
            ) *
            player.petDistance;

        const py =
            player.y +
            Math.sin(
                player.petAngle
            ) *
            player.petDistance;

        ctx.save();

        ctx.translate(
            px,
            py
        );

        ctx.shadowBlur = 15;

        ctx.shadowColor =
            "#ff00c8";

        ctx.fillStyle =
            "#ff00c8";

        ctx.strokeStyle =
            "#ffffff";

        ctx.lineWidth = 1;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            10,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.stroke();

        ctx.fillStyle =
            "#01040a";

        ctx.beginPath();

        ctx.arc(
            -3,
            -2,
            1.5,
            0,
            Math.PI * 2
        );

        ctx.arc(
            3,
            -2,
            1.5,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();

    }

}


/* =========================================================
   DRAW ENEMY
========================================================= */

function drawEnemy(enemy) {

    ctx.save();

    ctx.translate(
        enemy.x,
        enemy.y
    );

    const pulse =
        1 +
        Math.sin(
            enemy.wobble * 2
        ) *
        0.04;

    ctx.scale(
        pulse,
        pulse
    );

    ctx.shadowBlur = 18;

    ctx.shadowColor =
        enemy.color;

    ctx.fillStyle =
        "#071019";

    ctx.strokeStyle =
        enemy.color;

    ctx.lineWidth =
        enemy.type === "elite"
            ? 3
            : 2;


    if (
        enemy.type === "rusher"
    ) {

        ctx.rotate(
            Math.atan2(
                player.y -
                    enemy.y,
                player.x -
                    enemy.x
            )
        );

        ctx.beginPath();

        ctx.moveTo(
            20,
            0
        );

        ctx.lineTo(
            -12,
            -13
        );

        ctx.lineTo(
            -8,
            0
        );

        ctx.lineTo(
            -12,
            13
        );

        ctx.closePath();

        ctx.fill();

        ctx.stroke();

    }


    else if (
        enemy.type === "shooter"
    ) {

        ctx.beginPath();

        ctx.rect(
            -12,
            -12,
            24,
            24
        );

        ctx.fill();

        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            6,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }


    else if (
        enemy.type === "elite"
    ) {

        ctx.rotate(
            Math.PI / 4
        );

        ctx.beginPath();

        ctx.rect(
            -17,
            -17,
            34,
            34
        );

        ctx.fill();

        ctx.stroke();

        ctx.rotate(
            -Math.PI / 4
        );

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            8,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }


    else {

        ctx.beginPath();

        ctx.moveTo(
            0,
            -17
        );

        ctx.lineTo(
            15,
            0
        );

        ctx.lineTo(
            0,
            17
        );

        ctx.lineTo(
            -15,
            0
        );

        ctx.closePath();

        ctx.fill();

        ctx.stroke();

    }


    if (
        enemy.hitFlash > 0
    ) {

        ctx.fillStyle =
            "#ffffff";

        ctx.globalAlpha =
            0.8;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

    ctx.restore();


    /* ---------------------------------------------
       HP BAR
    --------------------------------------------- */

    const barWidth =
        enemy.radius * 2.3;

    const hpPercent =
        Math.max(
            0,
            enemy.hp /
            enemy.maxHp
        );

    ctx.fillStyle =
        "rgba(0,0,0,0.6)";

    ctx.fillRect(
        enemy.x -
            barWidth / 2,
        enemy.y -
            enemy.radius -
            10,
        barWidth,
        3
    );

    ctx.fillStyle =
        enemy.color;

    ctx.fillRect(
        enemy.x -
            barWidth / 2,
        enemy.y -
            enemy.radius -
            10,
        barWidth *
            hpPercent,
        3
    );

}


/* =========================================================
   DRAW BOSS
========================================================= */

function drawBoss() {

    const boss =
        game.boss;

    if (
        !boss ||
        boss.dead
    ) {

        return;

    }

    ctx.save();

    ctx.translate(
        boss.x,
        boss.y
    );

    const pulse =
        1 +
        Math.sin(
            game.elapsed * 4
        ) *
        0.04;

    ctx.scale(
        pulse,
        pulse
    );

    ctx.shadowBlur = 35;

    ctx.shadowColor =
        "#ff00c8";

    ctx.fillStyle =
        "#160617";

    ctx.strokeStyle =
        "#ff00c8";

    ctx.lineWidth = 4;


    /* ---------------------------------------------
       DEMON STICKER SHAPE
    --------------------------------------------- */

    ctx.beginPath();

    ctx.moveTo(
        -45,
        -30
    );

    ctx.lineTo(
        -28,
        -55
    );

    ctx.lineTo(
        -12,
        -39
    );

    ctx.lineTo(
        0,
        -48
    );

    ctx.lineTo(
        12,
        -39
    );

    ctx.lineTo(
        28,
        -55
    );

    ctx.lineTo(
        45,
        -30
    );

    ctx.lineTo(
        52,
        8
    );

    ctx.lineTo(
        35,
        35
    );

    ctx.lineTo(
        0,
        50
    );

    ctx.lineTo(
        -35,
        35
    );

    ctx.lineTo(
        -52,
        8
    );

    ctx.closePath();

    ctx.fill();

    ctx.stroke();


    /* ---------------------------------------------
       EYES
    --------------------------------------------- */

    ctx.shadowBlur = 15;

    ctx.fillStyle =
        "#ff315d";

    ctx.beginPath();

    ctx.ellipse(
        -18,
        -3,
        9,
        5,
        -0.2,
        0,
        Math.PI * 2
    );

    ctx.ellipse(
        18,
        -3,
        9,
        5,
        0.2,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* ---------------------------------------------
       MOUTH
    --------------------------------------------- */

    ctx.strokeStyle =
        "#ff315d";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.arc(
        0,
        8,
        17,
        0.15,
        Math.PI - 0.15
    );

    ctx.stroke();


    /* ---------------------------------------------
       PHASE AURA
    --------------------------------------------- */

    if (
        boss.phase >= 2
    ) {

        ctx.globalAlpha =
            0.2;

        ctx.strokeStyle =
            "#ff00c8";

        ctx.lineWidth = 5;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            68,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }

    ctx.restore();

}


/* =========================================================
   DRAW BULLETS
========================================================= */

function drawBullets() {

    for (
        const bullet
        of game.bullets
    ) {

        ctx.save();

        ctx.translate(
            bullet.x,
            bullet.y
        );

        ctx.rotate(
            bullet.angle
        );

        let color =
            "#00f6ff";

        if (
            bullet.type === "fire"
        )
            color = "#ff642e";

        if (
            bullet.type === "ice"
        )
            color = "#75eaff";

        if (
            bullet.type === "thunder"
        )
            color = "#eaff00";

        ctx.shadowBlur = 12;

        ctx.shadowColor =
            color;

        ctx.fillStyle =
            color;

        ctx.fillRect(
            -7,
            -2,
            14,
            4
        );

        ctx.restore();

    }

}


/* =========================================================
   DRAW ENEMY BULLETS
========================================================= */

function drawEnemyBullets() {

    for (
        const bullet
        of game.enemyBullets
    ) {

        ctx.save();

        ctx.shadowBlur = 12;

        ctx.shadowColor =
            bullet.color;

        ctx.fillStyle =
            bullet.color;

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();

    }

}


/* =========================================================
   DRAW PICKUPS
========================================================= */

function drawPickups() {

    const icons = {

        bomb: "B",

        missile: "M",

        clear: "X",

        moveSpeed: "S",

        fireSpeed: "F",

        multiShot: "2",

        ultraGun: "U",

        elemental: "E"

    };

    const colors = {

        bomb: "#ffb000",

        missile: "#ff642e",

        clear: "#ffffff",

        moveSpeed: "#00ff9d",

        fireSpeed: "#00f6ff",

        multiShot: "#b15cff",

        ultraGun: "#ff00c8",

        elemental: "#75eaff"

    };


    for (
        const pickup
        of game.pickups
    ) {

        const scale =
            1 +
            Math.sin(
                pickup.pulse
            ) *
            0.08;

        ctx.save();

        ctx.translate(
            pickup.x,
            pickup.y
        );

        ctx.scale(
            scale,
            scale
        );

        ctx.shadowBlur = 20;

        ctx.shadowColor =
            colors[pickup.type];

        ctx.fillStyle =
            "rgba(2,10,18,0.9)";

        ctx.strokeStyle =
            colors[pickup.type];

        ctx.lineWidth = 2;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            12,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.stroke();

        ctx.fillStyle =
            colors[pickup.type];

        ctx.font =
            "bold 9px monospace";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            icons[pickup.type],
            0,
            0
        );

        ctx.restore();

    }

}


/* =========================================================
   DRAW PARTICLES
========================================================= */

function drawParticles() {

    for (
        const p
        of game.particles
    ) {

        ctx.globalAlpha =
            Math.max(
                0,
                p.life /
                p.maxLife
            );

        ctx.fillStyle =
            p.color;

        ctx.shadowBlur = 8;

        ctx.shadowColor =
            p.color;

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }

    ctx.globalAlpha = 1;

}


/* =========================================================
   DRAW EXPLOSIONS
========================================================= */

function drawExplosions() {

    for (
        const e
        of game.explosions
    ) {

        const alpha =
            e.life /
            e.maxLife;

        ctx.globalAlpha =
            alpha;

        ctx.strokeStyle =
            e.color;

        ctx.shadowBlur = 25;

        ctx.shadowColor =
            e.color;

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            e.x,
            e.y,
            e.radius,
            0,
            Math.PI * 2
        );

        ctx.stroke();

    }

    ctx.globalAlpha = 1;

}


/* =========================================================
   DRAW EFFECTS
========================================================= */

function drawEffects() {

    for (
        const e
        of game.effects
    ) {

        const alpha =
            e.life /
            e.maxLife;

        ctx.globalAlpha =
            alpha;


        if (
            e.type === "element"
        ) {

            ctx.strokeStyle =
                e.color;

            ctx.lineWidth = 3;

            ctx.shadowBlur = 15;

            ctx.shadowColor =
                e.color;

            ctx.beginPath();

            ctx.arc(
                e.x,
                e.y,
                e.radius,
                0,
                Math.PI * 2
            );

            ctx.stroke();

        }


        else if (
            e.type === "muzzle"
        ) {

            ctx.save();

            ctx.translate(
                e.x,
                e.y
            );

            ctx.rotate(
                e.angle
            );

            ctx.fillStyle =
                "#ffffff";

            ctx.shadowBlur = 20;

            ctx.shadowColor =
                "#00f6ff";

            ctx.beginPath();

            ctx.moveTo(
                0,
                0
            );

            ctx.lineTo(
                22,
                -6
            );

            ctx.lineTo(
                22,
                6
            );

            ctx.closePath();

            ctx.fill();

            ctx.restore();

        }


        else if (
            e.type === "laser"
        ) {

            ctx.save();

            ctx.translate(
                e.x,
                e.y
            );

            ctx.rotate(
                e.angle
            );

            const progress =
                1 -
                e.life /
                e.maxLife;

            ctx.fillStyle =
                `rgba(255,49,93,${
                    0.25 +
                    progress * 0.5
                })`;

            ctx.shadowBlur = 30;

            ctx.shadowColor =
                "#ff315d";

            ctx.fillRect(
                0,
                -e.width / 2,
                e.length,
                e.width
            );

            ctx.fillStyle =
                "#ffffff";

            ctx.fillRect(
                0,
                -2,
                e.length,
                4
            );

            ctx.restore();


            const dx =
                Math.cos(
                    e.angle
                );

            const dy =
                Math.sin(
                    e.angle
                );

            const px =
                player.x -
                e.x;

            const py =
                player.y -
                e.y;

            const projection =
                px * dx +
                py * dy;

            if (
                projection > 0
            ) {

                const closestX =
                    e.x +
                    dx *
                    projection;

                const closestY =
                    e.y +
                    dy *
                    projection;

                const dist =
                    Math.hypot(
                        player.x -
                            closestX,
                        player.y -
                            closestY
                    );

                if (
                    dist <
                    player.radius +
                    e.width / 2
                ) {

                    damagePlayer(
                        e.damage *
                        0.016
                    );

                }

            }

        }

    }

    ctx.globalAlpha = 1;

}


/* =========================================================
   DRAW DAMAGE TEXT
========================================================= */

function drawDamageTexts() {

    for (
        const text
        of game.damageTexts
    ) {

        ctx.globalAlpha =
            text.life /
            text.maxLife;

        ctx.fillStyle =
            text.color;

        ctx.font =
            "bold 12px monospace";

        ctx.textAlign =
            "center";

        ctx.shadowBlur = 8;

        ctx.shadowColor =
            text.color;

        ctx.fillText(
            text.value,
            text.x,
            text.y
        );

    }

    ctx.globalAlpha = 1;

}


/* =========================================================
   DRAW AIM LINE
========================================================= */

function drawAimLine() {

    if (
        !game.running
    )
        return;

    const length = 85;

    const endX =
        player.x +
        Math.cos(
            player.angle
        ) *
        length;

    const endY =
        player.y +
        Math.sin(
            player.angle
        ) *
        length;

    ctx.save();

    ctx.strokeStyle =
        "rgba(0,246,255,0.18)";

    ctx.lineWidth = 1;

    ctx.setLineDash([
        5,
        7
    ]);

    ctx.beginPath();

    ctx.moveTo(
        player.x,
        player.y
    );

    ctx.lineTo(
        endX,
        endY
    );

    ctx.stroke();

    ctx.restore();

}


/* =========================================================
   DRAW
========================================================= */

function draw() {

    ctx.save();

    if (
        game.screenShake > 0
    ) {

        ctx.translate(
            randomRange(
                -game.screenShake,
                game.screenShake
            ),
            randomRange(
                -game.screenShake,
                game.screenShake
            )
        );

    }

    drawBackground();

    drawAimLine();

    drawPickups();

    drawBullets();

    drawEnemyBullets();

    game.enemies.forEach(
        drawEnemy
    );

    drawBoss();

    drawPlayer();

    drawEffects();

    drawExplosions();

    drawParticles();

    drawDamageTexts();

    ctx.restore();


    /* ---------------------------------------------
       DAMAGE FLASH
    --------------------------------------------- */

    if (
        game.flash > 0
    ) {

        ctx.fillStyle =
            `rgba(255,0,40,${
                game.flash * 2
            })`;

        ctx.fillRect(
            0,
            0,
            W,
            H
        );

    }

}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(timestamp) {

    if (
        !game.running
    ) {

        draw();

        return;

    }

    const dt =
        Math.min(
            0.033,
            (
                timestamp -
                game.lastTime
            ) / 1000
        );

    game.lastTime =
        timestamp;

    update(dt);

    draw();

    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   INITIAL MENU STATE
========================================================= */

function initializeMenu() {

    mobileControls.style.display =
        "none";

    stageClearScreen.classList.add(
        "hidden"
    );

    gameoverScreen.classList.add(
        "hidden"
    );

    levelupScreen.classList.add(
        "hidden"
    );

}

initializeMenu();


/* =========================================================
   PREVENT MOBILE SCROLL
========================================================= */

document.addEventListener(
    "touchmove",
    event => {

        if (
            gameScreen &&
            !gameScreen.classList.contains(
                "hidden"
            )
        ) {

            event.preventDefault();

        }

    },
    {
        passive: false
    }
);


/* =========================================================
   VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden &&
            game.running
        ) {

            game.paused = true;

        }

    }
);


/* =========================================================
   INITIAL RENDER
========================================================= */

draw();