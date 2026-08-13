/* =========================================================
   CYBER HUNTER
   SCRIPT.JS
   Landscape Mobile + PC
========================================================= */

"use strict";

/* =========================================================
   CANVAS
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let WIDTH = 0;
let HEIGHT = 0;
let DPR = 1;


/* =========================================================
   DOM
========================================================= */

const startButton = document.getElementById("start-button");
const gameMessage = document.getElementById("game-message");
const messageTitle = document.getElementById("message-title");
const messageText = document.getElementById("message-text");

const playerHpBar = document.getElementById("player-hp");
const playerHpText = document.getElementById("player-hp-text");

const scoreElement = document.getElementById("score");
const roundElement = document.getElementById("round-number");
const stageElement = document.getElementById("stage-number");

const bossHud = document.getElementById("boss-hud");
const bossHpBar = document.getElementById("boss-hp");
const bossHpText = document.getElementById("boss-hp-text");

const enemyCountElement = document.getElementById("enemy-count");

const weaponNameElement = document.getElementById("weapon-name");
const weaponLevelElement = document.getElementById("weapon-level");

const itemPopup = document.getElementById("item-popup");
const itemIcon = document.getElementById("item-icon");
const itemName = document.getElementById("item-name");
const itemDescription = document.getElementById("item-description");


/* =========================================================
   GAME STATE
========================================================= */

const game = {

    running: false,

    difficulty: "normal",

    round: 1,

    stage: 1,

    maxStages: 5,

    score: 0,

    enemiesKilled: 0,

    stageTimer: 0,

    spawnTimer: 0,

    transitionTimer: 0,

    gameOver: false,

    victory: false,

    bossActive: false,

    bossDefeated: false,

    lastTime: 0,

    enemySpawnLimit: 12,

    totalEnemies: 0,

    enemiesToSpawn: 0,

    stageComplete: false,

    screenShake: 0,

    flash: 0
};


/* =========================================================
   DIFFICULTY
========================================================= */

const difficulties = {

    easy: {
        name: "DỄ",
        enemyHp: 40,
        enemyDamage: 7,
        enemySpeed: 48,
        bossMultiplier: 3,
        dropBonus: 0.10
    },

    normal: {
        name: "BÌNH THƯỜNG",
        enemyHp: 60,
        enemyDamage: 10,
        enemySpeed: 58,
        bossMultiplier: 4,
        dropBonus: 0.15
    },

    hard: {
        name: "KHÓ",
        enemyHp: 85,
        enemyDamage: 14,
        enemySpeed: 70,
        bossMultiplier: 5,
        dropBonus: 0.20
    }

};


/* =========================================================
   PLAYER
========================================================= */

const player = {

    x: 0,
    y: 0,

    radius: 17,

    speed: 230,

    maxHp: 100,
    hp: 100,

    damage: 20,

    fireRate: 0.28,
    fireTimer: 0,

    bulletSpeed: 600,

    projectileCount: 1,

    projectileSpread: 0.18,

    weaponLevel: 1,

    moveX: 0,
    moveY: 0,

    invincible: 0,

    rapidFireTimer: 0,
    speedBoostTimer: 0,

    element: null,

    ultraGun: false,

    petUnlocked: false
};


/* =========================================================
   PET
========================================================= */

const pet = {

    active: false,

    x: 0,
    y: 0,

    radius: 11,

    orbit: 0,

    fireTimer: 0,

    fireRate: 0.65,

    damage: 18

};


/* =========================================================
   ARRAYS
========================================================= */

const enemies = [];
const bullets = [];
const enemyBullets = [];
const particles = [];
const items = [];
const bossProjectiles = [];
const effects = [];


/* =========================================================
   INPUT
========================================================= */

const keys = {

    w: false,
    a: false,
    s: false,
    d: false,

    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};


document.addEventListener("keydown", event => {

    if (event.key in keys) {
        keys[event.key] = true;
    }

});


document.addEventListener("keyup", event => {

    if (event.key in keys) {
        keys[event.key] = false;
    }

});


/* =========================================================
   JOYSTICK
========================================================= */

const joystick = document.getElementById("joystick");
const joystickBase = document.getElementById("joystick-base");
const joystickStick = document.getElementById("joystick-stick");

const joystickState = {

    active: false,

    pointerId: null,

    x: 0,
    y: 0,

    maxDistance: 45
};


function resetJoystick() {

    joystickState.active = false;

    joystickState.x = 0;
    joystickState.y = 0;

    joystickStick.style.transform =
        "translate(-50%, -50%)";
}


function updateJoystick(clientX, clientY) {

    const rect = joystickBase.getBoundingClientRect();

    const centerX =
        rect.left + rect.width / 2;

    const centerY =
        rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    const distance =
        Math.sqrt(dx * dx + dy * dy);

    if (distance > joystickState.maxDistance) {

        dx =
            dx / distance *
            joystickState.maxDistance;

        dy =
            dy / distance *
            joystickState.maxDistance;
    }

    joystickState.x =
        dx / joystickState.maxDistance;

    joystickState.y =
        dy / joystickState.maxDistance;

    joystickStick.style.transform =
        `translate(calc(-50% + ${dx}px),
                   calc(-50% + ${dy}px))`;
}


joystick.addEventListener("pointerdown", event => {

    event.preventDefault();

    joystickState.active = true;
    joystickState.pointerId = event.pointerId;

    joystick.setPointerCapture(event.pointerId);

    updateJoystick(
        event.clientX,
        event.clientY
    );

});


joystick.addEventListener("pointermove", event => {

    if (!joystickState.active) return;

    updateJoystick(
        event.clientX,
        event.clientY
    );

});


joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);


/* =========================================================
   RESIZE
========================================================= */

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    DPR =
        Math.min(window.devicePixelRatio || 1, 2);

    WIDTH = rect.width;
    HEIGHT = rect.height;

    canvas.width =
        Math.floor(WIDTH * DPR);

    canvas.height =
        Math.floor(HEIGHT * DPR);

    ctx.setTransform(
        DPR,
        0,
        0,
        DPR,
        0,
        0
    );

    if (player.x === 0) {

        player.x =
            WIDTH / 2;

        player.y =
            HEIGHT / 2;
    }

}


