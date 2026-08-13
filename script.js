/* =========================================================
   NEON PARTY RUN
   GAME ENGINE
========================================================= */


/* =========================================================
   DOM
========================================================= */

const arena = document.getElementById("arena");

const player = document.getElementById("player");

const enemiesLayer = document.getElementById("enemies");

const projectileLayer =
    document.getElementById("projectiles");

const itemLayer =
    document.getElementById("items");

const effectLayer =
    document.getElementById("effects");

const scoreElement =
    document.getElementById("score");

const comboElement =
    document.getElementById("combo");

const waveElement =
    document.getElementById("wave");

const hpFill =
    document.getElementById("hp-fill");

const hpText =
    document.getElementById("hp-text");

const boss =
    document.getElementById("boss");

const bossHpFill =
    document.getElementById("boss-hp-fill");

const powerupsElement =
    document.getElementById("powerups");

const waveMessage =
    document.getElementById("wave-message");

const startScreen =
    document.getElementById("start-screen");

const gameOverScreen =
    document.getElementById("game-over");

const victoryScreen =
    document.getElementById("victory");

const startButton =
    document.getElementById("start-button");

const restartButton =
    document.getElementById("restart-button");

const victoryButton =
    document.getElementById("victory-button");

const finalScore =
    document.getElementById("final-score");

const victoryScore =
    document.getElementById("victory-score");

const specialButton =
    document.getElementById("special-button");

const joystick =
    document.getElementById("joystick");

const joystickKnob =
    document.getElementById("joystick-knob");


/* =========================================================
   GAME STATE
========================================================= */

let gameRunning = false;

let score = 0;

let combo = 1;

let hp = 100;

let wave = 1;

let enemies = [];

let projectiles = [];

let items = [];

let bossActive = false;

let bossData = null;

let lastTime = 0;

let fireTimer = 0;

let spawnTimer = 0;

let waveTimer = 0;

let comboTimer = 0;

let specialCooldown = 0;


/* =========================================================
   PLAYER
========================================================= */

const playerData = {

    x: 0,
    y: 0,

    speed: 260,

    radius: 22,

    damage: 25,

    fireRate: 0.32,

    shots: 1,

    shield: false,

    speedBoost: 1,

    damageBoost: 1

};


/* =========================================================
   JOYSTICK
========================================================= */

const joystickData = {

    x: 0,

    y: 0,

    active: false

};


function joystickStart(event) {

    joystickData.active = true;

    joystickMove(event);
}


function joystickMove(event) {

    if (!joystickData.active) return;

    const rect =
        joystick.getBoundingClientRect();

    const touch =
        event.touches
            ? event.touches[0]
            : event;

    let dx =
        touch.clientX -
        (rect.left + rect.width / 2);

    let dy =
        touch.clientY -
        (rect.top + rect.height / 2);

    const maxDistance =
        rect.width / 2 - 29;

    const distance =
        Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) {

        dx =
            (dx / distance) *
            maxDistance;

        dy =
            (dy / distance) *
            maxDistance;
    }

    joystickData.x =
        dx / maxDistance;

    joystickData.y =
        dy / maxDistance;

    joystickKnob.style.transform =
        `translate(calc(-50% + ${dx}px),
                   calc(-50% + ${dy}px))`;
}


function joystickEnd() {

    joystickData.active = false;

    joystickData.x = 0;

    joystickData.y = 0;

    joystickKnob.style.transform =
        "translate(-50%, -50%)";
}


joystick.addEventListener(
    "touchstart",
    joystickStart,
    { passive: false }
);

joystick.addEventListener(
    "touchmove",
    joystickMove,
    { passive: false }
);

joystick.addEventListener(
    "touchend",
    joystickEnd
);


/* =========================================================
   KEYBOARD
========================================================= */

const keys = {};

window.addEventListener(
    "keydown",
    event => {

        keys[event.key.toLowerCase()] = true;

    }
);

