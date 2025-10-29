class SkullController {
  constructor(ctx, width, height, speed, scaleRatio) {
    this.ctx = ctx;
    this.canvas = { width, height };
    this.speed = speed;
    this.scaleRatio = scaleRatio;
    this.skulls = [];
    
    // Skull dimensions
    this.skullWidth = 2048 / 35;
    this.skullHeight = 2048 / 35;
    
    // Spawn settings
    this.spawnTimer = 0;
    this.spawnInterval = 15000; // 15 seconds between skulls
    this.minSpawnY = 50;
    this.maxSpawnY = height - 120; // Adjust based on ground height
    
    // Notification settings
    this.showNotification = false;
    this.notificationOpacity = 0;
    this.notificationTimer = 0;
    this.notificationCount = 0;
    this.maxNotifications = 1; // Only show notification once
    
    // Sound effect
    this.skullSound = new Audio('/games/phish404/audio/skull-sound.mp3');
  }
  
  // Reset method to clear all skulls
  reset() {
    debugLog('Clearing all skulls from SkullController');
    this.skulls = [];
    this.spawnTimer = 0;
  }
  
  update(gameSpeed, frameTimeDelta) {
    // Update existing skulls
    this.skulls.forEach(skull => {
      skull.update(this.speed, gameSpeed);
    });
    
    // Remove off-screen skulls
    this.skulls = this.skulls.filter(skull => !skull.isOffScreen());
    
    // Update spawn timer
    this.spawnTimer += frameTimeDelta;
    
    // Spawn new skull if it's time
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      
      // Random Y position within bounds
      const randomY = Math.floor(Math.random() * (this.maxSpawnY - this.minSpawnY + 1)) + this.minSpawnY;
      
      // Create new skull
      const skull = new Skull(
        this.ctx,
        this.canvas.width,
        randomY,
        this.skullWidth * this.scaleRatio,
        this.skullHeight * this.scaleRatio
      );
      
      this.skulls.push(skull);
      
      // Play skull sound when a skull appears
      this.skullSound.currentTime = 0;
      this.skullSound.play().catch(e => debugLog("Error playing skull sound:", e));
      
      // Show notification if we haven't shown too many
      if (this.notificationCount < this.maxNotifications) {
        this.showNotification = true;
        this.notificationOpacity = 1;
        this.notificationTimer = 0;
        this.notificationCount++;
      }
    }
    
    // Update notification
    if (this.showNotification) {
      this.notificationTimer += frameTimeDelta;
      
      // Fade out after 3 seconds
      if (this.notificationTimer > 3000) {
        this.notificationOpacity -= 0.02;
        
        if (this.notificationOpacity <= 0) {
          this.showNotification = false;
          this.notificationOpacity = 0;
        }
      }
    }
  }
  
  draw() {
    // Draw all skulls
    this.skulls.forEach(skull => {
      skull.draw();
    });
    
    // Draw notification
    if (this.showNotification && this.notificationOpacity > 0) {
      // Draw notification text
      this.ctx.save();
      this.ctx.fillStyle = `rgba(255, 0, 0, ${this.notificationOpacity})`; // Red with opacity
      this.ctx.strokeStyle = `rgba(0, 0, 0, ${this.notificationOpacity})`; // Black outline with opacity
      this.ctx.lineWidth = 2;
      this.ctx.font = '14px "Press Start 2P"';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const text = "DANGER! AVOID THE SKULL!";
      const x = this.canvas.width / 2;
      const y = 150; // Position below the milk notification (which is at y=50)
      
      // Draw text with outline for better visibility
      this.ctx.strokeText(text, x, y);
      this.ctx.fillText(text, x, y);
      this.ctx.restore();
    }
  }
  
  checkCollision(player) {
    // Check for collision with any skull
    for (const skull of this.skulls) {
      if (this.isColliding(player, skull)) {
        // Remove the skull after collision
        this.skulls = this.skulls.filter(s => s !== skull);
        return skull;
      }
    }
    return null;
  }
  
  isColliding(player, skull) {
    // Simple rectangle collision detection
    const playerHitbox = {
      x: player.x + player.width * 0.2,
      y: player.y + player.height * 0.2,
      width: player.width * 0.6,
      height: player.height * 0.6
    };
    
    const skullHitbox = {
      x: skull.x + skull.width * 0.2,
      y: skull.y + skull.height * 0.2,
      width: skull.width * 0.6,
      height: skull.height * 0.6
    };
    
    return (
      playerHitbox.x < skullHitbox.x + skullHitbox.width &&
      playerHitbox.x + playerHitbox.width > skullHitbox.x &&
      playerHitbox.y < skullHitbox.y + skullHitbox.height &&
      playerHitbox.y + playerHitbox.height > skullHitbox.y
    );
  }
  
  reset() {
    this.skulls = [];
    this.spawnTimer = 0;
    this.showNotification = false;
    this.notificationOpacity = 0;
    this.notificationTimer = 0;
    this.notificationCount = 0;
  }
}
