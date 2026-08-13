/* =====================================================
   DEADLINE MAYHEM
   SCRIPT.JS
===================================================== */

"use strict";


/* =====================================================
   CANVAS
===================================================== */

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");


/* =====================================================
   DOM
===================================================== */

const startScreen =
    document.getElementById("start-screen");

const gameOverScreen =
    document.getElementById("game-over");

const winScreen =
    document.getElementById("win-screen");

const startButton =
    document.getElementById("start-button");

const restartButton =
    document.getElementById("restart-button");

const playAgainButton =
    document.getElementById("play-again");

const hpFill =
    document.getElementById("hp-fill");

const hpText =
    document.getElementById("hp-text");

const scoreText =
    document.getElementById("score");

const comboText =
    document.getElementById("combo");

const waveText =
    document.getElementById("wave");

const objectiveText =
    document.getElementById("objective");

const eventMessage =
    document.getElementById("event-message");

const eventTitle =
    document.getElementById("event-title");

const eventSubtitle =
    document.getElementById("event-subtitle");

const itemPopup =
    document.getElementById("item-popup");

const bossUI =
    document.getElementById("boss-ui");

const bossFill =
    document.getElementById("boss-fill");

const finalScore =
    document.getElementById("final-score");

const winScore =
    document.getElementById("win-score");

const pauseButton =
    document.getElementById("pause-button");

const joystick =
    document.getElementById("joystick");

const joystickStick =
    document.getElementById("joystick-stick");

const coffeeButton =
    document.getElementById("coffee-button");

const specialButton =
    document.getElementById("special-button");


/* =====================================================
   GAME STATE
===================================================== */

let gameRunning = false;
let paused = false;

let lastTime = 0;

let score = 0;

let combo = 0;

let comboTimer = 0;

let wave = 1;

let waveTimer = 0;

let waveDuration = 25000;

let bossSpawned = false;

let bossDefeated = false;

let screenShake = 0;

let eventTimer = 0;


/* =====================================================
   INPUT
===================================================== */

const keys = {};

window.addEventListener(
    "keydown",
    event => {

        keys[event.key.toLowerCase()] = true;

        if (
            event.key === " " ||
            event.key === "Enter"
        ) {
            event.preventDefault();
        }
    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[event.key.toLowerCase()] = false;
    }
);


/* =====================================================
   MOBILE JOYSTICK
===================================================== */

const joystickState = {

    active: false,

    x: 0,

    y: 0

};


function updateJoystick(
    clientX,
    clientY
) {

    const rect =
        joystick.getBoundingClientRect();

    const centerX =
        rect.left + rect.width / 2;

    const centerY =
        rect.top + rect.height / 2;

    let dx =
        clientX - centerX;

    let dy =
        clientY - centerY;

    const radius =
        rect.width * .38;

    const distance =
        Math.hypot(dx, dy);

    if (distance > radius) {

        dx =
            dx / distance * radius;

        dy =
            dy / distance * radius;
    }

    joystickState.x =
        dx / radius;

    joystickState.y =
        dy / radius;

    joystickStick.style.transform =
        `translate(
            calc(-50% + ${dx}px),
            calc(-50% + ${dy}px)
        )`;
}


function resetJoystick() {

    joystickState.active = false;

    joystickState.x = 0;
    joystickState.y = 0;

    joystickStick.style.transform =
        "translate(-50%, -50%)";
}


joystick.addEventListener(
    "pointerdown",
    event => {

        joystickState.active = true;

        joystick.setPointerCapture(
            event.pointerId
        );

        updateJoystick(
            event.clientX,
            event.clientY
        );
    }
);


joystick.addEventListener(
    "pointermove",
    event => {

        if (!joystickState.active) {
            return;
        }

        updateJoystick(
            event.clientX,
            event.clientY
        );
    }
);


joystick.addEventListener(
    "pointerup",
    resetJoystick
);

joystick.addEventListener(
    "pointercancel",
    resetJoystick
);


/* =====================================================
   PLAYER
===================================================== */

const player = {

    x: 0,

    y: 0,

    radius: 20,

    speed: 280,

    maxHp: 100,

    hp: 100,

    damage: 12,

    fireRate: 420,

    fireTimer: 0,

    invincible: 0,

    coffee: 0,

    special: 0,

    facingX: 1,

    facingY: 0

};


/* =====================================================
   ENEMIES
===================================================== */

const enemies = [];

const bullets = [];

const enemyBullets = [];

const particles = [];

const pickups = [];


/* =====================================================
   BOSS
===================================================== */

let boss = null;


/* =====================================================
   RESIZE
===================================================== */

