/* ============================================================
   BLACKOUT
   script.js
   Complete Game Controller
   ============================================================ */

"use strict";

/* ============================================================
   CONFIG
   ============================================================ */

const CONFIG = {
    WORLD_WIDTH: 1800,
    WORLD_HEIGHT: 1000,

    PLAYER: {
        speed: 210,
        maxHP: 100,
        maxBattery: 100,
        maxAmmo: 60,

        fireRate: 190,
        bulletSpeed: 760,
        damage: 25,

        interactionRange: 90
    },

    ENEMY: {
        speed: 55,
        chaseSpeed: 82,

        maxHP: 70,

        detectionRange: 360,
        attackRange: 42,
        attackDamage: 10,
        attackCooldown: 850
    },

    BOSS: {
        maxHP: 400,

        speed: 52,
        chaseSpeed: 70,

        detectionRange: 600,
        attackRange: 65,

        attackDamage: 18,
        attackCooldown: 1000,

        skillCooldown: 3500
    },

    BULLET: {
        lifetime: 1.8
    },

    BATTERY: {
        drain: 2.4
    },

    CAMERA: {
        smooth: 0.12
    }
};


/* ============================================================
   DOM HELPER
   ============================================================ */

function findElement(...selectors) {

    for (const selector of selectors) {

        if (!selector) continue;

        const element =
            document.querySelector(selector);

        if (element) return element;
    }

    return null;
}


function createElement(
    tag,
    className = "",
    parent = null
) {

    const element =
        document.createElement(tag);

    if (className) {

        element.className =
            className;
    }

    if (parent) {

        parent.appendChild(element);
    }

    return element;
}


/* ============================================================
   GAME STATE
   ============================================================ */

const Game = {

    initialized: false,

    running: false,

    paused: false,

    gameOver: false,

    lastTime: 0,

    elapsed: 0,

    score: 0,

    kills: 0,

    wave: 1,

    stage: 1,

    difficulty: "NORMAL",

    objective: 0,

    camera: {
        x: 0,
        y: 0
    },

    player: {

        x: 900,

        y: 500,

        angle: 0,

        hp: CONFIG.PLAYER.maxHP,

        battery:
            CONFIG.PLAYER.maxBattery,

        ammo:
            CONFIG.PLAYER.maxAmmo,

        firing: false,

        moving: false,

        flashlight: true,

        lastShot: 0,

        invulnerableUntil: 0
    },

    mouse: {

        x: 0,

        y: 0,

        down: false
    },

    keyboard: {},

    joystick: {

        active: false,

        x: 0,

        y: 0,

        strength: 0
    },

    bullets: [],

    enemies: [],

    enemyBullets: [],

    particles: [],

    loot: [],

    interactables: [],

    boss: null,

    effects: [],

    messageTimeout: null
};


/* ============================================================
   DOM REFERENCES
   ============================================================ */

let DOM = {};


/* ============================================================
   CACHE DOM
   ============================================================ */

function cacheDOM() {

    DOM.game =
        findElement(
            "#game",
            ".game",
            "main"
        );

    DOM.world =
        findElement(
            "#world",
            ".world",
            "#gameWorld",
            ".game-world"
        );

    DOM.gameWorld =
        findElement(
            "#gameWorld",
            ".game-world",
            "#world",
            ".world"
        );

    DOM.player =
        findElement(
            "#player",
            ".player"
        );

    DOM.startScreen =
        findElement(
            ".start-screen",
            "#startScreen"
        );

    DOM.startButton =
        findElement(
            "#startGameButton",
            "#startButton",
            ".start-button",
            "[data-action='start']"
        );

    DOM.healthFill =
        findElement(
            ".health-fill",
            "#healthFill",
            "#hpFill"
        );

    DOM.batteryFill =
        findElement(
            ".battery-fill",
            "#batteryFill"
        );

    DOM.batteryText =
        findElement(
            "#batteryText",
            ".battery-text"
        );

    DOM.ammo =
        findElement(
            ".ammo-display",
            "#ammoDisplay",
            "#ammo"
        );

    DOM.score =
        findElement(
            "[data-score]",
            "#score",
            ".score-value"
        );

    DOM.wave =
        findElement(
            "[data-wave]",
            "#wave",
            ".wave-value"
        );

    DOM.stage =
        findElement(
            "[data-stage]",
            "#stage",
            ".stage-value"
        );

    DOM.objectiveProgress =
        findElement(
            "#objectiveProgress",
            ".objective-progress"
        );

    DOM.damageOverlay =
        findElement(
            ".damage-overlay",
            "#damageOverlay"
        );

    DOM.messageLayer =
        findElement(
            "#messageLayer",
            ".message-layer"
        );

    DOM.joystick =
        findElement(
            ".joystick",
            "#joystick"
        );

    DOM.joystickKnob =
        findElement(
            ".joystick-knob",
            "#joystickKnob"
        );

    DOM.fireButton =
        findElement(
            ".fire-button",
            "#fireButton",
            "[data-action='fire']"
        );

    DOM.pauseButton =
        findElement(
            "[data-action='pause']",
            "#pauseButton",
            ".pause-button"
        );

    DOM.flashlightButton =
        findElement(
            "[data-action='flashlight']",
            "#flashlightButton"
        );

    DOM.interactButton =
        findElement(
            "[data-action='interact']",
            "#interactButton"
        );

    DOM.minimap =
        findElement(
            ".minimap",
            "#minimap"
        );

    DOM.mapPlayer =
        findElement(
            ".map-player",
            "#mapPlayer"
        );

    DOM.mapEnemies =
        findElement(
            ".map-enemies",
            "#mapEnemies"
        );
}


/* ============================================================
   INITIALIZATION
   ============================================================ */

function init() {

    if (Game.initialized) return;

    Game.initialized = true;

    cacheDOM();

    ensureGameStructure();

    setupPlayer();

    setupStartButton();

    setupKeyboard();

    setupMouse();

    setupJoystick();

    setupTouchButtons();

    setupResize();

    createWorldObjects();

    updateUI();

    render();

    Game.lastTime =
        performance.now();

    requestAnimationFrame(gameLoop);
}


/* ============================================================
   ENSURE BASIC STRUCTURE
   ============================================================ */