window.addEventListener(
    "keyup",
    event => {

        keys[event.key.toLowerCase()] = false;

    }
);


/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer(dt) {

    let moveX =
        joystickData.x;

    let moveY =
        joystickData.y;


    if (keys["w"] || keys["arrowup"])
        moveY -= 1;

    if (keys["s"] || keys["arrowdown"])
        moveY += 1;

    if (keys["a"] || keys["arrowleft"])
        moveX -= 1;

    if (keys["d"] || keys["arrowright"])
        moveX += 1;


    const length =
        Math.sqrt(
            moveX * moveX +
            moveY * moveY
        );


    if (length > 0) {

        moveX /= length;

        moveY /= length;

        playerData.x +=
            moveX *
            playerData.speed *
            playerData.speedBoost *
            dt;

        playerData.y +=
            moveY *
            playerData.speed *
            playerData.speedBoost *
            dt;
    }


    const width =
        arena.clientWidth;

    const height =
        arena.clientHeight;


    playerData.x =
        Math.max(
            30,
            Math.min(
                width - 30,
                playerData.x
            )
        );

    playerData.y =
        Math.max(
            80,
            Math.min(
                height - 35,
                playerData.y
            )
        );


    player.style.left =
        playerData.x + "px";

    player.style.top =
        playerData.y + "px";
}


/* =========================================================
   SPAWN ENEMY
========================================================= */

function spawnEnemy() {

    if (!gameRunning) return;

    if (bossActive) return;


    const width =
        arena.clientWidth;

    const height =
        arena.clientHeight;


    const side =
        Math.floor(
            Math.random() * 4
        );


    let x;
    let y;


    if (side === 0) {

        x = -40;

        y =
            Math.random() *
            height;

    }

    else if (side === 1) {

        x =
            width + 40;

        y =
            Math.random() *
            height;

    }

    else if (side === 2) {

        x =
            Math.random() *
            width;

        y = -40;

    }

    else {

        x =
            Math.random() *
            width;

        y =
            height + 40;
    }


    const enemyElement =
        document.createElement("div");

    enemyElement.className =
        "enemy";


    enemiesLayer.appendChild(
        enemyElement
    );


    const enemy = {

        element: enemyElement,

        x: x,

        y: y,

        hp: 50 + wave * 10,

        maxHp:
            50 + wave * 10,

        speed:
            50 + wave * 8,

        damage:
            8 + wave,

        attackTimer:
            0,

        radius: 20

    };


    enemies.push(enemy);
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


        const dx =
            playerData.x -
            enemy.x;

        const dy =
            playerData.y -
            enemy.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (distance > 1) {

            enemy.x +=
                (dx / distance) *
                enemy.speed *
                dt;

            enemy.y +=
                (dy / distance) *
                enemy.speed *
                dt;
        }


        enemy.attackTimer -= dt;


        /* =========================
           ENEMY ATTACK
        ========================== */

        if (
            distance <
            enemy.radius +
            playerData.radius +
            8
        ) {

            if (enemy.attackTimer <= 0) {

                damagePlayer(
                    enemy.damage
                );

                enemy.attackTimer =
                    0.8;

                enemy.x -=
                    (dx / distance) * 25;

                enemy.y -=
                    (dy / distance) * 25;
            }
        }


        enemy.element.style.left =
            enemy.x + "px";

        enemy.element.style.top =
            enemy.y + "px";
    }
}


/* =========================================================
   AUTO FIRE
========================================================= */

function autoFire(dt) {

    fireTimer -= dt;

    if (fireTimer > 0)
        return;

    fireTimer =
        playerData.fireRate;


    shoot();
}


/* =========================================================
   SHOOT
========================================================= */

