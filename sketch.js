// ============================================================
// Week 6 Example 2 — Free Roam Top-Down with Boss Battle
// ============================================================
// The player moves freely around a world larger than the canvas.
// A smooth-follow camera keeps the player centred.
// Enemy waves are loaded from JSON and chase the player.
// A minimap in the bottom-right corner shows the player and
// enemy positions at all times.
// A giant orange blob boss spawns when the player enters the
// boss zone at the top of the world. Defeat it to win.
// Press B to skip straight to the boss for testing.
//
// Files:
//   sketch.js           — all game logic
//   data/enemies.json   — wave trigger positions, enemy data, boss data
//   data/obstacles.json — obstacle positions in world coordinates
// ============================================================

// ------------------------------------------------------------
// WORLD
// The world is larger than the canvas. The camera follows
// the player so only part of the world is visible at once.
// ------------------------------------------------------------
const DIR_VECTORS = {
  up:    { x: 0,  y: -1 },
  down:  { x: 0,  y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1,  y: 0 },
};

const WORLD_W = 1600; // total world width in pixels
const WORLD_H = 2000; // total world height in pixels

const WEREWOLFSPRITE = { //werewolf 144 x256
  frameWidth:  48,
  frameHeight: 64,
  numFrames:   3,
  animSpeed:   13,
  scale:       1.4,
  rows: {
    up:  0,
    right:    1,
    down: 2,
    left:  3,
  },
  offsets: {
    down:  { x: 0, y: 30  },
    up:    { x: 0, y: 30  },
    right: { x: 0, y: 30 },
    left:  { x: 0, y: 30 },
  },
};



// ------------------------------------------------------------
// CAMERA
// camX and camY are the world coordinates at the top-left
// of the canvas. translate(-camX, -camY) shifts everything
// so the player appears centred on screen.
// ------------------------------------------------------------
let camX = 0;
let camY = 0;
const CAM_SMOOTHING = 0.1;

// ------------------------------------------------------------
// PLAYER CONFIGURATION
// ------------------------------------------------------------
const PLAYER_SPEED = 3;
const BULLET_SPEED = 10;
const SHOOT_COOLDOWN = 17;
const INVINCIBLE_FRAMES = 90;

// ------------------------------------------------------------
// PLAYER
// Position is in world coordinates.
// Starts near the bottom centre of the world.
// ------------------------------------------------------------
let player = {
  x: WORLD_W / 2,
  y: WORLD_H - 200,
  r: 22,

  currentFrame: 0,
  frameTimer: 0,
  direction: "down",
  isMoving: false,

  shootTimer: 0,
  health: 5,
  maxHealth: 5,
  invincible: false,
  invincibleTimer: 0,
  bounceVX: 0,
  bounceVY: 0,
};

let VIL_FRAME_W;
let VIL_FRAME_H;
const VIL_COLS    = 3;

const VIL_DRAW_W  = 50;
const VIL_DRAW_H  = 60;

const VIL_ROWS = {
  down:  0,
  right: 1,
  up:    2,
  left:  3,
};
// Horizontal correction offsets for each animation frame
// Tune these numbers until the villager stops drifting
const VIL_XOFF = [6, 0, -10];  // 4 frames per row


// ------------------------------------------------------------
// BULLETS and ENEMIES
// Positions are in world coordinates.
// ------------------------------------------------------------
let bullets = [];
let enemies = [];

// ------------------------------------------------------------
// OBSTACLES
// Loaded from data/obstacles.json in preload().
// Positioned in world coordinates — drawn and collided in
// world space. Player takes damage and bounces on contact.
// ------------------------------------------------------------
let obstacleData;
let obstacles = [];

// ------------------------------------------------------------
// WAVE SYSTEM
// Each wave has a triggerY — spawns when player.y < triggerY.
// nextWave tracks which wave to check next.
// ------------------------------------------------------------
let enemyData;
let nextWave = 0;

// ------------------------------------------------------------
// BOSS
// Spawns when player enters the boss zone (player.y < bossZoneY).
// ------------------------------------------------------------
let boss = null;
let bossData = null;
const BOSS_ZONE_Y = 300; // world Y — enter this zone to trigger boss

// ------------------------------------------------------------
// MINIMAP
// Drawn in screen coordinates after pop().
// Shows a scaled-down version of the world with dots for
// the player (teal) and enemies (orange).
// ------------------------------------------------------------
const MAP_W = 120; // minimap width in pixels
const MAP_H = 120; // minimap height in pixels
const MAP_X = 16;  // screen position — bottom left
const MAP_Y_OFFSET = 16; // offset from bottom of screen

