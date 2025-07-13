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
    
    // Load hacker images
    this.images = [];
    for (let i = 1; i <= this.numberOfFrames; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/hacker/hacker${i}.png`;
      this.images.push(img);
    }
    
    this.type = 'hacker';
  }
  
  update(frameTimeDelta, gameSpeed) {
    // Don't update if not active
    if (!this.active) return;
    
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
      
      // Check if loading is complete
      if (this.loadingTimer >= this.loadingDuration) {
        this.isLoading = false;
        this.loadingTimer = 0;
        this.shootTimer = this.shootInterval; // Ready to shoot immediately after loading
        console.log('Hacker finished loading viruses!');
      }
    } else {
      // Only update shoot timer when not loading
      this.shootTimer += frameTimeDelta;
    }
  }
  
  draw() {
    // Don't draw if not active
    if (!this.active) return;
    
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
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LOADING VIRUSES...', barX + barWidth / 2, barY - barHeight);
        
        // Draw flashing "ATTACK NOW!" text in the middle of the screen
        const flashSpeed = 300; // milliseconds per flash cycle
        const isFlashing = Math.floor(Date.now() / flashSpeed) % 2 === 0;
        
        if (isFlashing) {
          // Use a large, prominent font
          this.ctx.font = `${barHeight * 4}px 'Press Start 2P', monospace`;
          this.ctx.fillStyle = '#ffff00'; // Bright yellow
          
          // Position in the middle of the screen
          const canvasWidth = this.ctx.canvas.width;
          const canvasHeight = this.ctx.canvas.height;
          
          // Draw "ATTACK NOW!" text
          this.ctx.fillText('ATTACK NOW!', canvasWidth / 2, canvasHeight / 2);
          
          // Draw smaller instruction text below
          this.ctx.font = `${barHeight * 2}px 'Press Start 2P', monospace`;
          this.ctx.fillStyle = '#ffffff'; // White
          this.ctx.fillText('JUMP INTO THE HACKER!', canvasWidth / 2, canvasHeight / 2 + barHeight * 6);
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
    this.isLoading = true;
    this.loadingTimer = 0;
    console.log('Hacker is loading viruses...');
  }
  
  activate() {
    this.active = true;
  }
  
  deactivate() {
    this.active = false;
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
  
  // Draw the lives indicator above the hacker
  drawLivesIndicator() {
    // Position the lives indicator above the hacker
    const heartSize = this.width * 0.2;
    const startX = this.fixedX + (this.width - (heartSize * this.maxLives)) / 2;
    const y = this.y - heartSize * 1.5;
    
    // Draw each heart representing a life
    for (let i = 0; i < this.maxLives; i++) {
      // Determine if this heart should be filled or empty
      const isFilled = i < this.lives;
      
      // Draw the heart
      this.ctx.fillStyle = isFilled ? '#ff0000' : '#666666';
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      
      // Position for this heart
      const x = startX + (i * heartSize);
      
      // Draw heart shape
      this.ctx.beginPath();
      const topLeftX = x + heartSize * 0.1;
      const topLeftY = y + heartSize * 0.3;
      const topRightX = x + heartSize * 0.9;
      const topRightY = y + heartSize * 0.3;
      const bottomX = x + heartSize * 0.5;
      const bottomY = y + heartSize * 0.9;
      
      // Draw a simple heart shape
      this.ctx.moveTo(bottomX, bottomY);
      this.ctx.quadraticCurveTo(x, y + heartSize * 0.5, topLeftX, topLeftY);
      this.ctx.quadraticCurveTo(x + heartSize * 0.5, y, topRightX, topLeftY);
      this.ctx.quadraticCurveTo(x + heartSize, y + heartSize * 0.5, bottomX, bottomY);
      
      // Fill and stroke the heart
      this.ctx.fill();
      this.ctx.stroke();
    }
  }
}