function resizeCanvas() {

    const rect =
        canvas.getBoundingClientRect();

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    canvas.width =
        rect.width * dpr;

    canvas.height =
        rect.height * dpr;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );
}


window.addEventListener(
    "resize",
    resizeCanvas
);

resizeCanvas();


function width() {

    return canvas.clientWidth;
}


function height() {

    return canvas.clientHeight;
}


/* =====================================================
   START GAME
===================================================== */

function startGame() {

    gameRunning = true;

    paused = false;

    score = 0;

    combo = 0;

    comboTimer = 0;

    wave = 1;

    waveTimer = 0;

    bossSpawned = false;

    bossDefeated = false;

    boss = null;

    enemies.length = 0;

    bullets.length = 0;

    enemyBullets.length = 0;

    particles.length = 0;

    pickups.length = 0;

    player.hp = player.maxHp;

    player.x =
        width() * .5;

    player.y =
        height() * .65;

    player.speed = 280;

    player.damage = 12;

    player.fireRate = 420;

    player.fireTimer = 0;

    startScreen.style.display =
        "none";

    gameOverScreen.style.display =
        "none";

    winScreen.style.display =
        "none";

    bossUI.classList.remove(
        "active"
    );

    showEvent(
        "MỘT NGÀY BÌNH THƯỜNG",
        "Cho đến khi sếp gửi tin: 'Em rảnh không?'"
    );

    updateHUD();
}


/* =====================================================
   EVENTS
===================================================== */

function showEvent(
    title,
    subtitle
) {

    eventTitle.textContent =
        title;

    eventSubtitle.textContent =
        subtitle;

    eventMessage.classList.add(
        "show"
    );

    eventTimer = 2500;
}


function updateEvent(dt) {

    if (eventTimer <= 0) {
        return;
    }

    eventTimer -= dt;

    if (eventTimer <= 0) {

        eventMessage.classList.remove(
            "show"
        );
    }
}


/* =====================================================
   RANDOM EVENTS
===================================================== */

function randomOfficeEvent() {

    const events = [

        [
            "☕ CÀ PHÊ ĐẾN!",
            "Tốc độ tăng 35% trong 5 giây."
        ],

        [
            "📧 47 EMAIL MỚI!",
            "Tại sao chúng ta phải chịu đựng điều này?"
        ],

        [
            "💰 TĂNG LƯƠNG!",
            "À xin lỗi... gửi nhầm người."
        ],

        [
            "📅 HỌP ĐỘT XUẤT!",
            "Không ai biết họp về cái gì."
        ],

        [
            "😈 DEADLINE TĂNG CA!",
            "Kẻ địch nhanh hơn!"
        ]

    ];

    const selected =
        events[
            Math.floor(
                Math.random() *
                events.length
            )
        ];

    showEvent(
        selected[0],
        selected[1]
    );

    if (
        selected[0].includes("CÀ PHÊ")
    ) {

        player.speed *= 1.35;

        setTimeout(
            () => {
                player.speed /= 1.35;
            },
            5000
        );
    }
}


/* =====================================================
   WAVE
===================================================== */

function updateWave(dt) {

    if (bossSpawned) {
        return;
    }

    waveTimer += dt;

    if (
        waveTimer >= waveDuration
    ) {

        waveTimer = 0;

        wave++;

        if (wave >= 5) {

            spawnBoss();

            return;
        }

        showEvent(
            `WAVE ${wave}`,
            getWaveText()
        );
    }

    if (
        Math.random() < dt / 1800
    ) {

        spawnEnemy();
    }

    if (
        Math.random() < dt / 6500
    ) {

        randomOfficeEvent();
    }
}


function getWaveText() {

    const texts = [

        "Deadline bắt đầu chạy.",

        "Email đang nổi giận.",

        "Task đang nhân bản.",

        "Sếp đang online.",

        "KHÔNG CÒN ĐƯỜNG LÙI."
    ];

    return texts[
        Math.min(
            wave - 1,
            texts.length - 1
        )
    ];
}


/* =====================================================
   SPAWN ENEMY
===================================================== */