function ensureGameStructure() {

    if (!DOM.game) {

        DOM.game =
            createElement(
                "div",
                "game"
            );

        document.body.appendChild(
            DOM.game
        );
    }


    if (!DOM.gameWorld) {

        DOM.gameWorld =
            createElement(
                "div",
                "game-world",
                DOM.game
            );

        DOM.gameWorld.id =
            "gameWorld";
    }


    if (!DOM.world) {

        DOM.world =
            DOM.gameWorld;
    }


    if (!DOM.player) {

        DOM.player =
            createElement(
                "div",
                "player",
                DOM.gameWorld
            );

        DOM.player.id =
            "player";
    }


    if (!DOM.messageLayer) {

        DOM.messageLayer =
            createElement(
                "div",
                "message-layer",
                DOM.game
            );

        DOM.messageLayer.id =
            "messageLayer";
    }


    if (!DOM.damageOverlay) {

        DOM.damageOverlay =
            createElement(
                "div",
                "damage-overlay",
                DOM.game
            );

        DOM.damageOverlay.id =
            "damageOverlay";
    }


    buildPlayerVisual();
}


/* ============================================================
   PLAYER VISUAL
   ============================================================ */

function buildPlayerVisual() {

    if (!DOM.player) return;

    if (
        DOM.player.dataset
            .blackoutReady === "true"
    ) {
        return;
    }

    DOM.player.dataset.blackoutReady =
        "true";

    DOM.player.innerHTML = `

        <div class="player-shadow"></div>

        <div class="player-body">

            <div class="player-head"></div>

            <div class="player-torso"></div>

            <div class="player-arm player-arm-left"></div>

            <div class="player-arm player-arm-right"></div>

            <div class="player-weapon"></div>

        </div>

        <div class="flashlight-cone"></div>

        <div class="player-crosshair"></div>

    `;
}


/* ============================================================
   START BUTTON
   ============================================================ */

function setupStartButton() {

    const button =
        DOM.startButton ||
        findElement(
            ".start-screen button",
            ".start-content button"
        );

    if (!button) return;

    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            startGame();
        }
    );

    button.addEventListener(
        "touchend",
        event => {

            event.preventDefault();

            startGame();
        },
        { passive: false }
    );
}


/* ============================================================
   START GAME
   ============================================================ */

function startGame() {

    if (Game.running) return;

    Game.running = true;

    Game.paused = false;

    Game.gameOver = false;

    Game.elapsed = 0;

    Game.score = 0;

    Game.kills = 0;

    Game.wave = 1;

    Game.stage = 1;

    Game.objective = 0;

    Game.player.x =
        CONFIG.WORLD_WIDTH / 2;

    Game.player.y =
        CONFIG.WORLD_HEIGHT / 2;

    Game.player.angle = 0;

    Game.player.hp =
        CONFIG.PLAYER.maxHP;

    Game.player.battery =
        CONFIG.PLAYER.maxBattery;

    Game.player.ammo =
        CONFIG.PLAYER.maxAmmo;

    Game.player.flashlight =
        true;

    Game.player.firing =
        false;


    clearDynamicObjects();

    createWorldObjects();

    createEnemiesForWave();


    const startScreen =
        findElement(
            ".start-screen",
            "#startScreen"
        );

    if (startScreen) {

        startScreen.style.pointerEvents =
            "none";

        startScreen.style.opacity =
            "0";

        setTimeout(() => {

            if (
                startScreen &&
                startScreen.parentNode
            ) {

                startScreen.remove();
            }

        }, 450);
    }


    showMessage(
        "BLACKOUT // MISSION START"
    );

    updateUI();
}


/* ============================================================
   RESET DYNAMIC OBJECTS
   ============================================================ */

function clearDynamicObjects() {

    Game.enemies.forEach(
        enemy => {

            if (
                enemy.el &&
                enemy.el.parentNode
            ) {
                enemy.el.remove();
            }
        }
    );

    Game.bullets.length = 0;

    Game.enemyBullets.length = 0;

    Game.particles.length = 0;

    Game.enemies.length = 0;

    Game.loot.length = 0;

    Game.interactables.length = 0;

    Game.boss = null;


    document
        .querySelectorAll(
            ".blackout-dynamic"
        )
        .forEach(
            element =>
                element.remove()
        );
}


/* ============================================================
   WORLD OBJECTS
   ============================================================ */

function createWorldObjects() {

    createInteractable(
        720,
        280,
        "RADIO",
        "radio"
    );

    createInteractable(
        1120,
        690,
        "SUPPLY",
        "supply"
    );

    createInteractable(
        430,
        600,
        "NOTE",
        "note"
    );

    createInteractable(
        1420,
        470,
        "EXIT",
        "exit"
    );
}


/* ============================================================
   INTERACTABLE
   ============================================================ */

function createInteractable(
    x,
    y,
    label,
    type
) {

    const el =
        createElement(
            "button",
            "blackout-dynamic interactable",
            DOM.gameWorld
        );

    el.type = "button";

    el.dataset.type = type;

    el.textContent = label;

    el.style.position =
        "absolute";

    el.style.left =
        `${x}px`;

    el.style.top =
        `${y}px`;

    el.style.transform =
        "translate(-50%, -50%)";

    const object = {

        x,

        y,

        type,

        label,

        el,

        used: false
    };

    el.addEventListener(
        "click",
        () => {

            interactWith(
                object
            );
        }
    );

    Game.interactables.push(
        object
    );

    return object;
}


/* ============================================================
   INTERACTION
   ============================================================ */

function interact() {

    if (!Game.running) return;

    let nearest = null;

    let nearestDistance =
        CONFIG.PLAYER.interactionRange;


    for (
        const object
        of Game.interactables
    ) {

        if (object.used) continue;

        const distance =
            distanceBetween(
                Game.player,
                object
            );

        if (
            distance <
            nearestDistance
        ) {

            nearest =
                object;

            nearestDistance =
                distance;
        }
    }


    if (!nearest) {

        showMessage(
            "NO INTERACTION AVAILABLE"
        );

        return;
    }


    interactWith(nearest);
}


/* ============================================================
   INTERACT WITH OBJECT
   ============================================================ */

function interactWith(object) {

    if (!object || object.used) {
        return;
    }


    const distance =
        distanceBetween(
            Game.player,
            object
        );


    if (
        distance >
        CONFIG.PLAYER.interactionRange
    ) {

        showMessage(
            "TOO FAR"
        );

        return;
    }


    if (object.type === "radio") {

        showDialogue(
            "UNKNOWN SIGNAL",
            "If you can hear this... don't let them see you."
        );

        object.used = true;

        return;
    }


    if (object.type === "supply") {

        Game.player.ammo =
            Math.min(
                CONFIG.PLAYER.maxAmmo,
                Game.player.ammo + 20
            );

        Game.player.battery =
            Math.min(
                CONFIG.PLAYER.maxBattery,
                Game.player.battery + 30
            );

        object.used = true;

        object.el.remove();

        showMessage(
            "SUPPLIES RECOVERED"
        );

        return;
    }


    if (object.type === "note") {

        showDialogue(
            "FIELD NOTE",
            "03:17 AM. The city went dark. Something started moving."
        );

        object.used = true;

        return;
    }


    if (object.type === "exit") {

        if (Game.stage >= 5) {

            showMessage(
                "EXIT UNLOCKED"
            );

            completeGame();

        } else {

            showMessage(
                "EXIT LOCKED"
            );
        }
    }
}