// ------------------------------------------------------------
// GAME STATE
// ------------------------------------------------------------
let score = 0;

const STATE_PLAY = "play";
const STATE_BOSS = "boss";
const STATE_WIN = "win";
const STATE_OVER = "over";
let gameState = STATE_PLAY;

// sprite sheets
let werewolfImg;
let villagerImg;
// bg 
let groundImg;

// ------------------------------------------------------------
// SOUNDS — uncomment and fill in paths to add audio
// ------------------------------------------------------------
let shootSounds = [];
let hitSound;
let playerHitSounds = [];
let bossHitSound;
let bossMusic;
let winSound;
let backgroundMusic;

// ============================================================
// preload()
// ============================================================
function preload() {
  enemyData    = loadJSON("data/enemies.json");
  obstacleData = loadJSON("data/obstacles.json");
  werewolfImg = loadImage("assets/images/werewolf.png");
  villagerImg = loadImage("assets/images/villager.png");
  groundImg = loadImage("assets/images/ground.png");

  for (let i = 1; i <= 3; i++) {
    shootSounds.push(loadSound("assets/sounds/shoot" + i + ".mp3"));
  }
  hitSound       = loadSound("assets/sounds/hit.mp3");
  for (let i = 1; i <= 2; i++) {
    playerHitSounds.push(loadSound("assets/sounds/hurt" + i + ".mp3"));
  }
  bossHitSound   = loadSound("assets/sounds/bossHit.mp3");
bossMusic      = loadSound("assets/sounds/bossMusic.mp3");
  winSound       = loadSound("assets/sounds/winHowl.mp3");
  loseSound      = loadSound("assets/sounds/loseCry.mp3");
  backgroundMusic          = loadSound("assets/sounds/background.mp3");
}

// ============================================================
// setup()
// ============================================================
function setup() {
  createCanvas(800, 450);
  VIL_FRAME_W = villagerImg.width / 3;
VIL_FRAME_H = villagerImg.height / 4;

  bossData = enemyData.boss;

  // Build obstacle objects from JSON
  for (let i = 0; i < obstacleData.obstacles.length; i++) {
    let o = obstacleData.obstacles[i];
    obstacles.push({ x: o.x, y: o.y, size: o.size });

  }

  // Start camera so player is visible
  camX = player.x - width / 2;
  camY = player.y - height / 2;

  // Uncomment to start music:
  backgroundMusic.loop();
  backgroundMusic.setVolume(2);
}

// ============================================================
// draw()
// ============================================================
function draw() {
  background(20);

  updateCamera();

  // Everything inside push/pop is drawn in world coordinates
  push();
  translate(-camX, -camY);

  drawBackground();
  drawBossZone();

  if (gameState === STATE_PLAY) {
    handleInput();
    applyBounce();
    updateBullets();
    updateEnemies();
    checkWaveSpawns();
    checkBossZone();
    checkBulletEnemyCollisions();
    checkEnemyPlayerCollision();
    checkObstaclePlayerCollision();
    updateInvincibility();
    drawObstacles();
    drawEnemies();
    drawBullets();
    drawPlayer();
    animateSprite();

  } else if (gameState === STATE_BOSS) {
    handleInput();
    applyBounce();
    updateBullets();
    updateBoss();
    checkBulletBossCollision();
    checkBossPlayerCollision();
    checkObstaclePlayerCollision();
    updateInvincibility();
    drawObstacles();
    drawBoss();
    drawBullets();
    drawPlayer();
  }

  pop(); // restore screen coordinates

  // HUD and minimap are drawn in screen coordinates
  drawHUD();
  drawMinimap();

  if (gameState === STATE_BOSS) drawBossHUD();
  if (gameState === STATE_WIN)  drawWinScreen();
  if (gameState === STATE_OVER) drawGameOver();
}

 
// ------------------------------------------------------------
// updateCamera()
// Smoothly moves the camera toward the player each frame.
// Clamps so the camera never shows outside the world.
// ------------------------------------------------------------
function updateCamera() {
  let targetX = player.x - width / 2;
  let targetY = player.y - height / 2;

  targetX = constrain(targetX, 0, WORLD_W - width);
  targetY = constrain(targetY, 0, WORLD_H - height);

  camX = lerp(camX, targetX, CAM_SMOOTHING);
  camY = lerp(camY, targetY, CAM_SMOOTHING);
}

