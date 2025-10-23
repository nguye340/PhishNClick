# Popup Manic Enhancement Guide 🎮

## Overview
This guide explains how to integrate the new fun game mechanics into Popup Manic to make it more engaging and challenging.

---

## New Features Added

### 1. **Core Game Mechanics** (`game-mechanics.ts`)
- ✅ Score system with combo multipliers (1x, 2x, 3x, 4x, 5x)
- ✅ Lives system (3 lives, can earn up to 5)
- ✅ Progressive difficulty (6 levels, 0-5)
- ✅ Reaction time tracking
- ✅ Accuracy calculation
- ✅ Badge system for achievements
- ✅ Power-ups (Freeze, Slow-mo, Auto-report, Reveal-all)

### 2. **Popup Behaviors** (`animated-popup.tsx`)
- ✅ **Static**: Normal stationary popup
- ✅ **Bounce**: Floats and bounces off screen edges (like DVD logo)
- ✅ **Avoid Cursor**: Runs away from mouse pointer
- ✅ **Spin**: Rotates continuously
- ✅ **Pulse**: Grows and shrinks rhythmically
- ✅ **Trap**: Special popup with malicious GIF that causes instant infection

### 3. **Visual Components**
- ✅ **GameHUD**: Top bar showing score, combo, lives, difficulty
- ✅ **GameSummaryModal**: End-game stats with badges and performance tips
- ✅ **InfectionOverlay**: Dramatic effect when clicking trap GIFs
- ✅ **FreezeEffect** & **SlowMotionEffect**: Power-up visual feedback

---

## Difficulty Progression

Each difficulty level increases challenge:

| Level | Spawn Interval | Behaviors | Trap Chance | Speed |
|-------|----------------|-----------|-------------|-------|
| 0 | 3s | Static only | 0% | 1.0x |
| 1 | 2.5s | 40% bounce, 20% pulse | 0% | 1.0x |
| 2 | 2s | 60% bounce, 30% avoid, 40% pulse | 5% | 1.2x |
| 3 | 1.5s | 70% bounce, 50% avoid, 50% pulse | 10% | 1.4x |
| 4 | 1.2s | 80% bounce, 60% avoid, 60% pulse | 15% | 1.6x |
| 5 | 1s | 90% bounce, 70% avoid, 70% pulse | 20% | 2.0x |

**Difficulty increases every 3 correct answers.**

---

## Integration Steps

### Step 1: Import New Modules

Add to `popup-manic-game.tsx`:

```typescript
import { 
  GameMechanics, 
  initializeGameMechanics,
  handleCorrectAction,
  handleIncorrectAction,
  getCurrentDifficulty,
  generatePopupBehavior,
  setComboTimer,
  calculateGameSummary,
  PopupBehavior,
} from './game-mechanics'
import { GameHUD, ScorePopup, BadgeNotification, DifficultyUpNotification } from './game-hud'
import { AnimatedPopup, TrapGIF, InfectionOverlay, FreezeEffect, SlowMotionEffect } from './animated-popup'
import { GameSummaryModal } from './game-summary-modal'
```

### Step 2: Add New State Variables

```typescript
const [mechanics, setMechanics] = useState<GameMechanics>(initializeGameMechanics())
const [popupBehaviors, setPopupBehaviors] = useState<Map<string, PopupBehavior>>(new Map())
const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
const [scorePopups, setScorePopups] = useState<Array<{id: string, x: number, y: number, value: number, isCombo: boolean}>>([])
const [showBadge, setShowBadge] = useState<string | null>(null)
const [showDifficultyUp, setShowDifficultyUp] = useState<number | null>(null)
const [showInfection, setShowInfection] = useState(false)
const [trapGIFs, setTrapGIFs] = useState<Array<{id: string, x: number, y: number}>>([])
const [showGameSummary, setShowGameSummary] = useState(false)
```

### Step 3: Track Cursor Position

```typescript
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    setCursorPosition({ x: e.clientX, y: e.clientY })
  }
  
  window.addEventListener('mousemove', handleMouseMove)
  return () => window.removeEventListener('mousemove', handleMouseMove)
}, [])
```

### Step 4: Modify Popup Spawning

```typescript
const spawnPopup = async () => {
  try {
    const apiPopup = await fetchRandomPopup()
    const difficulty = getCurrentDifficulty(mechanics)
    
    // Generate random position
    const position = generateRandomPosition()
    const size = { width: 450, height: 350 }
    
    const popup = transformPopupFromAPI(apiPopup, position, size)
    
    // Generate behavior based on difficulty
    const behavior = generatePopupBehavior(popup.id, difficulty)
    
    setPopupBehaviors(prev => new Map(prev).set(popup.id, behavior))
    
    // Spawn trap GIF if this is a trap popup
    if (behavior.isTrap) {
      const trapX = position.x + size.width / 2 - 50
      const trapY = position.y + size.height / 2 - 50
      setTrapGIFs(prev => [...prev, { 
        id: `trap-${popup.id}`, 
        x: trapX, 
        y: trapY 
      }])
    }
    
    dispatch({ type: 'ADD_POPUP', payload: popup })
    
    // Schedule next popup based on difficulty
    setTimeout(spawnPopup, difficulty.spawnInterval)
  } catch (error) {
    console.error('Failed to spawn popup:', error)
  }
}
```

