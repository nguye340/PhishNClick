class ShieldPowerupController {
  constructor(gameWidth, gameHeight, scaleRatio) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.scaleRatio = scaleRatio;
    
    // Array to hold active shield powerups
    this.shields = [];
    
    // Shield properties - even smaller size
    this.width = 60 * scaleRatio;
    this.height = 60 * scaleRatio;
    
    // Load shield image
    this.image = new Image();
    this.image.src = '/games/phish404/img/shield-icon.png';
    debugLog('SHIELD CONTROLLER: Loading shield image from', this.image.src);
    
    // Pulsing effect properties - much slower and subtle
    this.pulseScale = 1.0;
    this.pulseSpeed = 0.001; // Significantly reduced speed for very slow pulsing
    this.pulseMin = 0.95;  // Less shrinking
    this.pulseMax = 1.05;  // Less expanding
    
    // Sound effects for shield
    this.collectSound = new Audio('/games/phish404/audio/coin-hit.mp3');
    this.spawnSound = new Audio('/games/phish404/audio/bubble-up.mp3');
    
    // Flag to only spawn during hacker loading phase
    this.onlyDuringHackerLoading = true;
    
    // Debug mode for testing
    this.debugMode = false;
    
    // Respawn timer
    this.respawnTimer = null;
    
    // Track if first shield has been collected and tutorial shown
    this.firstShieldCollected = false;
    
    // Notification properties
    this.notification = {
      active: false,
      text: ['SUPER SHIELD POWER-UP!', 'VIRUS PROTECTION ACTIVATED!', '3X DAMAGE ABSORPTION', 'NOT STOP PHISHING ATTACKS', '', 'Press SPACE to CONTINUE'],
      y: this.gameHeight * 0.5, // Position at exact middle of screen
      opacity: 1,
      waitingForKeypress: false
    };
    
    // Bind event listener for space key
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }
  
  reset() {
    this.shields = [];
    
    // Clear any existing respawn timer
    if (this.respawnTimer) {
      clearTimeout(this.respawnTimer);
      this.respawnTimer = null;
    }
  }
  
  // Create a moving shield that travels across the screen
  spawnShield() {
    debugLog('SHIELD CONTROLLER: Creating moving shield');
    
    // Play spawn sound
    if (this.spawnSound) {
      this.spawnSound.currentTime = 0;
      this.spawnSound.play().catch(e => debugLog('Error playing shield spawn sound:', e));
    }
    
    // Start position at right side of screen
    const x = this.gameWidth;
    
    // Random y position in the middle 60% of screen height
    const y = Math.random() * (this.gameHeight * 0.6) + (this.gameHeight * 0.2);
    
    const shield = {
      x: x,
      y: y,
      width: this.width,
      height: this.height,
      collected: false,
      speed: 2 * this.scaleRatio, // Shield movement speed
      visible: true
    };
    
    this.shields.push(shield);
    debugLog('SHIELD CONTROLLER: Moving shield created at', shield.x, shield.y);
    return shield;
  }
  
  update(deltaTime, gameSpeed, hackerLoading) {
    // Don't update if notification is active and waiting for keypress
    if (this.notification.active && this.notification.waitingForKeypress) {
      return;
    }
    
    // Only spawn shields during hacker loading or in debug mode
    if ((hackerLoading || this.debugMode) && this.shields.length === 0 && !this.respawnTimer) {
      debugLog('SHIELD CONTROLLER: Hacker loading detected or debug mode, spawning shield');
      this.respawnTimer = setTimeout(() => {
        this.spawnShield();
        this.respawnTimer = null;
      }, 2000); // Wait 2 seconds before spawning
    }
    
    // Move shields from right to left
    for (let i = this.shields.length - 1; i >= 0; i--) {
      const shield = this.shields[i];
      
      // Move shield left
      shield.x -= shield.speed;
      
      // Remove shield if it goes off screen
      if (shield.x + shield.width < 0) {
        this.shields.splice(i, 1);
        debugLog('SHIELD CONTROLLER: Shield moved off screen, removing');
        
        // Spawn a new shield if we're still in hacker loading or debug mode
        if (hackerLoading || this.debugMode) {
          this.respawnTimer = setTimeout(() => {
            this.spawnShield();
            this.respawnTimer = null;
          }, 2000);
        }
      }
    }
    
    // Log current shield status
    if (hackerLoading || this.debugMode) {
      debugLog(`Shield update: ${this.shields.length} shields active`);
    }
  }
  
  checkCollision(player) {
    // Use for loop with reverse iteration to safely remove items while iterating
    for (let i = this.shields.length - 1; i >= 0; i--) {
      const shield = this.shields[i];
      
      if (player.x < shield.x + shield.width &&
          player.x + player.width > shield.x &&
          player.y < shield.y + shield.height &&
          player.y + player.height > shield.y) {
            
        debugLog('SHIELD COLLECTED - removing from array');
        
        // Remove the shield from the array
        this.shields.splice(i, 1);
        
        // Play collection sound
        if (this.collectSound) {
          this.collectSound.currentTime = 0;
          this.collectSound.play().catch(e => debugLog("Error playing shield collect sound:", e));
        }
        
        // Activate shield on player
        if (player.activateShield) {
          player.activateShield(3); // Shield absorbs 3 hits
          debugLog('Shield activated on player');
          
          // Show notification
          this.showNotification();
        } else {
          debugError('Player does not have activateShield method');
        }
        
        // Spawn a new shield after a delay if in hacker loading
        if (window.hackerIsLoading) {
          this.respawnTimer = setTimeout(() => {
            this.spawnShield();
            this.respawnTimer = null;
          }, 5000); // Wait 5 seconds before spawning a new shield
        }
      }
    }
    
    return this.shields.length === 0; // Return true if all shields collected
  }
  
  showNotification() {
    // Only show notification for first shield collected
    if (!this.firstShieldCollected) {
      this.firstShieldCollected = true;
      this.notification.active = true;
      this.notification.waitingForKeypress = true;
      
      // Add event listener for space key
      window.addEventListener('keydown', this.handleKeyDown);
      
      // Pause the game
      if (typeof window.pauseGame === 'function') {
        window.pauseGame(true, 'shield_tutorial');
      }
      
      debugLog('Shield tutorial activated - game paused');
    }
  }
  
  handleKeyDown(event) {
    // Check if space key was pressed and notification is active
    if (event.code === 'Space' && this.notification.active && this.notification.waitingForKeypress) {
      // Hide notification
      this.notification.active = false;
      this.notification.waitingForKeypress = false;
      
      // Remove event listener
      window.removeEventListener('keydown', this.handleKeyDown);
      
      // Resume the game
      if (typeof window.pauseGame === 'function') {
        window.pauseGame(false, 'shield_tutorial');
      }
      
      debugLog('Shield tutorial dismissed - game resumed');
    }
  }
  
  // Helper method to draw rounded rectangles for browsers that don't support roundRect
  drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fill) {
      ctx.fill();
    }
    
    if (stroke) {
      // Draw border
      ctx.strokeStyle = '#00a8ff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
  
  draw(ctx) {
    // Update pulsing effect
    this.pulseScale += this.pulseSpeed;
    if (this.pulseScale > this.pulseMax || this.pulseScale < this.pulseMin) {
      this.pulseSpeed = -this.pulseSpeed;
    }
    
    // Draw all active shields
    this.shields.forEach((shield, index) => {
      ctx.save();
      
      // Draw shield image or placeholder
      if (this.image.complete) {
        // Calculate center position for the shield
        const centerX = shield.x + shield.width / 2;
        const centerY = shield.y + shield.height / 2;
        
        // Apply pulsing effect
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(this.pulseScale, this.pulseScale);
        
        // Draw the shield image with pulsing effect
        ctx.drawImage(
          this.image,
          -shield.width / 2,  // Adjust x to center
          -shield.height / 2, // Adjust y to center
          shield.width,
          shield.height
        );
        ctx.restore();
        
        // Add glow effect when pulsing larger
        if (this.pulseScale > 1.0) {
          ctx.save();
          ctx.globalAlpha = 0.3 * (this.pulseScale - 1) / (this.pulseMax - 1);
          ctx.filter = 'blur(5px)';
          ctx.drawImage(
            this.image,
            shield.x - 5,
            shield.y - 5,
            shield.width + 10,
            shield.height + 10
          );
          ctx.restore();
        }
      } else {
        // Simple placeholder if image not loaded
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(shield.x, shield.y, shield.width, shield.height);
        
        // Simple border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.strokeRect(shield.x, shield.y, shield.width, shield.height);
        
        // Simple text
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SHIELD', shield.x + shield.width/2, shield.y + shield.height/2);
      }
      
      ctx.restore();
    });
    
    // Draw notification if active
    if (this.notification.active && this.notification.opacity > 0) {
      ctx.save();
      
      // Set transparency based on fade in/out
      ctx.globalAlpha = this.notification.opacity;
      
      // Draw background
      const padding = 20;
      const lineHeight = 28; // Reduced line height for smaller spacing
      const width = 450; // Slightly narrower notification
      const height = (this.notification.text.length * lineHeight) + (padding * 2);
      const x = (this.gameWidth - width) / 2;
      const y = this.notification.y - height / 2;
      
      // Create a pulsing effect for the notification
      const time = Date.now() / 1000;
      const pulseScale = 1 + Math.sin(time * 4) * 0.02; // Subtle pulse
      
      // Apply the pulse scale
      ctx.translate(x + width/2, y + height/2);
      ctx.scale(pulseScale, pulseScale);
      ctx.translate(-(x + width/2), -(y + height/2));
      
      // Draw semi-transparent background with rounded corners and gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, 'rgba(25, 25, 75, 0.85)');
      gradient.addColorStop(1, 'rgba(10, 10, 40, 0.9)');
      ctx.fillStyle = gradient;
      
      // Use roundRect if available, otherwise draw a regular rectangle
      if (ctx.roundRect) {
        ctx.roundRect(x, y, width, height, 15);
        ctx.fill();
        
        // Draw glowing border
        const borderGlow = ctx.createLinearGradient(x, y, x + width, y + height);
        borderGlow.addColorStop(0, '#00a8ff');
        borderGlow.addColorStop(0.5, '#00ffaa');
        borderGlow.addColorStop(1, '#00a8ff');
        
        ctx.strokeStyle = borderGlow;
        ctx.lineWidth = 4;
        ctx.roundRect(x, y, width, height, 15);
        ctx.stroke();
      } else {
        // Fallback for browsers that don't support roundRect
        this.drawRoundedRect(ctx, x, y, width, height, 15, true, true);
      }
      
      // Set text alignment for all text
      ctx.textAlign = 'center';
      
      // Draw each line of text with different colors and effects
      this.notification.text.forEach((line, index) => {
        const textY = y + padding + (index * lineHeight) + 15;
        
        // Different styling for different lines
        if (index === 0) {
          // Title text with glow effect
          ctx.font = 'bold 14px "Press Start 2P", cursive';
          ctx.fillStyle = '#ffff00'; // Yellow
          ctx.shadowColor = '#ff8800';
          ctx.shadowBlur = 6;
          ctx.fillText(line, x + width/2, textY);
          ctx.shadowBlur = 0;
        } 
        else if (index === 1) {
          // Second line - blue
          ctx.font = 'bold 12px "Press Start 2P", cursive';
          ctx.fillStyle = '#00ffff'; // Cyan
          ctx.fillText(line, x + width/2, textY);
        }
        else if (index === 2) {
          // Third line - green
          ctx.font = 'bold 12px "Press Start 2P", cursive';
          ctx.fillStyle = '#00ff88'; // Green
          ctx.fillText(line, x + width/2, textY);
        }
        else if (index === 3) {
          // Fourth line - red
          ctx.font = 'bold 11px "Press Start 2P", cursive';
          ctx.fillStyle = '#ff5555'; // Red
          ctx.fillText(line, x + width/2, textY);
        }
        else if (index === 5) {
          // Press space line with blinking effect
          ctx.font = 'bold 11px "Press Start 2P", cursive';
          
          // Blinking effect
          if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = '#ffffff'; // White
          } else {
            ctx.fillStyle = '#ffaa00'; // Orange
          }
          
          ctx.fillText(line, x + width/2, textY);
        }
        else {
          // Default text style
          ctx.font = 'bold 11px "Press Start 2P", cursive';
          ctx.fillStyle = 'white';
          ctx.fillText(line, x + width/2, textY);
        }
      });
      
      // Draw shield icons in the corners for decoration
      if (this.image.complete) {
        const iconSize = 30; // Smaller icons
        ctx.drawImage(this.image, x + 15, y + 15, iconSize, iconSize); // Top left
        ctx.drawImage(this.image, x + width - iconSize - 15, y + 15, iconSize, iconSize); // Top right
        ctx.drawImage(this.image, x + 15, y + height - iconSize - 15, iconSize, iconSize); // Bottom left
        ctx.drawImage(this.image, x + width - iconSize - 15, y + height - iconSize - 15, iconSize, iconSize); // Bottom right
      }
      
      ctx.restore();
    }
  }
}

// Add to global scope for access from game.js
window.ShieldPowerupController = ShieldPowerupController;