/* ============================================================
   KEYBOARD
   ============================================================ */

function setupKeyboard() {

    window.addEventListener(
        "keydown",
        event => {

            Game.keyboard[
                event.key.toLowerCase()
            ] = true;


            if (
                event.key === " "
            ) {

                event.preventDefault();

                toggleFlashlight();
            }


            if (
                event.key.toLowerCase()
                === "e"
            ) {

                interact();
            }


            if (
                event.key === "Escape"
            ) {

                togglePause();
            }
        }
    );


    window.addEventListener(
        "keyup",
        event => {

            Game.keyboard[
                event.key.toLowerCase()
            ] = false;
        }
    );
}


/* ============================================================
   MOUSE
   ============================================================ */

function setupMouse() {

    window.addEventListener(
        "mousemove",
        event => {

            Game.mouse.x =
                event.clientX;

            Game.mouse.y =
                event.clientY;

            updateMouseAim();
        }
    );


    window.addEventListener(
        "mousedown",
        event => {

            if (event.button === 0) {

                Game.mouse.down =
                    true;
            }
        }
    );


    window.addEventListener(
        "mouseup",
        event => {

            if (event.button === 0) {

                Game.mouse.down =
                    false;
            }
        }
    );


    window.addEventListener(
        "blur",
        () => {

            Game.mouse.down =
                false;

            Game.player.firing =
                false;
        }
    );
}


/* ============================================================
   MOUSE AIM
   ============================================================ */

function updateMouseAim() {

    if (!DOM.gameWorld) return;


    const rect =
        DOM.gameWorld.getBoundingClientRect();


    const screenX =
        Game.player.x /
        CONFIG.WORLD_WIDTH *
        rect.width;

    const screenY =
        Game.player.y /
        CONFIG.WORLD_HEIGHT *
        rect.height;


    Game.player.angle =
        Math.atan2(
            Game.mouse.y -
            rect.top -
            screenY,

            Game.mouse.x -
            rect.left -
            screenX
        );
}


/* ============================================================
   JOYSTICK
   ============================================================ */

function setupJoystick() {

    if (
        !DOM.joystick
    ) {
        return;
    }


    const joystick =
        DOM.joystick;

    const knob =
        DOM.joystickKnob ||
        joystick.querySelector(
            ".joystick-knob"
        );


    function reset() {

        Game.joystick.active =
            false;

        Game.joystick.x =
            0;

        Game.joystick.y =
            0;

        Game.joystick.strength =
            0;


        if (knob) {

            knob.style.transform =
                "translate(-50%, -50%)";
        }
    }


    function move(event) {

        if (
            !Game.joystick.active
        ) {
            return;
        }


        const touch =
            event.touches
                ? event.touches[0]
                : event;


        const rect =
            joystick.getBoundingClientRect();


        const centerX =
            rect.left +
            rect.width / 2;

        const centerY =
            rect.top +
            rect.height / 2;


        let dx =
            touch.clientX -
            centerX;

        let dy =
            touch.clientY -
            centerY;


        const radius =
            rect.width / 2 - 18;


        const length =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            length >
            radius
        ) {

            dx =
                dx /
                length *
                radius;

            dy =
                dy /
                length *
                radius;
        }


        Game.joystick.x =
            dx / radius;

        Game.joystick.y =
            dy / radius;

        Game.joystick.strength =
            Math.min(
                length / radius,
                1
            );


        if (knob) {

            knob.style.transform =
                `translate(
                    calc(-50% + ${dx}px),
                    calc(-50% + ${dy}px)
                )`;
        }
    }


    joystick.addEventListener(
        "touchstart",
        event => {

            event.preventDefault();

            Game.joystick.active =
                true;

            move(event);
        },
        { passive: false }
    );


    joystick.addEventListener(
        "touchmove",
        event => {

            event.preventDefault();

            move(event);
        },
        { passive: false }
    );


    joystick.addEventListener(
        "touchend",
        reset
    );


    joystick.addEventListener(
        "touchcancel",
        reset
    );
}


/* ============================================================
   MOBILE BUTTONS
   ============================================================ */

function setupTouchButtons() {

    if (DOM.fireButton) {

        const startFire = event => {

            event.preventDefault();

            Game.player.firing =
                true;
        };


        const stopFire = event => {

            event.preventDefault();

            Game.player.firing =
                false;
        };


        DOM.fireButton.addEventListener(
            "touchstart",
            startFire,
            { passive: false }
        );

        DOM.fireButton.addEventListener(
            "touchend",
            stopFire,
            { passive: false }
        );

        DOM.fireButton.addEventListener(
            "mousedown",
            startFire
        );

        DOM.fireButton.addEventListener(
            "mouseup",
            stopFire
        );
    }


    if (DOM.flashlightButton) {

        DOM.flashlightButton.addEventListener(
            "click",
            toggleFlashlight
        );
    }


    if (DOM.interactButton) {

        DOM.interactButton.addEventListener(
            "click",
            interact
        );
    }


    if (DOM.pauseButton) {

        DOM.pauseButton.addEventListener(
            "click",
            togglePause
        );
    }
}


/* ============================================================
   RESIZE
   ============================================================ */

function setupResize() {

    window.addEventListener(
        "resize",
        () => {

            render();

        }
    );
}


/* ============================================================
   MOVEMENT
   ============================================================ */

function updateMovement(dt) {

    let moveX = 0;

    let moveY = 0;


    if (
        Game.keyboard["w"] ||
        Game.keyboard["arrowup"]
    ) {
        moveY -= 1;
    }


    if (
        Game.keyboard["s"] ||
        Game.keyboard["arrowdown"]
    ) {
        moveY += 1;
    }


    if (
        Game.keyboard["a"] ||
        Game.keyboard["arrowleft"]
    ) {
        moveX -= 1;
    }


    if (
        Game.keyboard["d"] ||
        Game.keyboard["arrowright"]
    ) {
        moveX += 1;
    }


    if (
        Game.joystick.active
    ) {

        moveX =
            Game.joystick.x;

        moveY =
            Game.joystick.y;
    }


    const length =
        Math.sqrt(
            moveX * moveX +
            moveY * moveY
        );


    if (length > 0) {

        if (length > 1) {

            moveX /= length;

            moveY /= length;
        }

        Game.player.moving =
            true;

    } else {

        Game.player.moving =
            false;
    }


    const speed =
        CONFIG.PLAYER.speed;


    Game.player.x +=
        moveX *
        speed *
        dt;


    Game.player.y +=
        moveY *
        speed *
        dt;


    Game.player.x =
        clamp(
            Game.player.x,
            30,
            CONFIG.WORLD_WIDTH - 30
        );


    Game.player.y =
        clamp(
            Game.player.y,
            30,
            CONFIG.WORLD_HEIGHT - 30
        );
}


