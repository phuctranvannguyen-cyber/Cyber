/* =========================================================
   BLACKOUT
   script.js
   Core Game Engine
========================================================= */


/* =========================================================
   GAME CONFIG
========================================================= */

const CONFIG = {

    player: {
        speed: 185,
        maxHealth: 100,
        maxBattery: 100,
        maxAmmo: 30,

        fireRate: 260,
        damage: 25,

        interactionDistance: 75
    },

    enemy: {
        speed: 48,
        chaseSpeed: 82,

        maxHealth: 60,

        attackDistance: 38,
        attackCooldown: 900,

        detectionDistance: 260
    },

    world: {
        width: 1800,
        height: 1000
    },

    flashlight: {
        batteryDrain: 0.8
    }
};


/* =========================================================
   GAME STATE
========================================================= */

const Game = {

    running: false,
    paused: false,

    time: 0,

    score: 0,

    objectiveProgress: 0,

    player: {
        x: 850,
        y: 510,

        angle: 0,

        health: CONFIG.player.maxHealth,
        battery: CONFIG.player.maxBattery,

        ammo: CONFIG.player.maxAmmo,

        moving: false,

        flashlight: true,

        firing: false,

        lastShot: 0,

        damageFlash: 0
    },

    mouse: {
        x: 0,
        y: 0,

        down: false
    },

    joystick: {
        active: false,

        centerX: 0,
        centerY: 0,

        x: 0,
        y: 0,

        strength: 0
    },

    enemies: [],

    bullets: [],

    particles: [],

    interactables: [],

    keys: {},

    messageTimer: null
};


/* =========================================================
   DOM
========================================================= */

const $ = id => document.getElementById(id);

const world = $("world");
const gameWorld = $("gameWorld");

const playerEl = $("player");

const objectiveProgress = $("objectiveProgress");

const batteryFill = document.querySelector(".battery-fill");
const batteryText = $("batteryText");

const healthFill = document.querySelector(".health-fill");

const ammoDisplay = document.querySelector(".ammo-display");

const damageOverlay = document.querySelector(".damage-overlay");

const mapPlayer = document.querySelector(".map-player");
const mapEnemy = document.querySelector(".map-enemy");

const messageLayer = $("messageLayer");


/* =========================================================
   CREATE MISSING UI
========================================================= */

function createElement(tag, className, parent = world) {

    const el = document.createElement(tag);

    el.className = className;

    parent.appendChild(el);

    return el;
}


/* =========================================================
   PLAYER VISUAL
========================================================= */

function ensurePlayerVisual() {

    if (!playerEl) return;

    if (!playerEl.querySelector(".player-shadow")) {

        playerEl.innerHTML = `

            <div class="player-shadow"></div>

            <div class="player-body">

                <div class="player-head"></div>

                <div class="player-torso"></div>

                <div class="player-arm player-arm-left"></div>

                <div class="player-arm player-arm-right"></div>

            </div>

            <div class="flashlight-cone"></div>

        `;
    }
}


/* =========================================================
   START SCREEN
========================================================= */

function createStartScreen() {

    if (document.querySelector(".start-screen")) return;

    const screen = document.createElement("div");

    screen.className = "start-screen";

    screen.innerHTML = `

        <div class="start-content">

            <div class="start-glitch">
                SECURITY BREACH DETECTED
            </div>

            <h1>BLACKOUT</h1>

            <div class="start-time">
                03:17 AM
            </div>

            <div class="start-description">

                You are not alone.<br>
                Keep your flashlight alive.<br>
                Find a way out.

            </div>

            <button class="start-button" id="startGameButton">
                ENTER
            </button>

            <div class="start-warning">
                HEADPHONES RECOMMENDED
            </div>

        </div>

    `;

    document.getElementById("game").appendChild(screen);

    document
        .getElementById("startGameButton")
        .addEventListener("click", startGame);
}


/* =========================================================
   INITIALIZE
========================================================= */