function shoot() {

    if (!gameRunning) return;


    const centerX =
        playerData.x;

    const centerY =
        playerData.y;


    /* 
       Không auto aim.
       Đạn bay theo hướng người chơi
       đang di chuyển.
    */

    let dirX =
        joystickData.x;

    let dirY =
        joystickData.y;


    if (
        dirX === 0 &&
        dirY === 0
    ) {

        if (keys["w"] || keys["arrowup"])
            dirY = -1;

        else if (
            keys["s"] ||
            keys["arrowdown"]
        )
            dirY = 1;

        else if (
            keys["a"] ||
            keys["arrowleft"]
        )
            dirX = -1;

        else if (
            keys["d"] ||
            keys["arrowright"]
        )
            dirX = 1;

        else {

            /*
              Nếu đứng yên,
              mặc định bắn lên.
            */

            dirY = -1;
        }
    }


    const count =
        playerData.shots;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        let angle =
            Math.atan2(
                dirY,
                dirX
            );


        if (count > 1) {

            angle +=
                (i -
                    (count - 1) / 2) *
                0.16;
        }


        const projectileElement =
            document.createElement("div");

        projectileElement.className =
            "projectile";


        projectileLayer.appendChild(
            projectileElement
        );


        const projectile = {

            element:
                projectileElement,

            x: centerX,

            y: centerY,

            vx:
                Math.cos(angle) * 500,

            vy:
                Math.sin(angle) * 500,

            damage:
                playerData.damage *
                playerData.damageBoost,

            life: 1.5

        };


        projectiles.push(
            projectile
        );
    }
}


/* =========================================================
   UPDATE PROJECTILES
========================================================= */

function updateProjectiles(dt) {

    for (
        let i = projectiles.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            projectiles[i];


        bullet.x +=
            bullet.vx * dt;

        bullet.y +=
            bullet.vy * dt;

        bullet.life -= dt;


        bullet.element.style.left =
            bullet.x + "px";

        bullet.element.style.top =
            bullet.y + "px";


        if (
            bullet.life <= 0 ||
            bullet.x < -50 ||
            bullet.y < -50 ||
            bullet.x >
                arena.clientWidth + 50 ||
            bullet.y >
                arena.clientHeight + 50
        ) {

            bullet.element.remove();

            projectiles.splice(i, 1);

            continue;
        }


        checkBulletCollision(
            bullet,
            i
        );
    }
}


/* =========================================================
   BULLET COLLISION
========================================================= */

function checkBulletCollision(
    bullet,
    bulletIndex
) {


    /* ENEMIES */

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


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


        if (distance < 25) {

            enemy.hp -=
                bullet.damage;


            createHitEffect(
                enemy.x,
                enemy.y
            );


            bullet.element.remove();

            projectiles.splice(
                bulletIndex,
                1
            );


            if (enemy.hp <= 0) {

                killEnemy(
                    enemy,
                    i
                );
            }

            return;
        }
    }


    /* BOSS */

    if (bossActive && bossData) {

        const dx =
            bullet.x -
            bossData.x;

        const dy =
            bullet.y -
            bossData.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (distance < 55) {

            bossData.hp -=
                bullet.damage;

            updateBossHealth();

            createHitEffect(
                bossData.x,
                bossData.y
            );


            bullet.element.remove();

            projectiles.splice(
                bulletIndex,
                1
            );


            if (bossData.hp <= 0) {

                defeatBoss();
            }
        }
    }
}


/* =========================================================
   KILL ENEMY
========================================================= */

function killEnemy(
    enemy,
    index
) {

    enemy.element.remove();

    enemies.splice(
        index,
        1
    );


    score +=
        100 * combo;


    combo++;

    comboTimer = 3;


    scoreElement.textContent =
        score;

    comboElement.textContent =
        "x" + combo;


    createExplosion(
        enemy.x,
        enemy.y
    );


    /* ITEM DROP */

    if (
        Math.random() <
        0.28
    ) {

        spawnItem(
            enemy.x,
            enemy.y
        );
    }
}


