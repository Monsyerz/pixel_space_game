"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const screens = [...document.querySelectorAll(".screen")];
const hud = document.getElementById("hud");
const shopContent = document.getElementById("shopContent");
const statsList = document.getElementById("statsList");
const {
  createDifficultyManager,
  createEncounterManager,
  ENCOUNTER_DEFINITIONS,
  formatRunDistance,
  formatRunTime,
  GAME_STATE,
  SHOP_ITEMS,
  entities,
  gameState,
  setGameState,
  storage
} = window.PSA;

const difficultyManager = createDifficultyManager();
const runMetrics = difficultyManager.metrics;
const encounterManager = createEncounterManager({
  definitions: ENCOUNTER_DEFINITIONS,
  metrics: runMetrics
});
let save = storage.load();
let noticeReturnState = GAME_STATE.MENU;
let animationId = 0;
let lastTime = performance.now();
const keys = new Set();
const pointer = { active: false, x: W / 2, y: H - 90 };
let stars = [];
let bullets = [];
let enemyBullets = [];
let enemies = [];
let drops = [];
let particles = [];
let boss = null;
let player = null;
let runCoins = 0;
let message = "";
let messageTimer = 0;

function persistSave() {
  const saved = storage.save(save);
  updateCoinDisplays();
  return saved;
}

function showScreen(id) {
  screens.forEach(screen => screen.classList.add("hidden"));
  if (id) document.getElementById(id).classList.remove("hidden");
  hud.classList.toggle("hidden", id !== null);
}

const SCREEN_BY_STATE = Object.freeze({
  [GAME_STATE.MENU]: "menuScreen",
  [GAME_STATE.PLAYING]: null,
  [GAME_STATE.PAUSED]: null,
  [GAME_STATE.UPGRADE_SELECTION]: null,
  [GAME_STATE.EVENT]: null,
  [GAME_STATE.GAME_OVER]: "gameOverScreen",
  [GAME_STATE.SHOP]: "shopScreen",
  [GAME_STATE.STATS]: "statsScreen",
  [GAME_STATE.NOTICE]: "noticeScreen",
  [GAME_STATE.VICTORY]: "winScreen",
  [GAME_STATE.QUIT]: "quitScreen"
});

gameState.onChange(nextState => {
  if (nextState !== GAME_STATE.PLAYING) clearInput();
  showScreen(SCREEN_BY_STATE[nextState] ?? null);
});

function updateCoinDisplays() {
  document.querySelectorAll(".coinValue").forEach(element => {
    element.textContent = String(save.coins);
  });
}

function openMenu() {
  setGameState(GAME_STATE.MENU);
  updateCoinDisplays();
}

function selectedItemIdForType(type) {
  if (type === "weapon") return save.selectedWeapon;
  if (type === "skin") return save.selectedSkin;
  return save.selectedSupport;
}

function selectItem(item) {
  if (item.type === "weapon") save.selectedWeapon = item.id;
  if (item.type === "skin") save.selectedSkin = item.id;
  if (item.type === "support") save.selectedSupport = item.id;
}

function openNotice(title, text, returnState = GAME_STATE.MENU) {
  noticeReturnState = returnState;
  document.getElementById("noticeTitle").textContent = title;
  document.getElementById("noticeText").textContent = text;
  setGameState(GAME_STATE.NOTICE);
}

function closeNotice() {
  if (noticeReturnState === GAME_STATE.SHOP) {
    openShop();
  } else {
    openMenu();
  }
}

function purchaseOrEquip(itemId) {
  const item = SHOP_ITEMS.find(candidate => candidate.id === itemId);
  if (!item) return;

  const isOwned = save.ownedItems.includes(item.id);

  if (!isOwned) {
    if (save.coins < item.price) {
      openNotice(
        "NOT ENOUGH COINS",
        `Potrzebujesz ${item.price} coins. Masz ${save.coins}.`,
        GAME_STATE.SHOP
      );
      return;
    }

    save.coins -= item.price;
    save.ownedItems.push(item.id);
    persistSave();
    renderShop();
    return;
  }

  if (selectedItemIdForType(item.type) !== item.id) {
    selectItem(item);
    persistSave();
    renderShop();
  }
}