function init() {

    ensurePlayerVisual();

    createStartScreen();

    createEnemies();

    createInteractables();

    setupKeyboard();

    setupMouse();

    setupJoystick();

    setupButtons();

    updateUI();

    requestAnimationFrame(gameLoop);
}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    const screen = document.querySelector(".start-screen");

    if (screen) {

        screen.style.opacity = "0";

        setTimeout(() => {

            screen.remove();

        }, 400);
    }

    Game.running = true;

    Game.paused = false;

    showMessage("MISSION STARTED");

    Game.player.x = 850;
    Game.player.y = 510;

    Game.player.health = 100;

    Game.player.battery = 100;

    Game.player.ammo = 30;

    Game.time = 0;
}


/* =========================================================
   KEYBOARD
========================================================= */

function setupKeyboard() {

    window.addEventListener("keydown", e => {

        Game.keys[e.key.toLowerCase()] = true;

        if (e.key === " ") {

            e.preventDefault();

            toggleFlashlight();
        }

        if (e.key.toLowerCase() === "e") {

            interact();
        }

        if (e.key === "Escape") {

            togglePause();
        }
    });


    window.addEventListener("keyup", e => {

        Game.keys[e.key.toLowerCase()] = false;
    });
}


/* =========================================================
   MOUSE
========================================================= */

function setupMouse() {

    window.addEventListener("mousemove", e => {

        Game.mouse.x = e.clientX;
        Game.mouse.y = e.clientY;

        updateAimFromMouse();
    });


    window.addEventListener("mousedown", e => {

        if (e.button === 0) {

            Game.mouse.down = true;
        }
    });


    window.addEventListener("mouseup", e => {

        if (e.button === 0) {

            Game.mouse.down = false;
        }
    });


    window.addEventListener("mouseleave", () => {

        Game.mouse.down = false;
    });
}


/* =========================================================
   AIM
========================================================= */

function updateAimFromMouse() {

    if (!gameWorld) return;

    const rect = gameWorld.getBoundingClientRect();

    const mouseX =
        Game.mouse.x - rect.left;

    const mouseY =
        Game.mouse.y - rect.top;

    const playerScreenX =
        (Game.player.x / CONFIG.world.width) *
        rect.width;

    const playerScreenY =
        (Game.player.y / CONFIG.world.height) *
        rect.height;

    Game.player.angle =
        Math.atan2(
            mouseY - playerScreenY,
            mouseX - playerScreenX
        );
}


/* =========================================================
   JOYSTICK
========================================================= */