window.addEventListener(
    "resize",
    resizeCanvas
);

window.addEventListener(
    "orientationchange",
    () => {
        setTimeout(resizeCanvas, 200);
    }
);


/* =========================================================
   START GAME
========================================================= */

startButton.addEventListener(
    "click",
    startGame
);


function startGame() {

    game.running = true;

    game.gameOver = false;
    game.victory = false;

    game.round = 1;
    game.stage = 1;

    game.score = 0;

    player.hp =
        player.maxHp;

    player.x =
        WIDTH / 2;

    player.y =
        HEIGHT / 2;

    player.damage = 20;

    player.fireRate = 0.28;

    player.projectileCount = 1;

    player.weaponLevel = 1;

    player.element = null;

    player.ultraGun = false;

    pet.active = false;

    enemies.length = 0;
    bullets.length = 0;
    enemyBullets.length = 0;
    particles.length = 0;
    items.length = 0;
    bossProjectiles.length = 0;
    effects.length = 0;

    gameMessage.style.display =
        "none";

    startStage();

    game.lastTime =
        performance.now();

    requestAnimationFrame(gameLoop);
}


/* =========================================================
   START STAGE
========================================================= */

function startStage() {

    enemies.length = 0;

    bullets.length = 0;

    enemyBullets.length = 0;

    items.length = 0;

    bossProjectiles.length = 0;

    game.stageTimer = 0;

    game.spawnTimer = 0;

    game.bossActive = false;

    game.bossDefeated = false;

    game.stageComplete = false;

    bossHud.style.display =
        "none";

    roundElement.textContent =
        game.round;

    stageElement.textContent =
        game.stage;

    updateDifficultyText();

    const difficulty =
        difficulties[game.difficulty];

    game.totalEnemies =
        7 + game.stage * 3;

    game.enemiesToSpawn =
        game.totalEnemies;

    game.enemySpawnLimit =
        Math.min(
            5 + game.stage,
            9
        );

}


/* =========================================================
   DIFFICULTY UI
========================================================= */

function updateDifficultyText() {

    const difficulty =
        difficulties[game.difficulty];

    messageText.textContent =
        difficulty.name;
}


/* =========================================================
   SPAWN ENEMY
========================================================= */

function spawnEnemy() {

    if (
        game.enemiesToSpawn <= 0 ||
        game.bossActive
    ) {
        return;
    }

    if (
        enemies.length >=
        game.enemySpawnLimit
    ) {
        return;
    }

    const difficulty =
        difficulties[game.difficulty];

    const side =
        Math.floor(
            Math.random() * 4
        );

    let x;
    let y;

    if (side === 0) {
        x = Math.random() * WIDTH;
        y = -40;
    }

    else if (side === 1) {
        x = WIDTH + 40;
        y = Math.random() * HEIGHT;
    }

    else if (side === 2) {
        x = Math.random() * WIDTH;
        y = HEIGHT + 40;
    }

    else {
        x = -40;
        y = Math.random() * HEIGHT;
    }


    const typeRoll =
        Math.random();

    let type =
        "normal";

    if (
        game.stage >= 3 &&
        typeRoll < 0.18
    ) {
        type = "fast";
    }

    if (
        game.stage >= 4 &&
        typeRoll > 0.82
    ) {
        type = "tank";
    }


    let hp =
        difficulty.enemyHp;

    let speed =
        difficulty.enemySpeed;

    let radius =
        16;

    let damage =
        difficulty.enemyDamage;


    if (type === "fast") {

        hp *= 0.65;

        speed *= 1.6;

        radius = 13;
    }


    if (type === "tank") {

        hp *= 2.3;

        speed *= 0.65;

        radius = 24;

        damage *= 1.5;
    }


    /* Mỗi màn quái nhanh hơn */

    speed *=
        1 + (game.stage - 1) * 0.08;


    enemies.push({

        x,
        y,

        radius,

        hp,
        maxHp: hp,

        speed,

        damage,

        type,

        attackTimer:
            Math.random(),

        attackCooldown:
            type === "fast"
                ? 1.4
                : 2.0,

        hitFlash: 0
    });


    game.enemiesToSpawn--;
}


/* =========================================================
   BOSS
========================================================= */

function spawnBoss() {

    const difficulty =
        difficulties[game.difficulty];

    const normalHp =
        difficulty.enemyHp *
        (1 + (game.stage - 1) * 0.1);

    const bossHp =
        normalHp *
        difficulty.bossMultiplier;


    enemies.push({

        boss: true,

        x: WIDTH / 2,

        y: -100,

        radius: 48,

        hp: bossHp,

        maxHp: bossHp,

        speed:
            difficulty.enemySpeed * 0.55,

        damage:
            difficulty.enemyDamage * 2,

        attackTimer: 0,

        attackCooldown: 1.2,

        skillTimer: 3,

        skillCooldown: 5,

        hitFlash: 0
    });


    game.bossActive = true;

    bossHud.style.display =
        "flex";

    updateBossUI();
}


/* =========================================================
   UPDATE BOSS UI
========================================================= */

function updateBossUI() {

    const boss =
        enemies.find(
            enemy => enemy.boss
        );

    if (!boss) {

        bossHpBar.style.width =
            "0%";

        bossHpText.textContent =
            "0 / 0";

        return;
    }

    const percent =
        Math.max(
            0,
            boss.hp /
            boss.maxHp *
            100
        );

    bossHpBar.style.width =
        percent + "%";

    bossHpText.textContent =
        `${Math.ceil(boss.hp)}
         / ${Math.ceil(boss.maxHp)}`;
}


