/**
 * Enhanced Game Mechanics for Popup Manic
 * Adds scoring, combo, lives, difficulty progression, and fun popup behaviors
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface GameMechanics {
  score: number
  combo: number
  comboTimer: number | null
  lives: number
  maxLives: number
  correctCount: number
  difficulty: number
  roundNumber: number
  totalPopupsInRound: number
  accuracy: number
  averageReactionTime: number
  reactionTimes: number[]
  badges: string[]
  powerUps: PowerUp[]
  activePowerUp: PowerUp | null
}

export interface PowerUp {
  id: string
  type: 'freeze' | 'auto-report' | 'slow-mo' | 'reveal-all'
  name: string
  description: string
  duration: number // in seconds
  icon: string
  active: boolean
}

export interface PopupBehavior {
  id: string
  type: 'static' | 'bounce' | 'avoid-cursor' | 'spin' | 'pulse' | 'trap'
  speed: number
  velocity?: { vx: number; vy: number }
  scale: number
  rotation: number
  growthDirection?: 1 | -1
  isTrap?: boolean
}

export interface DifficultyConfig {
  level: number
  spawnInterval: number // ms
  movingPopupsChance: number // 0-1
  avoidCursorChance: number
  spinChance: number
  pulseChance: number
  trapChance: number
  comboBehaviors: boolean // combine multiple behaviors
  popupSpeed: number // multiplier
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const GAME_CONSTANTS = {
  SCORE_CORRECT: 10,
  SCORE_PENALTY: -15,
  COMBO_TIMEOUT: 3000, // 3 seconds
  COMBO_MULTIPLIERS: [1, 2, 3, 4, 5], // max 5x
  INITIAL_LIVES: 5,
  MAX_LIVES: 5,
  POPUPS_PER_ROUND: 20,
  CORRECT_FOR_DIFFICULTY_UP: 3, // increase difficulty every 3 correct
  POWERUP_SCORE_THRESHOLD: 50, // earn power-up every 50 points
}

export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  // Level 0: Easy - Static popups
  {
    level: 0,
    spawnInterval: 3000,
    movingPopupsChance: 0,
    avoidCursorChance: 0,
    spinChance: 0,
    pulseChance: 0,
    trapChance: 0,
    comboBehaviors: false,
    popupSpeed: 1.0,
  },
  // Level 1: Beginner - Some movement
  {
    level: 1,
    spawnInterval: 2500,
    movingPopupsChance: 0.4,
    avoidCursorChance: 0,
    spinChance: 0,
    pulseChance: 0.2,
    trapChance: 0,
    comboBehaviors: false,
    popupSpeed: 1.0,
  },
  // Level 2: Intermediate - More behaviors
  {
    level: 2,
    spawnInterval: 2000,
    movingPopupsChance: 0.6,
    avoidCursorChance: 0.3,
    spinChance: 0.2,
    pulseChance: 0.4,
    trapChance: 0.05,
    comboBehaviors: false,
    popupSpeed: 1.2,
  },
  // Level 3: Advanced - Complex behaviors
  {
    level: 3,
    spawnInterval: 1500,
    movingPopupsChance: 0.7,
    avoidCursorChance: 0.5,
    spinChance: 0.4,
    pulseChance: 0.5,
    trapChance: 0.1,
    comboBehaviors: true,
    popupSpeed: 1.4,
  },
  // Level 4: Expert - Chaotic
  {
    level: 4,
    spawnInterval: 1200,
    movingPopupsChance: 0.8,
    avoidCursorChance: 0.6,
    spinChance: 0.5,
    pulseChance: 0.6,
    trapChance: 0.15,
    comboBehaviors: true,
    popupSpeed: 1.6,
  },
  // Level 5: Master - Maximum difficulty
  {
    level: 5,
    spawnInterval: 1000,
    movingPopupsChance: 0.9,
    avoidCursorChance: 0.7,
    spinChance: 0.6,
    pulseChance: 0.7,
    trapChance: 0.2,
    comboBehaviors: true,
    popupSpeed: 2.0,
  },
]

// ============================================================================
// GAME MECHANICS FUNCTIONS
// ============================================================================

/**
 * Initialize game mechanics
 */
export function initializeGameMechanics(): GameMechanics {
  return {
    score: 0,
    combo: 0,
    comboTimer: null,
    lives: GAME_CONSTANTS.INITIAL_LIVES,
    maxLives: GAME_CONSTANTS.MAX_LIVES,
    correctCount: 0,
    difficulty: 0,
    roundNumber: 1,
    totalPopupsInRound: 0,
    accuracy: 100,
    averageReactionTime: 0,
    reactionTimes: [],
    badges: [],
    powerUps: [],
    activePowerUp: null,
  }
}

/**
 * Handle correct popup identification
 */