### Step 5: Handle Correct Actions

```typescript
const handleCorrectPopupAction = (popupId: string, clickX: number, clickY: number) => {
  const reactionTime = Date.now() - popupSpawnTime // Track when popup appeared
  
  // Update mechanics
  const oldDifficulty = mechanics.difficulty
  const oldCombo = mechanics.combo
  const newMechanics = setComboTimer(handleCorrectAction(mechanics, reactionTime))
  setMechanics(newMechanics)
  
  // Calculate score with combo
  const multiplier = Math.min(newMechanics.combo, 5)
  const points = 10 * multiplier
  
  // Show score popup
  const scoreId = `score-${Date.now()}`
  setScorePopups(prev => [...prev, {
    id: scoreId,
    x: clickX,
    y: clickY,
    value: points,
    isCombo: multiplier > 1,
  }])
  setTimeout(() => {
    setScorePopups(prev => prev.filter(s => s.id !== scoreId))
  }, 1000)
  
  // Check for new badges
  if (newMechanics.badges.length > mechanics.badges.length) {
    const newBadge = newMechanics.badges[newMechanics.badges.length - 1]
    setShowBadge(newBadge)
    setTimeout(() => setShowBadge(null), 3000)
  }
  
  // Check for difficulty increase
  if (newMechanics.difficulty > oldDifficulty) {
    setShowDifficultyUp(newMechanics.difficulty + 1)
    setTimeout(() => setShowDifficultyUp(null), 3000)
  }
  
  // Remove popup and its behavior
  dispatch({ type: 'REMOVE_POPUP', payload: popupId })
  setPopupBehaviors(prev => {
    const next = new Map(prev)
    next.delete(popupId)
    return next
  })
}
```

### Step 6: Handle Incorrect Actions & Traps

```typescript
const handleTrapClick = (trapId: string) => {
  // Show infection overlay
  setShowInfection(true)
  setTimeout(() => setShowInfection(false), 3000)
  
  // Update mechanics (lose life)
  const newMechanics = handleIncorrectAction(mechanics, true)
  setMechanics(newMechanics)
  
  // Remove trap
  setTrapGIFs(prev => prev.filter(t => t.id !== trapId))
  
  // Check for game over
  if (newMechanics.lives === 0) {
    handleGameOver()
  }
}

const handleIncorrectPopupAction = (popupId: string) => {
  const newMechanics = handleIncorrectAction(mechanics, true)
  setMechanics(newMechanics)
  
  // Show educational modal here...
  
  if (newMechanics.lives === 0) {
    handleGameOver()
  }
}
```

### Step 7: Power-Up System

```typescript
const activatePowerUp = (powerUp: PowerUp) => {
  setMechanics(prev => ({
    ...prev,
    activePowerUp: powerUp,
    powerUps: prev.powerUps.map(p => 
      p.id === powerUp.id ? { ...p, active: true } : p
    ),
  }))
  
  // Deactivate after duration
  if (powerUp.duration > 0) {
    setTimeout(() => {
      setMechanics(prev => ({
        ...prev,
        activePowerUp: null,
        powerUps: prev.powerUps.filter(p => p.id !== powerUp.id),
      }))
    }, powerUp.duration * 1000)
  } else {
    // Instant power-up (like auto-report)
    setMechanics(prev => ({
      ...prev,
      activePowerUp: null,
      powerUps: prev.powerUps.filter(p => p.id !== powerUp.id),
    }))
  }
}
```

### Step 8: Game Over & Summary

```typescript
const handleGameOver = () => {
  const summary = calculateGameSummary(mechanics)
  setShowGameSummary(true)
  dispatch({ type: 'SET_GAME_OVER', payload: true })
  dispatch({ type: 'SET_GAME_ACTIVE', payload: false })
}

const handlePlayAgain = () => {
  setShowGameSummary(false)
  setMechanics(initializeGameMechanics())
  setPopupBehaviors(new Map())
  setTrapGIFs([])
  startGame()
}
```

### Step 9: Render Components