// ------------------------------------------------------------
// drawObstacles()
// Drawn in world coordinates inside push/pop.
// Only draws obstacles near the camera for performance.
// ----------------------------- -------------------------------
function drawObstacles() {
  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];

    // Skip if off screen
    if (
      o.x + o.size < camX || o.x - o.size > camX + width ||
      o.y + o.size < camY || o.y - o.size > camY + height
    ) continue;

    let x = o.x - o.size / 2;
    let y = o.y - o.size / 2;
    let s = o.size;

    // Animated glow — pulses using sin(frameCount)
    let glow = map(sin(frameCount * 0.05 + i * 1.2), -1, 1, 40, 90);

    push();

    // Outer glow
    noStroke();
    fill(255, 100, 100, glow);
    rect(x - 4, y - 4, s + 8, s + 8, 8);

    // silver base
    fill(150, 180, 200);
    rect(x, y, s, s, 4);

    // silver surface patches
    fill(200, 230, 250);
    rect(x + s * 0.1, y + s * 0.1, s * 0.4, s * 0.35, 2);
    rect(x + s * 0.55, y + s * 0.5, s * 0.35, s * 0.3, 2);
    rect(x + s * 0.2, y + s * 0.6, s * 0.25, s * 0.25, 2);

    // Crack lines
    stroke(100, 120, 140);
    strokeWeight(1.5);
    line(x + s * 0.3, y, x + s * 0.5, y + s * 0.4);
    line(x + s * 0.5, y + s * 0.4, x + s * 0.7, y + s * 0.6);
    line(x, y + s * 0.5, x + s * 0.3, y + s * 0.7);
    line(x + s * 0.3, y + s * 0.7, x + s * 0.6, y + s);

    // Hot edge highlight
    noStroke();
    fill(255, 180, 180, 180);
    rect(x, y, s, 3, 2);
    rect(x, y, 3, s, 2);

    pop();
  }
}

// ------------------------------------------------------------
// checkObstaclePlayerCollision()
// Circle-rectangle overlap test — same as Example 1.
// Player bounces away and loses health on contact.
// ------------------------------------------------------------
function checkObstaclePlayerCollision() {
  if (player.invincible) return;

  for (let i = 0; i < obstacles.length; i++) {
    let o = obstacles[i];

    let closestX = constrain(player.x, o.x - o.size / 2, o.x + o.size / 2);
    let closestY = constrain(player.y, o.y - o.size / 2, o.y + o.size / 2);
    let d = dist(player.x, player.y, closestX, closestY);

    if (d < player.r) {
      player.health--;
      player.invincible      = true;
      player.invincibleTimer = INVINCIBLE_FRAMES;

      // Bounce direction — away from obstacle centre
      let dx  = player.x - o.x;
      let dy  = player.y - o.y;
      let len = dist(0, 0, dx, dy);
      if (len > 0) {
        player.bounceVX = (dx / len) * 8;
        player.bounceVY = (dy / len) * 8;
      }

      let randomHit = playerHitSounds[floor(random(playerHitSounds.length))];
    randomHit.play(); 

      if (player.health <= 0) {
        gameState = STATE_OVER;
         // Stop ALL music
  backgroundMusic.stop();
  bossMusic.stop();

  loseSound.play();
      }
      break;
    }
  }
}

// ------------------------------------------------------------
// applyBounce()
// Applies and decays bounce velocity each frame.
// ------------------------------------------------------------
function applyBounce() {
  if (abs(player.bounceVX) > 0.1 || abs(player.bounceVY) > 0.1) {
    player.x += player.bounceVX;
    player.y += player.bounceVY;
    player.bounceVX *= 0.75;
    player.bounceVY *= 0.75;

    player.x = constrain(player.x, player.r, WORLD_W - player.r);
    player.y = constrain(player.y, player.r, WORLD_H - player.r);
  }
}