/* =========================================================
   ITEMS
========================================================= */

const itemTypes = [

    {
        type: "speed",
        icon: "⚡",
        name: "SPEED"
    },

    {
        type: "shield",
        icon: "🛡️",
        name: "SHIELD"
    },

    {
        type: "double",
        icon: "🔫",
        name: "DOUBLE"
    },

    {
        type: "damage",
        icon: "🔥",
        name: "DAMAGE"
    },

    {
        type: "magnet",
        icon: "🧲",
        name: "MAGNET"
    },

    {
        type: "bomb",
        icon: "💣",
        name: "BOMB"
    }

];


function spawnItem(x, y) {

    const data =
        itemTypes[
            Math.floor(
                Math.random() *
                itemTypes.length
            )
        ];


    const element =
        document.createElement("div");

    element.className =
        "item";

    element.textContent =
        data.icon;


    itemLayer.appendChild(
        element
    );


    const item = {

        element: element,

        x: x,

        y: y,

        type: data.type,

        life: 10

    };


    items.push(item);
}


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


        /* MAGNET */

        const dx =
            playerData.x -
            item.x;

        const dy =
            playerData.y -
            item.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            playerData.magnet &&
            distance < 250
        ) {

            item.x +=
                (dx / distance) *
                300 *
                dt;

            item.y +=
                (dy / distance) *
                300 *
                dt;
        }


        if (
            distance < 35
        ) {

            collectItem(
                item,
                i
            );

            continue;
        }


        if (
            item.life <= 0
        ) {

            item.element.remove();

            items.splice(i, 1);

            continue;
        }


        item.element.style.left =
            item.x + "px";

        item.element.style.top =
            item.y + "px";
    }
}


/* =========================================================
   COLLECT ITEM
========================================================= */

function collectItem(
    item,
    index
) {

    activatePowerup(
        item.type
    );


    item.element.remove();

    items.splice(
        index,
        1
    );


    score += 50;

    scoreElement.textContent =
        score;
}


/* =========================================================
   POWERUPS
========================================================= */

function activatePowerup(type) {


    if (type === "speed") {

        playerData.speedBoost =
            1.7;

        showPowerup(
            "⚡ SPEED"
        );

        setTimeout(() => {

            playerData.speedBoost =
                1;

        }, 7000);
    }


    if (type === "shield") {

        playerData.shield =
            true;

        showPowerup(
            "🛡️ SHIELD"
        );

        setTimeout(() => {

            playerData.shield =
                false;

        }, 8000);
    }


    if (type === "double") {

        playerData.shots =
            2;

        showPowerup(
            "🔫 DOUBLE SHOT"
        );

        setTimeout(() => {

            playerData.shots =
                1;

        }, 10000);
    }


    if (type === "damage") {

        playerData.damageBoost =
            2;

        showPowerup(
            "🔥 DAMAGE x2"
        );

        setTimeout(() => {

            playerData.damageBoost =
                1;

        }, 8000);
    }


    if (type === "magnet") {

        playerData.magnet =
            true;

        showPowerup(
            "🧲 MAGNET"
        );

        setTimeout(() => {

            playerData.magnet =
                false;

        }, 8000);
    }


    if (type === "bomb") {

        showPowerup(
            "💣 PARTY BOMB"
        );


        for (
            let i = enemies.length - 1;
            i >= 0;
            i--
        ) {

            killEnemy(
                enemies[i],
                i
            );
        }


        createBigExplosion(
            playerData.x,
            playerData.y
        );
    }
}


/* =========================================================
   POWERUP HUD
========================================================= */

function showPowerup(text) {

    const element =
        document.createElement("div");

    element.className =
        "powerup";

    element.textContent =
        text;


    powerupsElement.appendChild(
        element
    );


    setTimeout(() => {

        element.remove();

    }, 4000);
}


/* =========================================================
   PLAYER DAMAGE
========================================================= */

