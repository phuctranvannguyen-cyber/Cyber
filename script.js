/* =========================================================
   CYBER // FALL
   SCRIPT.JS
   COMPLETE GAME ENGINE
   PC + MOBILE
========================================================= */

"use strict";


/* =========================================================
   CANVAS
========================================================= */

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


/* =========================================================
   DOM
========================================================= */

const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");

const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const comboEl = document.getElementById("combo");

const levelEl = document.getElementById("level");

const hpBar = document.getElementById("hp-bar");
const xpBar = document.getElementById("xp-bar");

const hpText = document.getElementById("hp-text");
const xpText = document.getElementById("xp-text");

const stageDisplay = document.getElementById("stage-display");

const bossContainer = document.getElementById("boss-container");
const bossHpBar = document.getElementById("boss-hp-bar");
const bossPhase = document.getElementById("boss-phase");

const skillsContainer =
    document.getElementById("skills-container");

const notification =
    document.getElementById("notification");

const levelupScreen =
    document.getElementById("levelup-screen");

const upgradeContainer =
    document.getElementById("upgrade-container");

const stageClearScreen =
    document.getElementById("stage-clear-screen");

const stageClearReward =
    document.getElementById("stage-reward");

const continueStage =
    document.getElementById("continue-stage");

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

const joystickArea =
    document.getElementById("joystick-area");

const joystickBase =
    document.getElementById("joystick-base");

const joystickStick =
    document.getElementById("joystick-stick");

const dashButton =
    document.getElementById("dash-button");


/* =========================================================
   GAME STATE
========================================================= */

const GAME = {
    running: false,
    paused: false,

    difficulty: "normal",

    stage: 1,
    maxStages: 5,

    score: 0,
    combo: 1,
    comboTimer: 0,

    kills: 0,

    stageActive: false,
    stageTransition: false,

    enemiesToSpawn: 0,
    enemiesSpawned: 0,
    enemiesKilled: 0,

    spawnTimer: 0,

    bossActive: false,
    bossDefeated: false,

    petUnlocked: false,

    lastTime: 0,

    shake: 0
};


/* =========================================================
   DIFFICULTY
========================================================= */

const DIFFICULTIES = {

    easy: {
        name: "EASY",

        enemyHp: 55,
        enemySpeed: 52,
        enemyDamage: 8,

        spawnCount: 10,

        bossMultiplier: 3,

        dropBase: 0.20,

        playerHp: 150,

        fireRate: 280
    },

    normal: {
        name: "NORMAL",

        enemyHp: 75,
        enemySpeed: 65,
        enemyDamage: 11,

        spawnCount: 13,

        bossMultiplier: 4,

        dropBase: 0.23,

        playerHp: 120,

        fireRate: 320
    },

    hard: {
        name: "HARD",

        enemyHp: 105,
        enemySpeed: 78,
        enemyDamage: 15,

        spawnCount: 16,

        bossMultiplier: 5,

        dropBase: 0.27,

        playerHp: 100,

        fireRate: 360
    }

};


/* =========================================================
   STAGE CONFIG
========================================================= */

function getStageConfig() {

    const d = DIFFICULTIES[GAME.difficulty];

    return {

        enemyHp:
            d.enemyHp *
            (1 + (GAME.stage - 1) * 0.13),

        enemySpeed:
            d.enemySpeed *
            (1 + (GAME.stage - 1) * 0.10),

        enemyDamage:
            d.enemyDamage *
            (1 + (GAME.stage - 1) * 0.08),

        spawnCount:
            d.spawnCount +
            (GAME.stage - 1) * 2,

        dropChance:
            d.dropBase +
            (GAME.stage - 1) * 0.055

    };
}


/* =========================================================
   PLAYER
========================================================= */

const player = {

    x: 0,
    y: 0,

    radius: 17,

    hp: 120,
    maxHp: 120,

    speed: 235,

    level: 1,

    xp: 0,
    xpNext: 100,

    damage: 25,

    fireRate: 300,
    fireTimer: 0,

    projectileSpeed: 650,

    projectileCount: 1,

    spread: 0.18,

    critChance: 0.08,
    critMultiplier: 1.8,

    dashPower: 620,
    dashCooldown: 1200,
    dashTimer: 0,

    invincibleTimer: 0,

    elemental: null,

    ultraGun: false,

    doubleShot: false,
    tripleShot: false,

    moveBoost: 1,

    pet: false,

    petDamage: 22,
    petFireTimer: 0,

    angle: 0
};


/* =========================================================
   INPUT
========================================================= */

const keys = {};

window.addEventListener("keydown", e => {

    keys[e.key.toLowerCase()] = true;

    if (
        e.key === " " ||
        e.code === "Space"
    ) {
        e.preventDefault();
        dash();
    }

});


window.addEventListener("keyup", e => {
    keys[e.key.toLowerCase()] = false;
});


let mouse = {
    x: W / 2,
    y: H / 2
};


canvas.addEventListener("mousemove", e => {

    mouse.x = e.clientX;
    mouse.y = e.clientY;

});


/* =========================================================
   MOBILE JOYSTICK
========================================================= */

const joystick = {
    active: false,
    id: null,

    x: 0,
    y: 0,

    strength: 0
};


function updateJoystick(clientX, clientY) {

    const rect =
        joystickBase.getBoundingClientRect();

    const centerX =
        rect.left + rect.width / 2;

    const centerY =
        rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const max =
        rect.width * 0.30;

    const distance =
        Math.hypot(dx, dy);

    if (distance > max) {

        dx =
            dx / distance * max;

        dy =
            dy / distance * max;

    }

    joystick.x =
        dx / max;

    joystick.y =
        dy / max;

    joystick.strength =
        Math.min(distance / max, 1);

    joystickStick.style.transform =
        `translate(
            calc(-50% + ${dx}px),
            calc(-50% + ${dy}px)
        )`;
}


function resetJoystick() {

    joystick.active = false;

    joystick.x = 0;
    joystick.y = 0;
    joystick.strength = 0;

    joystickStick.style.transform =
        "translate(-50%, -50%)";
}


