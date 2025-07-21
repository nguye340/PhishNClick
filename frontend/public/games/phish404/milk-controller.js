class MilkController {
  constructor(ctx, gameWidth, gameHeight, scaleRatio) {
    this.ctx = ctx;
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.scaleRatio = scaleRatio;
    
    this.milkBottles = [];
    this.milkCollected = 0;
    
    // Spawn timer
    this.spawnTimer = 0;
    this.normalSpawnInterval = 15000; // 15 seconds between milk spawns when energy is normal
    this.lowEnergySpawnInterval = 7000; // 7 seconds between milk spawns when energy is low
    this.hackerLoadingSpawnInterval = 3000; // 3 seconds between milk spawns during hacker loading phase
    this.spawnInterval = this.normalSpawnInterval; // Default to normal interval
    
    // Notification properties
    this.showNotification = false;
    this.notificationTimer = 0;
    this.notificationDuration = 4000; // Show notification for 4 seconds
    this.notificationText = "DRINK MILK TO RECHARGE SPEED!";
    this.notificationOpacity = 1.0;
    this.notificationBlinkRate = 500; // Blink every 500ms
    this.notificationCount = 0; // Track how many times notification has been shown
    this.maxNotifications = 1; // Maximum number of times to show notification (only once)
    
    // Sound effects
    this.slurpSound = new Audio('/games/phish404/audio/cartoon-slurp.mp3');
    this.yummySound = new Audio('/games/phish404/audio/yummy.mp3');
  }
  
  reset() {
    this.milkBottles = [];
    this.spawnTimer = 0;
  }
  
  update(gameSpeed, deltaTime, energyLevel) {
    // Check if hacker is in loading phase
    const hackerLoading = window.hackerIsLoading || false;
    
    // Update spawn interval based on energy level and hacker state
    this.updateSpawnInterval(energyLevel, hackerLoading);
    
    // Update spawn timer
    this.spawnTimer += deltaTime;
    
    // Spawn new milk bottle if it's time
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnMilkBottle();
      this.spawnTimer = 0;
    }
    
    // Update all milk bottles
    this.milkBottles.forEach(milk => {
      milk.update(gameSpeed, deltaTime);
    });
    
    // Remove off-screen milk bottles
    this.milkBottles = this.milkBottles.filter(milk => milk.x > -milk.width);
  }
  
  updateSpawnInterval(energyLevel, hackerLoading = false) {
    if (hackerLoading) {
      // Fastest spawn rate during hacker loading phase
      this.spawnInterval = this.hackerLoadingSpawnInterval;
    } 
    // If energy is below 30%, use faster spawn interval
    else if (energyLevel < 30) {
      this.spawnInterval = this.lowEnergySpawnInterval;
    } else {
      this.spawnInterval = this.normalSpawnInterval;
    }
  }
  
  draw(deltaTime) {
    // Draw all milk bottles
    this.milkBottles.forEach(milk => {
      milk.draw(this.ctx);
    });
    
    // Hide notification if no milk bottles are visible
    if (this.milkBottles.length === 0 && this.showNotification) {
      this.showNotification = false;
    }
    
    // Draw notification if active
    if (this.showNotification) {
      this.drawNotification(deltaTime);
    }
  }
  
  drawNotification(deltaTime) {
    // Update notification timer
    this.notificationTimer += deltaTime;
    
    // Calculate blinking effect
    this.notificationOpacity = Math.abs(Math.sin(this.notificationTimer / this.notificationBlinkRate));
    
    // Hide notification after duration
    if (this.notificationTimer >= this.notificationDuration) {
      this.showNotification = false;
      return;
    }
    
    // Draw notification text
    this.ctx.save();
    this.ctx.fillStyle = `rgba(255, 255, 0, ${this.notificationOpacity})`; // Yellow with opacity
    this.ctx.strokeStyle = `rgba(0, 0, 0, ${this.notificationOpacity})`; // Black outline with opacity
    this.ctx.lineWidth = 2;
    this.ctx.font = '14px "Press Start 2P"';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const text = this.notificationText;
    const x = this.gameWidth / 2;
    const y = 50; // Position at the top of the screen to avoid overlapping with skull notification
    
    // Draw text with outline for better visibility
    this.ctx.strokeText(text, x, y);
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }
  
  spawnMilkBottle() {
    // Create a new milk bottle and add it to the array
    const milk = new Milk(this.gameWidth, this.gameHeight, this.scaleRatio);
    this.milkBottles.push(milk);
    console.log("Milk bottle spawned!");
    
    // Show notification when milk appears (only for the first 2 times)
    if (this.notificationCount < this.maxNotifications) {
      this.showNotification = true;
      this.notificationTimer = 0;
      this.notificationOpacity = 1.0;
      this.notificationCount++;
    }
  }
  
  checkCollisions(player) {
    for (let i = 0; i < this.milkBottles.length; i++) {
      if (this.milkBottles[i].collideWith(player)) {
        // Play sounds if not muted
        if (!window.isMuted) {
          if (this.slurpSound) {
            this.slurpSound.currentTime = 0;
            this.slurpSound.play().catch(e => console.log("Error playing slurp sound:", e));
          }
          
          setTimeout(() => {
            if (this.yummySound) {
              this.yummySound.currentTime = 0;
              this.yummySound.play().catch(e => console.log("Error playing yummy sound:", e));
            }
          }, 300);
        }
        
        this.milkCollected++;
        return true; // Return true if milk was collected
      }
    }
    return false; // Return false if no milk was collected
  }
}
