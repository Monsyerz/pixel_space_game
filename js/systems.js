(function initializeSystems(global) {
  "use strict";

  const PSA = global.PSA;
  const { ENDLESS_BALANCE, WEAPON_DEFINITIONS } = PSA;
  const validStates = new Set(Object.values(PSA.GAME_STATE));
  let currentState = null;
  let stateChangeHandler = null;

  PSA.gameState = Object.freeze({
    get current() {
      return currentState;
    },

    is(state) {
      return currentState === state;
    },

    onChange(handler) {
      stateChangeHandler = typeof handler === "function" ? handler : null;
    }
  });

  PSA.setGameState = function setGameState(nextState) {
    if (!validStates.has(nextState)) {
      throw new Error(`Unknown game state: ${nextState}`);
    }

    const previousState = currentState;
    currentState = nextState;

    if (stateChangeHandler) {
      stateChangeHandler(nextState, previousState);
    }
  };

  PSA.getWeaponStatValue = function getWeaponStatValue(weaponId, statId, level) {
    const weapon = WEAPON_DEFINITIONS[weaponId];
    const stat = weapon?.stats.find(candidate => candidate.id === statId);
    if (!stat) return undefined;
    const safeLevel = Number.isFinite(Number(level))
      ? Math.min(5, Math.max(1, Math.floor(Number(level))))
      : 1;
    return stat.values[safeLevel - 1];
  };

  PSA.createWeaponRuntime = function createWeaponRuntime(weaponId, weaponUpgrades) {
    const definition = WEAPON_DEFINITIONS[weaponId] || WEAPON_DEFINITIONS.laser;
    const savedLevels = weaponUpgrades?.[definition.id] || {};
    const upgradeLevels = {};
    const runtime = { ...definition };

    for (const stat of definition.stats) {
      const level = Number.isFinite(Number(savedLevels[stat.id]))
        ? Math.min(5, Math.max(1, Math.floor(Number(savedLevels[stat.id]))))
        : 1;
      upgradeLevels[stat.id] = level;
      runtime[stat.property] = stat.values[level - 1];
    }

    if (runtime.projectileSize) {
      runtime.projectileWidth = runtime.projectileSize;
      runtime.projectileHeight = runtime.projectileSize;
    }

    runtime.upgradeLevels = Object.freeze(upgradeLevels);
    return Object.freeze(runtime);
  };

  PSA.createDifficultyManager = function createDifficultyManager() {
    const metrics = {
      survivalTime: 0,
      distance: 0,
      difficulty: 1,
      encountersCompleted: 0,
      score: 0,
      multiplier: 1
    };

    const settings = {
      spawnInterval: 1,
      enemySpeedMultiplier: 1,
      enemyProjectileSpeed: 225,
      zigzagChance: 0.18,
      shooterChance: 0.14,
      maximumEnemies: 6,
      shooterCooldown: 1.55,
      maximumEnemyBullets: ENDLESS_BALANCE.maximumEnemyBullets
    };

    function updateSettings() {
      const pressure = metrics.difficulty - 1;
      settings.spawnInterval = Math.max(
        ENDLESS_BALANCE.minimumSpawnInterval,
        1 - pressure * 0.08
      );
      settings.enemySpeedMultiplier = Math.min(
        ENDLESS_BALANCE.maximumEnemySpeedMultiplier,
        1 + pressure * 0.07
      );
      settings.enemyProjectileSpeed = Math.min(
        ENDLESS_BALANCE.maximumEnemyProjectileSpeed,
        225 + pressure * 14
      );
      settings.zigzagChance = Math.min(0.32, 0.18 + pressure * 0.02);
      settings.shooterChance = Math.min(0.32, 0.14 + pressure * 0.025);
      settings.maximumEnemies = Math.min(
        ENDLESS_BALANCE.maximumSimultaneousEnemies,
        6 + Math.floor(pressure / 1.2)
      );
      settings.shooterCooldown = Math.max(0.72, 1.55 - pressure * 0.1);
    }

    function reset() {
      metrics.survivalTime = 0;
      metrics.distance = 0;
      metrics.difficulty = 1;
      metrics.encountersCompleted = 0;
      metrics.score = 0;
      metrics.multiplier = 1;
      updateSettings();
    }

    function update(dt) {
      const elapsed = Number.isFinite(dt) ? Math.max(0, dt) : 0;
      metrics.survivalTime += elapsed;
      const distanceRate = ENDLESS_BALANCE.baseDistanceRate
        + (metrics.difficulty - 1) * ENDLESS_BALANCE.distanceDifficultyBonus;
      metrics.distance += distanceRate * elapsed;
      metrics.difficulty = Math.min(
        ENDLESS_BALANCE.maximumDifficulty,
        1 + metrics.distance / ENDLESS_BALANCE.distancePerDifficulty
      );
      updateSettings();
    }

    function addScore(points) {
      metrics.score += Math.round(points * metrics.multiplier);
    }

    reset();

    return Object.freeze({
      addScore,
      metrics,
      reset,
      settings,
      update
    });
  };

  PSA.createEncounterManager = function createEncounterManager(options) {
    const definitions = options.definitions;
    const metrics = options.metrics;
    const random = typeof options.random === "function" ? options.random : Math.random;
    const initialDelay = Number.isFinite(options.initialDelay) ? options.initialDelay : 1.1;
    const recentIds = [];
    let phase = "delay";
    let phaseTimer = initialDelay;
    let activeEncounter = null;

    if (!Array.isArray(definitions) || definitions.length === 0) {
      throw new Error("EncounterManager requires encounter definitions");
    }

    function effectiveWeight(definition, difficulty) {
      const pressure = Math.max(0, difficulty - 1);
      let weight = Math.max(
        0.1,
        definition.baseWeight + pressure * definition.difficultyWeight
      );

      if (recentIds[0] === definition.id && recentIds[1] === definition.id) {
        return 0;
      }

      if (recentIds[0] === definition.id) {
        weight *= 0.35;
      } else if (recentIds.includes(definition.id)) {
        weight *= 0.7;
      }

      const previousDefinition = definitions.find(candidate => candidate.id === recentIds[0]);
      if (previousDefinition?.intense && definition.intense) {
        weight *= 0.45;
      }

      return weight;
    }

    function selectNext(difficulty) {
      const weightedDefinitions = definitions.map(definition => ({
        definition,
        weight: effectiveWeight(definition, difficulty)
      }));
      const totalWeight = weightedDefinitions.reduce((total, entry) => total + entry.weight, 0);
      let roll = random() * totalWeight;

      for (const entry of weightedDefinitions) {
        roll -= entry.weight;
        if (roll <= 0 && entry.weight > 0) return entry.definition;
      }

      return weightedDefinitions.find(entry => entry.weight > 0)?.definition || definitions[0];
    }

    function beginEncounter(context) {
      const definition = selectNext(metrics.difficulty);
      activeEncounter = {
        definition,
        runtime: context.start(definition)
      };
      phase = "active";
      context.onStart?.(definition, activeEncounter.runtime);
    }

    function completeEncounter(context) {
      const completedEncounter = activeEncounter;
      metrics.encountersCompleted++;
      recentIds.unshift(completedEncounter.definition.id);
      recentIds.length = Math.min(recentIds.length, 3);
      activeEncounter = null;
      phase = "recovery";
      phaseTimer = completedEncounter.definition.recoveryTime;
      context.onComplete?.(completedEncounter.definition, completedEncounter.runtime);
    }

    function reset() {
      phase = "delay";
      phaseTimer = initialDelay;
      activeEncounter = null;
      recentIds.length = 0;
      metrics.encountersCompleted = 0;
    }

    function update(dt, context) {
      const elapsed = Number.isFinite(dt) ? Math.max(0, dt) : 0;

      if (phase === "active") {
        context.update(activeEncounter, elapsed);
        if (context.isComplete(activeEncounter)) completeEncounter(context);
        return;
      }

      phaseTimer -= elapsed;
      if (phaseTimer <= 0) beginEncounter(context);
    }

    return Object.freeze({
      get current() {
        return activeEncounter?.definition || null;
      },

      get phase() {
        return phase;
      },

      get recentEncounterIds() {
        return recentIds.slice();
      },

      reset,
      update
    });
  };

  PSA.formatRunTime = function formatRunTime(seconds) {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(totalSeconds / 60);
    const remainder = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  PSA.formatRunDistance = function formatRunDistance(distance) {
    return `${Math.max(0, Math.floor(distance)).toLocaleString("en-US")} km`;
  };
})(window);