// ------------------------------------------------------------
// drawBackground()
// Draws background shapes in world coordinates.
// Only shapes near the camera are drawn for performance.
// ------------------------------------------------------------
function drawBackground() {
  noStroke();
  if (groundImg && groundImg.width > 0) {
    let tW = groundImg.width;
    let tH = groundImg.height;
 
    // Only tile what's visible + one extra tile buffer
    let startX = floor(camX / tW) * tW;
    let startY = floor(camY / tH) * tH;
    let endX   = camX + width  + tW;
    let endY   = camY + height + tH;
 
    // Clamp to world bounds
    startX = max(startX, 0);
    startY = max(startY, 0);
    endX   = min(endX, WORLD_W);
    endY   = min(endY, WORLD_H);
 
    for (let tx = startX; tx < endX; tx += tW) {
      for (let ty = startY; ty < endY; ty += tH) {
        // Clip the tile if it overhangs the world edge
        let drawW = min(tW, WORLD_W - tx);
        let drawH = min(tH, WORLD_H - ty);
        image(groundImg, tx, ty, drawW, drawH, 0, 0, drawW, drawH);
      }
    }
  } else {
    // Fallback solid colour if image not yet loaded
    fill(30, 50, 30);
    noStroke();
    rect(0, 0, WORLD_W, WORLD_H);
  }

  // World boundary outline
  noFill();
  stroke(60, 50, 80);
  strokeWeight(4);
  rect(0, 0, WORLD_W, WORLD_H);
  noStroke();
}

// ------------------------------------------------------------
// drawBossZone()
// Shows a glowing zone at the top of the world where the
// boss will appear. Changes colour once the boss is active.
// ------------------------------------------------------------
function drawBossZone() {
  noStroke();
  if (gameState === STATE_BOSS) {
    fill(255, 80, 80, 30); // red when boss is active
  } else {
    fill(255, 150, 30, 20); // orange hint before boss
  }
  rect(0, 0, WORLD_W, BOSS_ZONE_Y);

  // Dashed boundary line
  stroke(gameState === STATE_BOSS ? color(255, 80, 80, 100) : color(255, 150, 30, 60));
  strokeWeight(2);
  drawingContext.setLineDash([10, 8]);
  line(0, BOSS_ZONE_Y, WORLD_W, BOSS_ZONE_Y);
  drawingContext.setLineDash([]);
  noStroke();
}

// ------------------------------------------------------------
// handleInput()
// WASD moves the player in world coordinates.
// Constrained to world boundaries.
// Spacebar fires in the current facing direction.
// ------------------------------------------------------------
function handleInput() {
  player.isMoving = false;
  if (keyIsDown(87)) { // W
  player.y -= PLAYER_SPEED;
  player.direction = "up";
  player.isMoving = true;
}
if (keyIsDown(83)) { // S
  player.y += PLAYER_SPEED;
  player.direction = "down";
  player.isMoving = true;
}
if (keyIsDown(65)) { // A
  player.x -= PLAYER_SPEED;
  player.direction = "left";
  player.isMoving = true;
}
if (keyIsDown(68)) { // D
  player.x += PLAYER_SPEED;
  player.direction = "right";
  player.isMoving = true;
}


  // Keep player inside world bounds
  player.x = constrain(player.x, player.r, WORLD_W - player.r);
  player.y = constrain(player.y, player.r, WORLD_H - player.r);

  if (player.shootTimer > 0) player.shootTimer--;
const DIR_VECTORS = {
  up:    { x: 0,  y: -1 },
  down:  { x: 0,  y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1,  y: 0 },
};

if (keyIsDown(32) && player.shootTimer === 0) {
  let dir = DIR_VECTORS[player.direction];

  bullets.push({
    x:  player.x + dir.x * (player.r + 4),
    y:  player.y + dir.y * (player.r + 4),
    vx: dir.x * BULLET_SPEED,
    vy: dir.y * BULLET_SPEED,
  });

  player.shootTimer = SHOOT_COOLDOWN;
  let randomShoot = shootSounds[floor(random(shootSounds.length))];
    randomShoot.play();

}

  
}

// ------------------------------------------------------------
// updateBullets()
// Bullets travel in world coordinates.
// Removed when they leave the world bounds.
// ------------------------------------------------------------
function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].x += bullets[i].vx;
    bullets[i].y += bullets[i].vy;

    if (
      bullets[i].x < 0 || bullets[i].x > WORLD_W ||
      bullets[i].y < 0 || bullets[i].y > WORLD_H
    ) {
      bullets.splice(i, 1);
    }
  }
}

// ------------------------------------------------------------
// checkWaveSpawns()
// Each wave has a triggerY — spawns when player.y passes it.
// Enemies spawn at random positions near the top of the world.
// ------------------------------------------------------------
function checkWaveSpawns() {
  if (nextWave >= enemyData.waves.length) return;

  let wave = enemyData.waves[nextWave];
  if (player.y < wave.spawnAt) {
    for (let i = 0; i < wave.enemies.length; i++) {
      let data = wave.enemies[i];
      enemies.push({
  x: random(100, WORLD_W - 100),
  y: random(BOSS_ZONE_Y + 50, BOSS_ZONE_Y + 300),
  r: 20,
  speed: data.speed,

  direction: "down",
  animFrame: 0,
  animTimer: 0,
  animSpeed: 10
});

    }
    nextWave++;
  }
}

