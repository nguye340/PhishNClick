class Player {
  constructor(ctx, width, height, minJumpHeight, maxJumpHeight, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.width = width;
    this.height = height;
    this.minJumpHeight = minJumpHeight;
    this.maxJumpHeight = maxJumpHeight;
    this.scaleRatio = scaleRatio;

    // Player position
    this.x = 40 * scaleRatio; // Moved further right from 10 to 40
    this.y = this.canvas.height - this.height - 1.5 * scaleRatio;
    this.groundY = this.y;

    // Jump properties
    this.jumpPressed = false;
    this.jumpInProgress = false;
    this.falling = false;
    this.baseJumpSpeed = 3.0; // Base jump speed at full energy
    this.baseFallSpeed = 2.0; // Base fall speed at full energy
    this.jumpSpeed = this.baseJumpSpeed; // Current jump speed (will be adjusted by energy)
    this.fallSpeed = this.baseFallSpeed; // Current fall speed (will be adjusted by energy)
    this.jumpStartTime = 0; // Track when jump started
    this.jumpHoldDuration = 0; // Track how long jump was held
    this.maxJumpHoldTime = 300; // Max time in ms to hold for highest jump
    
    // Energy-based speed properties
    this.energyLevel = 100; // Default to full energy
    this.minSpeedFactor = 0.4; // At 0 energy, speed is 40% of normal

    // Player states
    this.STANDING = 0;
    this.RUNNING = 1;
    this.JUMPING = 2;
    this.FALLING = 3;

    this.state = this.RUNNING;
    this.frameX = 0;
    this.maxFrame = 8;
    this.fps = 20;
    this.frameTimer = 0;
    this.frameInterval = 1000/this.fps;
    
    // Invincibility properties for damage feedback
    this.isInvincible = false;
    this.isVisible = true;
    
    // Shield properties
    this.shieldFrames = [];
    this.shieldFrameIndex = 0;
    this.shieldFrameTimer = 0;
    this.shieldFrameInterval = 50; // Faster animation (was 100ms)
    this.shieldHits = 0; // Number of hits the shield can absorb
    
    // Load shield frames immediately
    this.loadShieldFrames();
    debugLog('Shield frames loaded:', this.shieldFrames.length);

    // Load sprites for animation
    this.images = [];
    this.currentImage = 0;
    this.animationTimer = 0;
    this.animationInterval = 200; // Switch images every 200ms
    
    // Load both cat images
    const cat1 = new Image();
    cat1.src = "/games/phish404/img/cat.png";
    this.images.push(cat1);
    
    const cat2 = new Image();
    cat2.src = "/games/phish404/img/cat2.png";
    this.images.push(cat2);

    // Sound effects
    this.jumpSound = new Audio("/games/phish404/audio/jump.mp3");

    // Set up event listeners
    window.addEventListener("keydown", this.keydown.bind(this));
    window.addEventListener("keyup", this.keyup.bind(this));
    window.addEventListener("touchstart", this.touchstart.bind(this));
    window.addEventListener("touchend", this.touchend.bind(this));
  }

  keydown(event) {
    // Ignore keyboard input if any popup is visible
    if (typeof popupVisible !== 'undefined' && popupVisible) {
      return;
    }
    
    if (event.code === "Space") {
      this.jumpPressed = true;
      if (!this.jumpInProgress) {
        // Start tracking jump hold time
        this.jumpStartTime = Date.now();
      }
    }
  }

  keyup(event) {
    // Ignore keyboard input if any popup is visible
    if (typeof popupVisible !== 'undefined' && popupVisible) {
      return;
    }
    
    if (event.code === "Space") {
      this.jumpPressed = false;
      if (this.jumpInProgress && !this.falling) {
        // Force start falling when key is released
        this.falling = true;
      }
    }
  }

  touchstart() {
    // Ignore touch input if any popup is visible
    if (typeof popupVisible !== 'undefined' && popupVisible) {
      return;
    }
    this.jumpPressed = true;
  }

  touchend() {
    // Ignore touch input if any popup is visible
    if (typeof popupVisible !== 'undefined' && popupVisible) {
      return;
    }
    this.jumpPressed = false;
  }

  update(gameSpeed, frameTimeDelta, energyLevel) {
    // Update speed based on current energy level
    this.updateSpeedBasedOnEnergy(energyLevel);
    
    this.handleJump();
    this.handlePlayerFrame(frameTimeDelta);
    
    // Update shield animation
    this.updateShieldAnimation(frameTimeDelta);
  }
  
  updateSpeedBasedOnEnergy(energyLevel) {
    // Store the current energy level
    this.energyLevel = energyLevel;
    
    // Calculate speed factor based on energy (linear scale from minSpeedFactor to 1.0)
    const speedFactor = this.minSpeedFactor + ((1.0 - this.minSpeedFactor) * (energyLevel / 100));
    
    // Update jump and fall speeds based on energy level
    this.jumpSpeed = this.baseJumpSpeed * speedFactor;
    this.fallSpeed = this.baseFallSpeed * speedFactor;
    
    // Also adjust animation speed based on energy
    this.animationInterval = 200 / speedFactor; // Slower animation when low energy
  }

  handleJump() {
    // Start jump if jump pressed and not already jumping
    if (this.jumpPressed && !this.jumpInProgress) {
      this.jumpInProgress = true;
      if (this.jumpSound && !window.isMuted) {
        this.jumpSound.play().catch(error => debugLog("Error playing jump sound:", error));
      }
      this.state = this.JUMPING;
      this.frameX = 0;
    }

    if (this.jumpInProgress && !this.falling) {
      // Calculate current jump height based on how long space is held
      const currentTime = Date.now();
      this.jumpHoldDuration = Math.min(currentTime - this.jumpStartTime, this.maxJumpHoldTime);
      const jumpHeightFactor = this.jumpHoldDuration / this.maxJumpHoldTime;
      
      // Calculate current target height (between min and max)
      const currentTargetHeight = this.minJumpHeight + 
        (this.maxJumpHeight - this.minJumpHeight) * jumpHeightFactor;
      
      // Jump up
      this.y -= this.jumpSpeed * this.scaleRatio;

      // Check if reached current target jump height or max height
      if (this.y <= this.groundY - currentTargetHeight || 
          this.y <= this.groundY - this.maxJumpHeight || 
          !this.jumpPressed) {
        this.falling = true;
      }
    } else if (this.jumpInProgress && this.falling) {
      // Fall down
      this.y += this.fallSpeed * this.scaleRatio;
      this.state = this.FALLING;

      // Check if landed
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.jumpInProgress = false;
        this.falling = false;
        this.state = this.RUNNING;
        this.jumpHoldDuration = 0;
      }
    }
  }

  handlePlayerFrame(frameTimeDelta) {
    // Handle sprite frame animation
    if (this.frameTimer > this.frameInterval) {
      this.frameTimer = 0;
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
    } else {
      this.frameTimer += frameTimeDelta;
    }
    
    // Handle cat image animation
    this.animationTimer += frameTimeDelta;
    if (this.animationTimer > this.animationInterval) {
      this.animationTimer = 0;
      this.currentImage = (this.currentImage + 1) % this.images.length;
    }
  }
  
  // Add endJump method to handle space key release
  endJump() {
    if (this.jumpInProgress && !this.falling) {
      // Force start falling when key is released
      this.falling = true;
    }
  }
  
  // Load shield animation frames
  loadShieldFrames() {
    debugLog('Loading shield frames...');
    this.shieldFrames = []; // Clear existing frames
    
    for (let i = 1; i <= 22; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/shield/shield${i}.png`;
      debugLog(`Loading shield frame ${i}:`, img.src);
      
      // Add onload handler to verify image loading
      img.onload = () => {
        debugLog(`Shield frame ${i} loaded successfully`);
      };
      
      img.onerror = () => {
        debugError(`Failed to load shield frame ${i}:`, img.src);
      };
      
      this.shieldFrames.push(img);
    }
    
    debugLog(`Initialized ${this.shieldFrames.length} shield frames`);
  }
  
  // Activate shield with specified number of hits
  activateShield(hits) {
    this.shieldHits = hits;
    debugLog(`Shield activated with ${hits} hits remaining`);
    
    // Reset animation frame to start
    this.shieldFrameIndex = 0;
    this.shieldFrameTimer = 0;
    
    // Update shield counter UI
    this.updateShieldCounterUI();
    
    // Play shield sound if available
    if (window.shieldSound) {
      window.shieldSound.currentTime = 0;
      window.shieldSound.play().catch(e => debugLog("Error playing shield sound:", e));
    }
  }
  
  // Update the shield counter UI
  updateShieldCounterUI() {
    const shieldContainer = document.getElementById('shieldCounterContainer');
    const shieldCounter = document.getElementById('shieldCounter');
    
    if (shieldContainer && shieldCounter) {
      if (this.shieldHits > 0) {
        // Show shield counter and update the count
        shieldContainer.style.display = 'flex';
        shieldCounter.textContent = `x${this.shieldHits}`;
      } else {
        // Hide shield counter when no shield
        shieldContainer.style.display = 'none';
      }
    }
  }
  
  // Called when player takes damage
  takeDamage(amount) {
    // If player has a shield, use it instead of taking damage
    if (this.shieldHits > 0) {
      this.shieldHits--;
      debugLog(`Shield hit! ${this.shieldHits} hits remaining`);
      
      // Update shield counter UI
      this.updateShieldCounterUI();
      
      // Play shield guard sound when shield blocks damage
      if (window.shieldGuardSound) {
        window.shieldGuardSound.currentTime = 0;
        window.shieldGuardSound.play().catch(e => debugLog("Error playing shield guard sound:", e));
      }
      
      // Play shield break sound on last hit
      if (this.shieldHits === 0 && window.shieldBreakSound) {
        window.shieldBreakSound.currentTime = 0;
        window.shieldBreakSound.play().catch(e => debugLog("Error playing shield break sound:", e));
      }
      
      // Make player briefly invincible to prevent multiple hits
      this.makeInvincible(500);
      return false; // No damage taken
    }
    
    // Take damage if no shield
    debugLog('takeDamage called with amount:', amount);
    debugLog('Current invincibility state:', this.isInvincible);
    
    // Don't take damage if currently invincible
    if (this.isInvincible) {
      debugLog('Player is invincible, no damage taken');
      return false;
    }
    
    debugLog(`Player took ${amount} damage!`);
    
    // Call the global game.loseLife function which will handle invincibility
    debugLog('Attempting to call loseLife...');
    
    if (window.game && typeof window.game.loseLife === 'function') {
      debugLog('Calling game.loseLife()');
      try {
        window.game.loseLife();
        debugLog('Successfully called game.loseLife()');
      } catch (e) {
        debugError('Error calling game.loseLife():', e);
      }
    } else if (typeof loseLife === 'function') {
      debugLog('Falling back to global loseLife()');
      try {
        loseLife();
        debugLog('Successfully called global loseLife()');
      } catch (e) {
        debugError('Error calling global loseLife():', e);
      }
    } else {
      debugError('No loseLife function available!');
    }
    
    return true;
  }
  
  updateShieldAnimation(deltaTime) {
    if (this.shieldHits > 0) {
      // Make shield animation faster
      this.shieldFrameTimer += deltaTime * 1.5;
      if (this.shieldFrameTimer > this.shieldFrameInterval) {
        this.shieldFrameTimer = 0;
        this.shieldFrameIndex = (this.shieldFrameIndex + 1) % this.shieldFrames.length;
        debugLog('Shield animation frame:', this.shieldFrameIndex);
      }
    }
  }
  
  draw() {
    if (!this.isVisible) return;
    
    const currentImage = this.images[this.currentImage];
    
    // Draw the player
    this.ctx.drawImage(
      currentImage,
      this.x,
      this.y,
      this.width,
      this.height
    );
    
    // Draw shield if active
    this.drawShield();
  }
  
  drawShield() {
    if (this.shieldHits > 0 && this.shieldFrames[this.shieldFrameIndex]) {
      // Make shield much bigger - 2.5x instead of 1.5x
      const shieldSize = Math.max(this.width, this.height) * 2.5;
      const offsetX = (this.width - shieldSize) / 2;
      const offsetY = (this.height - shieldSize) / 2;
      
      this.ctx.save();
      
      // Add a glowing effect
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = 'rgba(0, 150, 255, 0.7)';
      
      // Make it more visible
      this.ctx.globalAlpha = 0.9;
      
      this.ctx.drawImage(
        this.shieldFrames[this.shieldFrameIndex],
        this.x + offsetX,
        this.y + offsetY,
        shieldSize,
        shieldSize
      );
      this.ctx.restore();
    }
  }
  
  flash(duration) {
    const flashInterval = 100; // Flash every 100ms
    const flashes = duration / (flashInterval * 2);
    let flashCount = 0;
    
    const flash = () => {
      if (flashCount >= flashes * 2) {
        // Ensure player is visible at the end
        this.isVisible = true;
        return;
      }
      
      // Toggle visibility
      this.isVisible = !this.isVisible;
      flashCount++;
      
      // Schedule next flash
      setTimeout(flash, flashInterval);
    };
    
    // Start flashing
    flash();
  }
  
  // Reset player to initial state
  reset() {
    // Reset position
    this.y = this.groundY;
    
    // Reset jump state
    this.jumpPressed = false;
    this.jumpInProgress = false;
    this.falling = false;
    this.jumpStartTime = 0;
    this.jumpHoldDuration = 0;
  }
  
  // Make player invincible for a specified duration
  makeInvincible(duration = 2000) {
    // Set invincibility
    this.isInvincible = true;
    debugLog(`Player is now invincible for ${duration}ms`);
    
    // Flash effect to show invincibility
    this.flash(duration);
    
    // Set timeout to remove invincibility
    setTimeout(() => {
      this.isInvincible = false;
      debugLog('Player invincibility ended');
    }, duration);
    
    // Reset animation state
    this.state = this.RUNNING;
    this.frameX = 0;
    this.frameTimer = 0;
    this.animationTimer = 0;
    this.currentImage = 0;
    
    // Reset visibility
    this.isInvincible = false;
    this.isVisible = true;
    
    debugLog('Player reset complete');
  }
}
