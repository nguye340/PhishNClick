# 🎮 Testing Guide - Popup Manic Fun Mechanics

## Quick Test URL
**Navigate to**: `http://localhost:3001/games/popup-manic`

---

## ✅ What to Test

### 1. **Start the Game**
- Click "START GAME" button
- **Expected**: HUD appears at top showing:
  - Score: 0
  - Combo: 1x
  - Lives: ❤️❤️❤️ (3 hearts)
  - Difficulty: Level 1

### 2. **Test Scoring & Combos**
**Steps:**
1. Close/report 3 popups correctly in a row quickly (within 3 seconds between each)
2. **Expected**:
   - First popup: "+10" floats up
   - Second popup: "+20" floats up with "COMBO!" (2x multiplier)
   - Third popup: "+30" floats up with "COMBO!" (3x multiplier)
   - 🔥 Fire icon appears next to combo multiplier in HUD

**What it looks like:**
```
Score increases: 0 → 10 → 30 → 60
Combo in HUD: 1x → 2x → 3x
```

### 3. **Test Difficulty Progression**
**Steps:**
1. Get 3 correct answers
2. **Expected**: 
   - Full-screen notification: "🎯 DIFFICULTY INCREASED! LEVEL 2"
   - Popups start spawning faster
   - Some popups now bounce around the screen

**Continue to test:**
- Get 3 more correct → Level 3 (popups avoid cursor)
- Get 3 more correct → Level 4 (popups spin)
- Get 3 more correct → Level 5 (popups pulse, very fast)

### 4. **Test Popup Behaviors**

#### **Level 0-1: Static & Bounce**
- Popups stay in place OR bounce like DVD screensaver
- Hit screen edges and bounce back

#### **Level 2+: Avoid Cursor**
- Move mouse near a popup
- **Expected**: Popup runs away from your cursor
- Try to "catch" it by moving fast

#### **Level 3+: Spin**
- Some popups rotate 360°
- Still interactable while spinning

#### **Level 4+: Pulse**
- Some popups grow and shrink rhythmically
- "Breathing" effect

### 5. **Test Trap GIFs** (Level 2+)
**Steps:**
1. Play until difficulty level 2
2. Look for a red glowing GIF in the center of a popup
3. Click the trap GIF
4. **Expected**:
   - Screen flashes RED
   - Static noise effect
   - Warning: "⚠️ INFECTED! You clicked malicious content!"
   - Lose 1 life (hearts decrease)
   - Trap disappears

### 6. **Test Lives System**
**Steps:**
1. Make 3 mistakes OR click 3 trap GIFs
2. **Expected**: Hearts decrease: ❤️❤️❤️ → ❤️❤️ → ❤️ → 💔
3. When lives = 0:
   - Game Over
   - Game Summary modal appears

### 7. **Test Power-Ups** (Need 50+ points)
**Steps:**
1. Score 50 points (5 correct answers with no combos)
2. **Expected**: Power-up appears in HUD (icon in top-left area)
3. Click the power-up icon
4. **Expected** (depending on type):
   - ❄️ **Freeze**: All popups stop moving, blue tint overlay
   - 🐌 **Slow-mo**: Popups move at 30% speed, purple tint
   - 🎯 **Auto-report**: Next malicious popup auto-highlights
   - 👁️ **Reveal-all**: Shows indicators on all popups

### 8. **Test Badges**
**Steps to unlock specific badges:**

- **⚡ Streak (5 in a row)**:
  - Close 5 popups correctly without mistakes
  - **Expected**: Badge notification slides in from right

- **🔥 Combo Master (10 in a row)**:
  - Get 10x combo multiplier
  - Must be FAST (within 3 seconds between each)

- **🎯 Perfect Accuracy**:
  - Close 10+ popups with 100% accuracy (no mistakes)

- **⏱️ Quick Draw**:
  - Maintain average reaction time under 2 seconds

- **💰 High Roller (500 points)**:
  - Reach 500 points total

- **👑 Champion (1000 points)**:
  - Reach 1000 points total

### 9. **Test Game Summary**
**Steps:**
1. Lose all 3 lives
2. **Expected**: Game Summary Modal shows:
   - Your Rank: (Beginner/Intermediate/Advanced/Expert/Master)
   - Final Score
   - Accuracy percentage
   - Average Reaction Time
   - Highest Combo
   - Badges Earned (with icons)
   - Performance Tips
   - "PLAY AGAIN" button

3. Click "PLAY AGAIN"
4. **Expected**: 
   - Modal closes
   - Everything resets to start state
   - New game begins

---

## 🐛 Common Issues & Fixes

### Issue: "Popups aren't moving"
**Solution**: 
- Check difficulty level in HUD
- Level 0 = all static (by design)
- Play correctly to increase difficulty

### Issue: "No score popups appearing"
**Solution**:
- Make sure you're doing CORRECT actions
- Wrong actions don't give points
- Look for "+10" floating text at popup position

### Issue: "Combo resets too fast"
**Solution**:
- You have 3 seconds between correct actions
- Must be quick to maintain combo
- This is intentional for challenge