/* ============================================================
   FLASHLIGHT
   ============================================================ */

function toggleFlashlight() {

    if (
        Game.player.battery <= 0
    ) {

        showMessage(
            "BATTERY EMPTY"
        );

        return;
    }


    Game.player.flashlight =
        !Game.player.flashlight;


    const cone =
        DOM.player?.querySelector(
            ".flashlight-cone"
        );


    if (cone) {

        cone.style.opacity =
            Game.player.flashlight
                ? "1"
                : "0";
    }
}


/* ============================================================
   BATTERY
   ============================================================ */

function updateBattery(dt) {

    if (
        !Game.player.flashlight
    ) {
        return;
    }


    Game.player.battery -=
        CONFIG.BATTERY.drain *
        dt;


    if (
        Game.player.battery <= 0
    ) {

        Game.player.battery =
            0;

        Game.player.flashlight =
            false;

        showMessage(
            "FLASHLIGHT BATTERY EMPTY"
        );
    }
}


/* ============================================================
   ENEMY CREATION
   ============================================================ */

function createEnemiesForWave() {

    const amount =
        3 +
        Game.stage;


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        const distance =
            450 +
            Math.random() * 300;


        const x =
            clamp(
                Game.player.x +
                Math.cos(angle) *
                distance,

                50,
                CONFIG.WORLD_WIDTH - 50
            );


        const y =
            clamp(
                Game.player.y +
                Math.sin(angle) *
                distance,

                50,
                CONFIG.WORLD_HEIGHT - 50
            );


        createEnemy(
            x,
            y
        );
    }


    if (
        Game.stage === 5
    ) {

        createBoss();
    }
}


/* ============================================================
   CREATE ENEMY
   ============================================================ */

function createEnemy(x, y) {

    const el =
        createElement(
            "div",
            "blackout-dynamic enemy",
            DOM.gameWorld
        );


    el.innerHTML = `

        <div class="enemy-shadow"></div>

        <div class="enemy-head"></div>

        <div class="enemy-body"></div>

        <div class="enemy-health">

            <div></div>

        </div>

    `;


    const enemy = {

        type: "normal",

        el,

        x,

        y,

        hp:
            CONFIG.ENEMY.maxHP,

        maxHP:
            CONFIG.ENEMY.maxHP,

        state: "idle",

        lastAttack: 0,

        attackTimer: 0,

        hitFlash: 0,

        dead: false
    };


    Game.enemies.push(
        enemy
    );

    return enemy;
}


/* ============================================================
   BOSS
   ============================================================ */

function createBoss() {

    const el =
        createElement(
            "div",
            "blackout-dynamic enemy boss",
            DOM.gameWorld
        );


    el.innerHTML = `

        <div class="boss-aura"></div>

        <div class="boss-head">

            <span></span>

        </div>

        <div class="boss-body"></div>

        <div class="boss-health">

            <div></div>

        </div>

        <div class="boss-name">
            THE HOLLOW
        </div>

    `;


    const boss = {

        type: "boss",

        el,

        x:
            CONFIG.WORLD_WIDTH / 2,

        y: 130,

        hp:
            CONFIG.BOSS.maxHP,

        maxHP:
            CONFIG.BOSS.maxHP,

        state: "idle",

        lastAttack: 0,

        lastSkill: 0,

        skillIndex: 0,

        dead: false
    };


    Game.enemies.push(
        boss
    );

    Game.boss =
        boss;


    showMessage(
        "WARNING // BOSS DETECTED"
    );
}


/* ============================================================
   UPDATE ENEMIES
   ============================================================ */

function updateEnemies(dt) {

    for (
        const enemy
        of Game.enemies
    ) {

        if (enemy.dead) continue;


        if (
            enemy.type === "boss"
        ) {

            updateBoss(
                enemy,
                dt
            );

        } else {

            updateNormalEnemy(
                enemy,
                dt
            );
        }


        renderEnemy(
            enemy
        );
    }
}


/* ============================================================
   NORMAL ENEMY AI
   ============================================================ */

function updateNormalEnemy(
    enemy,
    dt
) {

    const dx =
        Game.player.x -
        enemy.x;

    const dy =
        Game.player.y -
        enemy.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (
        distance <=
        CONFIG.ENEMY.detectionRange
    ) {

        enemy.state =
            "chasing";
    }


    if (
        enemy.state ===
        "chasing"
    ) {

        if (
            distance >
            CONFIG.ENEMY.attackRange
        ) {

            const nx =
                dx / distance;

            const ny =
                dy / distance;


            enemy.x +=
                nx *
                CONFIG.ENEMY.chaseSpeed *
                dt;

            enemy.y +=
                ny *
                CONFIG.ENEMY.chaseSpeed *
                dt;

        } else {

            enemyAttack(
                enemy
            );
        }
    }
}


/* ============================================================
   BOSS AI
   ============================================================ */

function updateBoss(
    boss,
    dt
) {

    const dx =
        Game.player.x -
        boss.x;

    const dy =
        Game.player.y -
        boss.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (
        distance <
        CONFIG.BOSS.detectionRange
    ) {

        boss.state =
            "chasing";
    }


    if (
        boss.state ===
        "chasing"
    ) {

        if (
            distance >
            CONFIG.BOSS.attackRange
        ) {

            const nx =
                dx / distance;

            const ny =
                dy / distance;


            boss.x +=
                nx *
                CONFIG.BOSS.chaseSpeed *
                dt;

            boss.y +=
                ny *
                CONFIG.BOSS.chaseSpeed *
                dt;

        } else {

            enemyAttack(
                boss
            );
        }


        const now =
            performance.now();


        if (
            now -
            boss.lastSkill >
            CONFIG.BOSS.skillCooldown
        ) {

            bossSkill(
                boss
            );

            boss.lastSkill =
                now;
        }
    }
}


/* ============================================================
   ENEMY ATTACK
   ============================================================ */

function enemyAttack(enemy) {

    const now =
        performance.now();


    const cooldown =
        enemy.type === "boss"
            ? CONFIG.BOSS.attackCooldown
            : CONFIG.ENEMY.attackCooldown;


    if (
        now -
        enemy.lastAttack <
        cooldown
    ) {
        return;
    }


    enemy.lastAttack =
        now;


    const damage =
        enemy.type === "boss"
            ? CONFIG.BOSS.attackDamage
            : CONFIG.ENEMY.attackDamage;


    damagePlayer(
        damage
    );
}


/* ============================================================
   BOSS SKILLS
   ============================================================ */