export function handleCorrectAction(mechanics: GameMechanics, reactionTime: number): GameMechanics {
  const updated = { ...mechanics }
  
  // Increase combo
  updated.combo += 1
  updated.correctCount += 1
  updated.totalPopupsInRound += 1
  
  // Calculate score with combo multiplier
  const multiplier = Math.min(updated.combo, GAME_CONSTANTS.COMBO_MULTIPLIERS.length)
  const comboBonus = GAME_CONSTANTS.COMBO_MULTIPLIERS[multiplier - 1]
  updated.score += GAME_CONSTANTS.SCORE_CORRECT * comboBonus
  
  // Track reaction time
  updated.reactionTimes.push(reactionTime)
  updated.averageReactionTime = 
    updated.reactionTimes.reduce((a, b) => a + b, 0) / updated.reactionTimes.length
  
  // Check for difficulty increase
  if (updated.correctCount % GAME_CONSTANTS.CORRECT_FOR_DIFFICULTY_UP === 0) {
    updated.difficulty = Math.min(
      updated.difficulty + 1,
      DIFFICULTY_CONFIGS.length - 1
    )
  }
  
  // Check for power-up unlock
  if (updated.score % GAME_CONSTANTS.POWERUP_SCORE_THRESHOLD === 0) {
    const powerUp = generatePowerUp()
    updated.powerUps.push(powerUp)
  }
  
  // Update accuracy
  updated.accuracy = (updated.correctCount / updated.totalPopupsInRound) * 100
  
  // Check for badges
  const newBadges = checkForBadges(updated)
  updated.badges = Array.from(new Set([...updated.badges, ...newBadges]))
  
  return updated
}

/**
 * Handle incorrect action or trap click
 */
export function handleIncorrectAction(mechanics: GameMechanics, loseLife: boolean = true): GameMechanics {
  const updated = { ...mechanics }
  
  // Reset combo
  updated.combo = 0
  updated.totalPopupsInRound += 1
  
  // Apply penalty
  updated.score = Math.max(0, updated.score + GAME_CONSTANTS.SCORE_PENALTY)
  
  // Lose life
  if (loseLife) {
    updated.lives = Math.max(0, updated.lives - 1)
  }
  
  // Update accuracy
  updated.accuracy = updated.totalPopupsInRound > 0
    ? (updated.correctCount / updated.totalPopupsInRound) * 100
    : 100
  
  return updated
}

/**
 * Reset combo if timer expires
 */
export function resetComboIfExpired(mechanics: GameMechanics): GameMechanics {
  if (mechanics.comboTimer && Date.now() > mechanics.comboTimer) {
    return { ...mechanics, combo: 0, comboTimer: null }
  }
  return mechanics
}

/**
 * Set combo timer for next action
 */
export function setComboTimer(mechanics: GameMechanics): GameMechanics {
  return {
    ...mechanics,
    comboTimer: Date.now() + GAME_CONSTANTS.COMBO_TIMEOUT,
  }
}

/**
 * Get current difficulty configuration
 */
export function getCurrentDifficulty(mechanics: GameMechanics): DifficultyConfig {
  return DIFFICULTY_CONFIGS[Math.min(mechanics.difficulty, DIFFICULTY_CONFIGS.length - 1)]
}

/**
 * Generate popup behavior based on difficulty
 */
export function generatePopupBehavior(
  popupId: string,
  difficulty: DifficultyConfig
): PopupBehavior {
  const rand = Math.random()
  
  // Check for trap first
  if (rand < difficulty.trapChance) {
    return {
      id: popupId,
      type: 'trap',
      speed: 0,
      scale: 1,
      rotation: 0,
      isTrap: true,
    }
  }
  
  // Determine primary behavior
  let behaviorType: PopupBehavior['type'] = 'static'
  
  if (rand < difficulty.movingPopupsChance) {
    behaviorType = 'bounce'
  } else if (rand < difficulty.avoidCursorChance + difficulty.movingPopupsChance) {
    behaviorType = 'avoid-cursor'
  } else if (rand < difficulty.spinChance + difficulty.avoidCursorChance + difficulty.movingPopupsChance) {
    behaviorType = 'spin'
  } else if (rand < difficulty.pulseChance + difficulty.spinChance + difficulty.avoidCursorChance + difficulty.movingPopupsChance) {
    behaviorType = 'pulse'
  }
  
  // Generate velocity for bouncing popups
  const velocity = behaviorType === 'bounce' ? {
    vx: (Math.random() * 2 + 1) * difficulty.popupSpeed * (Math.random() < 0.5 ? -1 : 1),
    vy: (Math.random() * 1 + 0.5) * difficulty.popupSpeed * (Math.random() < 0.5 ? -1 : 1),
  } : undefined
  
  return {
    id: popupId,
    type: behaviorType,
    speed: difficulty.popupSpeed,
    velocity,
    scale: 1,
    rotation: 0,
    growthDirection: behaviorType === 'pulse' ? 1 : undefined,
    isTrap: false,
  }
}

/**
 * Update bouncing popup position
 */
export function updateBouncingPopup(
  behavior: PopupBehavior,
  currentX: number,
  currentY: number,
  width: number,
  height: number,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number; behavior: PopupBehavior } {
  if (!behavior.velocity) return { x: currentX, y: currentY, behavior }
  
  let { vx, vy } = behavior.velocity
  let newX = currentX + vx
  let newY = currentY + vy
  
  // Bounce off edges
  if (newX < 0 || newX + width > screenWidth) {
    vx = -vx
    newX = Math.max(0, Math.min(newX, screenWidth - width))
  }
  if (newY < 0 || newY + height > screenHeight) {
    vy = -vy
    newY = Math.max(0, Math.min(newY, screenHeight - height))
  }
  
  return {
    x: newX,
    y: newY,
    behavior: { ...behavior, velocity: { vx, vy } },
  }
}