function setupJoystick() {

    const joystick =
        document.querySelector(".joystick");

    const knob =
        document.querySelector(".joystick-knob");

    if (!joystick || !knob) return;


    const resetJoystick = () => {

        Game.joystick.active = false;

        Game.joystick.x = 0;

        Game.joystick.y = 0;

        Game.joystick.strength = 0;

        knob.style.transform =
            "translate(-50%, -50%)";
    };


    const moveJoystick = e => {

        if (!Game.joystick.active) return;

        const touch =
            e.touches ? e.touches[0] : e;

        const rect =
            joystick.getBoundingClientRect();

        const centerX =
            rect.left + rect.width / 2;

        const centerY =
            rect.top + rect.height / 2;

        let dx =
            touch.clientX - centerX;

        let dy =
            touch.clientY - centerY;

        const radius =
            rect.width / 2 - 26;

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        if (distance > radius) {

            dx =
                dx / distance * radius;

            dy =
                dy / distance * radius;
        }

        Game.joystick.x =
            dx / radius;

        Game.joystick.y =
            dy / radius;

        Game.joystick.strength =
            Math.min(distance / radius, 1);

        knob.style.transform =
            `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    };


    joystick.addEventListener(
        "touchstart",
        e => {

            e.preventDefault();

            Game.joystick.active = true;

            moveJoystick(e);
        },
        { passive: false }
    );


    joystick.addEventListener(
        "touchmove",
        e => {

            e.preventDefault();

            moveJoystick(e);
        },
        { passive: false }
    );


    joystick.addEventListener(
        "touchend",
        resetJoystick
    );


    joystick.addEventListener(
        "touchcancel",
        resetJoystick
    );
}


/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {

    const fireButton =
        document.querySelector(".fire-button");

    const flashlightButton =
        document.querySelector("[data-action='flashlight']");

    const interactButton =
        document.querySelector("[data-action='interact']");

    const pauseButton =
        document.querySelector("[data-action='pause']");


    if (fireButton) {

        fireButton.addEventListener(
            "touchstart",
            e => {

                e.preventDefault();

                Game.player.firing = true;
            }
        );

        fireButton.addEventListener(
            "touchend",
            () => {

                Game.player.firing = false;
            }
        );
    }


    if (flashlightButton) {

        flashlightButton.addEventListener(
            "click",
            toggleFlashlight
        );
    }


    if (interactButton) {

        interactButton.addEventListener(
            "click",
            interact
        );
    }


    if (pauseButton) {

        pauseButton.addEventListener(
            "click",
            togglePause
        );
    }
}


/* =========================================================
   MOVEMENT
========================================================= */

function updateMovement(dt) {

    let x = 0;
    let y = 0;


    /* Keyboard */

    if (Game.keys["w"]) y -= 1;

    if (Game.keys["s"]) y += 1;

    if (Game.keys["a"]) x -= 1;

    if (Game.keys["d"]) x += 1;


    /* Joystick */

    if (Game.joystick.active) {

        x = Game.joystick.x;

        y = Game.joystick.y;
    }


    const length =
        Math.sqrt(x * x + y * y);


    if (length > 0) {

        if (length > 1) {

            x /= length;
            y /= length;
        }

        Game.player.moving = true;

    } else {

        Game.player.moving = false;
    }


    const speed =
        CONFIG.player.speed;


    Game.player.x +=
        x * speed * dt;

    Game.player.y +=
        y * speed * dt;


    /* Keep inside world */

    Game.player.x =
        Math.max(
            20,
            Math.min(
                CONFIG.world.width - 20,
                Game.player.x
            )
        );


    Game.player.y =
        Math.max(
            20,
            Math.min(
                CONFIG.world.height - 20,
                Game.player.y
            )
        );
}


/* =========================================================
   FLASHLIGHT
========================================================= */

function toggleFlashlight() {

    Game.player.flashlight =
        !Game.player.flashlight;

    const cone =
        document.querySelector(".flashlight-cone");

    if (cone) {

        cone.style.opacity =
            Game.player.flashlight ? "1" : "0";
    }

    showMessage(
        Game.player.flashlight
            ? "FLASHLIGHT ON"
            : "FLASHLIGHT OFF"
    );
}


/* =========================================================
   BATTERY
========================================================= */

function updateBattery(dt) {

    if (!Game.player.flashlight) return;

    Game.player.battery -=
        CONFIG.flashlight.batteryDrain * dt;

    if (Game.player.battery <= 0) {

        Game.player.battery = 0;

        Game.player.flashlight = false;

        const cone =
            document.querySelector(".flashlight-cone");

        if (cone) {

            cone.style.opacity = "0";
        }

        showMessage("BATTERY EMPTY");
    }
}


/* =========================================================
   ENEMIES
========================================================= */

function createEnemies() {

    const positions = [

        { x: 1250, y: 260 },

        { x: 1320, y: 700 },

        { x: 560, y: 730 },

        { x: 480, y: 300 }

    ];


    positions.forEach(
        (pos, index) => {

            const enemy =
                createElement(
                    "div",
                    "enemy"
                );

            enemy.innerHTML = `

                <div class="enemy-detection"></div>

                <div class="enemy-head"></div>

                <div class="enemy-body"></div>

            `;

            const data = {

                el: enemy,

                x: pos.x,

                y: pos.y,

                health:
                    CONFIG.enemy.maxHealth,

                state: "idle",

                lastAttack: 0,

                id: index

            };

            Game.enemies.push(data);
        }
    );
}


/* =========================================================
   ENEMY AI
========================================================= */

function updateEnemies(dt) {

    Game.enemies.forEach(enemy => {

        if (enemy.health <= 0) return;


        const dx =
            Game.player.x - enemy.x;

        const dy =
            Game.player.y - enemy.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy);


        /* Detection */

        if (
            distance <
            CONFIG.enemy.detectionDistance
        ) {

            enemy.state = "chasing";

            enemy.el.classList.add("alert");

        } else {

            enemy.state = "idle";

            enemy.el.classList.remove("alert");
        }


        /* Chase */

        if (enemy.state === "chasing") {

            const nx = dx / distance;
            const ny = dy / distance;

            enemy.x +=
                nx *
                CONFIG.enemy.chaseSpeed *
                dt;

            enemy.y +=
                ny *
                CONFIG.enemy.chaseSpeed *
                dt;


            /* Attack */

            if (
                distance <
                CONFIG.enemy.attackDistance
            ) {

                attackPlayer(enemy);
            }
        }


        renderEnemy(enemy);
    });
}


/* =========================================================
   ENEMY ATTACK
========================================================= */

function attackPlayer(enemy) {

    const now = performance.now();

    if (
        now - enemy.lastAttack <
        CONFIG.enemy.attackCooldown
    ) {
        return;
    }

    enemy.lastAttack = now;

    damagePlayer(8);

    createBloodParticles(
        Game.player.x,
        Game.player.y
    );

    showMessage("YOU ARE HIT");
}


/* =========================================================
   DAMAGE PLAYER
========================================================= */

function damagePlayer(amount) {

    Game.player.health -= amount;

    if (Game.player.health < 0) {

        Game.player.health = 0;
    }


    if (damageOverlay) {

        damageOverlay.classList.remove("active");

        void damageOverlay.offsetWidth;

        damageOverlay.classList.add("active");
    }


    if (Game.player.health <= 0) {

        gameOver();
    }
}


/* =========================================================
   RENDER ENEMY
========================================================= */

function renderEnemy(enemy) {

    const rect =
        gameWorld.getBoundingClientRect();

    const x =
        enemy.x /
        CONFIG.world.width *
        rect.width;

    const y =
        enemy.y /
        CONFIG.world.height *
        rect.height;

    enemy.el.style.left =
        `${x}px`;

    enemy.el.style.top =
        `${y}px`;
}


/* =========================================================
   AUTO FIRE
========================================================= */

function updateShooting() {

    const now =
        performance.now();


    const keyboardFire =
        Game.keys["f"] ||
        Game.mouse.down;


    const shouldFire =
        Game.player.firing ||
        keyboardFire;


    if (!shouldFire) return;


    if (
        now - Game.player.lastShot <
        CONFIG.player.fireRate
    ) {
        return;
    }


    if (Game.player.ammo <= 0) {

        showMessage("OUT OF AMMO");

        return;
    }


    shoot();
}


/* =========================================================
   SHOOT
========================================================= */

function shoot() {

    Game.player.lastShot =
        performance.now();

    Game.player.ammo--;


    const bullet = {

        x: Game.player.x,

        y: Game.player.y,

        angle: Game.player.angle,

        speed: 620,

        damage: CONFIG.player.damage,

        life: 1.5

    };


    Game.bullets.push(bullet);

    createMuzzleFlash();
}


/* =========================================================
   UPDATE BULLETS
========================================================= */

function updateBullets(dt) {

    for (
        let i = Game.bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            Game.bullets[i];


        bullet.x +=
            Math.cos(bullet.angle) *
            bullet.speed *
            dt;

        bullet.y +=
            Math.sin(bullet.angle) *
            bullet.speed *
            dt;

        bullet.life -= dt;


        if (bullet.life <= 0) {

            Game.bullets.splice(i, 1);

            continue;
        }


        /* Enemy collision */

        for (const enemy of Game.enemies) {

            if (enemy.health <= 0) continue;


            const dx =
                bullet.x - enemy.x;

            const dy =
                bullet.y - enemy.y;

            const distance =
                Math.sqrt(dx * dx + dy * dy);


            if (distance < 28) {

                enemy.health -=
                    bullet.damage;

                createHitParticle(
                    enemy.x,
                    enemy.y
                );

                Game.score += 100;

                Game.objectiveProgress += 1;

                Game.bullets.splice(i, 1);

                if (enemy.health <= 0) {

                    killEnemy(enemy);
                }

                break;
            }
        }
    }
}


/* =========================================================
   KILL ENEMY
========================================================= */

function killEnemy(enemy) {

    enemy.el.style.display = "none";

    createExplosion(
        enemy.x,
        enemy.y
    );

    showMessage("TARGET DOWN");

    Game.score += 500;
}


/* =========================================================
   PARTICLES
========================================================= */

function createParticle(x, y, char = "*") {

    const particle =
        createElement(
            "div",
            "particle"
        );

    particle.textContent = char;

    particle.style.position = "absolute";

    particle.style.left =
        `${x}px`;

    particle.style.top =
        `${y}px`;

    particle.style.color =
        "var(--cyan)";

    particle.style.pointerEvents =
        "none";

    particle.style.zIndex = "50";

    Game.particles.push({

        el: particle,

        x,

        y,

        life: 0.5,

        vx:
            (Math.random() - 0.5) *
            80,

        vy:
            (Math.random() - 0.5) *
            80
    });
}


/* =========================================================
   HIT PARTICLES
========================================================= */

function createHitParticle(x, y) {

    for (let i = 0; i < 5; i++) {

        createParticle(x, y, "•");
    }
}


/* =========================================================
   BLOOD PARTICLES
========================================================= */

function createBloodParticles(x, y) {

    for (let i = 0; i < 8; i++) {

        const particle =
            createElement(
                "div",
                "particle"
            );

        particle.textContent = "•";

        particle.style.position =
            "absolute";

        particle.style.color =
            "var(--red)";

        particle.style.zIndex =
            "80";

        Game.particles.push({

            el: particle,

            x,

            y,

            life: 0.7,

            vx:
                (Math.random() - 0.5) *
                150,

            vy:
                (Math.random() - 0.5) *
                150
        });
    }
}


/* =========================================================
   EXPLOSION
========================================================= */

function createExplosion(x, y) {

    for (let i = 0; i < 15; i++) {

        createParticle(
            x,
            y,
            Math.random() > 0.5
                ? "*"
                : "+"
        );
    }
}


/* =========================================================
   MUZZLE FLASH
========================================================= */

function createMuzzleFlash() {

    const flash =
        createElement(
            "div",
            "muzzle-flash"
        );

    flash.style.position =
        "absolute";

    flash.style.left =
        `${Game.player.x}px`;

    flash.style.top =
        `${Game.player.y}px`;

    flash.style.width =
        "20px";

    flash.style.height =
        "20px";

    flash.style.borderRadius =
        "50%";

    flash.style.background =
        "rgba(255,255,200,.8)";

    flash.style.boxShadow =
        "0 0 25px rgba(255,255,200,.9)";

    flash.style.zIndex =
        "100";

    setTimeout(() => {

        flash.remove();

    }, 70);
}


/* =========================================================
   PARTICLE UPDATE
========================================================= */

function updateParticles(dt) {

    for (
        let i = Game.particles.length - 1;
        i >= 0;
        i--
    ) {

        const p =
            Game.particles[i];

        p.x += p.vx * dt;

        p.y += p.vy * dt;

        p.life -= dt;

        p.el.style.left =
            `${p.x}px`;

        p.el.style.top =
            `${p.y}px`;

        p.el.style.opacity =
            Math.max(
                0,
                p.life
            );

        if (p.life <= 0) {

            p.el.remove();

            Game.particles.splice(i, 1);
        }
    }
}


/* =========================================================
   INTERACTABLES
========================================================= */

function createInteractables() {

    const objects = [

        {
            x: 990,
            y: 300,
            type: "radio",
            text: "RADIO"
        },

        {
            x: 610,
            y: 520,
            type: "drawer",
            text: "DRAWER"
        },

        {
            x: 840,
            y: 660,
            type: "note",
            text: "NOTE"
        }

    ];


    objects.forEach(obj => {

        const el =
            createElement(
                "button",
                `search-object object-${obj.type}`
            );

        el.textContent =
            obj.type === "radio"
                ? "◉"
                : obj.type === "drawer"
                ? "▣"
                : "▤";

        el.style.left =
            `${obj.x}px`;

        el.style.top =
            `${obj.y}px`;

        obj.el = el;

        Game.interactables.push(obj);
    });
}


/* =========================================================
   INTERACTION
========================================================= */

function interact() {

    let nearest = null;

    let nearestDistance =
        Infinity;


    Game.interactables.forEach(obj => {

        const dx =
            obj.x - Game.player.x;

        const dy =
            obj.y - Game.player.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy);


        if (
            distance <
            CONFIG.player.interactionDistance &&
            distance <
            nearestDistance
        ) {

            nearest = obj;

            nearestDistance = distance;
        }
    });


    if (!nearest) {

        showMessage("NOTHING TO INTERACT");

        return;
    }


    if (nearest.type === "radio") {

        showDialogue(
            "UNKNOWN",
            "If you can hear this... leave before they find you."
        );
    }


    if (nearest.type === "drawer") {

        Game.player.ammo += 10;

        if (
            Game.player.ammo >
            CONFIG.player.maxAmmo
        ) {
            Game.player.ammo =
                CONFIG.player.maxAmmo;
        }

        nearest.el.style.display =
            "none";

        showMessage("AMMO +10");
    }


    if (nearest.type === "note") {

        showDialogue(
            "FIELD NOTE",
            "03:17 AM. The lights went out. Then I heard footsteps."
        );
    }
}


/* =========================================================
   DIALOGUE
========================================================= */

function showDialogue(name, text) {

    const box =
        document.querySelector(".dialogue-box");

    if (box) box.remove();


    const dialogue =
        document.createElement("div");

    dialogue.className =
        "dialogue-box";

    dialogue.innerHTML = `

        <div class="dialogue-header">

            <span>${name}</span>

            <span class="dialogue-time">
                03:17
            </span>

        </div>

        <div class="dialogue-text">
            ${text}
        </div>

        <div class="dialogue-actions">

            <button id="dialogueClose">
                CLOSE
            </button>

        </div>

    `;


    document
        .getElementById("game")
        .appendChild(dialogue);


    document
        .getElementById("dialogueClose")
        .onclick = () => {

            dialogue.remove();
        };
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text) {

    if (!messageLayer) return;


    const old =
        messageLayer.querySelector(
            ".game-message"
        );

    if (old) old.remove();


    const message =
        document.createElement("div");

    message.className =
        "game-message";

    message.textContent =
        text;


    messageLayer.appendChild(message);


    clearTimeout(
        Game.messageTimer
    );


    Game.messageTimer =
        setTimeout(() => {

            message.remove();

        }, 1800);
}


/* =========================================================
   UPDATE PLAYER POSITION
========================================================= */

function renderPlayer() {

    if (!playerEl) return;


    const rect =
        gameWorld.getBoundingClientRect();


    const x =
        Game.player.x /
        CONFIG.world.width *
        rect.width;


    const y =
        Game.player.y /
        CONFIG.world.height *
        rect.height;


    playerEl.style.left =
        `${x}px`;

    playerEl.style.top =
        `${y}px`;


    playerEl.style.transform =
        `translate(-50%, -50%) rotate(${Game.player.angle}rad)`;


    const mapScaleX =
        100 /
        CONFIG.world.width;


    const mapScaleY =
        100 /
        CONFIG.world.height;


    if (mapPlayer) {

        mapPlayer.style.left =
            `${Game.player.x * mapScaleX}%`;

        mapPlayer.style.top =
            `${Game.player.y * mapScaleY}%`;
    }
}


/* =========================================================
   UPDATE MAP
========================================================= */

function updateMap() {

    if (!mapEnemy) return;

    const active =
        Game.enemies.find(
            enemy =>
                enemy.health > 0
        );


    if (!active) return;


    mapEnemy.style.left =
        `${active.x / CONFIG.world.width * 100}%`;

    mapEnemy.style.top =
        `${active.y / CONFIG.world.height * 100}%`;
}


/* =========================================================
   UI
========================================================= */

function updateUI() {

    if (healthFill) {

        const percent =
            Game.player.health /
            CONFIG.player.maxHealth *
            100;

        healthFill.style.width =
            `${percent}%`;
    }


    if (batteryFill) {

        batteryFill.style.width =
            `${Game.player.battery}%`;
    }


    if (batteryText) {

        batteryText.textContent =
            `${Math.ceil(Game.player.battery)}%`;
    }


    if (ammoDisplay) {

        ammoDisplay.innerHTML = `
            ${Game.player.ammo}
            <span class="ammo-divider">/</span>
            ${CONFIG.player.maxAmmo}
        `;
    }


    if (objectiveProgress) {

        const progress =
            Math.min(
                100,
                Game.objectiveProgress
            );

        objectiveProgress.style.width =
            `${progress}%`;
    }


    const score =
        document.querySelector(
            "[data-score]"
        );

    if (score) {

        score.textContent =
            Game.score;
    }
}


/* =========================================================
   PAUSE
========================================================= */

function togglePause() {

    if (!Game.running) return;

    Game.paused =
        !Game.paused;


    if (Game.paused) {

        showPauseMenu();

    } else {

        const menu =
            document.querySelector(
                ".pause-overlay"
            );

        if (menu) menu.remove();
    }
}


/* =========================================================
   PAUSE MENU
========================================================= */

function showPauseMenu() {

    if (
        document.querySelector(
            ".pause-overlay"
        )
    ) return;


    const overlay =
        document.createElement("div");

    overlay.className =
        "overlay pause-overlay";


    overlay.innerHTML = `

        <div class="menu-card">

            <div class="menu-title">
                PAUSED
            </div>

            <div class="menu-subtitle">
                SYSTEM STANDBY
            </div>

            <button
                class="menu-button"
                id="resumeButton"
            >
                RESUME
            </button>

            <button
                class="menu-button danger"
                id="restartButton"
            >
                RESTART
            </button>

        </div>

    `;


    document
        .getElementById("game")
        .appendChild(overlay);


    document
        .getElementById("resumeButton")
        .onclick = togglePause;


    document
        .getElementById("restartButton")
        .onclick = () => {

            location.reload();
        };
}


/* =========================================================
   GAME OVER
========================================================= */

function gameOver() {

    Game.running = false;

    const overlay =
        document.createElement("div");

    overlay.className =
        "overlay";


    overlay.innerHTML = `

        <div class="menu-card">

            <div
                class="menu-title"
                style="color:var(--red)"
            >
                YOU DIED
            </div>

            <div class="menu-subtitle">
                SIGNAL LOST
            </div>

            <div
                style="
                    margin:20px 0;
                    color:var(--muted);
                    font-size:10px;
                "
            >
                SCORE: ${Game.score}
            </div>

            <button
                class="menu-button"
                id="retryButton"
            >
                TRY AGAIN
            </button>

        </div>

    `;


    document
        .getElementById("game")
        .appendChild(overlay);


    document
        .getElementById("retryButton")
        .onclick = () => {

            location.reload();
        };
}


/* =========================================================
   GAME LOOP
========================================================= */

let lastTime =
    performance.now();


function gameLoop(timestamp) {

    const dt =
        Math.min(
            (timestamp - lastTime) / 1000,
            0.05
        );

    lastTime = timestamp;


    if (
        Game.running &&
        !Game.paused
    ) {

        Game.time += dt;


        updateMovement(dt);

        updateBattery(dt);

        updateEnemies(dt);

        updateShooting();

        updateBullets(dt);

        updateParticles(dt);

        renderPlayer();

        updateMap();

        updateUI();
    }


    requestAnimationFrame(gameLoop);
}


/* =========================================================
   INITIAL START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);