function bossSkill(boss) {

    boss.skillIndex =
        (
            boss.skillIndex + 1
        ) % 3;


    if (
        boss.skillIndex === 0
    ) {

        bossShockwave(
            boss
        );

    } else if (
        boss.skillIndex === 1
    ) {

        bossBurst(
            boss
        );

    } else {

        bossDash(
            boss
        );
    }
}


/* ============================================================
   BOSS SHOCKWAVE
   ============================================================ */

function bossShockwave(boss) {

    createExplosionEffect(
        boss.x,
        boss.y,
        180
    );


    const distance =
        distanceBetween(
            boss,
            Game.player
        );


    if (
        distance < 180
    ) {

        damagePlayer(
            22
        );
    }


    showMessage(
        "BOSS SKILL // SHOCKWAVE"
    );
}


/* ============================================================
   BOSS PROJECTILE BURST
   ============================================================ */

function bossBurst(boss) {

    const baseAngle =
        Math.atan2(
            Game.player.y -
            boss.y,

            Game.player.x -
            boss.x
        );


    for (
        let i = -2;
        i <= 2;
        i++
    ) {

        createEnemyBullet(
            boss.x,
            boss.y,
            baseAngle +
            i * 0.16
        );
    }


    showMessage(
        "BOSS SKILL // BURST"
    );
}


/* ============================================================
   BOSS DASH
   ============================================================ */

function bossDash(boss) {

    const dx =
        Game.player.x -
        boss.x;

    const dy =
        Game.player.y -
        boss.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (
        distance === 0
    ) return;


    boss.x +=
        dx /
        distance *
        180;


    boss.y +=
        dy /
        distance *
        180;


    createExplosionEffect(
        boss.x,
        boss.y,
        100
    );


    showMessage(
        "BOSS SKILL // DASH"
    );
}


/* ============================================================
   ENEMY BULLETS
   ============================================================ */

function createEnemyBullet(
    x,
    y,
    angle
) {

    const bullet = {

        x,

        y,

        angle,

        speed: 300,

        damage: 12,

        life: 3
    };


    Game.enemyBullets.push(
        bullet
    );
}


/* ============================================================
   UPDATE ENEMY BULLETS
   ============================================================ */

function updateEnemyBullets(dt) {

    for (
        let i =
            Game.enemyBullets.length - 1;

        i >= 0;

        i--
    ) {

        const bullet =
            Game.enemyBullets[i];


        bullet.x +=
            Math.cos(
                bullet.angle
            ) *
            bullet.speed *
            dt;


        bullet.y +=
            Math.sin(
                bullet.angle
            ) *
            bullet.speed *
            dt;


        bullet.life -= dt;


        if (
            bullet.life <= 0
        ) {

            Game.enemyBullets.splice(
                i,
                1
            );

            continue;
        }


        if (
            distanceBetween(
                bullet,
                Game.player
            ) < 25
        ) {

            damagePlayer(
                bullet.damage
            );


            Game.enemyBullets.splice(
                i,
                1
            );
        }
    }
}


/* ============================================================
   PLAYER DAMAGE
   ============================================================ */

function damagePlayer(amount) {

    const now =
        performance.now();


    if (
        now <
        Game.player.invulnerableUntil
    ) {
        return;
    }


    Game.player.hp -=
        amount;


    Game.player.invulnerableUntil =
        now + 400;


    showDamageEffect();


    createBloodParticles(
        Game.player.x,
        Game.player.y
    );


    if (
        Game.player.hp <= 0
    ) {

        Game.player.hp =
            0;

        gameOver();
    }
}


/* ============================================================
   SHOOTING
   ============================================================ */

function updateShooting() {

    const keyboardFire =
        Game.keyboard["f"];


    const wantsFire =
        Game.player.firing ||
        Game.mouse.down ||
        keyboardFire;


    if (!wantsFire) return;


    const now =
        performance.now();


    if (
        now -
        Game.player.lastShot <
        CONFIG.PLAYER.fireRate
    ) {
        return;
    }


    if (
        Game.player.ammo <= 0
    ) {

        showMessage(
            "OUT OF AMMO"
        );

        Game.player.firing =
            false;

        return;
    }


    shoot();
}


/* ============================================================
   SHOOT
   ============================================================ */

function shoot() {

    const now =
        performance.now();


    Game.player.lastShot =
        now;


    Game.player.ammo--;


    const offsetX =
        Math.cos(
            Game.player.angle
        ) * 24;


    const offsetY =
        Math.sin(
            Game.player.angle
        ) * 24;


    const bullet = {

        x:
            Game.player.x +
            offsetX,

        y:
            Game.player.y +
            offsetY,

        angle:
            Game.player.angle,

        speed:
            CONFIG.PLAYER.bulletSpeed,

        damage:
            CONFIG.PLAYER.damage,

        life:
            CONFIG.BULLET.lifetime
    };


    Game.bullets.push(
        bullet
    );


    createMuzzleFlash();
}


/* ============================================================
   UPDATE BULLETS
   ============================================================ */

function updateBullets(dt) {

    for (
        let i =
            Game.bullets.length - 1;

        i >= 0;

        i--
    ) {

        const bullet =
            Game.bullets[i];


        bullet.x +=
            Math.cos(
                bullet.angle
            ) *
            bullet.speed *
            dt;


        bullet.y +=
            Math.sin(
                bullet.angle
            ) *
            bullet.speed *
            dt;


        bullet.life -= dt;


        if (
            bullet.life <= 0
        ) {

            Game.bullets.splice(
                i,
                1
            );

            continue;
        }


        let hit = false;


        for (
            const enemy
            of Game.enemies
        ) {

            if (
                enemy.dead
            ) {
                continue;
            }


            const radius =
                enemy.type === "boss"
                    ? 55
                    : 30;


            if (
                distanceBetween(
                    bullet,
                    enemy
                ) <
                radius
            ) {

                damageEnemy(
                    enemy,
                    bullet.damage
                );


                hit = true;

                break;
            }
        }


        if (hit) {

            Game.bullets.splice(
                i,
                1
            );
        }
    }
}


/* ============================================================
   DAMAGE ENEMY
   ============================================================ */

function damageEnemy(
    enemy,
    damage
) {

    enemy.hp -=
        damage;


    enemy.hitFlash =
        0.12;


    createHitParticles(
        enemy.x,
        enemy.y
    );


    if (
        enemy.hp <= 0
    ) {

        killEnemy(
            enemy
        );
    }
}


/* ============================================================
   KILL ENEMY
   ============================================================ */