/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer(dt) {

    let moveX =
        joystickState.x;

    let moveY =
        joystickState.y;


    if (
        Math.abs(moveX) < 0.05 &&
        Math.abs(moveY) < 0.05
    ) {

        if (
            keys.a ||
            keys.ArrowLeft
        ) {
            moveX -= 1;
        }

        if (
            keys.d ||
            keys.ArrowRight
        ) {
            moveX += 1;
        }

        if (
            keys.w ||
            keys.ArrowUp
        ) {
            moveY -= 1;
        }

        if (
            keys.s ||
            keys.ArrowDown
        ) {
            moveY += 1;
        }
    }


    const length =
        Math.sqrt(
            moveX * moveX +
            moveY * moveY
        );


    if (length > 1) {

        moveX /= length;
        moveY /= length;
    }


    let speed =
        player.speed;


    if (
        player.speedBoostTimer > 0
    ) {

        speed *= 1.5;

        player.speedBoostTimer -= dt;
    }


    player.x +=
        moveX *
        speed *
        dt;

    player.y +=
        moveY *
        speed *
        dt;


    const margin =
        player.radius + 8;


    player.x =
        Math.max(
            margin,
            Math.min(
                WIDTH - margin,
                player.x
            )
        );

    player.y =
        Math.max(
            margin,
            Math.min(
                HEIGHT - margin,
                player.y
            )
        );


    if (
        player.invincible > 0
    ) {
        player.invincible -= dt;
    }
}


/* =========================================================
   AUTO FIRE
========================================================= */

function updateAutoFire(dt) {

    player.fireTimer -= dt;

    if (
        player.fireTimer > 0
    ) {
        return;
    }


    let fireRate =
        player.fireRate;


    if (
        player.rapidFireTimer > 0
    ) {

        fireRate *= 0.45;

        player.rapidFireTimer -= dt;
    }


    player.fireTimer =
        fireRate;


    /* Không auto-aim.
       Bắn theo hướng người chơi
       đang di chuyển.
       Nếu đứng yên thì bắn
       theo hướng mặc định lên trên.
    */

    let directionX =
        joystickState.x;

    let directionY =
        joystickState.y;


    if (
        Math.abs(directionX) < 0.1 &&
        Math.abs(directionY) < 0.1
    ) {

        directionX = 0;
        directionY = -1;
    }


    const angle =
        Math.atan2(
            directionY,
            directionX
        );


    const count =
        player.ultraGun
            ? Math.max(
                player.projectileCount,
                4
            )
            : player.projectileCount;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        let bulletAngle =
            angle;


        if (count > 1) {

            const center =
                (count - 1) / 2;

            bulletAngle +=
                (i - center) *
                player.projectileSpread;
        }


        bullets.push({

            x: player.x,

            y: player.y,

            vx:
                Math.cos(
                    bulletAngle
                ) *
                player.bulletSpeed,

            vy:
                Math.sin(
                    bulletAngle
                ) *
                player.bulletSpeed,

            radius: 5,

            damage:
                player.damage,

            element:
                player.element,

            life: 1.5
        });
    }
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
            dt;

        bullet.y +=
            bullet.vy *
            dt;

        bullet.life -= dt;


        if (
            bullet.life <= 0 ||
            bullet.x < -50 ||
            bullet.x > WIDTH + 50 ||
            bullet.y < -50 ||
            bullet.y > HEIGHT + 50
        ) {

            bullets.splice(i, 1);

            continue;
        }


        for (
            let j = enemies.length - 1;
            j >= 0;
            j--
        ) {

            const enemy =
                enemies[j];


            const dx =
                bullet.x -
                enemy.x;

            const dy =
                bullet.y -
                enemy.y;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distance <
                bullet.radius +
                enemy.radius
            ) {

                damageEnemy(
                    enemy,
                    bullet.damage,
                    bullet.element
                );


                createHitParticles(
                    bullet.x,
                    bullet.y,
                    bullet.element
                );


                bullets.splice(i, 1);

                break;
            }
        }
    }
}


/* =========================================================
   DAMAGE ENEMY
========================================================= */

function damageEnemy(
    enemy,
    damage,
    element
) {

    let finalDamage =
        damage;


    if (element === "fire") {
        finalDamage *= 1.35;
    }

    if (element === "lightning") {
        finalDamage *= 1.5;
    }

    if (element === "ice") {
        finalDamage *= 1.15;

        enemy.speed *= 0.985;
    }


    enemy.hp -=
        finalDamage;

    enemy.hitFlash =
        0.08;


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

    const index =
        enemies.indexOf(enemy);

    if (index === -1) return;


    enemies.splice(
        index,
        1
    );


    game.score +=
        enemy.boss
            ? 1000
            : enemy.type === "tank"
                ? 80
                : 50;


    game.enemiesKilled++;


    createExplosion(
        enemy.x,
        enemy.y,
        enemy.boss
            ? 45
            : 20
    );


    /* Item drop */

    dropItem(enemy);


    if (enemy.boss) {

        bossDefeated();
    }
}


/* =========================================================
   ITEM DROP
========================================================= */

function dropItem(enemy) {

    if (enemy.boss) {

        spawnItem(
            enemy.x,
            enemy.y,
            "ultra"
        );

        return;
    }


    const difficulty =
        difficulties[game.difficulty];


    /*
       Tỷ lệ cơ bản được tăng dần
       theo từng màn.
    */

    let dropChance =
        0.16 +
        (game.stage - 1) * 0.035 +
        difficulty.dropBonus;


    dropChance =
        Math.min(
            dropChance,
            0.38
        );


    if (
        Math.random() >
        dropChance
    ) {
        return;
    }


    const roll =
        Math.random();


    let type;


    if (roll < 0.10) {

        type = "bomb";
    }

    else if (roll < 0.20) {

        type = "missile";
    }

    else if (roll < 0.25) {

        type = "clear";
    }

    else if (roll < 0.40) {

        type = "speed";
    }

    else if (roll < 0.60) {

        type = "rapid";
    }

    else if (roll < 0.75) {

        type = "multi";
    }

    else if (roll < 0.85) {

        type = "ultra";
    }

    else {

        type = "element";
    }


    spawnItem(
        enemy.x,
        enemy.y,
        type
    );
}


/* =========================================================
   SPAWN ITEM
========================================================= */