function spawnEnemy() {

    const side =
        Math.floor(
            Math.random() * 4
        );

    let x;
    let y;

    if (side === 0) {

        x = -40;
        y = Math.random() * height();

    } else if (side === 1) {

        x = width() + 40;
        y = Math.random() * height();

    } else if (side === 2) {

        x = Math.random() * width();
        y = -40;

    } else {

        x = Math.random() * width();
        y = height() + 40;
    }


    const types = [

        {
            name: "DEADLINE",
            emoji: "📄",
            hp: 30,
            speed: 80,
            damage: 7,
            radius: 18
        },

        {
            name: "EMAIL",
            emoji: "📧",
            hp: 22,
            speed: 120,
            damage: 5,
            radius: 16
        },

        {
            name: "TASK",
            emoji: "📋",
            hp: 45,
            speed: 60,
            damage: 10,
            radius: 21
        },

        {
            name: "MEETING",
            emoji: "📅",
            hp: 70,
            speed: 45,
            damage: 14,
            radius: 25
        }

    ];


    const type =
        types[
            Math.floor(
                Math.random() *
                types.length
            )
        ];


    const enemy = {

        x,

        y,

        radius: type.radius,

        hp:
            type.hp *
            (1 + wave * .12),

        maxHp:
            type.hp *
            (1 + wave * .12),

        speed:
            type.speed *
            (1 + wave * .07),

        damage:
            type.damage *
            (1 + wave * .05),

        emoji: type.emoji,

        name: type.name,

        attackTimer:
            700 +
            Math.random() * 700,

        hitFlash: 0
    };


    enemies.push(enemy);
}


/* =====================================================
   BOSS
===================================================== */

function spawnBoss() {

    bossSpawned = true;

    boss = {

        x: width() / 2,

        y: -100,

        radius: 48,

        hp: 1200,

        maxHp: 1200,

        speed: 55,

        damage: 18,

        attackTimer: 1500,

        skillTimer: 5000,

        phase: 1,

        hitFlash: 0
    };

    bossUI.classList.add(
        "active"
    );

    showEvent(
        "👔 SẾP TỔNG ĐÃ XUẤT HIỆN",
        "EM CÓ THỂ Ở LẠI TĂNG CA KHÔNG?"
    );
}


/* =====================================================
   PLAYER MOVEMENT
===================================================== */

function updatePlayer(dt) {

    let dx = 0;
    let dy = 0;


    if (
        keys["w"] ||
        keys["arrowup"]
    ) {

        dy -= 1;
    }

    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        dy += 1;
    }

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        dx -= 1;
    }

    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        dx += 1;
    }


    if (joystickState.active) {

        dx =
            joystickState.x;

        dy =
            joystickState.y;
    }


    const length =
        Math.hypot(dx, dy);


    if (length > 0) {

        dx /= length;
        dy /= length;

        player.x +=
            dx *
            player.speed *
            dt / 1000;

        player.y +=
            dy *
            player.speed *
            dt / 1000;

        player.facingX = dx;
        player.facingY = dy;
    }


    const margin = 25;

    player.x =
        Math.max(
            margin,
            Math.min(
                width() - margin,
                player.x
            )
        );

    player.y =
        Math.max(
            margin,
            Math.min(
                height() - margin,
                player.y
            )
        );


    if (
        player.invincible > 0
    ) {

        player.invincible -= dt;
    }
}


/* =====================================================
   AUTO FIRE
===================================================== */

function updateAutoFire(dt) {

    player.fireTimer -= dt;

    if (
        player.fireTimer <= 0
    ) {

        fireBullet();

        player.fireTimer =
            player.fireRate;
    }
}


/* =====================================================
   FIND NEAREST ENEMY
   ONLY FOR SHOOTING DIRECTION
===================================================== */

function getNearestEnemy() {

    let nearest = null;

    let bestDistance =
        Infinity;


    for (
        const enemy of enemies
    ) {

        const dx =
            enemy.x -
            player.x;

        const dy =
            enemy.y -
            player.y;

        const distance =
            Math.hypot(dx, dy);


        if (
            distance <
            bestDistance
        ) {

            bestDistance =
                distance;

            nearest =
                enemy;
        }
    }


    if (boss) {

        const dx =
            boss.x -
            player.x;

        const dy =
            boss.y -
            player.y;

        const distance =
            Math.hypot(dx, dy);


        if (
            distance <
            bestDistance
        ) {

            nearest =
                boss;
        }
    }


    return nearest;
}


/* =====================================================
   SHOOT
===================================================== */

function fireBullet() {

    const target =
        getNearestEnemy();


    /*
        AUTO FIRE ONLY.

        Không auto-aim:
        Nếu không có mục tiêu thì
        bắn theo hướng nhân vật đang di chuyển.
    */

    let dx =
        player.facingX;

    let dy =
        player.facingY;


    if (target) {

        dx =
            target.x -
            player.x;

        dy =
            target.y -
            player.y;

        const length =
            Math.hypot(dx, dy);

        if (length > 0) {

            dx /= length;
            dy /= length;
        }
    }


    bullets.push({

        x:
            player.x,

        y:
            player.y,

        vx:
            dx * 650,

        vy:
            dy * 650,

        radius: 5,

        damage:
            player.damage,

        life: 1200
    });
}


