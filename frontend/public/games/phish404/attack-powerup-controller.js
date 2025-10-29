class AttackPowerupController {
  constructor(gameWidth, gameHeight, scaleRatio) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.scaleRatio = scaleRatio;
    
    // Array to hold active attack powerups
    this.powerups = [];
    
    // Powerup properties - slightly smaller than shield
    this.width = 50 * scaleRatio;
    this.height = 50 * scaleRatio;
    
    // Load star animation frames
    this.animationFrames = [];
    this.currentFrame = 0;
    this.frameCount = 24; // Number of frames in the animation
    this.animationSpeed = 0.05; // Slower animation speed
    this.animationTimer = 0;
    
    // Pulsing effect properties
    this.pulseScale = 1.0;
    this.pulseSpeed = 0.01; // Slower pulsing
    this.pulseDirection = 1;
    this.minPulseScale = 0.8; // Slightly smaller when pulsing in
    this.maxPulseScale = 1.2; // Slightly larger when pulsing out
    
    // Load all animation frames
    for (let i = 1; i <= this.frameCount; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/star/star${i}.png`;
      this.animationFrames.push(img);
    }
    
    // Sound effects for attack powerup
    this.spawnSound = new Audio('/games/phish404/audio/powerup_spawn.mp3');
    this.collectSound = new Audio('/games/phish404/audio/yay-6120.mp3');
    
    // Only spawn during hacker boss loading phase
    this.onlyDuringBossLoading = true;
    
    // Respawn timer
    this.respawnTimer = null;
    
    // Movement speed
    this.speed = 2 * scaleRatio;
    
    debugLog('ATTACK POWERUP: Controller initialized');
  }
  
  // Spawn a new attack powerup
  spawn() {
    if (this.respawnTimer) {
      clearTimeout(this.respawnTimer);
      this.respawnTimer = null;
    }
    
    // Play spawn sound
    if (this.spawnSound) {
      this.spawnSound.currentTime = 0;
      this.spawnSound.play().catch(e => debugLog('Error playing spawn sound:', e));
    }
    
    const powerup = {
      x: this.gameWidth,
      y: Math.random() * (this.gameHeight - this.height * 2) + this.height * 0.5,
      width: this.width,
      height: this.height,
      collected: false
    };
    
    this.powerups.push(powerup);
    debugLog('ATTACK POWERUP: Spawned at', powerup.x, powerup.y);
    
    return powerup;
  }
  
  // Update all active powerups
  update(deltaTime, bossLoading) {
    // Update animation
    this.animationTimer += deltaTime;
    if (this.animationTimer >= this.animationSpeed) {
      this.animationTimer = 0;
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
    }
    
    // Update pulsing effect
    this.pulseScale += this.pulseSpeed * this.pulseDirection;
    if (this.pulseScale >= this.maxPulseScale) {
      this.pulseScale = this.maxPulseScale;
      this.pulseDirection = -1;
    } else if (this.pulseScale <= this.minPulseScale) {
      this.pulseScale = this.minPulseScale;
      this.pulseDirection = 1;
    }
    
    // Update positions of all powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      
      // Move powerup from right to left
      powerup.x -= this.speed;
      
      // Remove if off screen
      if (powerup.x + powerup.width < 0) {
        this.powerups.splice(i, 1);
      }
    }
    
    // Spawn new powerup if conditions are met
    if (bossLoading && this.powerups.length === 0 && !this.respawnTimer) {
      this.respawnTimer = setTimeout(() => {
        this.spawn();
        this.respawnTimer = null;
      }, 5000); // Respawn after 5 seconds if still in boss loading phase
    }
  }
  
  // Draw all active powerups
  draw(ctx) {
    if (this.animationFrames.length === 0) return;
    
    const currentFrame = this.animationFrames[this.currentFrame];
    
    this.powerups.forEach(powerup => {
      // Save the current context state
      ctx.save();
      
      // Calculate the center point of the powerup
      const centerX = powerup.x + powerup.width / 2;
      const centerY = powerup.y + powerup.height / 2;
      
      // Move to the center, scale, then move back
      ctx.translate(centerX, centerY);
      ctx.scale(this.pulseScale, this.pulseScale);
      
      if (currentFrame.complete) {
        // Draw the frame with the new scale
        ctx.drawImage(
          currentFrame,
          -powerup.width / 2,  // Adjust x position after scaling
          -powerup.height / 2, // Adjust y position after scaling
          powerup.width,
          powerup.height
        );
      } else {
        // Fallback drawing if image not loaded (with pulse effect)
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(
          0, 0,  // Position is now relative to the translated origin
          (powerup.width / 2) * (0.8 + 0.2 * Math.sin(Date.now() * 0.005)), // Subtle pulse
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      
      // Restore the context state
      ctx.restore();
    });
  }
  
  // Check for collision with player
  checkCollision(player) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      
      if (
        player.x < powerup.x + powerup.width &&
        player.x + player.width > powerup.x &&
        player.y < powerup.y + powerup.height &&
        player.y + player.height > powerup.y
      ) {
        // Play collection sound
        if (this.collectSound && !window.isMuted) {
          this.collectSound.currentTime = 0;
          this.collectSound.play().catch(e => debugLog('Audio play error:', e));
        }
        
        // Activate electric ball shooting if controller exists
        if (window.electricBallController) {
          window.electricBallController.activateStarPowerup(player);
          debugLog('ATTACK POWERUP: Activated star powerup - player can now shoot electric balls!');
        }
        
        // Remove the powerup
        this.powerups.splice(i, 1);
        
        // Return true to indicate a collision occurred
        return true;
      }
    }
    
    // No collision
    return false;
  }
  
  // Reset the controller
  reset() {
    this.powerups = [];
    if (this.respawnTimer) {
      clearTimeout(this.respawnTimer);
      this.respawnTimer = null;
    }
  }
}

// Add to global scope for access from game.js
window.AttackPowerupController = AttackPowerupController;