// ------------------------------------------------------------
// checkBossZone()
// Triggers the boss when the player enters the boss zone.
// ------------------------------------------------------------
function checkBossZone() {
  if (boss !== null) return;
  if (player.y > BOSS_ZONE_Y) return;

  spawnBoss();
}

// ------------------------------------------------------------
// spawnBoss()
// Builds the boss object from JSON data.
// Called when the player enters the boss zone or presses B.
// ------------------------------------------------------------
function spawnBoss() {
  boss = {
    x:           WORLD_W / 2,
    y:           bossData.retreatY,
    r:           bossData.r,
    health:      bossData.health,
    maxHealth:   bossData.health,
    blobT:       0,
    state:       "pausing",
    pauseTimer:  bossData.chargePause,
    chargeSpeed: bossData.chargeSpeed,
    retreatSpeed: bossData.retreatSpeed,
    retreatY:    bossData.retreatY,
    chargeVX:    0,
    chargeVY:    0,
  };

  enemies = [];
  gameState = STATE_BOSS;

  backgroundMusic.stop();
  bossMusic.loop();
}

// ------------------------------------------------------------
// updateEnemies()
// Enemies move toward the player in world coordinates.
// ------------------------------------------------------------
function updateEnemies() {
  for (let i = 0; i < enemies.length; i++) {
    let e = enemies[i];

    // Movement toward player
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let d  = dist(e.x, e.y, player.x, player.y);

    if (d > 0) {
      e.x += (dx / d) * e.speed;
      e.y += (dy / d) * e.speed;
    }

    // Direction based on movement
    e.direction = villagerDirection(e.x, e.y, player.x, player.y);

    // Animation
    e.animTimer++;
    if (e.animTimer >= e.animSpeed) {
      e.animTimer = 0;
      e.animFrame = (e.animFrame + 1) % VIL_COLS;
    }
  }
}


// ------------------------------------------------------------
// updateBoss()
// Same charge/retreat/pause cycle as before.
// All positions are in world coordinates.
// ------------------------------------------------------------
function updateBoss() {
  if (!boss) return;

  if (boss.state === "pausing") {
    boss.pauseTimer--;
    if (boss.pauseTimer <= 0) {
      let dx = player.x - boss.x;
      let dy = player.y - boss.y;
      let d  = dist(boss.x, boss.y, player.x, player.y);
      boss.chargeVX = (dx / d) * boss.chargeSpeed;
      boss.chargeVY = (dy / d) * boss.chargeSpeed;
      boss.state    = "charging";
    }

  } else if (boss.state === "charging") {
    boss.x += boss.chargeVX;
    boss.y += boss.chargeVY;

    let pastPlayer = dist(boss.x, boss.y, player.x, player.y) > 200 &&
                     boss.y > player.y;
    let offWorld   = boss.x < 0 || boss.x > WORLD_W ||
                     boss.y < 0 || boss.y > WORLD_H;

    if (pastPlayer || offWorld) {
      boss.state = "retreating";
    }

  } else if (boss.state === "retreating") {
    let targetX = WORLD_W / 2;
    let targetY = boss.retreatY;
    let dx      = targetX - boss.x;
    let dy      = targetY - boss.y;
    let d       = dist(boss.x, boss.y, targetX, targetY);

    if (d < 8) {
      boss.x          = targetX;
      boss.y          = targetY;
      boss.state      = "pausing";
      boss.pauseTimer = bossData.chargePause;
    } else {
      boss.x += (dx / d) * boss.retreatSpeed;
      boss.y += (dy / d) * boss.retreatSpeed;
    }
  }
}

// ------------------------------------------------------------
// checkBulletBossCollision()
// ------------------------------------------------------------
function checkBulletBossCollision() {
  if (!boss) return;

  for (let i = bullets.length - 1; i >= 0; i--) {
    let d = dist(bullets[i].x, bullets[i].y, boss.x, boss.y);
    if (d < boss.r + 6) {
      bullets.splice(i, 1);
      boss.health--;
      bossHitSound.play();

      if (boss.health <= 0) {
        gameState = STATE_WIN;
        winSound.play();
        bossMusic.stop();
      }
      break;
    }
  }
}