/* =====================================================
   UPDATE BULLETS
===================================================== */

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


        if (
            bullet.life <= 0 ||
            bullet.x < -100 ||
            bullet.x > width() + 100 ||
            bullet.y < -100 ||
            bullet.y > height() + 100
        ) {

            bullets.splice(i, 1);
        }
    }
}


/* =====================================================
   UPDATE ENEMIES
===================================================== */

function updateEnemies(dt) {

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;

        const distance =
            Math.hypot(dx, dy);


        if (distance > 0) {

            enemy.x +=
                dx / distance *
                enemy.speed *
                dt / 1000;

            enemy.y +=
                dy / distance *
                enemy.speed *
                dt / 1000;
        }


        enemy.attackTimer -= dt;

        enemy.hitFlash -= dt;


        if (
            enemy.attackTimer <= 0
        ) {

            enemyAttack(enemy);

            enemy.attackTimer =
                1100 +
                Math.random() * 900;
        }


        if (
            distance <
            player.radius +
            enemy.radius
        ) {

            damagePlayer(
                enemy.damage
            );

            enemy.x -=
                dx / Math.max(distance, 1) *
                25;

            enemy.y -=
                dy / Math.max(distance, 1) *
                25;
        }
    }
}


/* =====================================================
   ENEMY ATTACK
===================================================== */

function enemyAttack(enemy) {

    const dx =
        player.x -
        enemy.x;

    const dy =
        player.y -
        enemy.y;

    const distance =
        Math.hypot(dx, dy);


    if (distance <= 0) {
        return;
    }


    enemyBullets.push({

        x: enemy.x,

        y: enemy.y,

        vx:
            dx / distance * 250,

        vy:
            dy / distance * 250,

        radius: 5,

        damage:
            enemy.damage * .6,

        life: 2200
    });
}


/* =====================================================
   UPDATE ENEMY BULLETS
===================================================== */

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
            dt / 1000;

        bullet.y +=
            bullet.vy *
            dt / 1000;

        bullet.life -= dt;


        if (
            bullet.life <= 0
        ) {

            enemyBullets.splice(i, 1);

            continue;
        }


        const distance =
            Math.hypot(
                bullet.x -
                player.x,

                bullet.y -
                player.y
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
        }
    }
}


/* =====================================================
   BOSS UPDATE
===================================================== */

function updateBoss(dt) {

    if (!boss) {
        return;
    }


    const dx =
        player.x -
        boss.x;

    const dy =
        player.y -
        boss.y;

    const distance =
        Math.hypot(dx, dy);


    if (
        boss.y < height() * .25
    ) {

        boss.y +=
            50 *
            dt / 1000;

        return;
    }


    if (distance > 180) {

        boss.x +=
            dx / distance *
            boss.speed *
            dt / 1000;

        boss.y +=
            dy / distance *
            boss.speed *
            dt / 1000;
    }


    boss.attackTimer -= dt;

    boss.skillTimer -= dt;

    boss.hitFlash -= dt;


    if (
        boss.attackTimer <= 0
    ) {

        bossAttack();

        boss.attackTimer =
            900;
    }


    if (
        boss.skillTimer <= 0
    ) {

        bossSkill();

        boss.skillTimer =
            5000;
    }


    if (
        distance <
        player.radius +
        boss.radius
    ) {

        damagePlayer(
            boss.damage
        );
    }
}


/* =====================================================
   BOSS ATTACK
===================================================== */

function bossAttack() {

    const count = 7;

    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            Math.atan2(
                player.y - boss.y,
                player.x - boss.x
            ) +
            (
                i -
                (count - 1) / 2
            ) *
            .12;


        enemyBullets.push({

            x: boss.x,

            y: boss.y,

            vx:
                Math.cos(angle) *
                260,

            vy:
                Math.sin(angle) *
                260,

            radius: 6,

            damage: 10,

            life: 3000
        });
    }
}


/* =====================================================
   BOSS SKILL
===================================================== */

function bossSkill() {

    const skills = [

        bossRain,

        bossShockwave,

        bossSummon
    ];


    const skill =
        skills[
            Math.floor(
                Math.random() *
                skills.length
            )
        ];


    skill();
}


/* BOSS SKILL 1 */

function bossRain() {

    showEvent(
        "📧 EMAIL STORM!",
        "Sếp vừa gửi thêm 999 email."
    );


    for (
        let i = 0;
        i < 18;
        i++
    ) {

        const x =
            Math.random() *
            width();

        const y =
            -30;


        enemyBullets.push({

            x,

            y,

            vx:
                (
                    player.x -
                    x
                ) / 2,

            vy:
                240 +
                Math.random() * 120,

            radius: 8,

            damage: 12,

            life: 3500
        });
    }
}


/* BOSS SKILL 2 */