function damagePlayer(
    amount
) {

    if (
        playerData.shield
    ) {

        createHitEffect(
            playerData.x,
            playerData.y
        );

        return;
    }


    hp -= amount;


    hp =
        Math.max(
            0,
            hp
        );


    hpFill.style.width =
        hp + "%";

    hpText.textContent =
        hp;


    arena.classList.add(
        "shake"
    );


    setTimeout(() => {

        arena.classList.remove(
            "shake"
        );

    }, 250);


    if (hp <= 0) {

        endGame();
    }
}


/* =========================================================
   BOSS
========================================================= */

function spawnBoss() {

    bossActive = true;


    boss.style.display =
        "block";


    const width =
        arena.clientWidth;

    const height =
        arena.clientHeight;


    bossData = {

        x: width / 2,

        y: 120,

        hp:
            500 +
            wave * 100,

        maxHp:
            500 +
            wave * 100,

        speed:
            70 +
            wave * 5,

        attackTimer: 2

    };


    boss.style.left =
        bossData.x + "px";

    boss.style.top =
        bossData.y + "px";


    updateBossHealth();


    showWaveMessage(
        "👑 BOSS PARTY!"
    );
}


/* =========================================================
   UPDATE BOSS
========================================================= */

function updateBoss(dt) {

    if (
        !bossActive ||
        !bossData
    )
        return;


    const dx =
        playerData.x -
        bossData.x;

    const dy =
        playerData.y -
        bossData.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (distance > 120) {

        bossData.x +=
            (dx / distance) *
            bossData.speed *
            dt;

        bossData.y +=
            (dy / distance) *
            bossData.speed *
            dt;
    }


    bossData.attackTimer -=
        dt;


    if (
        bossData.attackTimer <= 0
    ) {

        bossAttack();

        bossData.attackTimer =
            2;
    }


    boss.style.left =
        bossData.x + "px";

    boss.style.top =
        bossData.y + "px";
}


/* =========================================================
   BOSS ATTACK
========================================================= */

function bossAttack() {

    const count = 8;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            (Math.PI * 2 / count) *
            i;


        createBossProjectile(
            bossData.x,
            bossData.y,
            angle
        );
    }


    createBigExplosion(
        bossData.x,
        bossData.y
    );
}


/* =========================================================
   BOSS PROJECTILE
========================================================= */

function createBossProjectile(
    x,
    y,
    angle
) {

    const element =
        document.createElement("div");

    element.className =
        "projectile";

    element.style.background =
        "#ff3bd4";

    element.style.boxShadow =
        "0 0 15px #ff3bd4";


    projectileLayer.appendChild(
        element
    );


    const projectile = {

        element: element,

        x: x,

        y: y,

        vx:
            Math.cos(angle) *
            220,

        vy:
            Math.sin(angle) *
            220,

        damage: 12,

        life: 3,

        enemyBullet: true

    };


    projectiles.push(
        projectile
    );
}


/* =========================================================
   BOSS HEALTH
========================================================= */

function updateBossHealth() {

    if (!bossData)
        return;


    const percent =
        Math.max(
            0,
            bossData.hp /
            bossData.maxHp *
            100
        );


    bossHpFill.style.width =
        percent + "%";
}


/* =========================================================
   DEFEAT BOSS
========================================================= */

function defeatBoss() {

    bossActive = false;

    boss.style.display =
        "none";


    createBigExplosion(
        bossData.x,
        bossData.y
    );


    score +=
        1000 * wave;


    combo += 5;


    scoreElement.textContent =
        score;

    comboElement.textContent =
        "x" + combo;


    bossData = null;


    wave++;


    if (wave > 10) {

        winGame();

        return;
    }


    showWaveMessage(
        "🎉 NEXT WAVE!"
    );
}


/* =========================================================
   COLLISION WITH BOSS PROJECTILES
========================================================= */

