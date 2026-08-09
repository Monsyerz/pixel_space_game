(function initializeEntities(global) {
  "use strict";

  const PSA = global.PSA;

  function createPlayer(width, height) {
    return {
      x: width / 2,
      y: height - 80,
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
  }

  function createPlayerBullet(player, offset, spread) {
    return {
      x: player.x,
      y: player.y - 18,
      vx: Math.sin(offset * spread) * 360,
      vy: -560,
      w: 4,
      h: 10,
      damage: 1,
      homing: player.aim
    };
  }

  function createEnemy(width, settings) {
    const typeRoll = Math.random();
    const type = typeRoll < settings.zigzagChance
      ? "zigzag"
      : typeRoll < settings.zigzagChance + settings.shooterChance
        ? "shooter"
        : "basic";
    const hp = 2;
    const x = 40 + Math.random() * (width - 80);

    return {
      x,
      y: -30,
      baseX: x,
      w: type === "shooter" ? 28 : 24,
      h: 22,
      hp,
      maxHp: hp,
      speed: (86 + Math.random() * 35) * settings.enemySpeedMultiplier,
      type,
      age: 0,
      shootTimer: 1.1 + Math.random() * 1.5
    };
  }

  function createBoss(width, difficulty) {
    const hp = 58;
    return {
      x: width / 2,
      y: 92,
      w: 112,
      h: 58,
      hp,
      maxHp: hp,
      dir: 1,
      speed: 100 * Math.min(1.25, 1 + (difficulty - 1) * 0.03),
      shootTimer: 0.8,
      age: 0
    };
  }

  function createEnemyBullet(source, player, speed, spread) {
    const angle = Math.atan2(player.y - source.y, player.x - source.x) + spread;
    return {
      x: source.x,
      y: source.y + source.h / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 7,
      h: 7
    };
  }

  function createDrop(x, y, type) {
    return { x, y, type, w: 20, h: 20, speed: 95, age: 0 };
  }

  function createParticle(x, y) {
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 220,
      vy: (Math.random() - 0.5) * 220,
      life: 0.25 + Math.random() * 0.5,
      maxLife: 0.75,
      size: 2 + Math.random() * 5
    };
  }

  function hit(a, b) {
    return Math.abs(a.x - b.x) * 2 < a.w + b.w
      && Math.abs(a.y - b.y) * 2 < a.h + b.h;
  }

  PSA.entities = Object.freeze({
    createBoss,
    createDrop,
    createEnemy,
    createEnemyBullet,
    createParticle,
    createPlayer,
    createPlayerBullet,
    hit
  });
})(window);