function killEnemy(enemy) {

    if (
        enemy.dead
    ) return;


    enemy.dead =
        true;


    Game.kills++;

    Game.score +=
        enemy.type === "boss"
            ? 5000
            : 250;


    createExplosionEffect(
        enemy.x,
        enemy.y,
        enemy.type === "boss"
            ? 180
            : 70
    );


    if (
        enemy.type === "boss"
    ) {

        bossDefeated();

    } else {

        maybeDropLoot(
            enemy
        );

        showMessage(
            "TARGET DOWN"
        );
    }


    if (
        enemy.el &&
        enemy.el.parentNode
    ) {

        enemy.el.remove();
    }
}


/* ============================================================
   BOSS DEFEATED
   ============================================================ */

function bossDefeated() {

    Game.boss =
        null;


    Game.score +=
        10000;


    showMessage(
        "THE HOLLOW // DESTROYED"
    );


    setTimeout(
        () => {

            if (
                Game.stage <
                5
            ) {

                nextStage();

            } else {

                completeGame();
            }

        },
        1200
    );
}


/* ============================================================
   NEXT STAGE
   ============================================================ */

function nextStage() {

    Game.stage++;

    Game.wave++;

    Game.objective = 0;


    Game.enemies.forEach(
        enemy => {

            if (
                enemy.el &&
                enemy.el.parentNode
            ) {

                enemy.el.remove();
            }
        }
    );


    Game.enemies.length =
        0;


    showMessage(
        `STAGE ${Game.stage} // INCOMING`
    );


    setTimeout(
        () => {

            createEnemiesForWave();

        },
        1200
    );
}


/* ============================================================
   LOOT
   ============================================================ */

const LOOT_TABLE = [

    {
        type: "ammo",
        chance: 0.35,
        label: "AMMO +10"
    },

    {
        type: "battery",
        chance: 0.25,
        label: "BATTERY +20"
    },

    {
        type: "health",
        chance: 0.20,
        label: "MEDKIT +25"
    },

    {
        type: "damage",
        chance: 0.08,
        label: "DAMAGE BOOST"
    },

    {
        type: "speed",
        chance: 0.07,
        label: "SPEED BOOST"
    },

    {
        type: "rare",
        chance: 0.05,
        label: "RARE CHIP"
    }
];


/* ============================================================
   DROP LOOT
   ============================================================ */

function maybeDropLoot(enemy) {

    const chance =
        0.25 +
        Game.stage * 0.04;


    if (
        Math.random() >
        chance
    ) {
        return;
    }


    let random =
        Math.random();


    for (
        const item
        of LOOT_TABLE
    ) {

        random -=
            item.chance;


        if (
            random <= 0
        ) {

            createLoot(
                enemy.x,
                enemy.y,
                item
            );

            break;
        }
    }
}


/* ============================================================
   CREATE LOOT
   ============================================================ */

function createLoot(
    x,
    y,
    item
) {

    const el =
        createElement(
            "button",
            "blackout-dynamic loot",
            DOM.gameWorld
        );


    el.textContent =
        item.type === "ammo"
            ? "▣"
            : item.type === "battery"
            ? "ϟ"
            : item.type === "health"
            ? "+"
            : item.type === "damage"
            ? "◆"
            : item.type === "speed"
            ? "»"
            : "★";


    el.style.position =
        "absolute";

    el.style.left =
        `${x}px`;

    el.style.top =
        `${y}px`;

    el.style.transform =
        "translate(-50%, -50%)";


    const loot = {

        x,

        y,

        type:
            item.type,

        label:
            item.label,

        el
    };


    Game.loot.push(
        loot
    );


    el.addEventListener(
        "click",
        () => {

            collectLoot(
                loot
            );
        }
    );
}


/* ============================================================
   COLLECT LOOT
   ============================================================ */

function collectLoot(loot) {

    const distance =
        distanceBetween(
            Game.player,
            loot
        );


    if (
        distance >
        CONFIG.PLAYER.interactionRange
    ) {

        showMessage(
            "MOVE CLOSER"
        );

        return;
    }


    switch (
        loot.type
    ) {

        case "ammo":

            Game.player.ammo =
                Math.min(
                    CONFIG.PLAYER.maxAmmo,
                    Game.player.ammo + 10
                );

            break;


        case "battery":

            Game.player.battery =
                Math.min(
                    CONFIG.PLAYER.maxBattery,
                    Game.player.battery + 20
                );

            break;


        case "health":

            Game.player.hp =
                Math.min(
                    CONFIG.PLAYER.maxHP,
                    Game.player.hp + 25
                );

            break;


        case "damage":

            CONFIG.PLAYER.damage +=
                8;

            break;


        case "speed":

            CONFIG.PLAYER.speed +=
                25;

            break;


        case "rare":

            Game.player.ammo =
                CONFIG.PLAYER.maxAmmo;

            Game.player.battery =
                CONFIG.PLAYER.maxBattery;

            Game.score +=
                1000;

            break;
    }


    showMessage(
        loot.label
    );


    loot.el.remove();


    const index =
        Game.loot.indexOf(
            loot
        );


    if (
        index !== -1
    ) {

        Game.loot.splice(
            index,
            1
        );
    }
}


/* ============================================================
   PARTICLES
   ============================================================ */

function createParticle(
    x,
    y,
    symbol = "•"
) {

    const el =
        createElement(
            "div",
            "blackout-dynamic particle",
            DOM.gameWorld
        );


    el.textContent =
        symbol;


    const particle = {

        el,

        x,

        y,

        vx:
            (Math.random() - 0.5) *
            180,

        vy:
            (Math.random() - 0.5) *
            180,

        life:
            0.5 +
            Math.random() *
            0.4,

        maxLife:
            0.9
    };


    Game.particles.push(
        particle
    );
}


/* ============================================================
   HIT PARTICLES
   ============================================================ */

function createHitParticles(
    x,
    y
) {

    for (
        let i = 0;
        i < 7;
        i++
    ) {

        createParticle(
            x,
            y,
            "•"
        );
    }
}


/* ============================================================
   BLOOD
   ============================================================ */

function createBloodParticles(
    x,
    y
) {

    for (
        let i = 0;
        i < 10;
        i++
    ) {

        createParticle(
            x,
            y,
            "◆"
        );
    }
}


/* ============================================================
   EXPLOSION
   ============================================================ */

function createExplosionEffect(
    x,
    y,
    size = 80
) {

    const el =
        createElement(
            "div",
            "blackout-dynamic explosion",
            DOM.gameWorld
        );


    el.style.position =
        "absolute";

    el.style.left =
        `${x}px`;

    el.style.top =
        `${y}px`;

    el.style.width =
        `${size}px`;

    el.style.height =
        `${size}px`;

    el.style.transform =
        "translate(-50%, -50%)";

    el.style.borderRadius =
        "50%";


    setTimeout(
        () => {

            if (
                el.parentNode
            ) {

                el.remove();
            }

        },
        500
    );


    for (
        let i = 0;
        i < 20;
        i++
    ) {

        createParticle(
            x,
            y,
            Math.random() > 0.5
                ? "*"
                : "+"
        );
    }
}


