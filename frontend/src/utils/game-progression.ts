/**
 * Game Progression System
 * Manages the flow between games and final assessment quiz
 */

export interface GameProgressionState {
  currentGame: string;
  completedGames: string[];
  gameOrder: string[];
  showFinalQuiz: boolean;
}

export const GAME_ORDER = [
  'popup-manic',
  'phish404', 
  'phish-hunt',
  'hooked-or-cooked'
];

export const GAME_NAMES = {
  'popup-manic': 'Popup Manic',
  'phish404': 'Phish404',
  'phish-hunt': 'Phish-Hunt', 
  'hooked-or-cooked': 'Hooked or Cooked'
};

export const GAME_ROUTES = {
  'popup-manic': '/games/popup-manic',
  'phish404': '/games/phish404',
  'phish-hunt': '/games/phish-hunt',
  'hooked-or-cooked': '/games/hooked-or-cooked'
};

/**
 * Get the next game in the progression sequence
 */
export function getNextGame(currentGame: string): string | null {
  const currentIndex = GAME_ORDER.indexOf(currentGame);
  if (currentIndex === -1 || currentIndex === GAME_ORDER.length - 1) {
    return null; // No next game or current game not found
  }
  return GAME_ORDER[currentIndex + 1];
}

/**
 * Check if this is the final game in the sequence
 */
export function isFinalGame(currentGame: string): boolean {
  return currentGame === GAME_ORDER[GAME_ORDER.length - 1];
}

/**
 * Get game progression state from localStorage
 */
export function getGameProgressionState(): GameProgressionState {
  if (typeof window === 'undefined') {
    return {
      currentGame: '',
      completedGames: [],
      gameOrder: GAME_ORDER,
      showFinalQuiz: false
    };
  }

  const saved = localStorage.getItem('gameProgressionState');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing game progression state:', e);
    }
  }

  return {
    currentGame: '',
    completedGames: [],
    gameOrder: GAME_ORDER,
    showFinalQuiz: false
  };
}

/**
 * Save game progression state to localStorage
 */
export function saveGameProgressionState(state: GameProgressionState): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('gameProgressionState', JSON.stringify(state));
  } catch (e) {
    console.error('Error saving game progression state:', e);
  }
}

/**
 * Mark a game as completed and update progression
 */
export function markGameCompleted(gameId: string): GameProgressionState {
  const state = getGameProgressionState();
  
  if (!state.completedGames.includes(gameId)) {
    state.completedGames.push(gameId);
  }
  
  const nextGame = getNextGame(gameId);
  if (nextGame) {
    state.currentGame = nextGame;
  } else {
    // All games completed, show final quiz
    state.showFinalQuiz = true;
  }
  
  saveGameProgressionState(state);
  return state;
}

/**
 * Reset game progression state
 */
export function resetGameProgression(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('gameProgressionState');
}

/**
 * Get progress percentage (0-100)
 */
export function getProgressPercentage(): number {
  const state = getGameProgressionState();
  return Math.round((state.completedGames.length / GAME_ORDER.length) * 100);
}