function renderShop() {
  shopContent.replaceChildren();
  const categories = ["Starting Weapons", "Skins", "Support Ships"];

  for (const category of categories) {
    const heading = document.createElement("h3");
    heading.textContent = category.toUpperCase();

    const grid = document.createElement("div");
    grid.className = "shop-grid";

    for (const item of SHOP_ITEMS.filter(candidate => candidate.category === category)) {
      const card = document.createElement("article");
      card.className = "shop-card";

      const name = document.createElement("strong");
      name.textContent = item.name;

      const description = document.createElement("small");
      description.textContent = item.description;

      const price = document.createElement("span");
      price.className = "price";
      price.textContent = `${item.price} COINS`;

      const owned = save.ownedItems.includes(item.id);
      const equipped = selectedItemIdForType(item.type) === item.id;
      const status = document.createElement("span");
      status.className = `item-status${owned ? " owned" : ""}${equipped ? " equipped" : ""}`;
      status.textContent = equipped ? "EQUIPPED" : owned ? "OWNED" : "LOCKED";

      const action = document.createElement("button");
      action.type = "button";
      action.textContent = equipped ? "EQUIPPED" : owned ? "EQUIP" : `BUY ${item.price}`;
      action.disabled = equipped;
      action.addEventListener("click", () => purchaseOrEquip(item.id));

      card.append(name, description, price, status, action);
      grid.append(card);
    }

    shopContent.append(heading, grid);
  }
}

function openShop() {
  renderShop();
  setGameState(GAME_STATE.SHOP);
  updateCoinDisplays();
}

function appendStat(label, value) {
  const labelElement = document.createElement("span");
  labelElement.textContent = label;
  const valueElement = document.createElement("span");
  valueElement.textContent = String(value);
  statsList.append(labelElement, valueElement);
}

function openStats() {
  statsList.replaceChildren();
  appendStat("HIGH SCORE", save.highScore);
  appendStat("TOTAL KILLS", save.totalKills);
  appendStat("BOSSES DEFEATED", save.bossesDefeated);
  appendStat("HIGHEST STAGE", save.highestStage);
  appendStat("HIGHEST LEVEL", save.highestLevel);
  appendStat("TOTAL COINS EARNED", save.totalCoinsEarned);
  appendStat("CURRENT COINS", save.coins);
  appendStat("MAX MULTI SHOT", `M${save.maxMulti}`);
  appendStat("MAX AUTO AIM", `A${save.maxAim}`);
  appendStat("MAX RAPID FIRE", `R${save.maxRapid}`);
  setGameState(GAME_STATE.STATS);
}

function initStars() {
  stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    speed: 20 + Math.random() * 70,
    size: Math.random() < 0.2 ? 3 : Math.random() < 0.5 ? 2 : 1
  }));
}

function startRun() {
  difficultyManager.reset();
  encounterManager.reset();
  runCoins = 0;
  player = entities.createPlayer(W, H);
  pointer.active = false;
  pointer.x = player.x;
  pointer.y = player.y;
  keys.clear();
  resetRunObjects();
  updateHud();
  setGameState(GAME_STATE.PLAYING);
  message = "ENDLESS RUN";
  messageTimer = 1.8;
}

function resetRunObjects() {
  bullets = [];
  enemyBullets = [];
  enemies = [];
  drops = [];
  particles = [];
  boss = null;
}

function addCoins(amount) {
  save.coins += amount;
  save.totalCoinsEarned += amount;
  runCoins += amount;
  persistSave();
}

function firePlayer() {
  const count = 1 + player.multi * 2;
  const spread = player.multi === 0 ? 0 : 0.13 - player.multi * 0.012;

  for (let i = 0; i < count; i++) {
    const offset = i - (count - 1) / 2;
    bullets.push(entities.createPlayerBullet(player, offset, spread));
  }

  player.fireCooldown = Math.max(0.075, 0.25 - player.rapid * 0.055);
}

