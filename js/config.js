(function initializeConfig(global) {
  "use strict";

  const PSA = global.PSA = global.PSA || {};

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

  PSA.ENDLESS_BALANCE = Object.freeze({
    difficultyGrowthRate: 1 / 75,
    maximumDifficulty: 8,
    baseDistanceRate: 6,
    distanceDifficultyBonus: 0.15,
    minimumSpawnInterval: 0.42,
    maximumEnemySpeedMultiplier: 1.5,
    maximumEnemyProjectileSpeed: 320,
    maximumSimultaneousEnemies: 11,
    maximumEnemyBullets: 80
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
  ]);

  PSA.DEFAULT_SAVE = Object.freeze({
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
    ownedItems: Object.freeze(["weapon-pulse-blaster", "skin-blue-steel"]),
    selectedWeapon: "weapon-pulse-blaster",
    selectedSkin: "skin-blue-steel",
    selectedSupport: null
  });
})(window);
