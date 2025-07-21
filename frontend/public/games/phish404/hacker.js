class Hacker {
  constructor(ctx, x, y, width, height) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    // Lives system for the hacker
    this.maxLives = 3;
    this.lives = this.maxLives;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 1000; // 1 second of invincibility after being hit
    
    // Fixed position on right side (slightly inset from edge)
    this.fixedX = x - width * 1.2;
    
    // Movement properties for floating effect
    this.floatAmplitude = 10; // How far up/down to float
    this.floatSpeed = 0.002; // Speed of floating
    this.floatOffset = Math.random() * Math.PI * 2; // Random starting position
    
    // Animation properties
    this.frameIndex = 0;
    this.tickCount = 0;
    this.ticksPerFrame = 5;
    this.numberOfFrames = 7;
    
    // Shooting properties
    this.shootTimer = 0;
    this.shootInterval = 2800; // Shoot every 2.8 seconds (increased from 2 seconds for easier gameplay)
    this.active = false; // Whether the hacker is currently active/visible
    
    // Virus loading phase properties
    this.isLoading = false; // Whether the hacker is currently loading viruses
    this.loadingTimer = 0; // Timer for the loading phase
    this.loadingDuration = 20000; // Loading takes 20 seconds (extended break for player)
    this.attackSequenceCount = 0; // Count attacks before loading phase
    this.attacksBeforeLoading = 3; // Number of attacks before entering loading phase (increased to 3)
    
    // Defeat and explosion properties
    this.isDefeated = false;
    this.isExploding = false;
    this.explosionFrameIndex = 0;
    this.explosionTickCount = 0;
    this.explosionTicksPerFrame = 3; // Slower explosion animation
    this.explosionFrames = 16; // 16 frames for boss-explode animation
    this.explosionComplete = false;
    
    // Load hacker images
    this.images = [];
    for (let i = 1; i <= this.numberOfFrames; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/hacker/hacker${i}.png`;
      this.images.push(img);
    }
    
    // Load explosion images
    this.explosionImages = [];
    for (let i = 1; i <= this.explosionFrames; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/boss-explode/boss-explode${i}.png`;
      this.explosionImages.push(img);
    }
    
    // Load defeat sounds
    this.bossDefeatSound = new Audio('/games/phish404/audio/boss-defeat.wav');
    this.victorySound = new Audio('/games/phish404/audio/Victory.mp3');
    this.yummySound = new Audio('/games/phish404/audio/yummy.mp3');
    
    this.type = 'hacker';
  }
  
  update(frameTimeDelta, gameSpeed) {
    // Don't update if not active
    if (!this.active) return;
    
    // Handle explosion animation if defeated
    if (this.isExploding) {
      this.explosionTickCount++;
      if (this.explosionTickCount > this.explosionTicksPerFrame) {
        this.explosionTickCount = 0;
        this.explosionFrameIndex++;
        
        if (this.explosionFrameIndex >= this.explosionFrames) {
          // Explosion animation complete
          this.explosionComplete = true;
          console.log('HACKER: Explosion animation complete');
          return; // Don't update anything else
        }
      }
      return; // Don't update normal animation during explosion
    }
    
    // Don't update normal behavior if defeated
    if (this.isDefeated) return;
    
    // Get canvas height for boundaries
    const canvasHeight = this.ctx.canvas.height;
    
    // Define safe boundaries (25% to 80% of canvas height)
    const minY = canvasHeight * 0.25; // Lower minimum position (was 0.1)
    const maxY = canvasHeight * 0.8; // Increase maximum position (was 0.7)
    
    // Calculate new position with floating effect
    let newY = this.y + Math.sin((this.floatOffset + performance.now()) * this.floatSpeed) * this.floatAmplitude * 0.05;
    
    // Apply boundaries to keep hacker within canvas
    newY = Math.max(minY, Math.min(newY, maxY));
    
    // Update position
    this.y = newY;
    
    // Update animation
    this.tickCount++;
    if (this.tickCount > this.ticksPerFrame) {
      this.tickCount = 0;
      this.frameIndex = (this.frameIndex + 1) % this.numberOfFrames;
    }
    
    // Handle invincibility
    if (this.invincible) {
      this.invincibleTimer += frameTimeDelta;
      if (this.invincibleTimer >= this.invincibleDuration) {
        this.invincible = false;
        this.invincibleTimer = 0;
        console.log('Hacker is no longer invincible');
      }
    }
    
    // Handle loading phase
    if (this.isLoading) {
      // Update loading timer
      this.loadingTimer += frameTimeDelta;
      
      // Debug logging every 500ms
      if (Math.floor(this.loadingTimer / 500) > Math.floor((this.loadingTimer - frameTimeDelta) / 500)) {
        console.log(`HACKER LOADING: ${this.loadingTimer.toFixed(0)}ms / ${this.loadingDuration}ms`);
      }
      
      // Check if loading is complete
      if (this.loadingTimer >= this.loadingDuration) {
        console.log('HACKER: Loading phase complete! Exiting loading mode...');
        this.isLoading = false;
        this.loadingTimer = 0;
        this.shootTimer = this.shootInterval; // Ready to shoot immediately after loading
        console.log('HACKER: Successfully exited loading mode, ready to attack!');
      }
    } else {
      // Only update shoot timer when not loading
      this.shootTimer += frameTimeDelta;
    }
  }
  
  draw() {
    // Don't draw if not active
    if (!this.active) return;
    
    // Draw explosion animation if exploding
    if (this.isExploding && !this.explosionComplete) {
      const explosionImage = this.explosionImages[this.explosionFrameIndex];
      if (explosionImage && explosionImage.complete) {
        // Draw explosion centered on hacker position
        const explosionSize = Math.max(this.width, this.height) * 1.5; // Make explosion bigger than hacker
        const explosionX = this.fixedX + (this.width - explosionSize) / 2;
        const explosionY = this.y + (this.height - explosionSize) / 2;
        
        this.ctx.drawImage(explosionImage, explosionX, explosionY, explosionSize, explosionSize);
      }
      return; // Don't draw normal hacker during explosion
    }
    
    // Don't draw if explosion is complete
    if (this.explosionComplete) return;
    
    if (this.images[this.frameIndex] && this.images[this.frameIndex].complete) {
      // Save context for transformations
      this.ctx.save();
      
      // Apply visual effect when invincible (flashing)
      if (this.invincible) {
        // Flash effect - only draw on even frames
        if (Math.floor(Date.now() / 100) % 2 === 0) {
          // Apply a red tint
          this.ctx.globalAlpha = 0.8;
          this.ctx.globalCompositeOperation = 'source-over';
        } else {
          // Semi-transparent on odd frames
          this.ctx.globalAlpha = 0.5;
        }
      }
      
      // Draw the hacker
      this.ctx.drawImage(
        this.images[this.frameIndex],
        this.fixedX,
        this.y,
        this.width,
        this.height
      );
      
      // Draw lives indicator above the hacker
      this.drawLivesIndicator();
      
      // Restore context
      this.ctx.restore();
      
      // Draw loading indicator if in loading phase
      if (this.isLoading) {
        const loadingProgress = this.loadingTimer / this.loadingDuration;
        
        // Position the loading bar above the hacker
        const barWidth = this.width * 0.8;
        const barHeight = this.height * 0.05;
        const barX = this.fixedX + (this.width - barWidth) / 2;
        const barY = this.y - barHeight * 2;
        
        // Draw text
        this.ctx.font = `${barHeight * 1.5}px 'Press Start 2P', monospace`;
        this.ctx.fillStyle = 'red';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LOADING VIRUSES...', barX + barWidth / 2, barY - barHeight);
        
        // Draw flashing "Your Turn!" text in the middle of the screen
        const flashSpeed = 300; // milliseconds per flash cycle
        const isFlashing = Math.floor(Date.now() / flashSpeed) % 2 === 0;
        
        if (isFlashing) {
          // Use a large, prominent font
          this.ctx.font = `${barHeight * 4}px 'Press Start 2P', monospace`;
          this.ctx.fillStyle = '#ffff00'; // Bright yellow
          
          // Position in the middle of the screen
          const canvasWidth = this.ctx.canvas.width;
          const canvasHeight = this.ctx.canvas.height;
          
          // Draw "Your Turn!" text
          this.ctx.fillText('YOUR TURN!', canvasWidth / 2, canvasHeight / 2);
          
          // Draw smaller instruction text below
          this.ctx.font = `${barHeight * 2}px 'Press Start 2P', monospace`;
          this.ctx.fillStyle = '#ffffff'; // White
          this.ctx.fillText('Collect STARS to attack', canvasWidth / 2, canvasHeight / 2 + barHeight * 6);
        }
        
        // Draw outline
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Draw progress
        const gradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        gradient.addColorStop(0, '#00ff00');
        gradient.addColorStop(0.5, '#ffff00');
        gradient.addColorStop(1, '#ff0000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, barWidth * loadingProgress, barHeight);
      }
    }
  }
  
  canShoot() {
    // Can't shoot while loading
    if (this.isLoading) return false;
    
    // Check if it's time to shoot
    return this.active && this.shootTimer >= this.shootInterval;
  }
  
  resetShootTimer() {
    this.shootTimer = 0;
    
    // Increment attack count
    this.attackSequenceCount++;
    
    // Check if it's time to load viruses
    if (this.attackSequenceCount >= this.attacksBeforeLoading) {
      this.startLoading();
      this.attackSequenceCount = 0;
    }
  }
  
  startLoading() {
    console.log('HACKER: Starting loading phase...');
    this.isLoading = true;
    this.loadingTimer = 0;
    console.log(`HACKER: Loading duration set to ${this.loadingDuration}ms`);
    console.log('HACKER: Notifying hacker controller of loading state...');
    // Update global loading state
    if (window.hackerController) {
      window.hackerController.setLoadingState(true);
      console.log('HACKER: Successfully notified hacker controller');
    } else {
      console.warn('HACKER: window.hackerController not found!');
    }
  }
  
  activate() {
    this.active = true;
    console.log('Hacker activated');
    // Set global loading state if needed
    if (window.hackerController) {
      window.hackerController.setLoadingState(this.isLoading);
    }
  }
  
  resetLives(bonusLives = 0) {
    // Reset lives with potential bonus for increased difficulty
    this.maxLives = 3 + bonusLives;
    this.lives = this.maxLives;
    console.log(`HACKER: Lives reset to ${this.lives} (${bonusLives} bonus lives)`);
  }
  
  deactivate() {
    this.active = false;
    console.log('Hacker deactivated');
    // Clear global loading state
    if (window.hackerController) {
      window.hackerController.setLoadingState(false);
    }
  }
  
  // Method to handle the hacker taking damage
  takeDamage() {
    // If invincible, don't take damage
    if (this.invincible) {
      console.log('Hacker is invincible, no damage taken');
      return false;
    }
    
    // Reduce lives
    this.lives--;
    console.log(`Hacker took damage! Remaining lives: ${this.lives}`);
    
    // Make hacker invincible briefly
    this.invincible = true;
    this.invincibleTimer = 0;
    
    // Check if hacker is defeated
    if (this.lives <= 0) {
      console.log('Hacker defeated!');
      // If in loading phase, end it immediately
      if (this.isLoading) {
        this.isLoading = false;
        this.loadingTimer = 0;
        // Update global loading state
        if (window.hackerController) {
          window.hackerController.setLoadingState(false);
        }
      }
      // Deactivate the hacker
      this.active = false;
      return true; // Hacker is defeated
    }
    
    return false; // Hacker is still active
  }
  
  // Reset hacker lives when spawning a new one
  resetLives() {
    this.lives = this.maxLives;
    this.invincible = false;
    this.invincibleTimer = 0;
  }
  
  // Draw the lives indicator below the hacker
  drawLivesIndicator() {
    // Load heart image if not already loaded
    if (!this.heartImage) {
      this.heartImage = new Image();
      this.heartImage.src = '/games/phish404/img/heart.gif';
      this.heartImage.onload = () => {
        // Redraw when the image is loaded
        this.needsRedraw = true;
      };
      return; // Skip drawing this frame
    }
    
    // Position the lives indicator below the hacker
    const heartSize = this.width * 0.4; // Increased heart size (25% of hacker width)
    const spacing = heartSize * 0.1; // Slightly more spacing between larger hearts
    const totalWidth = (heartSize * this.maxLives) + (spacing * (this.maxLives - 1));
    const startX = this.fixedX + (this.width - totalWidth) / 2;
    const y = this.y + this.height + (heartSize * 0.5); // Position below the hacker
    
    // Draw each heart representing a life
    for (let i = 0; i < this.maxLives; i++) {
      const x = startX + (i * (heartSize + spacing));
      
      // Only draw hearts for remaining lives
      if (i < this.lives) {
        if (this.heartImage.complete) {
          this.ctx.drawImage(this.heartImage, x, y, heartSize, heartSize);
        } else {
          // Fallback to drawing a red circle if image isn't loaded yet
          this.ctx.fillStyle = '#ff0000';
          this.ctx.beginPath();
          this.ctx.arc(x + heartSize/2, y + heartSize/2, heartSize/2, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }
  
  // Take damage from electric ball hits
  takeDamage(damage) {
    if (this.invincible || !this.active) {
      console.log('HACKER: Damage blocked - invincible or inactive');
      return false;
    }
    
    // Allow damage during loading phase (player's turn to attack)
    if (this.isLoading) {
      console.log('HACKER: Taking damage during loading phase (player\'s turn)');
    }
    
    this.lives -= damage;
    console.log(`HACKER: Took ${damage} damage! Lives remaining: ${this.lives}`);
    
    // Make hacker invincible for a short time after being hit
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
    
    // Check if hacker is defeated
    if (this.lives <= 0) {
      this.lives = 0;
      console.log('HACKER: Defeated by electric ball! Starting defeat sequence...');
      
      // Start defeat sequence
      this.startDefeatSequence();
      
      return true; // Return true to indicate hacker was defeated
    }
    
    return false; // Return false to indicate hacker is still alive
  }
  
  startDefeatSequence() {
    console.log('HACKER: Starting defeat sequence with explosion and sounds...');
    
    // Set defeat flags
    this.isDefeated = true;
    this.isExploding = true;
    this.explosionFrameIndex = 0;
    this.explosionTickCount = 0;
    this.explosionComplete = false;
    
    // Play defeat sounds
    this.playDefeatSounds();
    
    // Notify hacker controller of defeat
    if (window.hackerController) {
      window.hackerController.onHackerDefeated();
    }
  }
  
  playDefeatSounds() {
    console.log('HACKER: Playing defeat sounds...');
    
    // Set volume based on game settings
    const volume = window.gameVolume || 0.5;
    const isMuted = window.isMuted || false;
    
    if (!isMuted) {
      // Play boss defeat sound immediately
      this.bossDefeatSound.volume = volume;
      this.bossDefeatSound.currentTime = 0;
      this.bossDefeatSound.play().catch(e => console.log('Error playing boss defeat sound:', e));
      
      // Play victory sound after a short delay
      setTimeout(() => {
        this.victorySound.volume = volume;
        this.victorySound.currentTime = 0;
        this.victorySound.play().catch(e => console.log('Error playing victory sound:', e));
      }, 500);
      
      // Play yummy sound after victory sound
      setTimeout(() => {
        this.yummySound.volume = volume;
        this.yummySound.currentTime = 0;
        this.yummySound.play().catch(e => console.log('Error playing yummy sound:', e));
      }, 1500);
    }
  }
}
