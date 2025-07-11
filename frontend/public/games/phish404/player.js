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
      this.jumpSound.play().catch(error => console.log("Error playing jump sound:", error));
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

  draw() {
    // Skip drawing if not visible (for invincibility flashing effect)
    if (!this.isVisible) return;
    
    // Use the current cat image from the animation sequence
    const currentCatImage = this.images[this.currentImage];
    
    this.ctx.drawImage(
      currentCatImage,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
  
  takeDamage(amount) {
    console.log('takeDamage called with amount:', amount);
    console.log('Current invincibility state:', this.isInvincible);
    
    // Don't take damage if currently invincible
    if (this.isInvincible) {
      console.log('Player is invincible, no damage taken');
      return false;
    }
    
    console.log(`Player took ${amount} damage!`);
    
    // Call the global game.loseLife function which will handle invincibility
    console.log('Attempting to call loseLife...');
    
    if (window.game && typeof window.game.loseLife === 'function') {
      console.log('Calling game.loseLife()');
      try {
        window.game.loseLife();
        console.log('Successfully called game.loseLife()');
      } catch (e) {
        console.error('Error calling game.loseLife():', e);
      }
    } else if (typeof loseLife === 'function') {
      console.log('Falling back to global loseLife()');
      try {
        loseLife();
        console.log('Successfully called global loseLife()');
      } catch (e) {
        console.error('Error calling global loseLife():', e);
      }
    } else {
      console.error('No loseLife function available!');
    }
    
    return true;
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
    
    // Reset animation state
    this.state = this.RUNNING;
    this.frameX = 0;
    this.frameTimer = 0;
    this.animationTimer = 0;
    this.currentImage = 0;
    
    // Reset visibility
    this.isInvincible = false;
    this.isVisible = true;
    
    console.log('Player reset complete');
  }
}
