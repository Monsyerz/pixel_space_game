(function initializeConfig(global) {
  "use strict";

  const PSA = global.PSA = global.PSA || {};

  function weaponStat(id, label, property, values, options = {}) {
    return Object.freeze({
      id,
      label,
      property,
      values: Object.freeze(values),
      decimals: options.decimals ?? 0,
      displayScale: options.displayScale ?? 1,
      suffix: options.suffix ?? ""
    });
  }

  PSA.GAME_STATE = Object.freeze({
    MENU: "MENU",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    UPGRADE_SELECTION: "UPGRADE_SELECTION",
    EVENT: "EVENT",
    GAME_OVER: "GAME_OVER",

    // Temporary UI states retained so Phase 1 does not remove existing screens.
    SHOP: "SHOP",
    STATS: "STATS",
    NOTICE: "NOTICE",
    VICTORY: "VICTORY",
    QUIT: "QUIT"
  });

  PSA.SAVE_KEY = "pixelSpaceAssaultSaveV2";
  PSA.SAVE_VERSION = 3;

  PSA.WEAPON_UPGRADE_COSTS = Object.freeze([100, 250, 500, 1000]);

  PSA.LEGACY_WEAPON_IDS = Object.freeze({
    "weapon-pulse-blaster": "laser",
    "weapon-twin-laser": "shotgun",
    "weapon-plasma-shot": "lightning"
  });

  PSA.ENDLESS_BALANCE = Object.freeze({
    distancePerDifficulty: 450,
    maximumDifficulty: 8,
    baseDistanceRate: 6,
    distanceDifficultyBonus: 0.15,
    minimumSpawnInterval: 0.42,
    maximumEnemySpeedMultiplier: 1.5,
    maximumEnemyProjectileSpeed: 320,
    maximumSimultaneousEnemies: 11,
    maximumEnemyBullets: 80
  });

  PSA.WEAPON_DEFINITIONS = Object.freeze({
    laser: Object.freeze({
      id: "laser",
      name: "Laser",
      shortName: "LASER",
      description: "Fast, accurate and dependable at almost any range.",
      kind: "projectile",
      projectileType: "laser",
      projectileLife: 1.2,
      projectileWidth: 4,
      projectileHeight: 12,
      projectileColor: "#7ff8ff",
      pellets: 1,
      spread: 0,
      stats: Object.freeze([
        weaponStat("damage", "DAMAGE", "damage", [1, 1.25, 1.5, 1.8, 2.2], { decimals: 2, suffix: " DMG" }),
        weaponStat("fireRate", "FIRE RATE", "fireCooldown", [0.18, 0.165, 0.15, 0.135, 0.12], { decimals: 3, suffix: " s" }),
        weaponStat("penetration", "PENETRATION", "penetration", [1, 2, 3, 4, 5], { suffix: " TARGETS" }),
        weaponStat("projectileSpeed", "PROJECTILE SPEED", "projectileSpeed", [620, 680, 740, 800, 860], { suffix: " px/s" })
      ])
    }),
    shotgun: Object.freeze({
      id: "shotgun",
      name: "Shotgun",
      shortName: "SHOTGUN",
      description: "Close-range burst damage with a controlled pellet cone.",
      kind: "projectile",
      projectileType: "shotgun",
      fireCooldown: 0.58,
      projectileSpeed: 480,
      projectileWidth: 5,
      projectileHeight: 9,
      projectileColor: "#ffd36a",
      penetration: 1,
      stats: Object.freeze([
        weaponStat("damage", "DAMAGE", "damage", [1, 1.15, 1.3, 1.5, 1.75], { decimals: 2, suffix: " DMG" }),
        weaponStat("pellets", "PELLETS", "pellets", [3, 4, 5, 6, 7], { suffix: " PELLETS" }),
        weaponStat("range", "RANGE", "projectileLife", [0.6, 0.68, 0.76, 0.84, 0.92], { decimals: 2, suffix: " s" }),
        weaponStat("spread", "SPREAD", "spread", [0.36, 0.34, 0.32, 0.3, 0.28], { decimals: 1, displayScale: 57.2958, suffix: "° CONE" })
      ])
    }),
    lightning: Object.freeze({
      id: "lightning",
      name: "Lightning Strike",
      shortName: "LIGHTNING",
      description: "Automatic targeting that grows into a multi-target chain.",
      kind: "lightning",
      chainJumpRange: 240,
      effectDuration: 0.14,
      effectColor: "#b9a7ff",
      stats: Object.freeze([
        weaponStat("damage", "DAMAGE", "damage", [2, 2.5, 3, 3.5, 4], { decimals: 1, suffix: " DMG" }),
        weaponStat("chain", "CHAIN", "chain", [1, 2, 3, 4, 5], { suffix: " TARGETS" }),
        weaponStat("range", "RANGE", "range", [390, 430, 470, 510, 550], { suffix: " px" }),
        weaponStat("cooldown", "COOLDOWN", "fireCooldown", [0.78, 0.7, 0.62, 0.54, 0.46], { decimals: 2, suffix: " s" })
      ])
    }),
    rocket: Object.freeze({
      id: "rocket",
      name: "Rocket Launcher",
      shortName: "ROCKET",
      description: "Slow rockets detonate across tightly grouped enemies.",
      kind: "projectile",
      projectileType: "rocket",
      projectileLife: 2.2,
      projectileWidth: 10,
      projectileHeight: 18,
      projectileColor: "#ff845b",
      pellets: 1,
      spread: 0,
      penetration: 1,
      stats: Object.freeze([
        weaponStat("damage", "DAMAGE", "damage", [4, 5, 6, 7.25, 8.5], { decimals: 2, suffix: " DMG" }),
        weaponStat("blastRadius", "BLAST RADIUS", "blastRadius", [65, 80, 95, 110, 125], { suffix: " px" }),
        weaponStat("fireRate", "FIRE RATE", "fireCooldown", [1.2, 1.08, 0.96, 0.84, 0.72], { decimals: 2, suffix: " s" }),
        weaponStat("rocketSpeed", "ROCKET SPEED", "projectileSpeed", [300, 340, 380, 420, 460], { suffix: " px/s" })
      ])
    }),
    railgun: Object.freeze({
      id: "railgun",
      name: "Railgun",
      shortName: "RAILGUN",
      description: "A narrow power shot built for precise enemy line-ups.",
      kind: "projectile",
      projectileType: "railgun",
      projectileSpeed: 950,
      projectileLife: 0.75,
      projectileHeight: 30,
      projectileColor: "#d9f7ff",
      pellets: 1,
      spread: 0,
      stats: Object.freeze([
        weaponStat("damage", "DAMAGE", "damage", [3, 4, 5, 6, 7], { suffix: " DMG" }),
        weaponStat("penetration", "PENETRATION", "penetration", [2, 3, 4, 6, 10], { suffix: " TARGETS" }),
        weaponStat("chargeSpeed", "CHARGE SPEED", "fireCooldown", [1.1, 1, 0.9, 0.8, 0.7], { decimals: 2, suffix: " s" }),
        weaponStat("beamWidth", "BEAM WIDTH", "projectileWidth", [5, 7, 9, 11, 13], { suffix: " px" })
      ])
    }),
    plasma: Object.freeze({
      id: "plasma",
      name: "Plasma Cannon",
      shortName: "PLASMA",
      description: "A large energy bolt with direct damage and moderate splash.",
      kind: "projectile",
      projectileType: "plasma",
      projectileSpeed: 420,
      projectileLife: 1.4,
      projectileColor: "#d278ff",
      splashRadius: 70,
      pellets: 1,
      spread: 0,
      penetration: 1,
      stats: Object.freeze([
        weaponStat("damage", "DAMAGE", "damage", [2, 2.4, 2.8, 3.2, 3.6], { decimals: 1, suffix: " DMG" }),
        weaponStat("projectileSize", "PROJECTILE SIZE", "projectileSize", [12, 15, 18, 21, 24], { suffix: " px" }),
        weaponStat("fireRate", "FIRE RATE", "fireCooldown", [0.52, 0.47, 0.42, 0.37, 0.32], { decimals: 2, suffix: " s" }),
        weaponStat("splashDamage", "SPLASH DAMAGE", "splashDamage", [0.5, 0.8, 1.1, 1.4, 1.8], { decimals: 1, suffix: " DMG" })
      ])
    })
  });

  PSA.ENCOUNTER_DEFINITIONS = Object.freeze([
    Object.freeze({
      id: "enemy-swarm",
      name: "ENEMY SWARM",
      kind: "combat",
      pattern: "swarm",
      baseWeight: 30,
      difficultyWeight: -0.5,
      baseCount: 5,
      countPerDifficulty: 0.5,
      maximumCount: 9,
      spawnSpacing: 0.42,
      speedMultiplier: 1,
      recoveryTime: 1.2,
      intense: false
    }),
    Object.freeze({
      id: "fast-formation",
      name: "FAST FORMATION",
      kind: "combat",
      pattern: "fast",
      baseWeight: 20,
      difficultyWeight: 0.35,
      baseCount: 4,
      countPerDifficulty: 0.35,
      maximumCount: 7,
      spawnSpacing: 0.28,
      speedMultiplier: 1.32,
      recoveryTime: 1.3,
      intense: false
    }),
    Object.freeze({
      id: "heavy-formation",
      name: "HEAVY FORMATION",
      kind: "combat",
      pattern: "heavy",
      baseWeight: 15,
      difficultyWeight: 0.9,
      baseCount: 3,
      countPerDifficulty: 0.25,
      maximumCount: 5,
      spawnSpacing: 0.8,
      speedMultiplier: 0.84,
      recoveryTime: 1.8,
      intense: true
    }),
    Object.freeze({
      id: "elite-enemy",
      name: "ELITE SIGNAL",
      kind: "combat",
      pattern: "elite",
      baseWeight: 10,
      difficultyWeight: 0.75,
      baseCount: 1,
      countPerDifficulty: 0,
      maximumCount: 1,
      spawnSpacing: 0,
      speedMultiplier: 1.18,
      recoveryTime: 1.8,
      intense: true
    }),
    Object.freeze({
      id: "supply-zone",
      name: "SUPPLY ZONE",
      kind: "supply",
      baseWeight: 10,
      difficultyWeight: 0,
      duration: 7,
      recoveryTime: 0.8,
      intense: false
    }),
    Object.freeze({
      id: "quiet-space",
      name: "QUIET SPACE",
      kind: "quiet",
      baseWeight: 15,
      difficultyWeight: -0.7,
      duration: 3,
      recoveryTime: 0.6,
      intense: false
    })
  ]);

  PSA.SHOP_ITEMS = Object.freeze([
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
  ]);

  const defaultWeaponUpgrades = {};
  for (const weapon of Object.values(PSA.WEAPON_DEFINITIONS)) {
    defaultWeaponUpgrades[weapon.id] = Object.freeze(Object.fromEntries(
      weapon.stats.map(stat => [stat.id, 1])
    ));
  }
  PSA.DEFAULT_WEAPON_UPGRADES = Object.freeze(defaultWeaponUpgrades);

  PSA.DEFAULT_SAVE = Object.freeze({
    saveVersion: PSA.SAVE_VERSION,
    coins: 0,
    totalCoinsEarned: 0,
    totalKills: 0,
    bossesDefeated: 0,
    highestStage: 1,
    highestLevel: 1,
    highScore: 0,
    // Legacy M/A/R records are retained for old saves but never affect gameplay.
    maxMulti: 0,
    maxAim: 0,
    maxRapid: 0,
    ownedItems: Object.freeze(["weapon-pulse-blaster", "skin-blue-steel"]),
    selectedWeapon: "laser",
    weaponUpgrades: PSA.DEFAULT_WEAPON_UPGRADES,
    selectedSkin: "skin-blue-steel",
    selectedSupport: null
  });
})(window);
