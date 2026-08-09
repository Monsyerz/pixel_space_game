(function initializeStorage(global) {
  "use strict";

  const PSA = global.PSA;
  const {
    DEFAULT_SAVE,
    LEGACY_WEAPON_IDS,
    SAVE_KEY,
    SAVE_VERSION,
    SHOP_ITEMS,
    WEAPON_DEFINITIONS
  } = PSA;
  const knownOwnedItemIds = new Set([
    ...SHOP_ITEMS.map(item => item.id),
    ...Object.keys(LEGACY_WEAPON_IDS)
  ]);

  function safeInteger(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
  }

  function itemMatchesType(itemId, type) {
    return SHOP_ITEMS.some(item => item.id === itemId && item.type === type);
  }

  function safeLevel(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(5, Math.max(1, Math.floor(number))) : 1;
  }

  function normalizeWeaponId(value) {
    if (typeof value !== "string") return DEFAULT_SAVE.selectedWeapon;
    if (WEAPON_DEFINITIONS[value]) return value;
    return LEGACY_WEAPON_IDS[value] || DEFAULT_SAVE.selectedWeapon;
  }

  function normalizeWeaponUpgrades(value) {
    const source = value && typeof value === "object" ? value : {};
    const normalized = {};

    for (const weapon of Object.values(WEAPON_DEFINITIONS)) {
      const savedWeapon = source[weapon.id] && typeof source[weapon.id] === "object"
        ? source[weapon.id]
        : {};
      normalized[weapon.id] = Object.fromEntries(
        weapon.stats.map(stat => [stat.id, safeLevel(savedWeapon[stat.id])])
      );
    }

    return normalized;
  }

  function load() {
    let parsed = {};

    try {
      parsed = JSON.parse(global.localStorage.getItem(SAVE_KEY) || "{}") || {};
    } catch {
      parsed = {};
    }

    const ownedItems = Array.isArray(parsed.ownedItems)
      ? parsed.ownedItems.filter(itemId => (
        typeof itemId === "string" && knownOwnedItemIds.has(itemId)
      ))
      : [];

    for (const defaultItem of DEFAULT_SAVE.ownedItems) {
      if (!ownedItems.includes(defaultItem)) ownedItems.push(defaultItem);
    }

    const normalized = {
      saveVersion: SAVE_VERSION,
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
      selectedWeapon: normalizeWeaponId(parsed.selectedWeapon),
      weaponUpgrades: normalizeWeaponUpgrades(parsed.weaponUpgrades),
      selectedSkin: parsed.selectedSkin,
      selectedSupport: parsed.selectedSupport
    };

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

  PSA.storage = Object.freeze({ load, normalizeWeaponId, normalizeWeaponUpgrades, save });
})(window);