function nearestTarget(x, y) {
  const candidates = boss ? [boss] : enemies;
  let best = null;
  let bestDistance = Infinity;

  for (const target of candidates) {
    const dx = target.x - x;
    const dy = target.y - y;
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      best = target;
    }
  }

  return best;
}

function spawnEnemy(options = {}) {
  enemies.push(entities.createEnemy(W, difficultyManager.settings, options));
}

function spawnBoss() {
  boss = entities.createBoss(W, runMetrics.difficulty);
  message = "BOSS";
  messageTimer = 1.5;
}

function shootAtPlayer(source, speed = 230, spread = 0) {
  enemyBullets.push(entities.createEnemyBullet(source, player, speed, spread));
}

function encounterEnemyCount(definition) {
  const pressure = Math.max(0, runMetrics.difficulty - 1);
  return Math.min(
    definition.maximumCount,
    Math.floor(definition.baseCount + pressure * definition.countPerDifficulty)
  );
}

function encounterSpawnX(definition, index) {
  if (definition.pattern === "fast") {
    if (index === 0) return W / 2;
    const step = Math.ceil(index / 2);
    const direction = index % 2 === 0 ? 1 : -1;
    return Math.max(50, Math.min(W - 50, W / 2 + direction * step * 82));
  }

  if (definition.pattern === "heavy") {
    return [W * 0.25, W * 0.5, W * 0.75][index % 3];
  }

  if (definition.pattern === "elite") return W / 2;

  const column = index % 5;
  const rowOffset = Math.floor(index / 5) % 2 === 0 ? -18 : 34;
  return Math.max(50, Math.min(W - 50, W * (0.18 + column * 0.16) + rowOffset));
}

function encounterEnemyType(definition, index, total) {
  if (definition.pattern === "elite") return "shooter";
  if (definition.pattern === "heavy") return index % 3 === 1 ? "basic" : "shooter";
  if (definition.pattern === "fast") {
    if (runMetrics.difficulty >= 4 && index === total - 1) return "shooter";
    return index % 2 === 0 ? "zigzag" : "basic";
  }
  if (runMetrics.difficulty >= 5 && index % 5 === 4) return "shooter";
  return index % 4 === 3 ? "zigzag" : "basic";
}

function spawnEncounterEnemy(definition, runtime) {
  const elite = definition.pattern === "elite";
  spawnEnemy({
    x: encounterSpawnX(definition, runtime.spawned),
    type: encounterEnemyType(definition, runtime.spawned, runtime.total),
    speedMultiplier: definition.speedMultiplier,
    hp: elite ? 3 : 2,
    w: elite ? 34 : undefined,
    h: elite ? 28 : undefined,
    shootTimer: elite ? 0.7 : undefined,
    fireRateMultiplier: elite ? 0.62 : definition.pattern === "heavy" ? 0.85 : 1,
    scoreValue: elite ? 350 : 100,
    elite
  });
}

function startEncounter(definition) {
  if (definition.kind === "quiet") {
    return { remaining: definition.duration };
  }

  if (definition.kind === "supply") {
    const rewardType = player.hp < player.maxHp ? "heal" : "coin";
    const reward = entities.createDrop(W / 2, 145, rewardType);
    reward.encounterReward = true;
    drops.push(reward);
    return { remaining: definition.duration, reward };
  }

  return {
    spawned: 0,
    spawnTimer: 0,
    total: encounterEnemyCount(definition)
  };
}

function updateEncounter(activeEncounter, dt) {
  const { definition, runtime } = activeEncounter;

  if (definition.kind === "quiet") {
    runtime.remaining -= dt;
    return;
  }

  if (definition.kind === "supply") {
    runtime.remaining -= dt;
    if (runtime.remaining <= 0) runtime.reward.dead = true;
    return;
  }

  runtime.spawnTimer -= dt;

  if (
    runtime.spawned < runtime.total
    && runtime.spawnTimer <= 0
    && enemies.length < difficultyManager.settings.maximumEnemies
  ) {
    spawnEncounterEnemy(definition, runtime);
    runtime.spawned++;
    runtime.spawnTimer = definition.spawnSpacing;
  }
}