joystickArea.addEventListener(
    "pointerdown",
    e => {

        joystick.active = true;
        joystick.id = e.pointerId;

        joystickArea.setPointerCapture(
            e.pointerId
        );

        updateJoystick(
            e.clientX,
            e.clientY
        );

    }
);


joystickArea.addEventListener(
    "pointermove",
    e => {

        if (
            !joystick.active ||
            e.pointerId !== joystick.id
        ) return;

        updateJoystick(
            e.clientX,
            e.clientY
        );

    }
);


joystickArea.addEventListener(
    "pointerup",
    resetJoystick
);


joystickArea.addEventListener(
    "pointercancel",
    resetJoystick
);


/* =========================================================
   DIFFICULTY SELECT
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

    GAME.difficulty = difficulty;

    GAME.running = true;
    GAME.paused = false;

    GAME.stage = 1;

    GAME.score = 0;
    GAME.combo = 1;

    GAME.kills = 0;

    GAME.bossActive = false;
    GAME.bossDefeated = false;

    GAME.petUnlocked = false;

    resetPlayer();

    menuScreen.classList.add("hidden");

    gameScreen.classList.remove("hidden");

    hideAllOverlays();

    startStage();

}


/* =========================================================
   RESET PLAYER
========================================================= */

function resetPlayer() {

    const config =
        DIFFICULTIES[GAME.difficulty];

    player.x = W / 2;
    player.y = H / 2;

    player.hp =
        config.playerHp;

    player.maxHp =
        config.playerHp;

    player.speed = 235;

    player.level = 1;

    player.xp = 0;
    player.xpNext = 100;

    player.damage = 25;

    player.fireRate =
        config.fireRate;

    player.fireTimer = 0;

    player.projectileSpeed = 650;

    player.projectileCount = 1;

    player.spread = 0.18;

    player.critChance = 0.08;

    player.critMultiplier = 1.8;

    player.dashTimer = 0;

    player.invincibleTimer = 0;

    player.elemental = null;

    player.ultraGun = false;

    player.doubleShot = false;
    player.tripleShot = false;

    player.moveBoost = 1;

    player.pet = false;

    player.angle = 0;

}


/* =========================================================
   START STAGE
========================================================= */

function startStage() {

    GAME.stageActive = true;
    GAME.stageTransition = false;

    GAME.enemiesSpawned = 0;
    GAME.enemiesKilled = 0;

    GAME.spawnTimer = 0;

    GAME.bossActive = false;
    GAME.bossDefeated = false;

    enemies.length = 0;
    bullets.length = 0;
    enemyBullets.length = 0;
    drops.length = 0;
    particles.length = 0;

    const config =
        getStageConfig();

    GAME.enemiesToSpawn =
        config.spawnCount;

    stageDisplay.textContent =
        `${DIFFICULTIES[GAME.difficulty].name} · STAGE ${GAME.stage}`;

    bossContainer.classList.add("hidden");

    showNotification(
        `STAGE ${GAME.stage} // DEPLOY`,
        1000
    );

    updateHUD();

}


/* =========================================================
   ENTITY ARRAYS
========================================================= */

const enemies = [];
const bullets = [];
const enemyBullets = [];
const particles = [];
const drops = [];


/* =========================================================
   ENEMY
========================================================= */

function createEnemy() {

    const config =
        getStageConfig();

    let side =
        Math.floor(Math.random() * 4);

    let x;
    let y;

    if (side === 0) {
        x = -40;
        y = Math.random() * H;
    }

    if (side === 1) {
        x = W + 40;
        y = Math.random() * H;
    }

    if (side === 2) {
        x = Math.random() * W;
        y = -40;
    }

    if (side === 3) {
        x = Math.random() * W;
        y = H + 40;
    }

    const hp =
        config.enemyHp;

    enemies.push({

        x,
        y,

        radius:
            15 + Math.random() * 5,

        hp,
        maxHp: hp,

        speed:
            config.enemySpeed *
            (0.85 + Math.random() * 0.25),

        damage:
            config.enemyDamage,

        attackTimer:
            Math.random() * 800,

        attackCooldown:
            850 + Math.random() * 500,

        color:
            Math.random() > 0.5
                ? "#ff315d"
                : "#9c2bff",

        hitFlash: 0,

        type:
            Math.random() > 0.82
                ? "rusher"
                : "normal"

    });

    GAME.enemiesSpawned++;

}


/* =========================================================
   BOSS
========================================================= */

let boss = null;


function spawnBoss() {

    const config =
        getStageConfig();

    const difficulty =
        DIFFICULTIES[GAME.difficulty];

    const normalHp =
        config.enemyHp;

    const bossHp =
        normalHp *
        difficulty.bossMultiplier;

    boss = {

        x: W / 2,
        y: -120,

        radius: 55,

        hp: bossHp,
        maxHp: bossHp,

        speed:
            config.enemySpeed * 0.62,

        damage:
            config.enemyDamage * 1.8,

        attackTimer: 0,

        attackCooldown: 900,

        phase: 1,

        hitFlash: 0,

        rotation: 0

    };

    GAME.bossActive = true;

    bossContainer.classList.remove(
        "hidden"
    );

    showNotification(
        "☠ DEMON-X HAS AWAKENED ☠",
        1800
    );

}


/* =========================================================
   BULLET
========================================================= */

function shoot() {

    if (!GAME.running) return;

    if (player.fireTimer > 0) return;

    player.fireTimer =
        player.fireRate;

    const target =
        getAimTarget();

    if (!target) return;

    const baseAngle =
        Math.atan2(
            target.y - player.y,
            target.x - player.x
        );

    player.angle =
        baseAngle;

    let count =
        player.projectileCount;

    if (player.doubleShot)
        count = Math.max(count, 2);

    if (player.tripleShot)
        count = Math.max(count, 3);

    for (let i = 0; i < count; i++) {

        let angle =
            baseAngle;

        if (count > 1) {

            const totalSpread =
                player.spread *
                (count - 1);

            angle +=
                -totalSpread / 2 +
                player.spread * i;

        }

        const crit =
            Math.random() <
            player.critChance;

        let damage =
            player.damage;

        if (crit) {
            damage *=
                player.critMultiplier;
        }

        if (player.ultraGun) {
            damage *= 1.35;
        }

        bullets.push({

            x:
                player.x +
                Math.cos(angle) * 20,

            y:
                player.y +
                Math.sin(angle) * 20,

            vx:
                Math.cos(angle) *
                player.projectileSpeed,

            vy:
                Math.sin(angle) *
                player.projectileSpeed,

            radius:
                player.ultraGun
                    ? 6
                    : 4,

            damage,

            crit,

            elemental:
                player.elemental,

            life: 1200

        });

    }

}