function checkEnemyProjectile(
    bullet,
    index
) {

    if (!bullet.enemyBullet)
        return;


    const dx =
        bullet.x -
        playerData.x;

    const dy =
        bullet.y -
        playerData.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (distance < 25) {

        damagePlayer(
            bullet.damage
        );


        bullet.element.remove();

        projectiles.splice(
            index,
            1
        );
    }
}


/* =========================================================
   OVERRIDE PROJECTILE UPDATE
========================================================= */

const originalUpdateProjectiles =
    updateProjectiles;


updateProjectiles =
    function(dt) {

        for (
            let i =
                projectiles.length - 1;
            i >= 0;
            i--
        ) {

            const bullet =
                projectiles[i];


            if (
                bullet.enemyBullet
            ) {

                bullet.x +=
                    bullet.vx * dt;

                bullet.y +=
                    bullet.vy * dt;

                bullet.life -= dt;


                bullet.element.style.left =
                    bullet.x + "px";

                bullet.element.style.top =
                    bullet.y + "px";


                checkEnemyProjectile(
                    bullet,
                    i
                );


                if (
                    bullet.life <= 0
                ) {

                    bullet.element.remove();

                    projectiles.splice(
                        i,
                        1
                    );
                }

                continue;
            }
        }


        originalUpdateProjectiles(dt);
    };


/* =========================================================
   EFFECTS
========================================================= */

function createHitEffect(
    x,
    y
) {

    const effect =
        document.createElement("div");

    effect.className =
        "hit-effect";


    effect.style.left =
        x + "px";

    effect.style.top =
        y + "px";


    effectLayer.appendChild(
        effect
    );


    setTimeout(() => {

        effect.remove();

    }, 450);
}


function createExplosion(
    x,
    y
) {

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const particle =
            document.createElement("div");

        particle.className =
            "hit-effect";


        particle.style.left =
            x + "px";

        particle.style.top =
            y + "px";


        particle.style.borderColor =
            i % 2
                ? "#00ffff"
                : "#ff00d4";


        effectLayer.appendChild(
            particle
        );


        setTimeout(() => {

            particle.remove();

        }, 400);
    }
}


function createBigExplosion(
    x,
    y
) {

    for (
        let i = 0;
        i < 18;
        i++
    ) {

        createHitEffect(
            x +
                (Math.random() - 0.5) *
                120,

            y +
                (Math.random() - 0.5) *
                120
        );
    }
}


/* =========================================================
   WAVE
========================================================= */

function showWaveMessage(
    text
) {

    waveMessage.textContent =
        text;


    waveMessage.style.opacity =
        "1";

    waveMessage.style.transform =
        "translate(-50%, -50%) scale(1)";


    setTimeout(() => {

        waveMessage.style.opacity =
            "0";

        waveMessage.style.transform =
            "translate(-50%, -50%) scale(1.4)";

    }, 1200);
}


/* =========================================================
   WAVE SYSTEM
========================================================= */

function updateWave(dt) {

    waveTimer -= dt;


    if (
        waveTimer <= 0 &&
        !bossActive
    ) {

        if (
            enemies.length < 
            3 + wave
        ) {

            spawnEnemy();
        }


        if (
            Math.random() <
            0.015 &&
            enemies.length >
            3
        ) {

            spawnEnemy();
        }


        waveTimer =
            Math.max(
                0.4,
                1.4 -
                wave * 0.08
            );
    }


    /*
      Mỗi 10 wave có Boss
    */

    if (
        wave % 5 === 0 &&
        !bossActive
    ) {

        if (
            enemies.length === 0
        ) {

            spawnBoss();
        }
    }
}


/* =========================================================
   COMBO
========================================================= */

function updateCombo(dt) {

    if (combo <= 1)
        return;


    comboTimer -= dt;


    if (
        comboTimer <= 0
    ) {

        combo = 1;

        comboElement.textContent =
            "x1";
    }
}