function isEncounterComplete(activeEncounter) {
  const { definition, runtime } = activeEncounter;
  if (definition.kind === "quiet") return runtime.remaining <= 0;
  if (definition.kind === "supply") {
    return runtime.remaining <= 0 || !drops.includes(runtime.reward);
  }
  return runtime.spawned >= runtime.total && enemies.length === 0;
}

const encounterContext = Object.freeze({
  isComplete: isEncounterComplete,
  onStart(definition) {
    message = definition.name;
    messageTimer = 1.05;
  },
  start: startEncounter,
  update: updateEncounter
});

function dropUpgrade(x, y) {
  if (Math.random() > 0.18) return;

  const roll = Math.random();
  let type = "heal";
  if (roll < 0.28) type = "multi";
  else if (roll < 0.56) type = "aim";
  else if (roll < 0.84) type = "rapid";

  drops.push(entities.createDrop(x, y, type));
}

function applyDrop(type) {
  if (type === "coin") {
    addCoins(5);
    message = "+5 COINS";
    messageTimer = 0.8;
    return;
  }

  if (type === "multi") player.multi = Math.min(3, player.multi + 1);
  if (type === "aim") player.aim = Math.min(3, player.aim + 1);
  if (type === "rapid") player.rapid = Math.min(3, player.rapid + 1);
  if (type === "heal") player.hp = Math.min(player.maxHp, player.hp + 1);

  save.maxMulti = Math.max(save.maxMulti, player.multi);
  save.maxAim = Math.max(save.maxAim, player.aim);
  save.maxRapid = Math.max(save.maxRapid, player.rapid);
  persistSave();
  message = type === "heal" ? "+1 HP" : `${type.toUpperCase()} UPGRADE`;
  messageTimer = 0.8;
}

function explode(x, y, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push(entities.createParticle(x, y));
  }
}

function damagePlayer(amount = 1) {
  if (player.invincible > 0 || !gameState.is(GAME_STATE.PLAYING)) return;
  player.hp -= amount;
  player.invincible = 1.1;
  explode(player.x, player.y, 18);
  if (player.hp <= 0) endRun();
}

function killEnemy(index) {
  const enemy = enemies[index];
  explode(enemy.x, enemy.y, 12);
  dropUpgrade(enemy.x, enemy.y);
  enemies.splice(index, 1);
  save.totalKills++;
  difficultyManager.addScore(enemy.scoreValue);
  addCoins(1);
}

function defeatBoss() {
  explode(boss.x, boss.y, 55);
  boss = null;
  save.bossesDefeated++;
  save.totalKills++;
  difficultyManager.addScore(2500);
  addCoins(10);
  save.highScore = Math.max(save.highScore, runMetrics.score);
  persistSave();
  message = "BOSS DEFEATED +10";
  messageTimer = 2;
}

function endRun() {
  save.highScore = Math.max(save.highScore, runMetrics.score);
  persistSave();

  document.getElementById("gameOverScoreText").textContent = `SCORE: ${runMetrics.score.toLocaleString("en-US")}`;
  document.getElementById("gameOverDistanceText").textContent = `DISTANCE: ${formatRunDistance(runMetrics.distance)}`;
  document.getElementById("gameOverTimeText").textContent = `SURVIVAL TIME: ${formatRunTime(runMetrics.survivalTime)}`;
  document.getElementById("runCoinsText").textContent = `RUN COINS: ${runCoins}`;
  document.getElementById("totalCoinsText").textContent = `TOTAL COINS: ${save.coins}`;
  setGameState(GAME_STATE.GAME_OVER);
}

function updateStars(dt) {
  for (const star of stars) {
    star.y += star.speed * dt;
    if (star.y > H) {
      star.y = -2;
      star.x = Math.random() * W;
    }
  }
}