function spawnItem(
    x,
    y,
    type
) {

    items.push({

        x,
        y,

        type,

        radius: 13,

        life: 10,

        pulse: Math.random() * 10
    });
}


/* =========================================================
   ITEM DATA
========================================================= */

const itemData = {

    bomb: {
        icon: "💣",
        name: "BOMB",
        description: "Gây sát thương diện rộng"
    },

    missile: {
        icon: "🚀",
        name: "MISSILE",
        description: "Tên lửa truy đuổi mục tiêu gần"
    },

    clear: {
        icon: "☄",
        name: "CLEAR",
        description: "Quét sạch toàn bộ quái"
    },

    speed: {
        icon: "⚡",
        name: "SPEED",
        description: "Tăng tốc di chuyển"
    },

    rapid: {
        icon: "🔥",
        name: "RAPID FIRE",
        description: "Tăng tốc độ bắn"
    },

    multi: {
        icon: "✦",
        name: "MULTI SHOT",
        description: "Tăng số đường đạn"
    },

    ultra: {
        icon: "⚡",
        name: "ULTRA GUN",
        description: "Vũ khí tối thượng"
    },

    element: {
        icon: "❄",
        name: "ELEMENT",
        description: "Đạn nguyên tố"
    }
};


/* =========================================================
   UPDATE ITEMS
========================================================= */

function updateItems(dt) {

    for (
        let i = items.length - 1;
        i >= 0;
        i--
    ) {

        const item =
            items[i];

        item.life -= dt;
        item.pulse += dt * 5;


        const dx =
            player.x -
            item.x;

        const dy =
            player.y -
            item.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance <
            player.radius +
            item.radius
        ) {

            collectItem(item);

            items.splice(i, 1);

            continue;
        }


        if (
            item.life <= 0
        ) {

            items.splice(i, 1);
        }
    }
}


/* =========================================================
   COLLECT ITEM
========================================================= */

function collectItem(item) {

    const data =
        itemData[item.type];


    showItemPopup(
        data
    );


    if (item.type === "bomb") {

        enemies.forEach(enemy => {

            enemy.hp -= 80;

            if (
                enemy.hp <= 0
            ) {
                killEnemy(enemy);
            }
        });
    }


    else if (
        item.type === "missile"
    ) {

        const targets =
            enemies.slice(0, 5);

        targets.forEach(
            enemy => {

                enemy.hp -= 120;

                if (
                    enemy.hp <= 0
                ) {
                    killEnemy(enemy);
                }
            }
        );
    }


    else if (
        item.type === "clear"
    ) {

        const copy =
            [...enemies];

        copy.forEach(
            enemy => {

                if (!enemy.boss) {

                    killEnemy(enemy);
                }
            }
        );
    }


    else if (
        item.type === "speed"
    ) {

        player.speedBoostTimer =
            8;
    }


    else if (
        item.type === "rapid"
    ) {

        player.rapidFireTimer =
            10;
    }


    else if (
        item.type === "multi"
    ) {

        player.projectileCount =
            Math.min(
                3,
                player.projectileCount + 1
            );

        player.weaponLevel++;
    }


    else if (
        item.type === "ultra"
    ) {

        player.ultraGun =
            true;

        player.projectileCount =
            Math.max(
                4,
                player.projectileCount
            );

        player.damage *= 1.5;

        player.weaponLevel += 2;
    }


    else if (
        item.type === "element"
    ) {

        const elements = [
            "fire",
            "lightning",
            "ice"
        ];

        player.element =
            elements[
                Math.floor(
                    Math.random() *
                    elements.length
                )
            ];

        player.damage *= 1.2;

        player.weaponLevel++;
    }
}


/* =========================================================
   ITEM POPUP
========================================================= */

function showItemPopup(data) {

    itemIcon.textContent =
        data.icon;

    itemName.textContent =
        data.name;

    itemDescription.textContent =
        data.description;


    itemPopup.classList.add(
        "show"
    );


    clearTimeout(
        showItemPopup.timer
    );


    showItemPopup.timer =
        setTimeout(() => {

            itemPopup.classList.remove(
                "show"
            );

        }, 1800);
}


/* =========================================================
   UPDATE ENEMIES
========================================================= */

function updateEnemies(dt) {

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        enemy.hitFlash =
            Math.max(
                0,
                enemy.hitFlash - dt
            );


        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance > 0
        ) {

            const dirX =
                dx / distance;

            const dirY =
                dy / distance;


            enemy.x +=
                dirX *
                enemy.speed *
                dt;

            enemy.y +=
                dirY *
                enemy.speed *
                dt;
        }


        enemy.attackTimer -= dt;


        /* Boss */

        if (enemy.boss) {

            updateBoss(
                enemy,
                dt,
                distance
            );

            continue;
        }


        /* Quái thường */

        if (
            distance <
            enemy.radius +
            player.radius +
            12
        ) {

            damagePlayer(
                enemy.damage
            );
        }


        /*
           Một số quái có thể
           bắn đạn từ xa.
        */

        if (
            enemy.type !== "fast" &&
            distance < 430 &&
            enemy.attackTimer <= 0
        ) {

            enemy.attackTimer =
                enemy.attackCooldown;

            shootEnemyBullet(
                enemy
            );
        }
    }
}


/* =========================================================
   ENEMY BULLET
========================================================= */

function shootEnemyBullet(enemy) {

    const dx =
        player.x -
        enemy.x;

    const dy =
        player.y -
        enemy.y;

    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (distance === 0) return;


    const speed = 230;


    enemyBullets.push({

        x: enemy.x,

        y: enemy.y,

        vx:
            dx /
            distance *
            speed,

        vy:
            dy /
            distance *
            speed,

        radius: 6,

        damage:
            enemy.damage * 0.55,

        life: 3
    });
}


/* =========================================================
   UPDATE ENEMY BULLETS
========================================================= */

