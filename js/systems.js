(function initializeSystems(global) {
  "use strict";

  const PSA = global.PSA;
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
})(window);
