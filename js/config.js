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
