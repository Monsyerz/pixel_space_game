(function initializeSystems(global) {
  "use strict";

  const PSA = global.PSA;
  const { ENDLESS_BALANCE } = PSA;
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
      metrics.difficulty = Math.min(
        ENDLESS_BALANCE.maximumDifficulty,
        1 + metrics.survivalTime * ENDLESS_BALANCE.difficultyGrowthRate
      );

      const distanceRate = ENDLESS_BALANCE.baseDistanceRate
        + (metrics.difficulty - 1) * ENDLESS_BALANCE.distanceDifficultyBonus;
      metrics.distance += distanceRate * elapsed;
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