/* =========================================================
   SPECIAL POWER
========================================================= */

function useSpecial() {

    if (
        !gameRunning ||
        specialCooldown > 0
    )
        return;


    specialCooldown =
        8;


    specialButton.style.opacity =
        "0.4";


    setTimeout(() => {

        specialButton.style.opacity =
            "1";

    }, 8000);


    /*
      SUPER PARTY BLAST
    */

    for (
        let i = enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        const dx =
            enemy.x -
            playerData.x;

        const dy =
            enemy.y -
            playerData.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance < 280
        ) {

            killEnemy(
                enemy,
                i
            );
        }
    }


    createBigExplosion(
        playerData.x,
        playerData.y
    );
}


specialButton.addEventListener(
    "click",
    useSpecial
);


/* =========================================================
   RESET
========================================================= */

function resetGame() {

    score = 0;

    combo = 1;

    hp = 100;

    wave = 1;

    bossActive = false;

    bossData = null;

    enemies = [];

    projectiles = [];

    items = [];


    playerData.x =
        arena.clientWidth / 2;

    playerData.y =
        arena.clientHeight / 2;

    playerData.speed =
        260;

    playerData.damage =
        25;

    playerData.fireRate =
        0.32;

    playerData.shots =
        1;

    playerData.shield =
        false;

    playerData.speedBoost =
        1;

    playerData.damageBoost =
        1;

    playerData.magnet =
        false;


    enemiesLayer.innerHTML =
        "";

    projectileLayer.innerHTML =
        "";

    itemLayer.innerHTML =
        "";

    effectLayer.innerHTML =
        "";

    powerupsElement.innerHTML =
        "";


    scoreElement.textContent =
        "0";

    comboElement.textContent =
        "x1";

    waveElement.textContent =
        "1";

    hpFill.style.width =
        "100%";

    hpText.textContent =
        "100";


    boss.style.display =
        "none";


    player.style.left =
        playerData.x + "px";

    player.style.top =
        playerData.y + "px";
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    resetGame();

    gameRunning = true;

    startScreen.style.display =
        "none";

    gameOverScreen.style.display =
        "none";

    victoryScreen.style.display =
        "none";


    showWaveMessage(
        "LET'S PARTY!"
    );


    lastTime =
        performance.now();


    requestAnimationFrame(
        gameLoop
    );
}


/* =========================================================
   GAME OVER
========================================================= */

function endGame() {

    gameRunning = false;


    finalScore.textContent =
        score;


    gameOverScreen.style.display =
        "flex";
}


/* =========================================================
   VICTORY
========================================================= */

function winGame() {

    gameRunning = false;


    victoryScore.textContent =
        score;


    victoryScreen.style.display =
        "flex";
}


/* =========================================================
   BUTTONS
========================================================= */

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);

victoryButton.addEventListener(
    "click",
    startGame
);


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(
    timestamp
) {

    if (!gameRunning)
        return;


    let dt =
        (timestamp - lastTime) /
        1000;


    lastTime =
        timestamp;


    /*
      Tránh game chạy quá nhanh
      khi tab bị lag.
    */

    dt =
        Math.min(
            dt,
            0.033
        );


    updatePlayer(dt);

    updateEnemies(dt);

    updateProjectiles(dt);

    updateItems(dt);

    updateBoss(dt);

    autoFire(dt);

    updateWave(dt);

    updateCombo(dt);


    waveElement.textContent =
        wave;


    requestAnimationFrame(
        gameLoop
    );
}


/* =========================================================
   INITIAL POSITION
========================================================= */

function initialize() {

    playerData.x =
        arena.clientWidth / 2;

    playerData.y =
        arena.clientHeight / 2;


    player.style.left =
        playerData.x + "px";

    player.style.top =
        playerData.y + "px";
}


window.addEventListener(
    "resize",
    initialize
);


initialize();