// ------------------------------------------------------------
// checkBossPlayerCollision()
// ------------------------------------------------------------
function checkBossPlayerCollision() {
  if (!boss || player.invincible) return;

  let d = dist(player.x, player.y, boss.x, boss.y);
  if (d < player.r + boss.r - 10) {
    player.health--;
    player.invincible      = true;
    player.invincibleTimer = INVINCIBLE_FRAMES;
    let randomHit = playerHitSounds[floor(random(playerHitSounds.length))];
    randomHit.play();

    if (player.health <= 0) {
      gameState = STATE_OVER;
       // Stop ALL music
  backgroundMusic.stop();
  bossMusic.stop();

  loseSound.play();
    }
  }
}

// ------------------------------------------------------------
// checkEnemyPlayerCollision()
// ------------------------------------------------------------
function checkEnemyPlayerCollision() {
  if (player.invincible) return;

  for (let i = 0; i < enemies.length; i++) {
    let d = dist(player.x, player.y, enemies[i].x, enemies[i].y);
    if (d < player.r + enemies[i].r - 8) {
      player.health--;
      player.invincible      = true;
      player.invincibleTimer = INVINCIBLE_FRAMES;
      let randomHit = playerHitSounds[floor(random(playerHitSounds.length))];
      randomHit.play();

      if (player.health <= 0) {
        gameState = STATE_OVER;
         // Stop ALL music
  backgroundMusic.stop();
  bossMusic.stop();

  loseSound.play();
      }
      break;
    }
  }
}

// ------------------------------------------------------------
// checkBulletEnemyCollisions()
// ------------------------------------------------------------
function checkBulletEnemyCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      let d = dist(bullets[i].x, bullets[i].y, enemies[j].x, enemies[j].y);
      if (d < enemies[j].r + 6) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score++;
        hitSound.play();
        break;
      }
    }
  }
}

// ------------------------------------------------------------
// updateInvincibility()
// ------------------------------------------------------------
function updateInvincibility() {
  if (player.invincible) {
    player.invincibleTimer--;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }
}

// ------------------------------------------------------------
// drawBoss()
// Drawn in world coordinates inside push/pop.
// ------------------------------------------------------------
function drawBoss() {
  if (!boss) return;

  push();
  let isCharging = boss.state === "charging";
  fill(isCharging ? color(250, 240, 250) : color(190, 230, 240));
  noStroke();

  beginShape();
  let numPoints = 48;
  let wobble = isCharging ? 12 : 8;
  for (let i = 0; i < numPoints; i++) {
    let angle    = (TWO_PI / numPoints) * i;
    let noiseVal = noise(cos(angle) * 0.8 + boss.blobT, sin(angle) * 0.8 + boss.blobT);
    let r        = boss.r + map(noiseVal, 0, 1, -wobble, wobble);
    vertex(boss.x + cos(angle) * r, boss.y + sin(angle) * r);
  }
  endShape(CLOSE);

  fill(10);
  ellipse(boss.x - 18, boss.y - 12, 16, 16);
  ellipse(boss.x + 18, boss.y - 12, 16, 16);

  stroke(10);
  strokeWeight(4);
  line(boss.x - 26, boss.y - 22, boss.x - 10, boss.y - 18);
  line(boss.x + 10, boss.y - 18, boss.x + 26, boss.y - 22);

  pop();
  boss.blobT += 0.02;
}

// ------------------------------------------------------------
// drawEnemies()
// Drawn in world coordinates.
// ------------------------------------------------------------
function drawSpriteFrame(sheet, frameW, frameH, col, row, drawX, drawY, drawW, drawH) {
  let sx = col * frameW;
  let sy = row * frameH;

  push();
  imageMode(CENTER);
  image(sheet, drawX, drawY, drawW, drawH, sx, sy, frameW, frameH);
  pop();
}

function drawEnemies() {
  
  for (let i = 0; i < enemies.length; i++) {
    let e = enemies[i];

    // Skip if off-screen
    if (e.x + VIL_DRAW_W < camX || e.x - VIL_DRAW_W > camX + width ||
        e.y + VIL_DRAW_H < camY || e.y - VIL_DRAW_H > camY + height) continue;

    let row = VIL_ROWS[e.direction];
let col = e.animFrame;

// Apply per-frame horizontal correction
let correctedX = e.x + VIL_XOFF[col];

drawSpriteFrame(
  villagerImg,
  VIL_FRAME_W, VIL_FRAME_H,
  col, row,
  correctedX, e.y,
  VIL_DRAW_W, VIL_DRAW_H
);

  }
}