function updatePlayer(dt) {
  player.fireCooldown -= dt;
  player.invincible -= dt;
  messageTimer -= dt;

  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) dx--;
  if (keys.has("ArrowRight") || keys.has("d")) dx++;
  if (keys.has("ArrowUp") || keys.has("w")) dy--;
  if (keys.has("ArrowDown") || keys.has("s")) dy++;

  if (pointer.active) {
    const follow = Math.min(1, dt * 12);
    player.x += (pointer.x - player.x) * follow;
    player.y += (pointer.y - player.y) * follow;
  } else if (dx || dy) {
    const length = Math.hypot(dx, dy) || 1;
    player.x += dx / length * player.speed * dt;
    player.y += dy / length * player.speed * dt;
  }

  player.x = Math.max(22, Math.min(W - 22, player.x));
  player.y = Math.max(115, Math.min(H - 42, player.y));

  if ((pointer.active || keys.has("Space")) && player.fireCooldown <= 0) {
    firePlayer();
  }
}

function updatePlayerBullets(dt) {
  for (const bullet of bullets) {
    if (bullet.homing > 0) {
      const target = nearestTarget(bullet.x, bullet.y);
      if (target) {
        const desired = Math.atan2(target.y - bullet.y, target.x - bullet.x);
        const speed = Math.hypot(bullet.vx, bullet.vy);
        const strength = 0.8 + bullet.homing * 0.55;
        bullet.vx += Math.cos(desired) * strength * 220 * dt;
        bullet.vy += Math.sin(desired) * strength * 220 * dt;
        const newSpeed = Math.hypot(bullet.vx, bullet.vy) || 1;
        bullet.vx = bullet.vx / newSpeed * speed;
        bullet.vy = bullet.vy / newSpeed * speed;
      }
    }

    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
  }

  bullets = bullets.filter(bullet => (
    bullet.y > -30
    && bullet.y < H + 30
    && bullet.x > -30
    && bullet.x < W + 30
  ));
}

function updateEnemyBullets(dt) {
  for (const bullet of enemyBullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    if (entities.hit(bullet, player)) {
      bullet.dead = true;
      damagePlayer(1);
    }
  }

  enemyBullets = enemyBullets.filter(bullet => (
    !bullet.dead
    && bullet.y < H + 40
    && bullet.x > -40
    && bullet.x < W + 40
  ));
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    enemy.age += dt;
    enemy.y += enemy.speed * dt;

    if (enemy.type === "zigzag") {
      enemy.x = enemy.baseX + Math.sin(enemy.age * 4.2) * 75;
    }

    if (enemy.type === "shooter") {
      enemy.shootTimer -= dt;
      if (enemy.shootTimer <= 0 && enemy.y > 20) {
        if (enemyBullets.length < difficultyManager.settings.maximumEnemyBullets) {
          shootAtPlayer(enemy, difficultyManager.settings.enemyProjectileSpeed);
        }
        enemy.shootTimer = difficultyManager.settings.shooterCooldown * enemy.fireRateMultiplier;
      }
    }

    if (entities.hit(enemy, player)) {
      enemy.dead = true;
      damagePlayer(1);
      explode(enemy.x, enemy.y, 10);
    }

    if (enemy.y > H + 35) enemy.dead = true;
  }
}

function resolvePlayerBulletHits() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    let consumed = false;

    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      if (!enemy.dead && entities.hit(bullet, enemy)) {
        enemy.hp -= bullet.damage;
        bullets.splice(i, 1);
        consumed = true;
        if (enemy.hp <= 0) killEnemy(j);
        break;
      }
    }

    if (consumed) continue;

    if (boss && entities.hit(bullet, boss)) {
      boss.hp -= bullet.damage;
      bullets.splice(i, 1);
      if (boss.hp <= 0) defeatBoss();
    }
  }

  enemies = enemies.filter(enemy => !enemy.dead);
}