```tsx
return (
  <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
    {/* Game HUD */}
    {gameActive && (
      <GameHUD 
        mechanics={mechanics} 
        onPowerUpActivate={activatePowerUp}
      />
    )}
    
    {/* Animated Popups */}
    {state.popups.map(popup => {
      const behavior = popupBehaviors.get(popup.id)
      if (!behavior) return null
      
      return (
        <AnimatedPopup
          key={popup.id}
          behavior={behavior}
          initialX={popup.position.x}
          initialY={popup.position.y}
          width={popup.size.width}
          height={popup.size.height}
          cursorPosition={cursorPosition}
          isPaused={state.paused}
          isFrozen={mechanics.activePowerUp?.type === 'freeze'}
          isSlowMo={mechanics.activePowerUp?.type === 'slow-mo'}
          onPositionUpdate={(x, y) => {
            dispatch({ type: 'UPDATE_POPUP_POSITION', payload: { id: popup.id, x, y }})
          }}
        >
          <ModernPopupIntegration
            popup={popup}
            onClose={() => handleCorrectPopupAction(popup.id, popup.position.x, popup.position.y)}
            // ... other props
          />
        </AnimatedPopup>
      )
    })}
    
    {/* Trap GIFs */}
    {trapGIFs.map(trap => (
      <TrapGIF
        key={trap.id}
        x={trap.x}
        y={trap.y}
        onClick={() => handleTrapClick(trap.id)}
      />
    ))}
    
    {/* Score Popups */}
    {scorePopups.map(score => (
      <ScorePopup
        key={score.id}
        x={score.x}
        y={score.y}
        value={score.value}
        isCombo={score.isCombo}
      />
    ))}
    
    {/* Badge Notification */}
    {showBadge && <BadgeNotification badge={showBadge} />}
    
    {/* Difficulty Up Notification */}
    {showDifficultyUp && <DifficultyUpNotification level={showDifficultyUp} />}
    
    {/* Infection Overlay */}
    {showInfection && <InfectionOverlay />}
    
    {/* Power-Up Effects */}
    {mechanics.activePowerUp?.type === 'freeze' && <FreezeEffect />}
    {mechanics.activePowerUp?.type === 'slow-mo' && <SlowMotionEffect />}
    
    {/* Game Summary Modal */}
    {showGameSummary && (
      <GameSummaryModal
        isOpen={showGameSummary}
        onClose={() => setShowGameSummary(false)}
        onPlayAgain={handlePlayAgain}
        summary={calculateGameSummary(mechanics)}
      />
    )}
  </div>
)
```

---

## Testing Checklist

- [ ] Score increases with correct actions
- [ ] Combo builds up and displays multiplier
- [ ] Lives decrease on mistakes/trap clicks
- [ ] Difficulty increases every 3 correct answers
- [ ] Popups bounce off screen edges
- [ ] Popups avoid cursor when close
- [ ] Spinning popups rotate
- [ ] Pulsing popups grow/shrink
- [ ] Trap GIFs appear and trigger infection
- [ ] Power-ups appear and activate correctly
- [ ] Freeze stops all movement
- [ ] Slow-mo reduces speed
- [ ] Badges appear for achievements
- [ ] Game summary shows correct stats
- [ ] Game over triggers at 0 lives

---

## Customization Options

### Adjust Difficulty Scaling

Edit `DIFFICULTY_CONFIGS` in `game-mechanics.ts`:
- Change `spawnInterval` for faster/slower spawns
- Adjust behavior chances (0-1 range)
- Modify `popupSpeed` multiplier

### Add New Behaviors

1. Add behavior type to `PopupBehavior` interface
2. Implement update function (like `updateBouncingPopup`)
3. Add case in `AnimatedPopup` switch statement
4. Add to difficulty config

### Customize Scoring

Edit `GAME_CONSTANTS` in `game-mechanics.ts`:
- `SCORE_CORRECT`: Points for correct action
- `SCORE_PENALTY`: Points lost for mistakes
- `COMBO_MULTIPLIERS`: Multiplier values
- `CORRECT_FOR_DIFFICULTY_UP`: Actions needed to level up

---

## Performance Tips

1. **Limit Active Popups**: Max 5-6 on screen at once
2. **Use requestAnimationFrame**: Already implemented in AnimatedPopup
3. **Cleanup on Unmount**: Remove behaviors from Map when popups close
4. **Debounce Cursor Tracking**: Throttle mousemove if needed
5. **Optimize Animations**: Use CSS transforms for better performance

---

## Common Issues & Solutions

### Issue: Popups moving too fast
**Solution**: Reduce `popupSpeed` in difficulty config or adjust velocity calculations

### Issue: Traps too hard to avoid
**Solution**: Lower `trapChance` percentage or add visual warning before spawn

### Issue: Game too easy/hard
**Solution**: Adjust `CORRECT_FOR_DIFFICULTY_UP` constant and difficulty progression curve

### Issue: Performance lag with many popups
**Solution**: Limit max concurrent popups and use CSS transforms instead of position updates

---

## Next Steps

1. **Implement core mechanics** following steps above
2. **Test each behavior** individually before combining
3. **Balance difficulty** based on playtesting
4. **Add sound effects** for actions, combos, power-ups
5. **Create tutorial** explaining new mechanics
6. **Track analytics** to see which mechanics are most engaging

---

## Additional Features to Consider

- **Leaderboard**: Save high scores to backend
- **Daily Challenges**: Special popup configurations
- **Achievements System**: More detailed badge tracking
- **Multiplayer Mode**: Compete in real-time
- **Custom Skins**: Unlock popup themes
- **Sound Packs**: Different audio themes

---

**Good luck making Popup Manic fun and engaging! 🎮🎉**
