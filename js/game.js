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

const SAVE_KEY = "pixelSpaceAssaultSaveV2";

const SHOP_ITEMS = [
  {
    id: "weapon-pulse-blaster",
    category: "Starting Weapons",
    type: "weapon",
    name: "Pulse Blaster",
    description: "Niezawodna broń startowa o zbalansowanej szybkostrzelności.",
    price: 500
  },
  {
    id: "weapon-twin-laser",
    category: "Starting Weapons",
    type: "weapon",
    name: "Twin Laser",
    description: "Podwójna wiązka przygotowana do przyszłego systemu uzbrojenia.",
    price: 1000
  },
  {
    id: "weapon-plasma-shot",
    category: "Starting Weapons",
    type: "weapon",
    name: "Plasma Shot",
    description: "Ciężki pocisk plazmowy planowany dla późniejszej wersji gry.",
    price: 1500
  },
  {
    id: "skin-blue-steel",
    category: "Skins",
    type: "skin",
    name: "Blue Steel",
    description: "Klasyczne cyjanowo-niebieskie poszycie statku.",
    price: 750
  },
  {
    id: "skin-crimson",
    category: "Skins",
    type: "skin",
    name: "Crimson",
    description: "Czerwony wariant kolorystyczny dla odważnych pilotów.",
    price: 1500
  },
  {
    id: "skin-neon-ghost",
    category: "Skins",
    type: "skin",
    name: "Neon Ghost",
    description: "Jasne neonowe poszycie inspirowane głębokim kosmosem.",
    price: 2500
  },
  {
    id: "support-scout-wing",
    category: "Support Ships",
    type: "support",
    name: "Scout Wing",
    description: "Miniaturowy statek wsparcia; jego działanie pojawi się później.",
    price: 5000
  }
];

const SHOP_ITEM_IDS = new Set(SHOP_ITEMS.map(item => item.id));
const defaultSave = {
  coins: 0,
  totalCoinsEarned: 0,
  totalKills: 0,
  bossesDefeated: 0,
  highestStage: 1,
  highestLevel: 1,
  highScore: 0,
  maxMulti: 0,
  maxAim: 0,
  maxRapid: 0,
  ownedItems: ["weapon-pulse-blaster", "skin-blue-steel"],
  selectedWeapon: "weapon-pulse-blaster",
  selectedSkin: "skin-blue-steel",
  selectedSupport: null
};

function safeInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function itemMatchesType(itemId, type) {
  return SHOP_ITEMS.some(item => item.id === itemId && item.type === type);
}

function loadSave() {
  let parsed = {};

  try {
    parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}") || {};
  } catch {
    parsed = {};
  }

  const ownedItems = Array.isArray(parsed.ownedItems)
    ? parsed.ownedItems.filter(itemId => typeof itemId === "string" && SHOP_ITEM_IDS.has(itemId))
    : [];

  for (const defaultItem of defaultSave.ownedItems) {
    if (!ownedItems.includes(defaultItem)) ownedItems.push(defaultItem);
  }

  const normalized = {
    coins: safeInteger(parsed.coins, defaultSave.coins),
    totalCoinsEarned: safeInteger(parsed.totalCoinsEarned, defaultSave.totalCoinsEarned),
    totalKills: safeInteger(parsed.totalKills, defaultSave.totalKills),
    bossesDefeated: safeInteger(parsed.bossesDefeated, defaultSave.bossesDefeated),
    highestStage: Math.min(5, Math.max(1, safeInteger(parsed.highestStage, defaultSave.highestStage))),
    highestLevel: Math.min(5, Math.max(1, safeInteger(parsed.highestLevel, defaultSave.highestLevel))),
    highScore: safeInteger(parsed.highScore, defaultSave.highScore),
    maxMulti: Math.min(3, safeInteger(parsed.maxMulti, defaultSave.maxMulti)),
    maxAim: Math.min(3, safeInteger(parsed.maxAim, defaultSave.maxAim)),
    maxRapid: Math.min(3, safeInteger(parsed.maxRapid, defaultSave.maxRapid)),
    ownedItems,
    selectedWeapon: parsed.selectedWeapon,
    selectedSkin: parsed.selectedSkin,
    selectedSupport: parsed.selectedSupport
  };

  if (!ownedItems.includes(normalized.selectedWeapon) || !itemMatchesType(normalized.selectedWeapon, "weapon")) {
    normalized.selectedWeapon = defaultSave.selectedWeapon;
  }

  if (!ownedItems.includes(normalized.selectedSkin) || !itemMatchesType(normalized.selectedSkin, "skin")) {
    normalized.selectedSkin = defaultSave.selectedSkin;
  }

  if (!ownedItems.includes(normalized.selectedSupport) || !itemMatchesType(normalized.selectedSupport, "support")) {
    normalized.selectedSupport = null;
  }

  return normalized;
}