function updateBoss(dt) {
  if (!boss) return;

  boss.age += dt;
  boss.x += boss.dir * boss.speed * dt;
  if (boss.x < 90 || boss.x > W - 90) boss.dir *= -1;
  boss.shootTimer -= dt;

  if (boss.shootTimer <= 0) {
    const count = 3 + Math.min(4, Math.floor(runMetrics.difficulty / 2));
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.18;
      if (enemyBullets.length < difficultyManager.settings.maximumEnemyBullets) {
        shootAtPlayer(boss, difficultyManager.settings.enemyProjectileSpeed, spread);
      }
    }
    boss.shootTimer = Math.max(0.5, 1.05 - (runMetrics.difficulty - 1) * 0.06);
  }

  if (entities.hit(boss, player)) damagePlayer(2);
}

function updateDrops(dt) {
  for (const drop of drops) {
    if (drop.dead) continue;
    drop.age += dt;
    drop.y += drop.speed * dt;
    drop.x += Math.sin(drop.age * 5) * 28 * dt;
    if (entities.hit(drop, player)) {
      drop.dead = true;
      applyDrop(drop.type);
    }
  }

  drops = drops.filter(drop => !drop.dead && drop.y < H + 30);
}

function updateParticles(dt) {
  for (const particle of particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.97;
    particle.vy *= 0.97;
    particle.life -= dt;
  }

  particles = particles.filter(particle => particle.life > 0);
}

function update(dt) {
  updateStars(dt);

  if (!gameState.is(GAME_STATE.PLAYING) || !player) return;

  difficultyManager.update(dt);
  updatePlayer(dt);
  updatePlayerBullets(dt);
  updateEnemyBullets(dt);
  if (!gameState.is(GAME_STATE.PLAYING)) return;
  if (!boss) encounterManager.update(dt, encounterContext);
  updateEnemies(dt);
  resolvePlayerBulletHits();
  if (!gameState.is(GAME_STATE.PLAYING)) return;
  updateBoss(dt);
  updateDrops(dt);
  updateParticles(dt);
  updateHud();
}

function drawBackground() {
  ctx.fillStyle = "#03050d";
  ctx.fillRect(0, 0, W, H);

  for (const star of stars) {
    ctx.fillStyle = star.speed > 65 ? "#bdefff" : "#4d6b91";
    ctx.fillRect(Math.floor(star.x), Math.floor(star.y), star.size, star.size);
  }

  ctx.fillStyle = "rgba(33, 68, 109, 0.12)";
  for (let y = 0; y < H; y += 32) ctx.fillRect(0, y, W, 1);
}

function drawPlayer() {
  if (!player) return;
  if (player.invincible > 0 && Math.floor(player.invincible * 14) % 2 === 0) return;

  const x = Math.round(player.x);
  const y = Math.round(player.y);
  ctx.fillStyle = "#59ecff";
  ctx.fillRect(x - 5, y - 17, 10, 8);
  ctx.fillRect(x - 11, y - 9, 22, 14);
  ctx.fillRect(x - 18, y - 2, 36, 9);
  ctx.fillStyle = "#d6fbff";
  ctx.fillRect(x - 3, y - 11, 6, 7);
  ctx.fillStyle = "#2876b8";
  ctx.fillRect(x - 15, y + 7, 8, 6);
  ctx.fillRect(x + 7, y + 7, 8, 6);
  ctx.fillStyle = "#ff9d3d";
  ctx.fillRect(x - 11, y + 13, 6, 7 + Math.floor(Math.random() * 5));
  ctx.fillRect(x + 5, y + 13, 6, 7 + Math.floor(Math.random() * 5));
}