// ------------------------------------------------------------
// drawBullets()
// Drawn in world coordinates.
// ------------------------------------------------------------
function drawBullets() {
  fill(255);
  noStroke();
  for (let i = 0; i < bullets.length; i++) {
    ellipse(bullets[i].x, bullets[i].y, 10);
  }
}

function animateSprite() {
  if (player.isMoving) {
    player.frameTimer++;

    // When the timer reaches animSpeed, advance to the next frame
    // % numFrames wraps back to 0 after the last frame
    if (player.frameTimer >=  WEREWOLFSPRITE.animSpeed) {
      player.frameTimer = 0;
      player.currentFrame = (player.currentFrame + 1) % WEREWOLFSPRITE.numFrames;
    }
  } else {
    // Reset to standing frame when not moving
    player.currentFrame = 0;
    player.frameTimer   = 0;
  }
}
// ------------------------------------------------------------
// drawPlayer()
// Drawn in world coordinates. Flickers while invincible.
// ------------------------------------------------------------
function drawPlayer() {
  let row    = WEREWOLFSPRITE.rows[player.direction];
  let offset = WEREWOLFSPRITE.offsets[player.direction];

  let sx = player.currentFrame * WEREWOLFSPRITE.frameWidth;
  let sy = row * WEREWOLFSPRITE.frameHeight;

  let dw = WEREWOLFSPRITE.frameWidth  * WEREWOLFSPRITE.scale;
  let dh = WEREWOLFSPRITE.frameHeight * WEREWOLFSPRITE.scale;

  // FEET-BASED ANCHOR
  let drawX = player.x - dw/2 + offset.x;
  let drawY = player.y - dh + offset.y;

  // ⭐ Prevent sprite from going above the camera view
  drawY = max(drawY, camY);

  image(
    werewolfImg,
    drawX,
    drawY,
    dw, dh,
    sx, sy,
    WEREWOLFSPRITE.frameWidth,
    WEREWOLFSPRITE.frameHeight
  );
}

function villagerDirection(ex, ey, px, py) {
  let dx = px - ex;
  let dy = py - ey;

  if (abs(dy) > abs(dx)) {
    return dy > 0 ? "down" : "up";
  } else {
    return dx > 0 ? "right" : "left";
  }
}

// ------------------------------------------------------------
// drawMinimap()
// Drawn in screen coordinates after pop().
// Shows a scaled-down view of the world with:
//   Teal dot  — player position
//   Orange dots — enemy positions
//   Red dot   — boss position (when active)
//   Orange zone — boss zone indicator at top of minimap
// ------------------------------------------------------------
function drawMinimap() {
  let mapX = MAP_X;
  let mapY = height - MAP_H - MAP_Y_OFFSET;

  // Background
  fill(0, 0, 0, 180);
  stroke(80, 60, 120);
  strokeWeight(1);
  rect(mapX, mapY, MAP_W, MAP_H, 4);
  noStroke();

  // Boss zone indicator
  let zoneH = map(BOSS_ZONE_Y, 0, WORLD_H, 0, MAP_H);
  fill(255, 150, 30, 40);
  rect(mapX, mapY, MAP_W, zoneH, 4);

  // Helper — converts world position to minimap screen position
  function worldToMap(wx, wy) {
    return {
      x: mapX + map(wx, 0, WORLD_W, 0, MAP_W),
      y: mapY + map(wy, 0, WORLD_H, 0, MAP_H),
    };
  }

  // Enemy dots
  fill(255, 150, 30);
  for (let i = 0; i < enemies.length; i++) {
    let p = worldToMap(enemies[i].x, enemies[i].y);
    ellipse(p.x, p.y, 5);
  }

  // Boss dot
  if (boss) {
    fill(255, 60, 60);
    let p = worldToMap(boss.x, boss.y);
    ellipse(p.x, p.y, 8);
  }

  // Player dot — drawn last so it's always on top
  fill(0, 200, 180);
  let pp = worldToMap(player.x, player.y);
  ellipse(pp.x, pp.y, 7);

  // Camera viewport rectangle — shows what's currently visible
  noFill();
  stroke(255, 255, 255, 60);
  strokeWeight(1);
  let vp = worldToMap(camX, camY);
  let vpW = map(width,  0, WORLD_W, 0, MAP_W);
  let vpH = map(height, 0, WORLD_H, 0, MAP_H);
  rect(vp.x, vp.y, vpW, vpH);
  noStroke();

  // Label
  fill(120);
  textSize(9);
  textAlign(LEFT);
  textFont("monospace");
  text("MAP", mapX + 4, mapY + MAP_H - 4);
}