/* =========================================================
   AUTO AIM
========================================================= */

function getAimTarget() {

    let target = null;

    let closest =
        Infinity;


    if (boss && GAME.bossActive) {

        const distance =
            Math.hypot(
                boss.x - player.x,
                boss.y - player.y
            );

        closest = distance;

        target = boss;
    }


    for (const enemy of enemies) {

        const distance =
            Math.hypot(
                enemy.x - player.x,
                enemy.y - player.y
            );

        if (distance < closest) {

            closest = distance;

            target = enemy;

        }

    }


    return target;
}


/* =========================================================
   PET
========================================================= */

function updatePet(dt) {

    if (!player.pet) return;

    player.petFireTimer -= dt;

    if (player.petFireTimer > 0)
        return;

    const target =
        getAimTarget();

    if (!target)
        return;

    player.petFireTimer = 700;

    const angle =
        Math.atan2(
            target.y - player.y,
            target.x - player.x
        );

    bullets.push({

        x:
            player.x +
            Math.cos(angle) * 30,

        y:
            player.y +
            Math.sin(angle) * 30,

        vx:
            Math.cos(angle) * 540,

        vy:
            Math.sin(angle) * 540,

        radius: 5,

        damage:
            player.petDamage,

        crit: false,

        elemental: null,

        life: 1000,

        petBullet: true

    });

}


/* =========================================================
   UPDATE PLAYER
========================================================= */

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;


    if (
        keys["w"] ||
        keys["arrowup"]
    ) dy -= 1;

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) dy += 1;

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) dx -= 1;

    if (
        keys["d"] ||
        keys["arrowright"]
    ) dx += 1;


    if (
        joystick.active &&
        joystick.strength > 0.05
    ) {

        dx = joystick.x;
        dy = joystick.y;

    }


    const length =
        Math.hypot(dx, dy);

    if (length > 0) {

        dx /= length;
        dy /= length;

        const speed =
            player.speed *
            player.moveBoost;

        player.x +=
            dx * speed * dt / 1000;

        player.y +=
            dy * speed * dt / 1000;

    }


    const margin = 20;

    player.x =
        Math.max(
            margin,
            Math.min(W - margin, player.x)
        );

    player.y =
        Math.max(
            margin,
            Math.min(H - margin, player.y)
        );


    if (player.fireTimer > 0)
        player.fireTimer -= dt;

    if (player.dashTimer > 0)
        player.dashTimer -= dt;

    if (player.invincibleTimer > 0)
        player.invincibleTimer -= dt;


    if (
        player.invincibleTimer <= 0
    ) {

        const target =
            getAimTarget();

        if (target) {

            player.angle =
                Math.atan2(
                    target.y - player.y,
                    target.x - player.x
                );

        }

    }


    shoot();

    updatePet(dt);

}


/* =========================================================
   DASH
========================================================= */

function dash() {

    if (!GAME.running)
        return;

    if (player.dashTimer > 0)
        return;

    let dx = 0;
    let dy = 0;


    if (
        keys["w"] ||
        keys["arrowup"]
    ) dy -= 1;

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) dy += 1;

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) dx -= 1;

    if (
        keys["d"] ||
        keys["arrowright"]
    ) dx += 1;


    if (
        joystick.active &&
        joystick.strength > 0.1
    ) {

        dx = joystick.x;
        dy = joystick.y;

    }


    if (
        dx === 0 &&
        dy === 0
    ) {

        dx =
            Math.cos(player.angle);

        dy =
            Math.sin(player.angle);

    }


    const length =
        Math.hypot(dx, dy) || 1;

    dx /= length;
    dy /= length;


    player.x +=
        dx * player.dashPower * 0.35;

    player.y +=
        dy * player.dashPower * 0.35;


    player.x =
        Math.max(
            20,
            Math.min(W - 20, player.x)
        );

    player.y =
        Math.max(
            20,
            Math.min(H - 20, player.y)
        );


    player.invincibleTimer =
        350;

    player.dashTimer =
        player.dashCooldown;


    createExplosion(
        player.x,
        player.y,
        "#00f6ff",
        12
    );

    GAME.shake = 8;

}


/* =========================================================
   DASH BUTTON
========================================================= */

dashButton.addEventListener(
    "pointerdown",
    e => {

        e.preventDefault();

        dash();

    }
);


/* =========================================================
   UPDATE ENEMIES
========================================================= */

function updateEnemies(dt) {

    for (let i = enemies.length - 1; i >= 0; i--) {

        const enemy =
            enemies[i];

        const dx =
            player.x - enemy.x;

        const dy =
            player.y - enemy.y;

        const distance =
            Math.hypot(dx, dy) || 1;

        enemy.x +=
            dx / distance *
            enemy.speed *
            dt / 1000;

        enemy.y +=
            dy / distance *
            enemy.speed *
            dt / 1000;


        enemy.attackTimer -= dt;

        if (
            distance <
                player.radius +
                enemy.radius +
                10 &&
            enemy.attackTimer <= 0
        ) {

            damagePlayer(
                enemy.damage
            );

            enemy.attackTimer =
                enemy.attackCooldown;

        }


        enemy.hitFlash -= dt;

    }

}


/* =========================================================
   BOSS UPDATE
========================================================= */