function updateEnemyBullets(dt) {

    for (
        let i =
            enemyBullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            enemyBullets[i];


        bullet.x +=
            bullet.vx *
            dt;

        bullet.y +=
            bullet.vy *
            dt;

        bullet.life -= dt;


        const dx =
            bullet.x -
            player.x;

        const dy =
            bullet.y -
            player.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
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
            bullet.x < -50 ||
            bullet.x > WIDTH + 50 ||
            bullet.y < -50 ||
            bullet.y > HEIGHT + 50
        ) {

            enemyBullets.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   BOSS AI
========================================================= */

function updateBoss(
    boss,
    dt,
    distance
) {

    boss.attackTimer -= dt;

    boss.skillTimer -= dt;


    /* Boss contact attack */

    if (
        distance <
        boss.radius +
        player.radius +
        15
    ) {

        damagePlayer(
            boss.damage * dt
        );
    }


    /* Normal boss attack */

    if (
        boss.attackTimer <= 0
    ) {

        boss.attackTimer =
            boss.attackCooldown;

        bossShoot(
            boss
        );
    }


    /* Boss skill */

    if (
        boss.skillTimer <= 0
    ) {

        boss.skillTimer =
            boss.skillCooldown;

        bossSkill(
            boss
        );
    }


    updateBossUI();
}


/* =========================================================
   BOSS SHOOT
========================================================= */

function bossShoot(boss) {

    const baseAngle =
        Math.atan2(
            player.y - boss.y,
            player.x - boss.x
        );


    const count = 5;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            baseAngle +
            (
                i -
                (count - 1) / 2
            ) *
            0.18;


        bossProjectiles.push({

            x: boss.x,

            y: boss.y,

            vx:
                Math.cos(angle) *
                260,

            vy:
                Math.sin(angle) *
                260,

            radius: 8,

            damage: 13,

            life: 3
        });
    }
}


/* =========================================================
   BOSS SKILLS
========================================================= */

function bossSkill(boss) {

    const skill =
        Math.floor(
            Math.random() * 3
        );


    /* Shockwave */

    if (skill === 0) {

        effects.push({

            type: "shockwave",

            x: boss.x,

            y: boss.y,

            radius: 20,

            maxRadius: 280,

            life: 1
        });


        const dx =
            player.x -
            boss.x;

        const dy =
            player.y -
            boss.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance < 280
        ) {

            damagePlayer(
                25
            );
        }
    }


    /* Bullet circle */

    else if (skill === 1) {

        for (
            let i = 0;
            i < 16;
            i++
        ) {

            const angle =
                i /
                16 *
                Math.PI *
                2;


            bossProjectiles.push({

                x: boss.x,

                y: boss.y,

                vx:
                    Math.cos(angle) *
                    180,

                vy:
                    Math.sin(angle) *
                    180,

                radius: 7,

                damage: 10,

                life: 4
            });
        }
    }


    /* Target attack */

    else {

        for (
            let i = 0;
            i < 3;
            i++
        ) {

            setTimeout(() => {

                if (
                    !game.running
                ) return;


                const angle =
                    Math.atan2(
                        player.y -
                        boss.y,
                        player.x -
                        boss.x
                    );


                bossProjectiles.push({

                    x: boss.x,

                    y: boss.y,

                    vx:
                        Math.cos(angle) *
                        350,

                    vy:
                        Math.sin(angle) *
                        350,

                    radius: 10,

                    damage: 20,

                    life: 3
                });

            }, i * 250);
        }
    }


    game.screenShake =
        10;
}


/* =========================================================
   UPDATE BOSS PROJECTILES
========================================================= */