function bossShockwave() {

    showEvent(
        "💥 HỌP KHẨN!",
        "Tất cả mọi người ngồi yên!"
    );


    const count = 20;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            (
                Math.PI * 2 *
                i
            ) /
            count;


        enemyBullets.push({

            x: boss.x,

            y: boss.y,

            vx:
                Math.cos(angle) *
                210,

            vy:
                Math.sin(angle) *
                210,

            radius: 7,

            damage: 14,

            life: 2500
        });
    }
}


/* BOSS SKILL 3 */

function bossSummon() {

    showEvent(
        "📋 TASK NHÂN BẢN!",
        "Sếp vừa giao thêm việc."
    );


    for (
        let i = 0;
        i < 4;
        i++
    ) {

        spawnEnemy();
    }
}


/* =====================================================
   BULLET COLLISION
===================================================== */

function checkBulletHits() {

    for (
        let i =
            bullets.length - 1;

        i >= 0;

        i--
    ) {

        const bullet =
            bullets[i];

        let hit = false;


        /* ENEMIES */

        for (
            let j =
                enemies.length - 1;

            j >= 0;

            j--
        ) {

            const enemy =
                enemies[j];


            const distance =
                Math.hypot(
                    bullet.x -
                    enemy.x,

                    bullet.y -
                    enemy.y
                );


            if (
                distance <
                bullet.radius +
                enemy.radius
            ) {

                enemy.hp -=
                    bullet.damage;

                enemy.hitFlash =
                    100;

                createHitParticles(
                    enemy.x,
                    enemy.y
                );

                hit = true;


                if (
                    enemy.hp <= 0
                ) {

                    killEnemy(
                        enemy
                    );

                    enemies.splice(
                        j,
                        1
                    );
                }

                break;
            }
        }


        /* BOSS */

        if (
            !hit &&
            boss
        ) {

            const distance =
                Math.hypot(
                    bullet.x -
                    boss.x,

                    bullet.y -
                    boss.y
                );


            if (
                distance <
                bullet.radius +
                boss.radius
            ) {

                boss.hp -=
                    bullet.damage;

                boss.hitFlash =
                    100;

                createHitParticles(
                    boss.x,
                    boss.y
                );

                hit = true;


                if (
                    boss.hp <= 0
                ) {

                    killBoss();
                }
            }
        }


        if (hit) {

            bullets.splice(
                i,
                1
            );
        }
    }
}


/* =====================================================
   KILL ENEMY
===================================================== */

function killEnemy(enemy) {

    score +=
        100;

    combo++;

    comboTimer =
        1800;


    if (
        Math.random() < .18
    ) {

        spawnPickup(
            enemy.x,
            enemy.y
        );
    }


    createExplosion(
        enemy.x,
        enemy.y
    );


    if (
        combo % 10 === 0
    ) {

        showEvent(
            `COMBO x${combo}`,
            "Bạn đang làm việc quá năng suất."
        );
    }
}


/* =====================================================
   KILL BOSS
===================================================== */

function killBoss() {

    score += 5000;

    bossDefeated = true;

    boss = null;

    bossUI.classList.remove(
        "active"
    );

    createExplosion(
        width() / 2,
        height() / 2
    );


    showEvent(
        "🏆 SẾP ĐÃ BỊ ĐÁNH BẠI!",
        "Ngày mai vẫn phải đi làm."
    );


    setTimeout(
        winGame,
        2500
    );
}


/* =====================================================
   PICKUPS
===================================================== */

function spawnPickup(x, y) {

    const types = [

        {
            name: "COFFEE",
            emoji: "☕"
        },

        {
            name: "MONEY",
            emoji: "💰"
        },

        {
            name: "SLEEP",
            emoji: "💤"
        },

        {
            name: "PIZZA",
            emoji: "🍕"
        }

    ];


    const type =
        types[
            Math.floor(
                Math.random() *
                types.length
            )
        ];


    pickups.push({

        x,

        y,

        radius: 14,

        type:
            type.name,

        emoji:
            type.emoji,

        life: 10000
    });
}


/* =====================================================
   UPDATE PICKUPS
===================================================== */

function updatePickups(dt) {

    for (
        let i =
            pickups.length - 1;

        i >= 0;

        i--
    ) {

        const item =
            pickups[i];

        item.life -= dt;


        if (
            item.life <= 0
        ) {

            pickups.splice(i, 1);

            continue;
        }


        const distance =
            Math.hypot(
                item.x -
                player.x,

                item.y -
                player.y
            );


        if (
            distance <
            player.radius +
            item.radius
        ) {

            collectPickup(
                item
            );

            pickups.splice(
                i,
                1
            );
        }
    }
}


/* =====================================================
   COLLECT PICKUP
===================================================== */