function updateBoss(dt) {

    if (
        !boss ||
        !GAME.bossActive
    ) return;


    const dx =
        player.x - boss.x;

    const dy =
        player.y - boss.y;

    const distance =
        Math.hypot(dx, dy) || 1;


    boss.x +=
        dx / distance *
        boss.speed *
        dt / 1000;

    boss.y +=
        dy / distance *
        boss.speed *
        dt / 1000;


    boss.rotation +=
        dt * 0.001;


    boss.attackTimer -= dt;


    if (
        boss.attackTimer <= 0
    ) {

        bossAttack();

        boss.attackTimer =
            boss.attackCooldown;

    }


    const hpPercent =
        boss.hp /
        boss.maxHp;


    if (
        hpPercent <= 0.66 &&
        boss.phase === 1
    ) {

        boss.phase = 2;

        boss.speed *= 1.18;

        boss.attackCooldown *= 0.82;

        showNotification(
            "BOSS PHASE 02",
            1000
        );

    }


    if (
        hpPercent <= 0.33 &&
        boss.phase === 2
    ) {

        boss.phase = 3;

        boss.speed *= 1.25;

        boss.attackCooldown *= 0.75;

        showNotification(
            "BOSS PHASE 03 // RAGE",
            1000
        );

    }


    bossHpBar.style.width =
        `${Math.max(
            0,
            boss.hp /
            boss.maxHp *
            100
        )}%`;

    bossPhase.textContent =
        `PHASE 0${boss.phase}`;

}


/* =========================================================
   BOSS ATTACK
========================================================= */

function bossAttack() {

    if (!boss)
        return;


    const angle =
        Math.atan2(
            player.y - boss.y,
            player.x - boss.x
        );


    const count =
        boss.phase === 3
            ? 7
            : boss.phase === 2
                ? 5
                : 3;


    const spread =
        boss.phase === 3
            ? 0.65
            : 0.45;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const a =
            angle -
            spread / 2 +
            spread *
            (i / Math.max(1, count - 1));


        enemyBullets.push({

            x: boss.x,
            y: boss.y,

            vx:
                Math.cos(a) * 230,

            vy:
                Math.sin(a) * 230,

            radius: 7,

            damage:
                DIFFICULTIES[
                    GAME.difficulty
                ].enemyDamage * 1.25,

            life: 3000

        });

    }


    createExplosion(
        boss.x,
        boss.y,
        "#ff00c8",
        8
    );

}


/* =========================================================
   UPDATE BULLETS
========================================================= */

function updateBullets(dt) {

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];

        bullet.x +=
            bullet.vx *
            dt / 1000;

        bullet.y +=
            bullet.vy *
            dt / 1000;

        bullet.life -= dt;


        let remove = false;


        if (
            bullet.life <= 0 ||
            bullet.x < -50 ||
            bullet.x > W + 50 ||
            bullet.y < -50 ||
            bullet.y > H + 50
        ) {

            remove = true;

        }


        if (!remove) {

            for (
                let j = enemies.length - 1;
                j >= 0;
                j--
            ) {

                const enemy =
                    enemies[j];

                const distance =
                    Math.hypot(
                        bullet.x - enemy.x,
                        bullet.y - enemy.y
                    );


                if (
                    distance <
                    bullet.radius +
                    enemy.radius
                ) {

                    damageEnemy(
                        enemy,
                        bullet.damage,
                        bullet
                    );

                    remove = true;

                    break;

                }

            }

        }


        if (
            !remove &&
            boss &&
            GAME.bossActive
        ) {

            const distance =
                Math.hypot(
                    bullet.x - boss.x,
                    bullet.y - boss.y
                );


            if (
                distance <
                bullet.radius +
                boss.radius
            ) {

                damageBoss(
                    bullet.damage,
                    bullet
                );

                remove = true;

            }

        }


        if (remove) {

            bullets.splice(i, 1);

        }

    }

}


/* =========================================================
   UPDATE ENEMY BULLETS
========================================================= */

function updateEnemyBullets(dt) {

    for (
        let i = enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            enemyBullets[i];

        bullet.x +=
            bullet.vx *
            dt / 1000;

        bullet.y +=
            bullet.vy *
            dt / 1000;

        bullet.life -= dt;


        const distance =
            Math.hypot(
                bullet.x - player.x,
                bullet.y - player.y
            );


        if (
            distance <
            bullet.radius +
            player.radius
        ) {

            damagePlayer(
                bullet.damage
            );

            enemyBullets.splice(
                i,
                1
            );

            continue;

        }


        if (
            bullet.life <= 0 ||
            bullet.x < -100 ||
            bullet.x > W + 100 ||
            bullet.y < -100 ||
            bullet.y > H + 100
        ) {

            enemyBullets.splice(
                i,
                1
            );

        }

    }

}


/* =========================================================
   DAMAGE ENEMY
========================================================= */

function damageEnemy(
    enemy,
    damage,
    bullet
) {

    let finalDamage =
        damage;


    if (
        bullet.elemental === "fire"
    ) {

        finalDamage *= 1.25;

    }

    if (
        bullet.elemental === "ice"
    ) {

        enemy.speed *= 0.75;

    }

    if (
        bullet.elemental === "lightning"
    ) {

        finalDamage *= 1.4;

    }


    enemy.hp -= finalDamage;

    enemy.hitFlash = 100;


    createHitParticles(
        enemy.x,
        enemy.y,
        bullet.elemental
    );


    if (enemy.hp <= 0) {

        killEnemy(enemy);

    }

}


/* =========================================================
   DAMAGE BOSS
========================================================= */

function damageBoss(
    damage,
    bullet
) {

    let finalDamage =
        damage;


    if (
        bullet.elemental === "fire"
    ) finalDamage *= 1.15;

    if (
        bullet.elemental === "ice"
    ) finalDamage *= 1.08;

    if (
        bullet.elemental === "lightning"
    ) finalDamage *= 1.3;


    boss.hp -= finalDamage;

    boss.hitFlash = 100;


    createHitParticles(
        boss.x,
        boss.y,
        bullet.elemental
    );


    if (boss.hp <= 0) {

        killBoss();

    }

}


/* =========================================================
   KILL ENEMY
========================================================= */