function drawEnemy(enemy) {
  const x = Math.round(enemy.x);
  const y = Math.round(enemy.y);
  ctx.fillStyle = enemy.type === "zigzag"
    ? "#f762ff"
    : enemy.type === "shooter"
      ? "#ffb13b"
      : "#ff4f6f";
  ctx.fillRect(x - 12, y - 8, 24, 14);
  ctx.fillRect(x - 18, y - 2, 8, 8);
  ctx.fillRect(x + 10, y - 2, 8, 8);
  ctx.fillStyle = "#ffe5eb";
  ctx.fillRect(x - 5, y - 5, 4, 4);
  ctx.fillRect(x + 2, y - 5, 4, 4);

  if (enemy.elite) {
    ctx.strokeStyle = "#ffe45c";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - enemy.w / 2 - 4, y - enemy.h / 2 - 4, enemy.w + 8, enemy.h + 8);
    ctx.lineWidth = 1;
  }

  if (enemy.maxHp > 1) {
    ctx.fillStyle = "#42111b";
    ctx.fillRect(x - 12, y - 14, 24, 3);
    ctx.fillStyle = "#68f093";
    ctx.fillRect(x - 12, y - 14, Math.max(0, 24 * enemy.hp / enemy.maxHp), 3);
  }
}

function drawBoss() {
  if (!boss) return;

  const x = Math.round(boss.x);
  const y = Math.round(boss.y);
  ctx.fillStyle = "#bc3fff";
  ctx.fillRect(x - 42, y - 20, 84, 40);
  ctx.fillRect(x - 56, y - 8, 112, 25);
  ctx.fillStyle = "#f8d7ff";
  ctx.fillRect(x - 17, y - 12, 34, 15);
  ctx.fillStyle = "#ff3c73";
  ctx.fillRect(x - 8, y - 8, 16, 7);
  ctx.fillStyle = "#5e167c";
  ctx.fillRect(x - 52, y + 17, 20, 10);
  ctx.fillRect(x + 32, y + 17, 20, 10);
  ctx.fillStyle = "#2b0a3c";
  ctx.fillRect(150, 54, 500, 12);
  ctx.fillStyle = "#ff477e";
  ctx.fillRect(150, 54, Math.max(0, 500 * boss.hp / boss.maxHp), 12);
  ctx.strokeStyle = "#ffd7e4";
  ctx.strokeRect(149.5, 53.5, 501, 13);
}

function drawDrop(drop) {
  const labels = { multi: "M", aim: "A", rapid: "R", heal: "+", coin: "$" };
  const colors = { multi: "#59ecff", aim: "#77ff90", rapid: "#ffd34e", heal: "#ff6a87", coin: "#ffd34e" };
  ctx.fillStyle = "#07101e";
  ctx.fillRect(Math.round(drop.x - 10), Math.round(drop.y - 10), 20, 20);
  ctx.strokeStyle = colors[drop.type];
  ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(drop.x - 10), Math.round(drop.y - 10), 20, 20);
  ctx.fillStyle = colors[drop.type];
  ctx.font = "bold 15px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(labels[drop.type], Math.round(drop.x), Math.round(drop.y + 1));
}

function drawProjectiles() {
  for (const bullet of bullets) {
    ctx.fillStyle = "#7ff8ff";
    ctx.fillRect(Math.round(bullet.x - 2), Math.round(bullet.y - 6), bullet.w, bullet.h);
  }

  for (const bullet of enemyBullets) {
    ctx.fillStyle = "#ff4568";
    ctx.fillRect(Math.round(bullet.x - 4), Math.round(bullet.y - 4), 8, 8);
  }
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = "#ffcf57";
    ctx.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
  }
  ctx.globalAlpha = 1;
}

function drawMessage() {
  if (messageTimer <= 0) return;
  ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
  ctx.fillRect(170, 260, 460, 72);
  ctx.strokeStyle = "#59ecff";
  ctx.strokeRect(170.5, 260.5, 459, 71);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, W / 2, 296);
}

function draw() {
  drawBackground();

  if (![GAME_STATE.PLAYING, GAME_STATE.GAME_OVER, GAME_STATE.VICTORY].includes(gameState.current)) return;

  drawProjectiles();
  for (const enemy of enemies) drawEnemy(enemy);
  for (const drop of drops) drawDrop(drop);
  drawBoss();
  drawPlayer();
  drawParticles();
  drawMessage();
}