function collectPickup(item) {

    if (
        item.type === "COFFEE"
    ) {

        player.hp =
            Math.min(
                player.maxHp,
                player.hp + 25
            );

        player.speed += 20;

        popup(
            "☕ CÀ PHÊ! +25 HP"
        );
    }


    if (
        item.type === "MONEY"
    ) {

        score += 500;

        popup(
            "💰 TIỀN THƯỞNG! +500"
        );
    }


    if (
        item.type === "SLEEP"
    ) {

        player.fireRate =
            Math.max(
                180,
                player.fireRate - 60
            );

        popup(
            "💤 NGỦ 5 PHÚT! BẮN NHANH HƠN"
        );
    }


    if (
        item.type === "PIZZA"
    ) {

        player.damage += 4;

        popup(
            "🍕 PIZZA! DAMAGE +4"
        );
    }
}


/* =====================================================
   PLAYER DAMAGE
===================================================== */

function damagePlayer(
    amount
) {

    if (
        player.invincible > 0
    ) {

        return;
    }


    player.hp -= amount;

    player.invincible =
        350;

    screenShake =
        Math.max(
            screenShake,
            10
        );


    createHitParticles(
        player.x,
        player.y
    );


    if (
        player.hp <= 0
    ) {

        player.hp = 0;

        gameOver();
    }


    updateHUD();
}


/* =====================================================
   SPECIAL
===================================================== */

function useSpecial() {

    if (
        !gameRunning ||
        paused
    ) {

        return;
    }


    /*
        SPECIAL =
        "TÔI XIN NGHỈ!"
    */

    if (
        player.special >= 100
    ) {

        player.special = 0;

        showEvent(
            "💥 TÔI XIN NGHỈ!",
            "Mọi deadline bị xóa khỏi bản đồ."
        );


        for (
            const enemy of enemies
        ) {

            enemy.hp = 0;

            createExplosion(
                enemy.x,
                enemy.y
            );
        }


        enemies.length = 0;

        score += 1000;
    }
}


/* =====================================================
   COFFEE BUTTON
===================================================== */

function useCoffee() {

    if (
        player.coffee <= 0
    ) {

        player.hp =
            Math.min(
                player.maxHp,
                player.hp + 15
            );

        player.coffee = 1;

        popup(
            "☕ UỐNG CÀ PHÊ!"
        );

        setTimeout(
            () => {
                player.coffee = 0;
            },
            4000
        );
    }
}


/* =====================================================
   HUD
===================================================== */

function updateHUD() {

    const hpPercent =
        Math.max(
            0,
            player.hp /
            player.maxHp *
            100
        );


    hpFill.style.width =
        hpPercent + "%";


    hpText.textContent =
        `${Math.ceil(player.hp)} / ${player.maxHp}`;


    scoreText.textContent =
        score;


    comboText.textContent =
        `x${combo}`;


    waveText.textContent =
        wave;


    if (boss) {

        const bossPercent =
            Math.max(
                0,
                boss.hp /
                boss.maxHp *
                100
            );

        bossFill.style.width =
            bossPercent + "%";
    }


    if (
        bossSpawned
    ) {

        objectiveText.textContent =
            "ĐÁNH BẠI SẾP TỔNG";

    } else {

        objectiveText.textContent =
            `SỐNG SÓT QUA WAVE ${wave}`;
    }
}


/* =====================================================
   COMBO
===================================================== */

function updateCombo(dt) {

    if (combo <= 0) {
        return;
    }


    comboTimer -= dt;


    if (
        comboTimer <= 0
    ) {

        combo = 0;
    }
}


/* =====================================================
   PARTICLES
===================================================== */

function createHitParticles(
    x,
    y
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
                (
                    Math.random() -
                    .5
                ) * 180,

            vy:
                (
                    Math.random() -
                    .5
                ) * 180,

            life: 300,

            maxLife: 300,

            size:
                2 +
                Math.random() * 4
        });
    }
}


function createExplosion(
    x,
    y
) {

    for (
        let i = 0;
        i < 20;
        i++
    ) {

        particles.push({

            x,

            y,

            vx:
                (
                    Math.random() -
                    .5
                ) * 300,

            vy:
                (
                    Math.random() -
                    .5
                ) * 300,

            life:
                400 +
                Math.random() * 400,

            maxLife: 800,

            size:
                3 +
                Math.random() * 6
        });
    }
}


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
            dt / 1000;

        particle.y +=
            particle.vy *
            dt / 1000;


        particle.vx *= .96;

        particle.vy *= .96;


        particle.life -= dt;


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


/* =====================================================
   POPUP
===================================================== */