function killEnemy(enemy) {

    const index =
        enemies.indexOf(enemy);

    if (index !== -1) {

        enemies.splice(
            index,
            1
        );

    }


    GAME.enemiesKilled++;
    GAME.kills++;

    GAME.score +=
        100 * GAME.combo;


    GAME.combo =
        Math.min(
            GAME.combo + 0.1,
            10
        );

    GAME.comboTimer = 2500;


    addXP(25);


    createExplosion(
        enemy.x,
        enemy.y,
        enemy.color,
        15
    );


    tryDropItem(
        enemy.x,
        enemy.y
    );


    updateHUD();

}


/* =========================================================
   KILL BOSS
========================================================= */

function killBoss() {

    GAME.bossActive = false;
    GAME.bossDefeated = true;

    bossContainer.classList.add(
        "hidden"
    );


    GAME.score +=
        2500 * GAME.combo;


    createExplosion(
        boss.x,
        boss.y,
        "#ff00c8",
        80
    );


    if (
        GAME.difficulty === "easy" ||
        GAME.difficulty === "normal"
    ) {

        player.pet = true;

        GAME.petUnlocked = true;

        showNotification(
            "🐉 PET UNLOCKED // DEMON COMPANION",
            2200
        );

    }


    boss = null;

    finishStage();

}


/* =========================================================
   DAMAGE PLAYER
========================================================= */

function damagePlayer(amount) {

    if (
        player.invincibleTimer > 0
    ) return;


    player.hp -= amount;

    player.invincibleTimer =
        500;

    GAME.shake = 12;


    createExplosion(
        player.x,
        player.y,
        "#ff315d",
        8
    );


    if (player.hp <= 0) {

        player.hp = 0;

        gameOver();

    }


    updateHUD();

}


/* =========================================================
   XP
========================================================= */

function addXP(amount) {

    player.xp += amount;


    while (
        player.xp >= player.xpNext
    ) {

        player.xp -=
            player.xpNext;

        player.level++;

        player.xpNext =
            Math.floor(
                player.xpNext * 1.35
            );

        levelUp();

    }


    updateHUD();

}


/* =========================================================
   LEVEL UP
========================================================= */

function levelUp() {

    GAME.paused = true;

    levelupScreen.classList.remove(
        "hidden"
    );


    const upgrades = [

        {
            type: "WEAPON",
            name: "POWER CORE",
            description:
                "+25% DAMAGE",
            apply() {
                player.damage *= 1.25;
            }
        },

        {
            type: "WEAPON",
            name: "RAPID FIRE",
            description:
                "15% FASTER SHOOTING",
            apply() {
                player.fireRate *= 0.85;
            }
        },

        {
            type: "MOBILITY",
            name: "OVERDRIVE",
            description:
                "+20% MOVEMENT SPEED",
            apply() {
                player.moveBoost *= 1.20;
            }
        },

        {
            type: "DEFENSE",
            name: "NANO ARMOR",
            description:
                "+25 MAX HP",
            apply() {
                player.maxHp += 25;
                player.hp += 25;
            }
        },

        {
            type: "CRITICAL",
            name: "CRIT MATRIX",
            description:
                "+8% CRITICAL CHANCE",
            apply() {
                player.critChance += 0.08;
            }
        },

        {
            type: "PROJECTILE",
            name: "DUAL CORE",
            description:
                "2 PROJECTILES",
            apply() {
                player.doubleShot = true;
                player.projectileCount =
                    Math.max(
                        2,
                        player.projectileCount
                    );
            }
        }

    ];


    const selected =
        upgrades
            .sort(
                () => Math.random() - 0.5
            )
            .slice(0, 3);


    upgradeContainer.innerHTML = "";


    selected.forEach(upgrade => {

        const card =
            document.createElement("button");

        card.className =
            "upgrade-card";


        card.innerHTML = `

            <span class="upgrade-type">
                ${upgrade.type}
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

                GAME.paused = false;

                showNotification(
                    upgrade.name,
                    900
                );

                updateHUD();

            }
        );


        upgradeContainer.appendChild(
            card
        );

    });

}


/* =========================================================
   ITEM DROP
========================================================= */

const DROP_TABLE = [

    {
        name: "BOMB",
        weight: 8,

        apply() {

            for (
                const enemy of [...enemies]
            ) {

                enemy.hp = 0;

                killEnemy(enemy);

            }

            if (boss) {

                boss.hp *= 0.88;

            }

        }

    },

    {
        name: "MISSILE",
        weight: 8,

        apply() {

            for (let i = 0; i < 8; i++) {

                const target =
                    getAimTarget();

                if (!target)
                    break;

                const angle =
                    Math.atan2(
                        target.y - player.y,
                        target.x - player.x
                    );

                bullets.push({

                    x: player.x,
                    y: player.y,

                    vx:
                        Math.cos(angle) *
                        900,

                    vy:
                        Math.sin(angle) *
                        900,

                    radius: 8,

                    damage:
                        player.damage * 2.2,

                    crit: false,

                    elemental: null,

                    life: 1200

                });

            }

        }

    },

    {
        name: "CLEAR",
        weight: 4,

        apply() {

            for (
                const enemy of [...enemies]
            ) {

                killEnemy(enemy);

            }

        }

    },

    {
        name: "SPEED",
        weight: 13,

        apply() {

            player.moveBoost *= 1.30;

        }

    },

    {
        name: "RAPID FIRE",
        weight: 18,

        apply() {

            player.fireRate *= 0.78;

        }

    },

    {
        name: "DUAL SHOT",
        weight: 13,

        apply() {

            player.doubleShot = true;

            player.projectileCount =
                Math.max(
                    2,
                    player.projectileCount
                );

        }

    },

    {
        name: "TRIPLE SHOT",
        weight: 8,

        apply() {

            player.tripleShot = true;

            player.projectileCount =
                Math.max(
                    3,
                    player.projectileCount
                );

        }

    },

    {
        name: "ULTRA GUN",
        weight: 7,

        apply() {

            player.ultraGun = true;

            player.damage *= 1.25;

        }

    },

    {
        name: "FIRE",
        weight: 7,

        apply() {

            player.elemental =
                "fire";

            player.damage *= 1.20;

        }

    },

    {
        name: "ICE",
        weight: 6,

        apply() {

            player.elemental =
                "ice";

        }

    },

    {
        name: "LIGHTNING",
        weight: 6,

        apply() {

            player.elemental =
                "lightning";

            player.damage *= 1.15;

        }

    },

    {
        name: "DAMAGE CORE",
        weight: 10,

        apply() {

            player.damage *= 1.35;

        }

    }

];


function getRandomDrop() {

    let total = 0;

    for (
        const item of DROP_TABLE
    ) {

        total += item.weight;

    }


    let random =
        Math.random() * total;


    for (
        const item of DROP_TABLE
    ) {

        random -= item.weight;

        if (random <= 0)
            return item;

    }

    return DROP_TABLE[0];

}


/* =========================================================
   TRY DROP
========================================================= */

function tryDropItem(x, y) {

    const config =
        getStageConfig();


    if (
        Math.random() >
        config.dropChance
    ) return;


    const item =
        getRandomDrop();


    drops.push({

        x,
        y,

        radius: 11,

        item,

        life: 10000,

        pulse: 0

    });

}


/* =========================================================
   UPDATE DROPS
========================================================= */

function updateDrops(dt) {

    for (
        let i = drops.length - 1;
        i >= 0;
        i--
    ) {

        const drop =
            drops[i];

        drop.life -= dt;

        drop.pulse += dt;


        const distance =
            Math.hypot(
                player.x - drop.x,
                player.y - drop.y
            );


        if (
            distance <
            player.radius +
            drop.radius +
            12
        ) {

            drop.item.apply();

            showNotification(
                `SKILL ACQUIRED // ${drop.item.name}`,
                1200
            );


            skillsContainer.innerHTML +=
                `<div class="skill-item">
                    ${drop.item.name}
                </div>`;


            while (
                skillsContainer.children.length > 5
            ) {

                skillsContainer.removeChild(
                    skillsContainer.firstChild
                );

            }


            createExplosion(
                drop.x,
                drop.y,
                "#00f6ff",
                20
            );


            drops.splice(i, 1);

            continue;

        }


        if (
            drop.life <= 0
        ) {

            drops.splice(i, 1);

        }

    }

}