let save = loadSave();
let mode = "menu";
let noticeReturnMode = "menu";
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
let stage = 1;
let level = 1;
let score = 0;
let runCoins = 0;
let killsThisLevel = 0;
let enemyTarget = 12;
let spawnTimer = 0;
let bossPending = false;
let transitionTimer = 0;
let message = "";
let messageTimer = 0;

function persistSave() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    updateCoinDisplays();
    return true;
  } catch {
    updateCoinDisplays();
    return false;
  }
}

function showScreen(id) {
  screens.forEach(screen => screen.classList.add("hidden"));
  if (id) document.getElementById(id).classList.remove("hidden");
  hud.classList.toggle("hidden", id !== null);
}

function updateCoinDisplays() {
  document.querySelectorAll(".coinValue").forEach(element => {
    element.textContent = String(save.coins);
  });
}

function openMenu() {
  mode = "menu";
  pointer.active = false;
  keys.clear();
  showScreen("menuScreen");
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

function openNotice(title, text, returnMode = "menu") {
  noticeReturnMode = returnMode;
  mode = "notice";
  pointer.active = false;
  document.getElementById("noticeTitle").textContent = title;
  document.getElementById("noticeText").textContent = text;
  showScreen("noticeScreen");
}

function closeNotice() {
  if (noticeReturnMode === "shop") {
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
      openNotice("NOT ENOUGH COINS", `Potrzebujesz ${item.price} coins. Masz ${save.coins}.`, "shop");
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
  mode = "shop";
  pointer.active = false;
  keys.clear();
  renderShop();
  showScreen("shopScreen");
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
  mode = "stats";
  pointer.active = false;
  keys.clear();
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
  showScreen("statsScreen");
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
  mode = "playing";
  stage = 1;
  level = 1;
  score = 0;
  runCoins = 0;
  player = {
    x: W / 2,
    y: H - 80,
    w: 30,
    h: 28,
    hp: 5,
    maxHp: 5,
    speed: 330,
    fireCooldown: 0,
    invincible: 0,
    multi: 0,
    aim: 0,
    rapid: 0
  };
  pointer.active = false;
  pointer.x = player.x;
  pointer.y = player.y;
  keys.clear();
  resetLevel();
  updateHud();
  showScreen(null);
  message = "STAGE 1 - LEVEL 1";
  messageTimer = 1.8;
}

function resetLevel() {
  bullets = [];
  enemyBullets = [];
  enemies = [];
  drops = [];
  particles = [];
  boss = null;
  killsThisLevel = 0;
  enemyTarget = 10 + level * 2 + (stage - 1) * 2;
  spawnTimer = 0.6;
  bossPending = false;
  transitionTimer = 0;
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
    bullets.push({
      x: player.x,
      y: player.y - 18,
      vx: Math.sin(offset * spread) * 360,
      vy: -560,
      w: 4,
      h: 10,
      damage: 1,
      homing: player.aim
    });
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

function spawnEnemy() {
  const difficulty = stage + level * 0.35;
  const typeRoll = Math.random();
  const type = typeRoll < 0.18 + stage * 0.025
    ? "zigzag"
    : typeRoll < 0.35
      ? "shooter"
      : "basic";
  const hp = Math.ceil(1 + stage * 0.35 + level * 0.12);
  const enemy = {
    x: 40 + Math.random() * (W - 80),
    y: -30,
    baseX: 0,
    w: type === "shooter" ? 28 : 24,
    h: 22,
    hp,
    maxHp: hp,
    speed: 70 + difficulty * 12 + Math.random() * 35,
    type,
    age: 0,
    shootTimer: 1.1 + Math.random() * 1.5
  };
  enemy.baseX = enemy.x;
  enemies.push(enemy);
}

function spawnBoss() {
  const hp = 34 + stage * 16 + level * 8;
  boss = {
    x: W / 2,
    y: 92,
    w: 112,
    h: 58,
    hp,
    maxHp: hp,
    dir: 1,
    speed: 90 + stage * 10,
    shootTimer: 0.8,
    age: 0
  };
  message = `BOSS ${stage}-${level}`;
  messageTimer = 1.5;
}

function shootAtPlayer(source, speed = 230, spread = 0) {
  const angle = Math.atan2(player.y - source.y, player.x - source.x) + spread;
  enemyBullets.push({
    x: source.x,
    y: source.y + source.h / 2,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    w: 7,
    h: 7
  });
}

function dropUpgrade(x, y) {
  if (Math.random() > 0.18) return;

  const roll = Math.random();
  let type = "heal";
  if (roll < 0.28) type = "multi";
  else if (roll < 0.56) type = "aim";
  else if (roll < 0.84) type = "rapid";

  drops.push({ x, y, type, w: 20, h: 20, speed: 95, age: 0 });
}

function applyDrop(type) {
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

function hit(a, b) {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w
    && Math.abs(a.y - b.y) * 2 < a.h + b.h;
}

function explode(x, y, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 220,
      vy: (Math.random() - 0.5) * 220,
      life: 0.25 + Math.random() * 0.5,
      maxLife: 0.75,
      size: 2 + Math.random() * 5
    });
  }
}

function damagePlayer(amount = 1) {
  if (player.invincible > 0 || mode !== "playing") return;
  player.hp -= amount;
  player.invincible = 1.1;
  explode(player.x, player.y, 18);
  if (player.hp <= 0) endRun(false);
}

function killEnemy(index) {
  const enemy = enemies[index];
  explode(enemy.x, enemy.y, 12);
  dropUpgrade(enemy.x, enemy.y);
  enemies.splice(index, 1);
  killsThisLevel++;
  save.totalKills++;
  score += 100 * stage;
  addCoins(1);
}

function defeatBoss() {
  const completedStage = level === 5;
  explode(boss.x, boss.y, 55);
  boss = null;
  save.bossesDefeated++;
  save.totalKills++;
  score += 2500 * stage;
  addCoins(10);
  if (completedStage) addCoins(100);
  save.highScore = Math.max(save.highScore, score);
  persistSave();
  transitionTimer = 2.1;
  message = completedStage ? "STAGE CLEAR +110" : "LEVEL CLEAR +10";
  messageTimer = 2;
}

function updateHighestProgress() {
  if (stage > save.highestStage) {
    save.highestStage = stage;
    save.highestLevel = level;
  } else if (stage === save.highestStage) {
    save.highestLevel = Math.max(save.highestLevel, level);
  }
}

function advanceLevel() {
  if (level < 5) {
    level++;
  } else if (stage < 5) {
    stage++;
    level = 1;
  } else {
    endRun(true);
    return;
  }

  updateHighestProgress();
  persistSave();
  resetLevel();
  player.x = W / 2;
  player.y = H - 80;
  message = `STAGE ${stage} - LEVEL ${level}`;
  messageTimer = 1.8;
}

function endRun(won) {
  mode = won ? "won" : "gameover";
  pointer.active = false;
  keys.clear();
  save.highScore = Math.max(save.highScore, score);
  updateHighestProgress();
  persistSave();

  if (won) {
    document.getElementById("winText").textContent = `Wygrałeś wszystkie 25 leveli. Score: ${score}. Run coins: ${runCoins}.`;
    showScreen("winScreen");
  } else {
    document.getElementById("gameOverScoreText").textContent = `SCORE: ${score}`;
    document.getElementById("runCoinsText").textContent = `RUN COINS: ${runCoins}`;
    document.getElementById("totalCoinsText").textContent = `TOTAL COINS: ${save.coins}`;
    showScreen("gameOverScreen");
  }
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
    if (hit(bullet, player)) {
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

function updateEnemySpawning(dt) {
  if (boss || bossPending || killsThisLevel >= enemyTarget || transitionTimer > 0) return;

  spawnTimer -= dt;
  if (spawnTimer <= 0 && enemies.length < 7) {
    spawnEnemy();
    spawnTimer = Math.max(0.25, 0.92 - stage * 0.08 - level * 0.035);
  }
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
        shootAtPlayer(enemy, 220 + stage * 15);
        enemy.shootTimer = Math.max(0.6, 1.65 - stage * 0.12);
      }
    }

    if (hit(enemy, player)) {
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
      if (!enemy.dead && hit(bullet, enemy)) {
        enemy.hp -= bullet.damage;
        bullets.splice(i, 1);
        consumed = true;
        if (enemy.hp <= 0) killEnemy(j);
        break;
      }
    }

    if (consumed) continue;

    if (boss && hit(bullet, boss)) {
      boss.hp -= bullet.damage;
      bullets.splice(i, 1);
      if (boss.hp <= 0) defeatBoss();
    }
  }

  enemies = enemies.filter(enemy => !enemy.dead);
}