/* ============================================================
   MUZZLE FLASH
   ============================================================ */

function createMuzzleFlash() {

    const el =
        createElement(
            "div",
            "blackout-dynamic muzzle-flash",
            DOM.gameWorld
        );


    const distance =
        30;


    el.style.position =
        "absolute";


    el.style.left =
        `${
            Game.player.x +
            Math.cos(
                Game.player.angle
            ) *
            distance
        }px`;


    el.style.top =
        `${
            Game.player.y +
            Math.sin(
                Game.player.angle
            ) *
            distance
        }px`;


    el.style.transform =
        "translate(-50%, -50%)";


    setTimeout(
        () => {

            if (
                el.parentNode
            ) {

                el.remove();
            }

        },
        80
    );
}


/* ============================================================
   UPDATE PARTICLES
   ============================================================ */

function updateParticles(dt) {

    for (
        let i =
            Game.particles.length - 1;

        i >= 0;

        i--
    ) {

        const p =
            Game.particles[i];


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
            p.el
        ) {

            p.el.style.left =
                `${p.x}px`;

            p.el.style.top =
                `${p.y}px`;

            p.el.style.opacity =
                Math.max(
                    0,
                    p.life /
                    p.maxLife
                );
        }


        if (
            p.life <= 0
        ) {

            if (
                p.el &&
                p.el.parentNode
            ) {

                p.el.remove();
            }


            Game.particles.splice(
                i,
                1
            );
        }
    }
}


/* ============================================================
   RENDER ENEMY
   ============================================================ */

function renderEnemy(enemy) {

    if (!enemy.el) return;


    enemy.el.style.left =
        `${enemy.x}px`;

    enemy.el.style.top =
        `${enemy.y}px`;


    const health =
        enemy.el.querySelector(
            ".enemy-health div"
        );


    if (health) {

        health.style.width =
            `${Math.max(
                0,
                enemy.hp /
                enemy.maxHP *
                100
            )}%`;
    }


    const bossHealth =
        enemy.el.querySelector(
            ".boss-health div"
        );


    if (bossHealth) {

        bossHealth.style.width =
            `${Math.max(
                0,
                enemy.hp /
                enemy.maxHP *
                100
            )}%`;
    }


    if (
        enemy.hitFlash > 0
    ) {

        enemy.hitFlash -=
            0.016;

        enemy.el.classList.add(
            "hit"
        );

    } else {

        enemy.el.classList.remove(
            "hit"
        );
    }
}


/* ============================================================
   RENDER
   ============================================================ */

function render() {

    if (!DOM.gameWorld) return;


    DOM.player.style.left =
        `${Game.player.x}px`;

    DOM.player.style.top =
        `${Game.player.y}px`;


    DOM.player.style.transform =
        `translate(-50%, -50%) rotate(${Game.player.angle}rad)`;


    updateMap();


    for (
        const bullet
        of Game.bullets
    ) {

        renderBullet(
            bullet
        );
    }


    for (
        const bullet
        of Game.enemyBullets
    ) {

        renderEnemyBullet(
            bullet
        );
    }


    for (
        const loot
        of Game.loot
    ) {

        if (loot.el) {

            loot.el.style.left =
                `${loot.x}px`;

            loot.el.style.top =
                `${loot.y}px`;
        }
    }
}


/* ============================================================
   BULLET VISUAL
   ============================================================ */

const bulletElements =
    new Map();


function renderBullet(bullet) {

    let el =
        bulletElements.get(
            bullet
        );


    if (!el) {

        el =
            createElement(
                "div",
                "blackout-dynamic bullet",
                DOM.gameWorld
            );

        bulletElements.set(
            bullet,
            el
        );
    }


    el.style.left =
        `${bullet.x}px`;

    el.style.top =
        `${bullet.y}px`;

    el.style.transform =
        `translate(-50%, -50%) rotate(${bullet.angle}rad)`;


    if (
        bullet.life <= 0
    ) {

        el.remove();

        bulletElements.delete(
            bullet
        );
    }
}


/* ============================================================
   ENEMY BULLET VISUAL
   ============================================================ */

const enemyBulletElements =
    new Map();


function renderEnemyBullet(
    bullet
) {

    let el =
        enemyBulletElements.get(
            bullet
        );


    if (!el) {

        el =
            createElement(
                "div",
                "blackout-dynamic enemy-bullet",
                DOM.gameWorld
            );

        enemyBulletElements.set(
            bullet,
            el
        );
    }


    el.style.left =
        `${bullet.x}px`;

    el.style.top =
        `${bullet.y}px`;

    el.style.transform =
        `translate(-50%, -50%) rotate(${bullet.angle}rad)`;


    if (
        bullet.life <= 0
    ) {

        el.remove();

        enemyBulletElements.delete(
            bullet
        );
    }
}


/* ============================================================
   MAP
   ============================================================ */

function updateMap() {

    if (
        DOM.mapPlayer
    ) {

        DOM.mapPlayer.style.left =
            `${
                Game.player.x /
                CONFIG.WORLD_WIDTH *
                100
            }%`;


        DOM.mapPlayer.style.top =
            `${
                Game.player.y /
                CONFIG.WORLD_HEIGHT *
                100
            }%`;
    }


    if (
        !DOM.mapEnemies
    ) {
        return;
    }


    DOM.mapEnemies.innerHTML =
        "";


    for (
        const enemy
        of Game.enemies
    ) {

        if (
            enemy.dead
        ) continue;


        const dot =
            createElement(
                "span",
                "map-enemy-dot",
                DOM.mapEnemies
            );


        dot.style.left =
            `${
                enemy.x /
                CONFIG.WORLD_WIDTH *
                100
            }%`;


        dot.style.top =
            `${
                enemy.y /
                CONFIG.WORLD_HEIGHT *
                100
            }%`;
    }
}


/* ============================================================
   UI
   ============================================================ */

function updateUI() {

    if (
        DOM.healthFill
    ) {

        DOM.healthFill.style.width =
            `${
                Game.player.hp /
                CONFIG.PLAYER.maxHP *
                100
            }%`;
    }


    if (
        DOM.batteryFill
    ) {

        DOM.batteryFill.style.width =
            `${Game.player.battery}%`;
    }


    if (
        DOM.batteryText
    ) {

        DOM.batteryText.textContent =
            `${Math.ceil(
                Game.player.battery
            )}%`;
    }


    if (
        DOM.ammo
    ) {

        DOM.ammo.textContent =
            `${Game.player.ammo} / ${CONFIG.PLAYER.maxAmmo}`;
    }


    if (
        DOM.score
    ) {

        DOM.score.textContent =
            Game.score;
    }


    if (
        DOM.wave
    ) {

        DOM.wave.textContent =
            Game.wave;
    }


    if (
        DOM.stage
    ) {

        DOM.stage.textContent =
            `${Game.stage}/5`;
    }


    if (
        DOM.objectiveProgress
    ) {

        const total =
            Game.enemies.length;

        const dead =
            Game.enemies.filter(
                enemy =>
                    enemy.dead
            ).length;


        const percent =
            total === 0
                ? 0
                : dead /
                  total *
                  100;


        DOM.objectiveProgress.style.width =
            `${percent}%`;
    }
}