/* =========================================================
   STAGE PROGRESS
========================================================= */

function checkStageProgress() {

    if (!GAME.stageActive)
        return;


    if (
        GAME.enemiesSpawned <
        GAME.enemiesToSpawn
    ) return;


    if (
        GAME.enemiesKilled <
        GAME.enemiesToSpawn
    ) return;


    if (
        GAME.stage === 5 &&
        !GAME.bossDefeated
    ) {

        if (!GAME.bossActive) {

            spawnBoss();

        }

        return;

    }


    if (
        GAME.stage < 5
    ) {

        finishStage();

    }

}


/* =========================================================
   FINISH STAGE
========================================================= */

function finishStage() {

    if (
        GAME.stageTransition
    ) return;


    GAME.stageActive = false;

    GAME.stageTransition = true;


    const reward =
        500 * GAME.stage;

    GAME.score += reward;


    stageClearReward.textContent =
        `+${reward} SCORE`;


    if (
        GAME.stage >= 5
    ) {

        if (
            GAME.bossDefeated
        ) {

            gameVictory();

        }

        return;

    }


    GAME.paused = true;

    stageClearScreen.classList.remove(
        "hidden"
    );

}


/* =========================================================
   CONTINUE STAGE
========================================================= */

continueStage.addEventListener(
    "click",
    () => {

        GAME.stage++;

        stageClearScreen.classList.add(
            "hidden"
        );

        GAME.paused = false;

        startStage();

    }
);


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

    GAME.running = false;

    GAME.paused = true;

    gameoverTitle.textContent =
        "SYSTEM FAILURE";

    gameoverMessage.textContent =
        "PLAYER DESTROYED";

    finalScore.textContent =
        Math.floor(GAME.score);

    gameoverScreen.classList.remove(
        "hidden"
    );

}


/* =========================================================
   VICTORY
========================================================= */

function gameVictory() {

    GAME.running = false;

    GAME.paused = true;

    gameoverTitle.textContent =
        "SYSTEM OVERRIDE";

    gameoverMessage.textContent =
        "ALL 5 STAGES CLEARED";

    finalScore.textContent =
        Math.floor(GAME.score);

    gameoverScreen.classList.remove(
        "hidden"
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
            GAME.difficulty
        );

    }
);


/* =========================================================
   MENU
========================================================= */

menuButton.addEventListener(
    "click",
    () => {

        GAME.running = false;
        GAME.paused = false;

        hideAllOverlays();

        gameScreen.classList.add(
            "hidden"
        );

        menuScreen.classList.remove(
            "hidden"
        );

    }
);


/* =========================================================
   HIDE OVERLAYS
========================================================= */

function hideAllOverlays() {

    levelupScreen.classList.add(
        "hidden"
    );

    stageClearScreen.classList.add(
        "hidden"
    );

    gameoverScreen.classList.add(
        "hidden"
    );

}


/* =========================================================
   SPAWN SYSTEM
========================================================= */

function updateSpawning(dt) {

    if (!GAME.stageActive)
        return;


    if (
        GAME.enemiesSpawned >=
        GAME.enemiesToSpawn
    ) return;


    GAME.spawnTimer -= dt;


    const interval =
        Math.max(
            260,
            850 -
            GAME.stage * 75
        );


    if (
        GAME.spawnTimer <= 0
    ) {

        createEnemy();

        GAME.spawnTimer =
            interval;

    }

}


/* =========================================================
   COMBO
========================================================= */

function updateCombo(dt) {

    if (
        GAME.comboTimer > 0
    ) {

        GAME.comboTimer -= dt;

    } else {

        GAME.combo =
            Math.max(
                1,
                GAME.combo - dt * 0.0015
            );

    }

}


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    scoreEl.textContent =
        Math.floor(GAME.score);

    waveEl.textContent =
        GAME.stage;

    comboEl.textContent =
        `x${GAME.combo.toFixed(1)}`;


    levelEl.textContent =
        player.level;


    hpBar.style.width =
        `${Math.max(
            0,
            player.hp /
            player.maxHp *
            100
        )}%`;


    xpBar.style.width =
        `${Math.max(
            0,
            player.xp /
            player.xpNext *
            100
        )}%`;


    hpText.textContent =
        `${Math.ceil(player.hp)} / ${Math.ceil(player.maxHp)}`;


    xpText.textContent =
        `${Math.floor(player.xp)} / ${Math.floor(player.xpNext)}`;

}