function updateBossProjectiles(dt) {

    for (
        let i =
            bossProjectiles.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bossProjectiles[i];


        bullet.x +=
            bullet.vx *
            dt;

        bullet.y +=
            bullet.vy *
            dt;

        bullet.life -= dt;


        const dx =
            bullet.x -
            player.x;

        const dy =
            bullet.y -
            player.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance <
            bullet.radius +
            player.radius
        ) {

            damagePlayer(
                bullet.damage
            );

            bossProjectiles.splice(
                i,
                1
            );

            continue;
        }


        if (
            bullet.life <= 0 ||
            bullet.x < -100 ||
            bullet.x > WIDTH + 100 ||
            bullet.y < -100 ||
            bullet.y > HEIGHT + 100
        ) {

            bossProjectiles.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   PLAYER DAMAGE
========================================================= */

function damagePlayer(
    damage
) {

    if (
        player.invincible > 0 ||
        !game.running
    ) {
        return;
    }


    player.hp -=
        damage;


    player.invincible =
        0.25;


    game.screenShake =
        Math.min(
            14,
            game.screenShake + 5
        );


    game.flash =
        0.08;


    updatePlayerUI();


    if (
        player.hp <= 0
    ) {

        player.hp = 0;

        endGame();
    }
}


/* =========================================================
   BOSS DEFEATED
========================================================= */

function bossDefeated() {

    game.bossActive =
        false;

    game.bossDefeated =
        true;

    bossHud.style.display =
        "none";


    /*
       Easy / Normal:
       mở khóa pet sau boss.
    */

    if (
        game.difficulty === "easy" ||
        game.difficulty === "normal"
    ) {

        if (!player.petUnlocked) {

            player.petUnlocked =
                true;

            pet.active =
                true;

            showItemPopup({

                icon: "🐾",

                name: "PET UNLOCKED",

                description:
                    "Pet chiến đấu đã tham gia"
            });
        }
    }


    game.score +=
        1000;


    createExplosion(
        WIDTH / 2,
        HEIGHT / 2,
        90
    );


    game.stageComplete =
        true;
}


/* =========================================================
   PET
========================================================= */

function updatePet(dt) {

    if (!pet.active) return;


    pet.orbit +=
        dt * 2;


    const targetX =
        player.x +
        Math.cos(pet.orbit) *
        45;

    const targetY =
        player.y +
        Math.sin(pet.orbit) *
        45;


    pet.x +=
        (targetX - pet.x) *
        Math.min(
            1,
            dt * 8
        );

    pet.y +=
        (targetY - pet.y) *
        Math.min(
            1,
            dt * 8
        );


    pet.fireTimer -= dt;


    if (
        pet.fireTimer <= 0
    ) {

        pet.fireTimer =
            pet.fireRate;


        const target =
            findNearestEnemy(
                pet.x,
                pet.y
            );


        if (target) {

            const angle =
                Math.atan2(
                    target.y - pet.y,
                    target.x - pet.x
                );


            bullets.push({

                x: pet.x,

                y: pet.y,

                vx:
                    Math.cos(angle) *
                    500,

                vy:
                    Math.sin(angle) *
                    500,

                radius: 4,

                damage:
                    pet.damage,

                element: null,

                life: 1.4
            });
        }
    }
}


/* =========================================================
   FIND NEAREST ENEMY
========================================================= */

function findNearestEnemy(
    x,
    y
) {

    let nearest = null;

    let nearestDistance =
        Infinity;


    enemies.forEach(
        enemy => {

            const dx =
                enemy.x - x;

            const dy =
                enemy.y - y;


            const distance =
                dx * dx +
                dy * dy;


            if (
                distance <
                nearestDistance
            ) {

                nearestDistance =
                    distance;

                nearest =
                    enemy;
            }
        }
    );


    return nearest;
}


/* =========================================================
   STAGE LOGIC
========================================================= */

function updateStage(dt) {

    if (
        game.stageComplete
    ) {

        game.transitionTimer += dt;


        if (
            game.transitionTimer >
            2
        ) {

            nextStage();
        }

        return;
    }


    game.stageTimer += dt;


    if (
        game.stage < 5
    ) {

        game.spawnTimer -= dt;


        if (
            game.spawnTimer <= 0 &&
            game.enemiesToSpawn > 0
        ) {

            game.spawnTimer =
                Math.max(
                    0.35,
                    1.1 -
                    game.stage * 0.08
                );

            spawnEnemy();
        }


        if (
            game.enemiesToSpawn <= 0 &&
            enemies.length === 0
        ) {

            game.stageComplete =
                true;

            game.transitionTimer =
                0;
        }

    }

    else {

        /*
           Màn 5:
           Boss xuất hiện khi toàn bộ
           quái thường đã bị tiêu diệt.
        */

        if (
            !game.bossActive &&
            !game.bossDefeated &&
            game.enemiesToSpawn > 0
        ) {

            game.spawnTimer -= dt;


            if (
                game.spawnTimer <= 0
            ) {

                game.spawnTimer =
                    0.9;

                spawnEnemy();
            }
        }


        if (
            game.enemiesToSpawn <= 0 &&
            !game.bossActive &&
            !game.bossDefeated &&
            enemies.length === 0
        ) {

            spawnBoss();
        }


        if (
            game.bossDefeated
        ) {

            game.stageComplete =
                true;
        }
    }
}


/* =========================================================
   NEXT STAGE
========================================================= */

function nextStage() {

    game.transitionTimer =
        0;


    if (
        game.stage >=
        game.maxStages
    ) {

        nextRound();

        return;
    }


    game.stage++;

    startStage();
}


/* =========================================================
   NEXT ROUND
========================================================= */

function nextRound() {

    game.round++;

    game.stage = 1;

    game.score += 2000;

    startStage();
}


/* =========================================================
   PARTICLES
========================================================= */

function createHitParticles(
    x,
    y,
    element
) {

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        particles.push({

            x,
            y,

            vx:
                (Math.random() - 0.5) *
                180,

            vy:
                (Math.random() - 0.5) *
                180,

            life: 0.35,

            maxLife: 0.35,

            size:
                2 +
                Math.random() * 3,

            element
        });
    }
}


function createExplosion(
    x,
    y,
    size
) {

    for (
        let i = 0;
        i < size / 3;
        i++
    ) {

        particles.push({

            x,
            y,

            vx:
                (Math.random() - 0.5) *
                size * 5,

            vy:
                (Math.random() - 0.5) *
                size * 5,

            life:
                0.5 +
                Math.random() * 0.5,

            maxLife: 1,

            size:
                2 +
                Math.random() * 5,

            element: "explosion"
        });
    }
}


/* =========================================================
   UPDATE PARTICLES
========================================================= */

function updateParticles(dt) {

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        const particle =
            particles[i];


        particle.x +=
            particle.vx *
            dt;

        particle.y +=
            particle.vy *
            dt;


        particle.vx *=
            0.97;

        particle.vy *=
            0.97;


        particle.life -=
            dt;


        if (
            particle.life <= 0
        ) {

            particles.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   EFFECTS
========================================================= */

function updateEffects(dt) {

    for (
        let i =
            effects.length - 1;
        i >= 0;
        i--
    ) {

        const effect =
            effects[i];


        effect.life -= dt;


        if (
            effect.type ===
            "shockwave"
        ) {

            effect.radius +=
                (
                    effect.maxRadius -
                    effect.radius
                ) *
                dt *
                5;
        }


        if (
            effect.life <= 0
        ) {

            effects.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   UPDATE UI
========================================================= */

function updatePlayerUI() {

    const percent =
        Math.max(
            0,
            player.hp /
            player.maxHp *
            100
        );


    playerHpBar.style.width =
        percent + "%";


    playerHpText.textContent =
        `${Math.ceil(player.hp)}
         / ${player.maxHp}`;


    scoreElement.textContent =
        String(
            game.score
        ).padStart(
            6,
            "0"
        );


    weaponLevelElement.textContent =
        player.weaponLevel;


    if (
        player.element
    ) {

        weaponNameElement.textContent =
            `CYBER GUN · ${
                player.element.toUpperCase()
            }`;
    }

    else {

        weaponNameElement.textContent =
            player.ultraGun
                ? "ULTRA GUN"
                : "CYBER GUN";
    }


    enemyCountElement.textContent =
        enemies.length;
}


/* =========================================================
   DRAW BACKGROUND
========================================================= */

function drawBackground() {

    ctx.fillStyle =
        "#030711";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /* Grid */

    const grid =
        45;


    ctx.strokeStyle =
        "rgba(0,220,255,0.055)";

    ctx.lineWidth = 1;


    for (
        let x = 0;
        x < WIDTH;
        x += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            HEIGHT
        );

        ctx.stroke();
    }


    for (
        let y = 0;
        y < HEIGHT;
        y += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            WIDTH,
            y
        );

        ctx.stroke();
    }


    /* Center glow */

    const gradient =
        ctx.createRadialGradient(
            WIDTH / 2,
            HEIGHT / 2,
            0,
            WIDTH / 2,
            HEIGHT / 2,
            Math.max(
                WIDTH,
                HEIGHT
            ) * 0.6
        );


    gradient.addColorStop(
        0,
        "rgba(0,180,255,0.08)"
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
        WIDTH,
        HEIGHT
    );
}


/* =========================================================
   DRAW PLAYER
========================================================= */

function drawPlayer() {

    ctx.save();


    if (
        player.invincible > 0 &&
        Math.floor(
            player.invincible * 20
        ) % 2 === 0
    ) {

        ctx.globalAlpha = 0.35;
    }


    /* Glow */

    ctx.shadowBlur = 25;
    ctx.shadowColor =
        "#00eaff";


    /* Body */

    ctx.fillStyle =
        "#00cfff";


    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Core */

    ctx.shadowBlur = 0;

    ctx.fillStyle =
        "#e8ffff";


    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Direction indicator */

    let dirX =
        joystickState.x;

    let dirY =
        joystickState.y;


    if (
        Math.abs(dirX) < 0.1 &&
        Math.abs(dirY) < 0.1
    ) {

        dirX = 0;
        dirY = -1;
    }


    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(
        player.x,
        player.y
    );

    ctx.lineTo(
        player.x +
        dirX * 27,

        player.y +
        dirY * 27
    );

    ctx.stroke();


    ctx.restore();
}


/* =========================================================
   DRAW PET
========================================================= */

function drawPet() {

    if (!pet.active) return;


    ctx.save();

    ctx.shadowBlur = 18;

    ctx.shadowColor =
        "#b64cff";


    ctx.fillStyle =
        "#b64cff";


    ctx.beginPath();

    ctx.arc(
        pet.x,
        pet.y,
        pet.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#ffffff";


    ctx.beginPath();

    ctx.arc(
        pet.x,
        pet.y,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();
}


/* =========================================================
   DRAW ENEMIES
========================================================= */

function drawEnemies() {

    enemies.forEach(
        enemy => {

            ctx.save();


            if (enemy.boss) {

                drawBoss(
                    enemy
                );

                ctx.restore();

                return;
            }


            ctx.shadowBlur =
                enemy.type === "tank"
                    ? 20
                    : 12;


            ctx.shadowColor =
                enemy.type === "fast"
                    ? "#ff2bd6"
                    : "#ff3b4f";


            ctx.fillStyle =
                enemy.type === "tank"
                    ? "#9b162e"
                    : enemy.type === "fast"
                        ? "#c72ca9"
                        : "#d92740";


            ctx.beginPath();

            ctx.arc(
                enemy.x,
                enemy.y,
                enemy.radius,
                0,
                Math.PI * 2
            );

            ctx.fill();


            /* Eyes */

            ctx.shadowBlur = 0;

            ctx.fillStyle =
                "#ffffff";


            ctx.beginPath();

            ctx.arc(
                enemy.x - 5,
                enemy.y - 3,
                3,
                0,
                Math.PI * 2
            );

            ctx.arc(
                enemy.x + 5,
                enemy.y - 3,
                3,
                0,
                Math.PI * 2
            );

            ctx.fill();


            /* HP */

            const hpPercent =
                enemy.hp /
                enemy.maxHp;


            ctx.fillStyle =
                "rgba(0,0,0,0.6)";


            ctx.fillRect(
                enemy.x -
                enemy.radius,

                enemy.y -
                enemy.radius -
                8,

                enemy.radius * 2,

                4
            );


            ctx.fillStyle =
                "#ff304f";


            ctx.fillRect(
                enemy.x -
                enemy.radius,

                enemy.y -
                enemy.radius -
                8,

                enemy.radius *
                2 *
                hpPercent,

                4
            );


            ctx.restore();
        }
    );
}


/* =========================================================
   DRAW BOSS
========================================================= */

function drawBoss(boss) {

    ctx.save();


    const pulse =
        Math.sin(
            performance.now() *
            0.005
        ) * 4;


    /* Aura */

    ctx.shadowBlur =
        35;

    ctx.shadowColor =
        "#ff174f";


    ctx.fillStyle =
        "#701329";


    ctx.beginPath();

    ctx.arc(
        boss.x,
        boss.y,
        boss.radius + pulse,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Demon horns */

    ctx.shadowBlur = 0;

    ctx.fillStyle =
        "#ff315c";


    ctx.beginPath();

    ctx.moveTo(
        boss.x - 25,
        boss.y - 28
    );

    ctx.lineTo(
        boss.x - 38,
        boss.y - 58
    );

    ctx.lineTo(
        boss.x - 8,
        boss.y - 35
    );

    ctx.closePath();

    ctx.fill();


    ctx.beginPath();

    ctx.moveTo(
        boss.x + 25,
        boss.y - 28
    );

    ctx.lineTo(
        boss.x + 38,
        boss.y - 58
    );

    ctx.lineTo(
        boss.x + 8,
        boss.y - 35
    );

    ctx.closePath();

    ctx.fill();


    /* Face */

    ctx.fillStyle =
        "#d9274e";


    ctx.beginPath();

    ctx.arc(
        boss.x,
        boss.y,
        boss.radius - 5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Eyes */

    ctx.fillStyle =
        "#ffe600";


    ctx.shadowBlur =
        15;

    ctx.shadowColor =
        "#ffe600";


    ctx.beginPath();

    ctx.arc(
        boss.x - 17,
        boss.y - 8,
        7,
        0,
        Math.PI * 2
    );

    ctx.arc(
        boss.x + 17,
        boss.y - 8,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Mouth */

    ctx.shadowBlur = 0;

    ctx.strokeStyle =
        "#21030a";

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.arc(
        boss.x,
        boss.y + 8,
        18,
        0,
        Math.PI
    );

    ctx.stroke();


    ctx.restore();
}


/* =========================================================
   DRAW BULLETS
========================================================= */

function drawBullets() {

    bullets.forEach(
        bullet => {

            ctx.save();

            ctx.shadowBlur =
                15;

            ctx.shadowColor =
                getElementColor(
                    bullet.element
                );


            ctx.fillStyle =
                getElementColor(
                    bullet.element
                );


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
    );
}


/* =========================================================
   ELEMENT COLORS
========================================================= */

function getElementColor(
    element
) {

    if (
        element === "fire"
    ) {
        return "#ff5722";
    }

    if (
        element === "lightning"
    ) {
        return "#ffe600";
    }

    if (
        element === "ice"
    ) {
        return "#8deaff";
    }

    return "#00eaff";
}


/* =========================================================
   DRAW ENEMY BULLETS
========================================================= */

function drawEnemyBullets() {

    enemyBullets.forEach(
        bullet => {

            ctx.save();

            ctx.shadowBlur =
                12;

            ctx.shadowColor =
                "#ff315c";

            ctx.fillStyle =
                "#ff315c";


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
    );
}


/* =========================================================
   DRAW BOSS PROJECTILES
========================================================= */

function drawBossProjectiles() {

    bossProjectiles.forEach(
        bullet => {

            ctx.save();

            ctx.shadowBlur =
                20;

            ctx.shadowColor =
                "#ff00d9";

            ctx.fillStyle =
                "#ff00d9";


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
    );
}


/* =========================================================
   DRAW ITEMS
========================================================= */

function drawItems() {

    items.forEach(
        item => {

            const data =
                itemData[item.type];


            const pulse =
                Math.sin(
                    item.pulse
                ) * 3;


            ctx.save();


            ctx.shadowBlur =
                20;

            ctx.shadowColor =
                "#00ffcf";


            ctx.fillStyle =
                "rgba(0,255,210,0.12)";


            ctx.beginPath();

            ctx.arc(
                item.x,
                item.y,
                item.radius +
                pulse,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.shadowBlur = 0;

            ctx.font =
                "20px Arial";

            ctx.textAlign =
                "center";

            ctx.textBaseline =
                "middle";


            ctx.fillText(
                data.icon,
                item.x,
                item.y
            );


            ctx.restore();
        }
    );
}


/* =========================================================
   DRAW PARTICLES
========================================================= */

function drawParticles() {

    particles.forEach(
        particle => {

            const alpha =
                Math.max(
                    0,
                    particle.life /
                    particle.maxLife
                );


            ctx.save();

            ctx.globalAlpha =
                alpha;


            ctx.fillStyle =
                particle.element ===
                "explosion"
                    ? "#ff315c"
                    : getElementColor(
                        particle.element
                    );


            ctx.fillRect(
                particle.x,
                particle.y,
                particle.size,
                particle.size
            );


            ctx.restore();
        }
    );
}


/* =========================================================
   DRAW EFFECTS
========================================================= */

function drawEffects() {

    effects.forEach(
        effect => {

            if (
                effect.type ===
                "shockwave"
            ) {

                ctx.save();

                ctx.strokeStyle =
                    `rgba(255,30,100,${effect.life})`;

                ctx.lineWidth = 5;

                ctx.shadowBlur =
                    20;

                ctx.shadowColor =
                    "#ff174f";


                ctx.beginPath();

                ctx.arc(
                    effect.x,
                    effect.y,
                    effect.radius,
                    0,
                    Math.PI * 2
                );

                ctx.stroke();

                ctx.restore();
            }
        }
    );
}


/* =========================================================
   DRAW
========================================================= */

function draw() {

    ctx.save();


    if (
        game.screenShake > 0
    ) {

        const shake =
            game.screenShake;

        ctx.translate(
            (Math.random() - 0.5) *
            shake,

            (Math.random() - 0.5) *
            shake
        );

        game.screenShake *=
            0.9;
    }


    drawBackground();

    drawItems();

    drawParticles();

    drawEffects();

    drawEnemyBullets();

    drawBossProjectiles();

    drawBullets();

    drawEnemies();

    drawPet();

    drawPlayer();


    ctx.restore();


    if (
        game.flash > 0
    ) {

        ctx.fillStyle =
            `rgba(255,0,60,${
                game.flash * 2
            })`;

        ctx.fillRect(
            0,
            0,
            WIDTH,
            HEIGHT
        );

        game.flash -=
            0.016;
    }
}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(time) {

    if (!game.running) {
        return;
    }


    let dt =
        (time -
        game.lastTime) /
        1000;


    game.lastTime =
        time;


    /*
       Tránh game chạy quá nhanh
       nếu tab bị lag / chuyển app.
    */

    dt =
        Math.min(
            dt,
            0.033
        );


    updatePlayer(dt);

    updateAutoFire(dt);

    updateBullets(dt);

    updateEnemies(dt);

    updateEnemyBullets(dt);

    updateBossProjectiles(dt);

    updateItems(dt);

    updatePet(dt);

    updateParticles(dt);

    updateEffects(dt);

    updateStage(dt);

    updatePlayerUI();

    draw();


    requestAnimationFrame(
        gameLoop
    );
}


/* =========================================================
   GAME OVER
========================================================= */

function endGame() {

    game.running =
        false;

    game.gameOver =
        true;


    messageTitle.textContent =
        "GAME OVER";

    messageText.textContent =
        `SCORE ${game.score}`;

    startButton.textContent =
        "RESTART";


    gameMessage.style.display =
        "block";
}


/* =========================================================
   INITIALIZE
========================================================= */

resizeCanvas();

updatePlayerUI();


/* =========================================================
   DEV DIFFICULTY
   Có thể thay đổi sau này thành
   màn hình chọn độ khó.
========================================================= */

game.difficulty =
    "normal";


/* =========================================================
   END SCRIPT
========================================================= */