/* ============================================================
   DAMAGE EFFECT
   ============================================================ */

function showDamageEffect() {

    if (!DOM.damageOverlay) {
        return;
    }


    DOM.damageOverlay.classList.add(
        "active"
    );


    setTimeout(
        () => {

            DOM.damageOverlay.classList.remove(
                "active"
            );

        },
        180
    );
}


/* ============================================================
   MESSAGE
   ============================================================ */

function showMessage(text) {

    if (
        !DOM.messageLayer
    ) {
        return;
    }


    const message =
        createElement(
            "div",
            "game-message",
            DOM.messageLayer
        );


    message.textContent =
        text;


    clearTimeout(
        Game.messageTimeout
    );


    Game.messageTimeout =
        setTimeout(
            () => {

                if (
                    message.parentNode
                ) {

                    message.remove();
                }

            },
            1800
        );
}


/* ============================================================
   DIALOGUE
   ============================================================ */

function showDialogue(
    speaker,
    text
) {

    const old =
        document.querySelector(
            ".blackout-dialogue"
        );


    if (old) {
        old.remove();
    }


    const dialogue =
        createElement(
            "div",
            "blackout-dialogue",
            DOM.game
        );


    dialogue.innerHTML = `

        <div class="dialogue-inner">

            <div class="dialogue-speaker">
                ${speaker}
            </div>

            <div class="dialogue-text">
                ${text}
            </div>

            <button
                class="dialogue-close"
            >
                CLOSE
            </button>

        </div>

    `;


    const close =
        dialogue.querySelector(
            ".dialogue-close"
        );


    close.addEventListener(
        "click",
        () => {

            dialogue.remove();
        }
    );
}


/* ============================================================
   PAUSE
   ============================================================ */

function togglePause() {

    if (
        !Game.running ||
        Game.gameOver
    ) {
        return;
    }


    Game.paused =
        !Game.paused;


    if (
        Game.paused
    ) {

        showPauseScreen();

    } else {

        const overlay =
            document.querySelector(
                ".blackout-pause"
            );

        if (overlay) {
            overlay.remove();
        }
    }
}


/* ============================================================
   PAUSE SCREEN
   ============================================================ */

function showPauseScreen() {

    if (
        document.querySelector(
            ".blackout-pause"
        )
    ) {
        return;
    }


    const overlay =
        createElement(
            "div",
            "blackout-pause",
            DOM.game
        );


    overlay.innerHTML = `

        <div class="pause-panel">

            <div class="pause-title">
                SYSTEM PAUSED
            </div>

            <div class="pause-subtitle">
                SIGNAL SUSPENDED
            </div>

            <button
                class="pause-resume"
            >
                RESUME
            </button>

            <button
                class="pause-restart"
            >
                RESTART
            </button>

        </div>

    `;


    overlay
        .querySelector(
            ".pause-resume"
        )
        .onclick =
        togglePause;


    overlay
        .querySelector(
            ".pause-restart"
        )
        .onclick =
        () => {

            location.reload();
        };
}


/* ============================================================
   GAME OVER
   ============================================================ */

function gameOver() {

    if (
        Game.gameOver
    ) {
        return;
    }


    Game.gameOver =
        true;

    Game.running =
        false;


    const overlay =
        createElement(
            "div",
            "blackout-gameover",
            DOM.game
        );


    overlay.innerHTML = `

        <div class="gameover-panel">

            <div class="gameover-title">
                SIGNAL LOST
            </div>

            <div class="gameover-subtitle">
                YOU DID NOT MAKE IT OUT
            </div>

            <div class="gameover-stats">

                SCORE:
                <strong>
                    ${Game.score}
                </strong>

                <br>

                KILLS:
                <strong>
                    ${Game.kills}
                </strong>

                <br>

                STAGE:
                <strong>
                    ${Game.stage}
                </strong>

            </div>

            <button
                class="gameover-restart"
            >
                TRY AGAIN
            </button>

        </div>

    `;


    overlay
        .querySelector(
            ".gameover-restart"
        )
        .onclick =
        () => {

            location.reload();
        };
}


/* ============================================================
   COMPLETE GAME
   ============================================================ */

function completeGame() {

    Game.running =
        false;


    const overlay =
        createElement(
            "div",
            "blackout-victory",
            DOM.game
        );


    overlay.innerHTML = `

        <div class="victory-panel">

            <div class="victory-title">
                EXTRACTION COMPLETE
            </div>

            <div class="victory-subtitle">
                YOU SURVIVED BLACKOUT
            </div>

            <div class="victory-score">
                SCORE: ${Game.score}
            </div>

            <button
                class="victory-restart"
            >
                PLAY AGAIN
            </button>

        </div>

    `;


    overlay
        .querySelector(
            ".victory-restart"
        )
        .onclick =
        () => {

            location.reload();
        };
}


/* ============================================================
   GAME LOOP
   ============================================================ */

function gameLoop(timestamp) {

    let dt =
        (
            timestamp -
            Game.lastTime
        ) / 1000;


    Game.lastTime =
        timestamp;


    dt =
        Math.min(
            dt,
            0.05
        );


    if (
        Game.running &&
        !Game.paused &&
        !Game.gameOver
    ) {

        Game.elapsed +=
            dt;


        updateMovement(
            dt
        );


        updateBattery(
            dt
        );


        updateEnemies(
            dt
        );


        updateShooting();


        updateBullets(
            dt
        );


        updateEnemyBullets(
            dt
        );


        updateParticles(
            dt
        );


        render();


        updateUI();
    }


    requestAnimationFrame(
        gameLoop
    );
}


/* ============================================================
   UTILITIES
   ============================================================ */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


function distanceBetween(
    a,
    b
) {

    const dx =
        a.x -
        b.x;

    const dy =
        a.y -
        b.y;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


/* ============================================================
   PREVENT MOBILE PAGE SCROLL
   ============================================================ */

document.addEventListener(
    "touchmove",
    event => {

        if (
            event.target.closest(
                ".joystick"
            ) ||
            event.target.closest(
                ".fire-button"
            )
        ) {

            event.preventDefault();
        }

    },
    {
        passive: false
    }
);


/* ============================================================
   START
   ============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();
}