function updateLevelTransitions(dt) {
  if (!boss && killsThisLevel >= enemyTarget && enemies.length === 0 && transitionTimer <= 0) {
    bossPending = true;
    transitionTimer = 1.2;
    message = "WARNING: BOSS";
    messageTimer = 1.2;
  }

  if (bossPending) {
    transitionTimer -= dt;
    if (transitionTimer <= 0) {
      bossPending = false;
      spawnBoss();
    }
  } else if (transitionTimer > 0 && !boss) {
    transitionTimer -= dt;
    if (transitionTimer <= 0 && mode === "playing") advanceLevel();
  }
}

function updateBoss(dt) {
  if (!boss) return;

  boss.age += dt;
  boss.x += boss.dir * boss.speed * dt;
  if (boss.x < 90 || boss.x > W - 90) boss.dir *= -1;
  boss.shootTimer -= dt;

  if (boss.shootTimer <= 0) {
    const count = 3 + Math.min(4, stage);
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.18;
      shootAtPlayer(boss, 225 + stage * 18, spread);
    }
    boss.shootTimer = Math.max(0.42, 1.05 - stage * 0.09 - level * 0.035);
  }

  if (hit(boss, player)) damagePlayer(2);
}

function updateDrops(dt) {
  for (const drop of drops) {
    drop.age += dt;
    drop.y += drop.speed * dt;
    drop.x += Math.sin(drop.age * 5) * 28 * dt;
    if (hit(drop, player)) {
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

  if (mode !== "playing" || !player) return;

  updatePlayer(dt);
  updatePlayerBullets(dt);
  updateEnemyBullets(dt);
  if (mode !== "playing") return;
  updateEnemySpawning(dt);
  updateEnemies(dt);
  resolvePlayerBulletHits();
  if (mode !== "playing") return;
  updateLevelTransitions(dt);
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
  const labels = { multi: "M", aim: "A", rapid: "R", heal: "+" };
  const colors = { multi: "#59ecff", aim: "#77ff90", rapid: "#ffd34e", heal: "#ff6a87" };
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

  if (!["playing", "gameover", "won"].includes(mode)) return;

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
  document.getElementById("stageText").textContent = `STAGE ${stage}-${level}`;
  document.getElementById("hpText").textContent = `HP ${Math.max(0, player.hp)}/${player.maxHp}`;
  document.getElementById("scoreText").textContent = `SCORE ${score}`;
  document.getElementById("coinHud").textContent = `COINS ${save.coins}`;
  document.getElementById("upgradeText").textContent = `M${player.multi} A${player.aim} R${player.rapid}`;
  document.getElementById("progressText").textContent = boss
    ? "BOSS FIGHT"
    : `ENEMIES ${killsThisLevel}/${enemyTarget}`;
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
  if (mode !== "playing") return;
  event.preventDefault();
  canvas.setPointerCapture?.(event.pointerId);
  const point = canvasPoint(event);
  pointer.active = true;
  pointer.x = point.x;
  pointer.y = point.y;
}, { passive: false });

canvas.addEventListener("pointermove", event => {
  if (mode !== "playing" || !pointer.active) return;
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

  if (event.key === "Escape" && mode === "playing") openMenu();
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
  mode = "quit";
  showScreen("quitScreen");
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
  openNotice("COINS", "Zakup coinów zostanie podłączony później. Przycisk jest teraz tylko placeholderem.", "menu");
});
document.getElementById("noticeBackButton").addEventListener("click", closeNotice);

initStars();
updateCoinDisplays();
openMenu();
cancelAnimationFrame(animationId);
animationId = requestAnimationFrame(loop);