// ------------------------------------------------------------
// drawHUD()
// Drawn in screen coordinates.
// ------------------------------------------------------------
function drawHUD() {
  noStroke();

  fill(160);
  textSize(13);
  textAlign(LEFT);
  textFont("monospace");
  text("Move: WASD   Shoot: Spacebar   B: Boss fight", 16, 24);

  fill(255);
  textSize(16);
  textAlign(RIGHT);
  text("Score: " + score, width - 16, 28);

  let barW  = 160;
  let barH  = 14;
  let barX  = width - barW - 16;
  let barY  = 40;
  let fillW = map(player.health, 0, player.maxHealth, 0, barW);

  fill(40);
  rect(barX, barY, barW, barH, 4);

  let healthColour = lerpColor(
    color(220, 60,  60),
    color(60,  220, 120),
    player.health / player.maxHealth
  );
  fill(healthColour);
  rect(barX, barY, fillW, barH, 4);

  fill(200);
  textSize(11);
  textAlign(RIGHT);
  text("Health", width - 16, barY + barH + 12);

  // Boss zone hint — appears when player gets close
  if (gameState === STATE_PLAY && player.y < 600) {
    fill(255, 150, 30, map(player.y, 600, BOSS_ZONE_Y, 0, 255));
    textAlign(CENTER);
    textSize(14);
    text("Boss zone ahead — proceed carefully", width / 2, height - 20);
  }
}

// ------------------------------------------------------------
// drawBossHUD()
// Boss health bar at top centre — drawn in screen coordinates.
// ------------------------------------------------------------
function drawBossHUD() {
  if (!boss) return;

  let barW  = 400;
  let barH  = 18;
  let barX  = (width - barW) / 2;
  let barY  = 10;
  let fillW = map(boss.health, 0, boss.maxHealth, 0, barW);

  fill(40);
  rect(barX, barY, barW, barH, 4);

  let bossColour = lerpColor(
    color(220, 60,  60),
    color(255, 150, 30),
    boss.health / boss.maxHealth
  );
  fill(bossColour);
  rect(barX, barY, fillW, barH, 4);

  fill(255);
  textSize(12);
  textAlign(CENTER);
  textFont("monospace");
  text("MOLTEN SILVER BEAST", width / 2, barY + barH + 14);
}

// ------------------------------------------------------------
// drawWinScreen()
// ------------------------------------------------------------
function drawWinScreen() {
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER);
  textSize(52);
  text("Boss Defeated!", width / 2, height / 2 - 30);

  fill(180);
  textSize(18);
  text("Score: " + score, width / 2, height / 2 + 20);

  fill(120);
  textSize(14);
  text("Press R to play again", width / 2, height / 2 + 60);
}

// ------------------------------------------------------------
// drawGameOver()
// ------------------------------------------------------------
function drawGameOver() {
  fill(0, 0, 0, 160);
  rect(0, 0, width, height);

  fill(255);
  textAlign(CENTER);
  textSize(52);
  text("Game Over", width / 2, height / 2 - 30);

  fill(180);
  textSize(18);
  text("Score: " + score, width / 2, height / 2 + 20);

  fill(120);
  textSize(14);
  text("Press R to play again", width / 2, height / 2 + 60);
}

// ------------------------------------------------------------
// keyPressed()
// R restarts. B skips to boss fight.
// ------------------------------------------------------------
function keyPressed() {
  // B — skip to boss fight for testing
  if (key === "b" || key === "B") {
    player.y = BOSS_ZONE_Y - 10;
    if (!boss) spawnBoss();
  }

  // R — restart
  if (key === 'r' || key === 'R') {
  // Reset player
  player.x = WORLD_W / 2;
  player.y = WORLD_H - 200;
  player.health = player.maxHealth;
  player.invincible = false;
  player.invincibleTimer = 0;
  player.shootTimer = 0;
  player.currentFrame = 0;
  player.frameTimer = 0;
  player.direction = "down";
  player.isMoving = false;
  player.bounceVX = 0;
  player.bounceVY = 0;

  // Reset enemies + bullets
  enemies = [];
  bullets = [];

  // Reset waves
  nextWave = 0;

  // Reset boss
  boss = null;

  // Reset score
  score = 0;

  // Reset camera
  camX = player.x - width / 2;
  camY = player.y - height / 2;

  // Reset game state
  gameState = STATE_PLAY;

  // Reset music
  bossMusic.stop();
  loseSound.stop();
  backgroundMusic.loop();
  backgroundMusic.setVolume(2);
}

}
