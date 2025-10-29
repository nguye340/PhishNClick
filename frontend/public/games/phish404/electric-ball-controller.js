class ElectricBallController {
  constructor(gameWidth, gameHeight, scaleRatio) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.scaleRatio = scaleRatio;
    
    // Electric ball properties
    this.activeBalls = [];
    this.ballWidth = 150 * scaleRatio; // Much bigger electric ball
    this.ballHeight = 120 * scaleRatio; // Much bigger electric ball
    this.ballSpeed = 0.8 * scaleRatio; // Fast horizontal movement
    
    // Animation sizes (much bigger, scale with player size)
    this.throwFireSize = 150 * scaleRatio; // Much bigger throw fire animation
    this.impactSize = 200 * scaleRatio; // Much bigger impact explosion
    
    // Player shooting state
    this.shotsRemaining = 0;
    this.maxShots = 3;
    this.shotCooldown = 2000; // 2 seconds between shots
    this.lastShotTime = 0;
    this.autoFireEnabled = false;
    
    // Animation frames for different effects
    this.throwFireFrames = [];
    this.fireBlastFrames = [];
    this.impactFrames = [];
    
    // Load throw fire animation (8 frames)
    for (let i = 1; i <= 8; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/throwFire/throwFire${i}.png`;
      this.throwFireFrames.push(img);
    }
    
    // Load fire blast animation (10 frames)
    for (let i = 1; i <= 10; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/fireBlast/fireBlast${i}.png`;
      this.fireBlastFrames.push(img);
    }
    
    // Load impact animation (16 frames)
    for (let i = 1; i <= 16; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/impact/impact${i}.png`;
      this.impactFrames.push(img);
    }
    
    // Sound effects
    this.shootSound = new Audio('/games/phish404/audio/fire.mp3');
    this.shootSound.volume = 0.3; // Small volume as requested
    
    this.bossHitSound = new Audio('/games/phish404/audio/boss-hit.wav');
    this.bossHitSound.volume = 0.3; // Low volume as requested
    
    this.bossGruntSound = new Audio('/games/phish404/audio/boss-grunt.mp3');
    this.bossGruntSound.volume = 0.3; // Low volume as requested
    
    // Add sounds to global volume control
    if (window.gameSounds) {
      window.gameSounds.push(this.shootSound, this.bossHitSound, this.bossGruntSound);
    }
    
    // Active effects for rendering
    this.throwFireEffects = [];
    this.impactEffects = [];
    
    // Debug settings
    this.showHitboxDebug = false; // Set to false to hide hitbox
    
    debugLog('ELECTRIC BALL: Controller initialized');
  }
  
  // Activate the star powerup - gives player 3 shots
  activateStarPowerup(player) {
    this.shotsRemaining = this.maxShots;
    this.autoFireEnabled = true;
    this.lastShotTime = Date.now();
    
    // Show star counter and hide instruction
    this.updateStarUI();
    
    debugLog(`FIRE BALL: Star powerup activated! ${this.shotsRemaining} shots available`);
  }
  
  // Update method called each frame
  update(frameTimeDelta, player, hacker) {
    const currentTime = Date.now();
    
    // Debug hacker object
    if (this.activeBalls.length > 0) {
      debugLog('FIRE BALL: Update - Hacker object:', hacker ? 'exists' : 'null');
      if (hacker) {
        debugLog('FIRE BALL: Hacker position:', hacker.x, hacker.y, 'Loading:', hacker.isLoading);
      }
    }
    
    // Auto-fire logic
    if (this.autoFireEnabled && this.shotsRemaining > 0) {
      if (currentTime - this.lastShotTime >= this.shotCooldown) {
        this.fireElectricBall(player);
        this.lastShotTime = currentTime;
        this.shotsRemaining--;
        
        if (this.shotsRemaining <= 0) {
          this.autoFireEnabled = false;
          this.updateStarUI();
          debugLog('FIRE BALL: All shots used');
        }
      }
    }
    
    // Update electric balls
    this.updateElectricBalls(frameTimeDelta, hacker);
    
    // Update throw fire effects
    this.updateThrowFireEffects(frameTimeDelta);
    
    // Update impact effects
    this.updateImpactEffects(frameTimeDelta);
  }
  
  // Fire an electric ball from the player position
  fireElectricBall(player) {
    // Calculate starting position (right next to the cat, moved up)
    const startX = player.x + player.width + 10;
    const startY = player.y; // Moved up from center
    
    // Create throw fire effect
    this.createThrowFireEffect(startX, startY);
    
    // Create electric ball
    const ball = {
      x: startX,
      y: startY,
      width: this.ballWidth,
      height: this.ballHeight,
      speed: this.ballSpeed,
      currentFrame: 0,
      animationTimer: 0,
      animationSpeed: 50, // Very slow fire ball animation (milliseconds per frame)
      active: true
    };
    
    this.activeBalls.push(ball);
    
    // Play shoot sound
    if (!window.isMuted && this.shootSound) {
      this.shootSound.currentTime = 0;
      this.shootSound.play().catch(e => debugLog("Error playing shoot sound:", e));
    }
    
    // Update UI to show remaining shots
    this.updateStarUI();
    
    debugLog('FIRE BALL: Fired fire ball');
  }
  
  // Update all active electric balls
  updateElectricBalls(frameTimeDelta, hacker) {
    for (let i = this.activeBalls.length - 1; i >= 0; i--) {
      const ball = this.activeBalls[i];
      
      if (!ball.active) {
        this.activeBalls.splice(i, 1);
        continue;
      }
      
      // Move ball horizontally
      ball.x += ball.speed * frameTimeDelta;
      
      // Update animation
      ball.animationTimer += frameTimeDelta;
      if (ball.animationTimer >= ball.animationSpeed) {
        ball.currentFrame = (ball.currentFrame + 1) % this.fireBlastFrames.length;
        ball.animationTimer = 0;
      }
      
      // Check collision with hacker
      if (hacker && this.checkCollisionWithHacker(ball, hacker)) {
        this.hitHacker(ball, hacker);
        ball.active = false;
        continue;
      }
      
      // Remove ball if it goes off screen
      if (ball.x > this.gameWidth + 100) {
        this.activeBalls.splice(i, 1);
      }
    }
  }
  
  // Check collision between fire ball and hacker
  checkCollisionWithHacker(ball, hacker) {
    if (!hacker) {
      return false;
    }
    
    // Allow collision during loading phase (player can attack during loading)
    // if (hacker.isLoading) {
    //   return false;
    // }
    
    // Use hacker's fixed position
    const hackerX = hacker.fixedX;
    const hackerY = hacker.y;
    
    // Simple overlap detection with moderate padding for accurate hits
    const padding = 15; // Smaller, more accurate hitbox
    const collision = (
      ball.x + ball.width > hackerX - padding &&
      ball.x < hackerX + hacker.width + padding &&
      ball.y + ball.height > hackerY - padding &&
      ball.y < hackerY + hacker.height + padding
    );
    
    if (collision) {
      debugLog('FIRE BALL: HIT! Ball pos:', ball.x, ball.y, 'Hacker pos:', hackerX, hackerY);
    }
    
    return collision;
  }
  
  // Handle hitting the hacker
  hitHacker(ball, hacker) {
    debugLog('FIRE BALL: Hit hacker! Creating impact effect...');
    
    // Create impact effect at hacker's center for better visual
    const hackerCenterX = (hacker.fixedX || hacker.x) + hacker.width / 2;
    const hackerCenterY = hacker.y + hacker.height / 2;
    this.createImpactEffect(hackerCenterX, hackerCenterY);
    
    // Debug hacker object
    debugLog('FIRE BALL: Hacker object:', hacker);
    debugLog('FIRE BALL: Hacker has takeDamage method:', typeof hacker.takeDamage === 'function');
    debugLog('FIRE BALL: Hacker lives before damage:', hacker.lives);
    
    // Damage the hacker
    if (hacker && typeof hacker.takeDamage === 'function') {
      const wasDefeated = hacker.takeDamage(1); // Cost the attacker 1 life
      debugLog('FIRE BALL: Hacker took 1 damage! Lives remaining:', hacker.lives);
      debugLog('FIRE BALL: Hacker defeated:', wasDefeated);
    } else {
      debugError('FIRE BALL: Hacker does not have takeDamage method!');
    }
    
    // Play hit sounds - both boss-hit.wav and boss-grunt.mp3
    if (!window.isMuted) {
      debugLog('FIRE BALL: Playing boss hit sounds...');
      
      // Play boss-hit.wav immediately
      if (this.bossHitSound) {
        this.bossHitSound.currentTime = 0;
        this.bossHitSound.volume = 0.3; // Ensure volume is set
        this.bossHitSound.play().catch(e => debugLog("Error playing boss hit sound:", e));
        debugLog('FIRE BALL: Played boss-hit.wav');
      }
      
      // Play boss-grunt.mp3 slightly delayed
      setTimeout(() => {
        if (this.bossGruntSound) {
          this.bossGruntSound.currentTime = 0;
          this.bossGruntSound.volume = 0.3; // Ensure volume is set
          this.bossGruntSound.play().catch(e => debugLog("Error playing boss grunt sound:", e));
          debugLog('FIRE BALL: Played boss-grunt.mp3');
        }
      }, 200); // Slightly longer delay
    }
  }
  
  // Create throw fire effect
  createThrowFireEffect(x, y) {
    const effect = {
      x: x - this.throwFireSize / 2, // Center the effect
      y: y - this.throwFireSize / 2,
      currentFrame: 0,
      animationTimer: 0,
      animationSpeed: 80, // Extremely slow throw fire animation (milliseconds per frame)
      active: true
    };
    
    this.throwFireEffects.push(effect);
  }
  
  // Update throw fire effects
  updateThrowFireEffects(frameTimeDelta) {
    for (let i = this.throwFireEffects.length - 1; i >= 0; i--) {
      const effect = this.throwFireEffects[i];
      
      effect.animationTimer += frameTimeDelta;
      if (effect.animationTimer >= effect.animationSpeed) {
        effect.currentFrame++;
        effect.animationTimer = 0;
        
        if (effect.currentFrame >= this.throwFireFrames.length) {
          this.throwFireEffects.splice(i, 1);
        }
      }
    }
  }
  
  // Create impact effect
  createImpactEffect(x, y) {
    const effect = {
      x: x - this.impactSize / 2, // Center the effect
      y: y - this.impactSize / 2,
      currentFrame: 0,
      animationTimer: 0,
      animationSpeed: 60, // Very slow impact animation (milliseconds per frame)
      active: true
    };
    
    this.impactEffects.push(effect);
  }
  
  // Update impact effects
  updateImpactEffects(frameTimeDelta) {
    for (let i = this.impactEffects.length - 1; i >= 0; i--) {
      const effect = this.impactEffects[i];
      
      effect.animationTimer += frameTimeDelta;
      if (effect.animationTimer >= effect.animationSpeed) {
        effect.currentFrame++;
        effect.animationTimer = 0;
        
        if (effect.currentFrame >= this.impactFrames.length) {
          this.impactEffects.splice(i, 1);
        }
      }
    }
  }
  
  // Draw all electric ball effects
  draw(ctx, hacker = null) {
    // Draw debug hitbox if enabled (show even during loading for debugging)
    if (this.showHitboxDebug && hacker) {
      this.drawHitboxDebug(ctx, hacker);
    }
    // Draw throw fire effects
    this.throwFireEffects.forEach(effect => {
      if (effect.currentFrame < this.throwFireFrames.length) {
        const frame = this.throwFireFrames[effect.currentFrame];
        if (frame.complete) {
          ctx.drawImage(
            frame,
            effect.x,
            effect.y,
            this.throwFireSize,
            this.throwFireSize
          );
        }
      }
    });
    
    // Draw fire balls
    this.activeBalls.forEach(ball => {
      if (ball.active && ball.currentFrame < this.fireBlastFrames.length) {
        const frame = this.fireBlastFrames[ball.currentFrame];
        if (frame.complete) {
          ctx.drawImage(
            frame,
            ball.x,
            ball.y,
            ball.width,
            ball.height
          );
        }
      }
    });
    
    // Draw impact effects
    this.impactEffects.forEach(effect => {
      if (effect.currentFrame < this.impactFrames.length) {
        const frame = this.impactFrames[effect.currentFrame];
        if (frame.complete) {
          ctx.drawImage(
            frame,
            effect.x,
            effect.y,
            this.impactSize,
            this.impactSize
          );
        }
      }
    });
  }
  
  // Reset the controller
  reset() {
    this.activeBalls = [];
    this.throwFireEffects = [];
    this.impactEffects = [];
    this.shotsRemaining = 0;
    this.autoFireEnabled = false;
    this.lastShotTime = 0;
    
    debugLog('FIRE BALL: Controller reset');
  }
  
  // Get current shots remaining (for UI display)
  getShotsRemaining() {
    return this.shotsRemaining;
  }
  
  // Check if auto-fire is active
  isAutoFireActive() {
    return this.autoFireEnabled;
  }
  
  // Update star powerup UI
  updateStarUI() {
    const starCounter = document.getElementById('starCounter');
    const starCounterContainer = document.getElementById('starCounterContainer');
    const starInstruction = document.getElementById('starInstruction');
    
    if (this.shotsRemaining > 0) {
      // Show counter with remaining shots
      if (starCounter) starCounter.textContent = `x${this.shotsRemaining}`;
      if (starCounterContainer) starCounterContainer.style.display = 'flex';
      if (starInstruction) starInstruction.style.display = 'none';
    } else {
      // Hide counter and show instruction during hacker loading phase
      if (starCounterContainer) starCounterContainer.style.display = 'none';
      if (window.hackerIsLoading && starInstruction) {
        starInstruction.style.display = 'block';
      } else if (starInstruction) {
        starInstruction.style.display = 'none';
      }
    }
  }
  
  // Show star instruction during hacker loading phase
  showStarInstruction() {
    const starInstruction = document.getElementById('starInstruction');
    const footerMessage = document.getElementById('footerMessage');
    
    if (starInstruction && this.shotsRemaining === 0) {
      starInstruction.style.display = 'block';
      // Hide footer message when star instruction is shown
      if (footerMessage) {
        footerMessage.style.display = 'none';
      }
    }
  }
  
  // Hide star instruction
  hideStarInstruction() {
    const starInstruction = document.getElementById('starInstruction');
    const footerMessage = document.getElementById('footerMessage');
    
    if (starInstruction) {
      starInstruction.style.display = 'none';
    }
    
    // Show footer message when star instruction is hidden
    if (footerMessage) {
      footerMessage.style.display = 'block';
    }
  }
  
  // Draw debug hitbox for the hacker
  drawHitboxDebug(ctx, hacker) {
    const hackerX = hacker.fixedX;
    const hackerY = hacker.y;
    const padding = 15; // Same padding used in collision detection
    
    // Save current context state
    ctx.save();
    
    // Draw hacker's actual bounds (green)
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(hackerX, hackerY, hacker.width, hacker.height);
    
    // Draw collision hitbox with padding (red)
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      hackerX - padding,
      hackerY - padding,
      hacker.width + (padding * 2),
      hacker.height + (padding * 2)
    );
    
    // Draw center point (yellow)
    const centerX = hackerX + hacker.width / 2;
    const centerY = hackerY + hacker.height / 2;
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Restore context state
    ctx.restore();
  }
}

// Add to global scope for access from game.js
window.ElectricBallController = ElectricBallController;
