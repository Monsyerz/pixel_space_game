(function initializeStorage(global) {
  "use strict";

  const PSA = global.PSA;
  const { DEFAULT_SAVE, SAVE_KEY, SHOP_ITEMS } = PSA;
  const shopItemIds = new Set(SHOP_ITEMS.map(item => item.id));

  function safeInteger(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
  }

  function itemMatchesType(itemId, type) {
    return SHOP_ITEMS.some(item => item.id === itemId && item.type === type);
  }

  function load() {
    let parsed = {};

    try {
      parsed = JSON.parse(global.localStorage.getItem(SAVE_KEY) || "{}") || {};
    } catch {
      parsed = {};
    }

    const ownedItems = Array.isArray(parsed.ownedItems)
      ? parsed.ownedItems.filter(itemId => typeof itemId === "string" && shopItemIds.has(itemId))
      : [];

    for (const defaultItem of DEFAULT_SAVE.ownedItems) {
      if (!ownedItems.includes(defaultItem)) ownedItems.push(defaultItem);
    }

    const normalized = {
      coins: safeInteger(parsed.coins, DEFAULT_SAVE.coins),
      totalCoinsEarned: safeInteger(parsed.totalCoinsEarned, DEFAULT_SAVE.totalCoinsEarned),
      totalKills: safeInteger(parsed.totalKills, DEFAULT_SAVE.totalKills),
      bossesDefeated: safeInteger(parsed.bossesDefeated, DEFAULT_SAVE.bossesDefeated),
      highestStage: Math.min(5, Math.max(1, safeInteger(parsed.highestStage, DEFAULT_SAVE.highestStage))),
      highestLevel: Math.min(5, Math.max(1, safeInteger(parsed.highestLevel, DEFAULT_SAVE.highestLevel))),
      highScore: safeInteger(parsed.highScore, DEFAULT_SAVE.highScore),
      maxMulti: Math.min(3, safeInteger(parsed.maxMulti, DEFAULT_SAVE.maxMulti)),
      maxAim: Math.min(3, safeInteger(parsed.maxAim, DEFAULT_SAVE.maxAim)),
      maxRapid: Math.min(3, safeInteger(parsed.maxRapid, DEFAULT_SAVE.maxRapid)),
      ownedItems,
      selectedWeapon: parsed.selectedWeapon,
      selectedSkin: parsed.selectedSkin,
      selectedSupport: parsed.selectedSupport
    };

    if (!ownedItems.includes(normalized.selectedWeapon) || !itemMatchesType(normalized.selectedWeapon, "weapon")) {
      normalized.selectedWeapon = DEFAULT_SAVE.selectedWeapon;
    }

    if (!ownedItems.includes(normalized.selectedSkin) || !itemMatchesType(normalized.selectedSkin, "skin")) {
      normalized.selectedSkin = DEFAULT_SAVE.selectedSkin;
    }

    if (!ownedItems.includes(normalized.selectedSupport) || !itemMatchesType(normalized.selectedSupport, "support")) {
      normalized.selectedSupport = null;
    }

    return normalized;
  }

  function save(saveData) {
    try {
      global.localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      return true;
    } catch {
      return false;
    }
  }

  PSA.storage = Object.freeze({ load, save });
})(window);