/* =========================================================
   NOTIFICATION
========================================================= */

let notificationTimer = null;


function showNotification(
    text,
    duration = 1000
) {

    notification.textContent =
        text;

    notification.classList.add(
        "show"
    );


    clearTimeout(
        notificationTimer
    );


    notificationTimer =
        setTimeout(
            () => {

                notification.classList.remove(
                    "show"
                );

            },
            duration
        );

}


/* =========================================================
   PARTICLES
========================================================= */

function createExplosion(
    x,
    y,
    color,
    amount
) {

    for (
        let i = 0;
        i < amount;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI * 2;

        const speed =
            50 +
            Math.random() * 180;


        particles.push({

            x,
            y,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            life:
                300 +
                Math.random() * 500,

            maxLife: 800,

            radius:
                1 +
                Math.random() * 3,

            color

        });

    }

}


function createHitParticles(
    x,
    y,
    elemental
) {

    let color =
        "#00f6ff";


    if (elemental === "fire")
        color = "#ff6535";

    if (elemental === "ice")
        color = "#71eaff";

    if (elemental === "lightning")
        color = "#fff36b";


    createExplosion(
        x,
        y,
        color,
        5
    );

}


/* =========================================================
   UPDATE PARTICLES
========================================================= */

function updateParticles(dt) {

    for (
        let i = particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            particles[i];

        p.x +=
            p.vx *
            dt / 1000;

        p.y +=
            p.vy *
            dt / 1000;

        p.vx *= 0.97;
        p.vy *= 0.97;

        p.life -= dt;


        if (
            p.life <= 0
        ) {

            particles.splice(i, 1);

        }

    }

}


/* =========================================================
   BACKGROUND
========================================================= */

let gridOffset = 0;