function popup(text) {

    itemPopup.textContent =
        text;

    itemPopup.classList.remove(
        "show"
    );

    void itemPopup.offsetWidth;

    itemPopup.classList.add(
        "show"
    );
}


/* =====================================================
   DRAW BACKGROUND
===================================================== */

function drawBackground() {

    const w = width();
    const h = height();


    ctx.fillStyle =
        "#11171b";

    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    /* floor grid */

    ctx.strokeStyle =
        "rgba(150,160,165,.055)";

    ctx.lineWidth = 1;


    const grid = 50;


    for (
        let x = 0;
        x < w;
        x += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            h
        );

        ctx.stroke();
    }


    for (
        let y = 0;
        y < h;
        y += grid
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            w,
            y
        );

        ctx.stroke();
    }


    /* office windows */

    ctx.fillStyle =
        "rgba(255,255,255,.025)";


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const x =
            i * 180 + 40;

        const y =
            30 +
            (i % 3) * 100;


        ctx.fillRect(
            x,
            y,
            90,
            55
        );
    }
}


/* =====================================================
   DRAW PLAYER
===================================================== */

function drawPlayer() {

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );


    if (
        player.invincible > 0 &&
        Math.floor(
            player.invincible / 60
        ) % 2 === 0
    ) {

        ctx.globalAlpha = .35;
    }


    /* shadow */

    ctx.fillStyle =
        "rgba(0,0,0,.35)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        15,
        22,
        8,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* body */

    ctx.fillStyle =
        "#45545d";

    ctx.fillRect(
        -13,
        -2,
        26,
        25
    );


    /* shirt */

    ctx.fillStyle =
        "#d8dddf";

    ctx.fillRect(
        -11,
        0,
        22,
        20
    );


    /* head */

    ctx.fillStyle =
        "#c7a28a";

    ctx.beginPath();

    ctx.arc(
        0,
        -16,
        11,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* hair */

    ctx.fillStyle =
        "#25292c";

    ctx.beginPath();

    ctx.arc(
        0,
        -20,
        10,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();


    /* coffee */

    if (
        player.coffee
    ) {

        ctx.font =
            "14px Arial";

        ctx.fillText(
            "☕",
            15,
            5
        );
    }


    ctx.restore();
}


/* =====================================================
   DRAW ENEMY
===================================================== */

function drawEnemy(
    enemy
) {

    ctx.save();

    ctx.translate(
        enemy.x,
        enemy.y
    );


    if (
        enemy.hitFlash > 0
    ) {

        ctx.globalAlpha = .5;
    }


    /* shadow */

    ctx.fillStyle =
        "rgba(0,0,0,.35)";

    ctx.beginPath();

    ctx.ellipse(
        0,
        enemy.radius * .8,
        enemy.radius,
        5,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* body */

    ctx.fillStyle =
        "#303a40";

    ctx.fillRect(
        -enemy.radius,
        -enemy.radius,
        enemy.radius * 2,
        enemy.radius * 2
    );


    /* emoji */

    ctx.font =
        `${enemy.radius * 1.35}px Arial`;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        enemy.emoji,
        0,
        0
    );


    /* HP */

    ctx.fillStyle =
        "#1b2023";

    ctx.fillRect(
        -enemy.radius,
        -enemy.radius - 8,
        enemy.radius * 2,
        4
    );


    ctx.fillStyle =
        "#8bd67b";

    ctx.fillRect(
        -enemy.radius,
        -enemy.radius - 8,

        enemy.radius * 2 *
        (
            enemy.hp /
            enemy.maxHp
        ),

        4
    );


    ctx.restore();
}


/* =====================================================
   DRAW BOSS
===================================================== */

function drawBoss() {

    if (!boss) {
        return;
    }


    ctx.save();

    ctx.translate(
        boss.x,
        boss.y
    );


    /* aura */

    ctx.beginPath();

    ctx.arc(
        0,
        0,
        boss.radius + 15,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "rgba(190,40,40,.12)";

    ctx.fill();


    /* body */

    ctx.fillStyle =
        "#262d32";

    ctx.beginPath();

    ctx.roundRect(
        -38,
        -35,
        76,
        85,
        12
    );

    ctx.fill();


    /* suit */

    ctx.fillStyle =
        "#171b1e";

    ctx.fillRect(
        -28,
        -5,
        56,
        45
    );


    /* shirt */

    ctx.fillStyle =
        "#e3e3e3";

    ctx.fillRect(
        -15,
        -10,
        30,
        40
    );


    /* red tie */

    ctx.fillStyle =
        "#bd3d3d";

    ctx.beginPath();

    ctx.moveTo(
        0,
        -5
    );

    ctx.lineTo(
        8,
        10
    );

    ctx.lineTo(
        0,
        30
    );

    ctx.lineTo(
        -8,
        10
    );

    ctx.closePath();

    ctx.fill();


    /* head */

    ctx.fillStyle =
        "#c7a28a";

    ctx.beginPath();

    ctx.arc(
        0,
        -43,
        19,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* hair */

    ctx.fillStyle =
        "#252525";

    ctx.beginPath();

    ctx.arc(
        0,
        -50,
        18,
        Math.PI,
        Math.PI * 2
    );

    ctx.fill();


    /* angry eyes */

    ctx.fillStyle =
        "#222";

    ctx.fillRect(
        -10,
        -45,
        6,
        3
    );

    ctx.fillRect(
        4,
        -45,
        6,
        3
    );


    ctx.font =
        "12px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        "SẾP",
        0,
        65
    );


    ctx.restore();
}


/* =====================================================
   DRAW BULLETS
===================================================== */

function drawBullets() {

    ctx.fillStyle =
        "#f4f4f4";


    for (
        const bullet of bullets
    ) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


function drawEnemyBullets() {

    ctx.fillStyle =
        "#e86a6a";


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

        ctx.fill();
    }
}


/* =====================================================
   DRAW PICKUPS
===================================================== */

function drawPickups() {

    for (
        const item of pickups
    ) {

        ctx.save();

        ctx.translate(
            item.x,
            item.y
        );


        const pulse =
            Math.sin(
                performance.now() / 150
            ) * 2;


        ctx.font =
            `${24 + pulse}px Arial`;

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.fillText(
            item.emoji,
            0,
            0
        );


        ctx.restore();
    }
}


/* =====================================================
   DRAW PARTICLES
===================================================== */

function drawParticles() {

    for (
        const particle of particles
    ) {

        const alpha =
            particle.life /
            particle.maxLife;


        ctx.globalAlpha =
            alpha;

        ctx.fillStyle =
            "#d8dee0";


        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    ctx.globalAlpha = 1;
}


/* =====================================================
   DRAW
===================================================== */

function draw() {

    ctx.save();


    if (
        screenShake > 0
    ) {

        const shakeX =
            (
                Math.random() -
                .5
            ) *
            screenShake;

        const shakeY =
            (
                Math.random() -
                .5
            ) *
            screenShake;

        ctx.translate(
            shakeX,
            shakeY
        );
    }


    drawBackground();

    drawPickups();

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


/* =====================================================
   GAME OVER
===================================================== */

function gameOver() {

    gameRunning = false;

    finalScore.textContent =
        score;

    gameOverScreen.style.display =
        "flex";
}


/* =====================================================
   WIN
===================================================== */

function winGame() {

    gameRunning = false;

    winScore.textContent =
        score;

    winScreen.style.display =
        "flex";
}


/* =====================================================
   PAUSE
===================================================== */

function togglePause() {

    if (!gameRunning) {
        return;
    }

    paused =
        !paused;

    pauseButton.textContent =
        paused ? "▶" : "II";
}


/* =====================================================
   MAIN UPDATE
===================================================== */

function update(dt) {

    if (
        !gameRunning ||
        paused
    ) {

        return;
    }


    updatePlayer(dt);

    updateAutoFire(dt);

    updateWave(dt);

    updateEnemies(dt);

    updateBoss(dt);

    updateBullets(dt);

    updateEnemyBullets(dt);

    updatePickups(dt);

    updateParticles(dt);

    updateCombo(dt);

    updateEvent(dt);

    checkBulletHits();


    if (
        screenShake > 0
    ) {

        screenShake -=
            dt * .04;

        if (
            screenShake < 0
        ) {

            screenShake = 0;
        }
    }


    updateHUD();
}


/* =====================================================
   GAME LOOP
===================================================== */

function gameLoop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
    }


    let dt =
        timestamp -
        lastTime;


    lastTime =
        timestamp;


    dt =
        Math.min(
            dt,
            40
        );


    update(dt);

    draw();


    requestAnimationFrame(
        gameLoop
    );
}


/* =====================================================
   BUTTON EVENTS
===================================================== */

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);

playAgainButton.addEventListener(
    "click",
    startGame
);

pauseButton.addEventListener(
    "click",
    togglePause
);

coffeeButton.addEventListener(
    "pointerdown",
    useCoffee
);

specialButton.addEventListener(
    "pointerdown",
    useSpecial
);


/* =====================================================
   KEYBOARD SPECIAL
===================================================== */

window.addEventListener(
    "keydown",
    event => {

        if (
            event.key.toLowerCase() === "e"
        ) {

            useSpecial();
        }
    }
);


/* =====================================================
   INITIALIZATION
===================================================== */

resizeCanvas();

updateHUD();

requestAnimationFrame(
    gameLoop
);