function updateHud() {
  if (!player) return;
  document.getElementById("distanceText").textContent = `DISTANCE ${formatRunDistance(runMetrics.distance)}`;
  document.getElementById("hpText").textContent = `HP ${Math.max(0, player.hp)}/${player.maxHp}`;
  document.getElementById("scoreText").textContent = `SCORE ${runMetrics.score.toLocaleString("en-US")}`;
  document.getElementById("multiplierText").textContent = `MULTIPLIER x${runMetrics.multiplier}`;
  document.getElementById("upgradeText").textContent = `M${player.multi} A${player.aim} R${player.rapid}`;
  document.getElementById("runStatusText").textContent = `TIME ${formatRunTime(runMetrics.survivalTime)} • COINS ${save.coins}`;
}

function loop(now) {
  const dt = Math.min(0.033, Math.max(0, (now - lastTime) / 1000));
  lastTime = now;
  update(dt);
  draw();
  animationId = requestAnimationFrame(loop);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * W / rect.width,
    y: (event.clientY - rect.top) * H / rect.height
  };
}

function releasePointer(event) {
  if (event) event.preventDefault();
  pointer.active = false;
}

function keyboardToken(event) {
  if (event.code === "Space") return "Space";
  return event.key.length === 1 ? event.key.toLowerCase() : event.key;
}

function clearInput() {
  keys.clear();
  pointer.active = false;
}

canvas.addEventListener("pointerdown", event => {
  if (!gameState.is(GAME_STATE.PLAYING)) return;
  event.preventDefault();
  canvas.setPointerCapture?.(event.pointerId);
  const point = canvasPoint(event);
  pointer.active = true;
  pointer.x = point.x;
  pointer.y = point.y;
}, { passive: false });

canvas.addEventListener("pointermove", event => {
  if (!gameState.is(GAME_STATE.PLAYING) || !pointer.active) return;
  event.preventDefault();
  const point = canvasPoint(event);
  pointer.x = point.x;
  pointer.y = point.y;
}, { passive: false });

canvas.addEventListener("pointerup", releasePointer, { passive: false });
canvas.addEventListener("pointercancel", releasePointer, { passive: false });
canvas.addEventListener("contextmenu", event => event.preventDefault());

window.addEventListener("keydown", event => {
  const token = keyboardToken(event);
  keys.add(token);

  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(token)) {
    event.preventDefault();
  }

  if (event.key === "Escape" && gameState.is(GAME_STATE.PLAYING)) openMenu();
});

window.addEventListener("keyup", event => {
  keys.delete(keyboardToken(event));
});

window.addEventListener("blur", clearInput);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) clearInput();
});

document.getElementById("startButton").addEventListener("click", startRun);
document.getElementById("shopButton").addEventListener("click", openShop);
document.getElementById("statsButton").addEventListener("click", openStats);
document.getElementById("quitButton").addEventListener("click", () => {
  setGameState(GAME_STATE.QUIT);
});
document.getElementById("shopBackButton").addEventListener("click", openMenu);
document.getElementById("statsBackButton").addEventListener("click", openMenu);
document.getElementById("quitBackButton").addEventListener("click", openMenu);
document.getElementById("retryButton").addEventListener("click", startRun);
document.getElementById("gameOverShopButton").addEventListener("click", openShop);
document.getElementById("mainMenuButton").addEventListener("click", openMenu);
document.getElementById("winMenuButton").addEventListener("click", openMenu);
document.getElementById("winShopButton").addEventListener("click", openShop);
document.getElementById("buyCoinsButton").addEventListener("click", () => {
  openNotice(
    "COINS",
    "Zakup coinów zostanie podłączony później. Przycisk jest teraz tylko placeholderem.",
    GAME_STATE.MENU
  );
});
document.getElementById("noticeBackButton").addEventListener("click", closeNotice);

initStars();
updateCoinDisplays();
openMenu();
cancelAnimationFrame(animationId);
animationId = requestAnimationFrame(loop);