### Issue: "Trap GIFs not appearing"
**Solution**:
- Traps only spawn at difficulty level 2+
- Play correctly to reach level 2
- Only 5-20% chance per popup (random)

### Issue: "Power-ups not showing"
**Solution**:
- Need exactly 50, 100, 150, 200, etc. points
- Look in HUD top-left area for icons
- They appear automatically when earned

---

## 📊 Expected Gameplay Progression

### **First 30 seconds (Level 0-1)**
- Learning phase
- Static/slow bouncing popups
- Build combo practice
- Score: 0-100

### **30-90 seconds (Level 2-3)**
- Challenge begins
- Cursor-avoiding popups
- First traps appear
- Combo management critical
- Score: 100-300

### **90-180 seconds (Level 4-5)**
- Chaos mode
- Fast spawning (1-1.5s)
- Multiple behaviors per popup
- High trap chance (15-20%)
- Requires focus and skill
- Score: 300-600+

### **End Game (0 lives)**
- Game Summary
- Review stats
- Check badges
- See rank
- Play again!

---

## 🎯 Performance Benchmarks

### **Beginner**
- Score: 0-100
- Accuracy: <70%
- Avg Reaction: >5s
- Max Difficulty: 0-1

### **Intermediate**
- Score: 100-300
- Accuracy: 70-85%
- Avg Reaction: 3-5s
- Max Difficulty: 2-3

### **Advanced**
- Score: 300-500
- Accuracy: 85-95%
- Avg Reaction: 2-3s
- Max Difficulty: 4
- Badges: 2-3

### **Expert**
- Score: 500-1000
- Accuracy: 95%+
- Avg Reaction: <2s
- Max Difficulty: 5
- Badges: 4-5

### **Master**
- Score: 1000+
- Accuracy: 98%+
- Avg Reaction: <1.5s
- Max Difficulty: 5
- Badges: 6+
- Combos: 10x+ achieved

---

## 🎬 Video Test Scenarios

### Scenario 1: "Speed Run" (2 min)
1. Start game
2. Close popups as fast as possible
3. Ignore combos, just focus on speed
4. **Goal**: Reach Level 3 in under 2 minutes

### Scenario 2: "Combo Master" (3 min)
1. Start game
2. Focus ONLY on maintaining combo
3. Be fast between actions
4. **Goal**: Achieve 10x combo (🔥 Combo Master badge)

### Scenario 3: "Trap Survivor" (5 min)
1. Play until Level 2
2. Avoid ALL trap GIFs
3. Don't lose any lives
4. **Goal**: Perfect accuracy with 0 trap clicks

### Scenario 4: "Power-Up Tester" (3 min)
1. Score exactly 50 points
2. Get power-up
3. Activate it
4. Test its effect
5. **Goal**: Try all 4 power-up types

### Scenario 5: "Badge Hunter" (10 min)
1. Play carefully
2. Focus on accuracy
3. Maintain combos
4. React quickly
5. **Goal**: Unlock 3+ badges in one run

---

## 🔍 Debug Console

Open browser console (F12) to see:
```
[GameLoop] Spawning new popup, current count: 1
[GameLoop] Spawned popup popup-123 at position: {x: 500, y: 300} behavior: bounce
[Mechanics] Correct action - Combo: 2x, Score: 30
[Mechanics] Difficulty increased to level 2
[TRAP] Trap GIF clicked: trap-popup-456
[Badge] Unlocked: Streak ⚡
```

---

## ✅ Final Checklist

Before declaring success, verify ALL of these work:

- [ ] Game starts and shows HUD
- [ ] Score increases on correct actions (+10, +20, +30...)
- [ ] Combo multiplier shows and works (1x → 2x → 3x...)
- [ ] Lives decrease on mistakes/traps
- [ ] Difficulty increases every 3 correct answers
- [ ] Popups bounce around screen (Level 1+)
- [ ] Popups avoid cursor (Level 2+)
- [ ] Popups spin (Level 3+)
- [ ] Popups pulse (Level 3+)
- [ ] Trap GIFs appear and cause infection (Level 2+)
- [ ] Score popups float up with correct values
- [ ] Badge notifications slide in when earned
- [ ] Difficulty up notification shows on level up
- [ ] Infection overlay shows on trap click
- [ ] Power-ups appear every 50 points
- [ ] Power-ups activate and show effects
- [ ] Game summary shows at 0 lives
- [ ] Game summary displays correct stats
- [ ] Play again button resets game properly

---

## 🚀 Ready to Impress!

If all tests pass, your game now has:
- ✅ Engaging scoring system with combos
- ✅ Progressive difficulty that scales challenge
- ✅ Fun popup behaviors (bounce, avoid, spin, pulse)
- ✅ Dangerous traps with visual feedback
- ✅ Reward system (power-ups, badges)
- ✅ Professional UI with HUD and notifications
- ✅ Comprehensive end-game stats

**Your teacher will definitely be impressed!** 🎉