/**
 * Update cursor-avoiding popup position
 */
export function updateAvoidingPopup(
  behavior: PopupBehavior,
  currentX: number,
  currentY: number,
  width: number,
  height: number,
  cursorX: number,
  cursorY: number,
  screenWidth: number,
  screenHeight: number
): { x: number; y: number } {
  const centerX = currentX + width / 2
  const centerY = currentY + height / 2
  const dx = cursorX - centerX
  const dy = cursorY - centerY
  const dist = Math.hypot(dx, dy)
  
  // Only avoid if cursor is within 200px
  if (dist < 200) {
    const push = ((200 - dist) / 200) * (1 + behavior.speed * 0.4)
    const newX = Math.max(0, Math.min(currentX - dx * 0.02 * push, screenWidth - width))
    const newY = Math.max(0, Math.min(currentY - dy * 0.02 * push, screenHeight - height))
    return { x: newX, y: newY }
  }
  
  return { x: currentX, y: currentY }
}

/**
 * Update pulsing popup scale
 */
export function updatePulsingPopup(behavior: PopupBehavior): PopupBehavior {
  const minScale = 0.8
  const maxScale = 1.15
  const scaleStep = 0.008
  
  let newScale = behavior.scale + scaleStep * (behavior.growthDirection || 1)
  let newDirection = behavior.growthDirection || 1
  
  if (newScale >= maxScale) {
    newScale = maxScale
    newDirection = -1
  } else if (newScale <= minScale) {
    newScale = minScale
    newDirection = 1
  }
  
  return { ...behavior, scale: newScale, growthDirection: newDirection }
}

/**
 * Update spinning popup rotation
 */
export function updateSpinningPopup(behavior: PopupBehavior): PopupBehavior {
  const rotationSpeed = 2 // degrees per frame
  const newRotation = (behavior.rotation + rotationSpeed) % 360
  return { ...behavior, rotation: newRotation }
}

/**
 * Generate a random power-up
 */
function generatePowerUp(): PowerUp {
  const powerUpTypes = [
    {
      type: 'freeze' as const,
      name: 'Freeze',
      description: 'Stops all popup movement for 6 seconds',
      duration: 6,
      icon: '❄',
    },
    {
      type: 'slow-mo' as const,
      name: 'Slow Motion',
      description: 'Slows down all moving popups for 8 seconds',
      duration: 8,
      icon: '⏱',
    },
    {
      type: 'auto-report' as const,
      name: 'Auto-Report',
      description: 'Automatically identifies next malicious popup',
      duration: 0,
      icon: '⚡',
    },
    {
      type: 'reveal-all' as const,
      name: 'Reveal All',
      description: 'Shows indicators on all current popups for 5 seconds',
      duration: 5,
      icon: '👁',
    },
  ]
  
  const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)]
  
  return {
    id: `powerup-${Date.now()}-${Math.random()}`,
    ...randomType,
    active: false,
  }
}

/**
 * Check for earned badges
 */
function checkForBadges(mechanics: GameMechanics): string[] {
  const badges: string[] = []
  
  // Combo badges
  if (mechanics.combo >= 10) badges.push('Combo Master: 10 in a row')
  if (mechanics.combo >= 5) badges.push('Streak: 5 in a row')
  
  // Accuracy badges
  if (mechanics.accuracy === 100 && mechanics.totalPopupsInRound >= 10) {
    badges.push('Perfect: 100% accuracy')
  }
  
  // Speed badges
  if (mechanics.averageReactionTime < 2000 && mechanics.reactionTimes.length >= 10) {
    badges.push('Quick Draw: Avg < 2s')
  }
  
  // Score badges
  if (mechanics.score >= 500) badges.push('High Roller: 500+ points')
  if (mechanics.score >= 1000) badges.push('Champion: 1000+ points')
  
  // Difficulty badges
  if (mechanics.difficulty >= 3) badges.push('Advanced Player')
  if (mechanics.difficulty >= 5) badges.push('Master of Security')
  
  return badges
}

/**
 * Calculate end-game summary stats
 */
export function calculateGameSummary(mechanics: GameMechanics): {
  finalScore: number
  accuracy: number
  averageReactionTime: number
  correctAnswers: number
  totalAnswers: number
  highestCombo: number
  badges: string[]
  difficulty: number
} {
  return {
    finalScore: mechanics.score,
    accuracy: Math.round(mechanics.accuracy * 10) / 10,
    averageReactionTime: Math.round(mechanics.averageReactionTime),
    correctAnswers: mechanics.correctCount,
    totalAnswers: mechanics.totalPopupsInRound,
    highestCombo: mechanics.combo,
    badges: mechanics.badges,
    difficulty: mechanics.difficulty,
  }
}