function drawBackground(dt) {

    gridOffset +=
        dt * 0.015;


    ctx.fillStyle =
        "#01040a";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    /* Grid */

    const gridSize = 50;

    ctx.strokeStyle =
        "rgba(0,246,255,0.045)";

    ctx.lineWidth = 1;


    const offset =
        gridOffset %
        gridSize;


    for (
        let x = -gridSize;
        x < W + gridSize;
        x += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x + offset,
            0
        );

        ctx.lineTo(
            x + offset,
            H
        );

        ctx.stroke();

    }


    for (
        let y = -gridSize;
        y < H + gridSize;
        y += gridSize
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y + offset
        );

        ctx.lineTo(
            W,
            y + offset
        );

        ctx.stroke();

    }


    /* Center glow */

    const gradient =
        ctx.createRadialGradient(
            W / 2,
            H / 2,
            20,
            W / 2,
            H / 2,
            Math.max(W, H) * 0.7
        );


    gradient.addColorStop(
        0,
        "rgba(0,246,255,0.055)"
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


    if (
        player.invincibleTimer > 0
    ) {

        ctx.globalAlpha =
            0.45 +
            Math.sin(
                performance.now() * 0.04
            ) * 0.35;

    }


    /* Aura */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.radius + 9,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        "rgba(0,246,255,0.16)";

    ctx.stroke();


    /* Weapon */

    ctx.rotate(
        player.angle
    );


    ctx.fillStyle =
        "#00f6ff";

    ctx.shadowColor =
        "#00f6ff";

    ctx.shadowBlur =
        15;


    ctx.fillRect(
        4,
        -4,
        25,
        8
    );


    ctx.shadowBlur = 0;


    ctx.rotate(
        -player.angle
    );


    /* Body */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        player.radius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#061a25";

    ctx.fill();


    ctx.lineWidth = 2;

    ctx.strokeStyle =
        "#00f6ff";

    ctx.stroke();


    /* Core */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        6,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#ffffff";

    ctx.shadowColor =
        "#00f6ff";

    ctx.shadowBlur =
        15;

    ctx.fill();


    ctx.shadowBlur = 0;


    /* Pet */

    if (player.pet) {

        const petAngle =
            performance.now() *
            0.002;

        const px =
            Math.cos(petAngle) *
            38;

        const py =
            Math.sin(petAngle) *
            38;


        ctx.beginPath();

        ctx.arc(
            px,
            py,
            9,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#ff00c8";

        ctx.shadowColor =
            "#ff00c8";

        ctx.shadowBlur =
            15;

        ctx.fill();

        ctx.shadowBlur = 0;

    }


    ctx.restore();

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


    const flash =
        enemy.hitFlash > 0;


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        enemy.radius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        flash
            ? "#ffffff"
            : "#160914";

    ctx.fill();


    ctx.lineWidth = 2;

    ctx.strokeStyle =
        enemy.color;

    ctx.shadowColor =
        enemy.color;

    ctx.shadowBlur =
        14;

    ctx.stroke();

    ctx.shadowBlur = 0;


    /* Eyes */

    ctx.fillStyle =
        "#ff315d";


    ctx.fillRect(
        -7,
        -4,
        4,
        4
    );


    ctx.fillRect(
        3,
        -4,
        4,
        4
    );


    /* Health */

    const hpPercent =
        Math.max(
            0,
            enemy.hp /
            enemy.maxHp
        );


    ctx.fillStyle =
        "rgba(0,0,0,0.7)";

    ctx.fillRect(
        -18,
        -enemy.radius - 9,
        36,
        4
    );


    ctx.fillStyle =
        "#ff315d";

    ctx.fillRect(
        -18,
        -enemy.radius - 9,
        36 * hpPercent,
        4
    );


    ctx.restore();

}


/* =========================================================
   DRAW BOSS
========================================================= */

function drawBoss() {

    if (
        !boss ||
        !GAME.bossActive
    ) return;


    ctx.save();

    ctx.translate(
        boss.x,
        boss.y
    );


    ctx.rotate(
        boss.rotation
    );


    const flash =
        boss.hitFlash > 0;


    /* Demon aura */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        boss.radius + 18,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        "rgba(255,0,200,0.2)";

    ctx.lineWidth = 3;

    ctx.stroke();


    /* Horns */

    ctx.fillStyle =
        "#8e163d";


    ctx.beginPath();

    ctx.moveTo(
        -28,
        -30
    );

    ctx.lineTo(
        -45,
        -72
    );

    ctx.lineTo(
        -8,
        -45
    );

    ctx.closePath();

    ctx.fill();


    ctx.beginPath();

    ctx.moveTo(
        28,
        -30
    );

    ctx.lineTo(
        45,
        -72
    );

    ctx.lineTo(
        8,
        -45
    );

    ctx.closePath();

    ctx.fill();


    /* Head */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        boss.radius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        flash
            ? "#ffffff"
            : "#1b0714";

    ctx.fill();


    ctx.lineWidth = 4;

    ctx.strokeStyle =
        "#ff00c8";

    ctx.shadowColor =
        "#ff00c8";

    ctx.shadowBlur = 20;

    ctx.stroke();

    ctx.shadowBlur = 0;


    /* Eyes */

    ctx.fillStyle =
        "#ff315d";


    ctx.beginPath();

    ctx.ellipse(
        -20,
        -8,
        11,
        6,
        -0.25,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.ellipse(
        20,
        -8,
        11,
        6,
        0.25,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Mouth */

    ctx.beginPath();

    ctx.moveTo(
        -25,
        18
    );

    ctx.quadraticCurveTo(
        0,
        42,
        25,
        18
    );

    ctx.strokeStyle =
        "#ff315d";

    ctx.lineWidth = 3;

    ctx.stroke();


    ctx.restore();

}


/* =========================================================
   DRAW BULLETS
========================================================= */

function drawBullets() {

    for (
        const bullet of bullets
    ) {

        ctx.save();

        ctx.translate(
            bullet.x,
            bullet.y
        );


        const angle =
            Math.atan2(
                bullet.vy,
                bullet.vx
            );


        ctx.rotate(angle);


        let color =
            "#00f6ff";


        if (
            bullet.elemental === "fire"
        ) color = "#ff6535";


        if (
            bullet.elemental === "ice"
        ) color = "#71eaff";


        if (
            bullet.elemental === "lightning"
        ) color = "#fff36b";


        if (
            bullet.petBullet
        ) color = "#ff00c8";


        ctx.fillStyle =
            color;

        ctx.shadowColor =
            color;

        ctx.shadowBlur =
            12;


        ctx.fillRect(
            -10,
            -bullet.radius / 2,
            20,
            bullet.radius
        );


        ctx.restore();

    }

}


/* =========================================================
   DRAW ENEMY BULLETS
========================================================= */

function drawEnemyBullets() {

    for (
        const bullet of enemyBullets
    ) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#ff315d";

        ctx.shadowColor =
            "#ff315d";

        ctx.shadowBlur =
            15;

        ctx.fill();

        ctx.shadowBlur = 0;

    }

}


/* =========================================================
   DRAW DROPS
========================================================= */

function drawDrops() {

    for (
        const drop of drops
    ) {

        const pulse =
            1 +
            Math.sin(
                drop.pulse * 0.006
            ) * 0.12;


        ctx.save();

        ctx.translate(
            drop.x,
            drop.y
        );

        ctx.scale(
            pulse,
            pulse
        );


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            drop.radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "rgba(0,246,255,0.12)";

        ctx.fill();


        ctx.strokeStyle =
            "#00f6ff";

        ctx.lineWidth = 2;

        ctx.shadowColor =
            "#00f6ff";

        ctx.shadowBlur =
            15;

        ctx.stroke();

        ctx.shadowBlur = 0;


        ctx.fillStyle =
            "#dffcff";

        ctx.font =
            "bold 8px monospace";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";


        ctx.fillText(
            "S",
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
        const p of particles
    ) {

        const alpha =
            Math.max(
                0,
                p.life /
                p.maxLife
            );


        ctx.globalAlpha =
            alpha;


        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            p.color;

        ctx.fill();

    }


    ctx.globalAlpha = 1;

}


/* =========================================================
   RENDER
========================================================= */

function render(dt) {

    ctx.save();


    if (
        GAME.shake > 0
    ) {

        const sx =
            (Math.random() - 0.5) *
            GAME.shake;

        const sy =
            (Math.random() - 0.5) *
            GAME.shake;

        ctx.translate(
            sx,
            sy
        );

        GAME.shake *= 0.90;

        if (GAME.shake < 0.2)
            GAME.shake = 0;

    }


    drawBackground(dt);

    drawDrops();

    drawBullets();

    drawEnemyBullets();


    for (
        const enemy of enemies
    ) {

        drawEnemy(enemy);

    }


    drawBoss();

    drawPlayer();

    drawParticles();


    ctx.restore();

}


/* =========================================================
   MAIN UPDATE
========================================================= */

function update(dt) {

    if (
        !GAME.running ||
        GAME.paused
    ) return;


    updatePlayer(dt);

    updateSpawning(dt);

    updateEnemies(dt);

    updateBoss(dt);

    updateBullets(dt);

    updateEnemyBullets(dt);

    updateDrops(dt);

    updateParticles(dt);

    updateCombo(dt);

    checkStageProgress();

    updateHUD();

}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(timestamp) {

    if (!GAME.lastTime)
        GAME.lastTime = timestamp;


    let dt =
        timestamp -
        GAME.lastTime;


    GAME.lastTime =
        timestamp;


    dt =
        Math.min(
            dt,
            40
        );


    update(dt);

    render(dt);


    requestAnimationFrame(
        gameLoop
    );

}


requestAnimationFrame(
    gameLoop
);


/* =========================================================
   INITIAL STATE
========================================================= */

updateHUD();

console.log(
    "%c CYBER // FALL ",
    "color:#00f6ff;font-size:20px;font-weight:bold;"
);

console.log(
    "%c SYSTEM READY ",
    "color:#ff00c8;font-size:12px;"
);