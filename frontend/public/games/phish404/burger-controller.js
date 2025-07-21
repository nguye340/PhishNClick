class BurgerController {
  constructor(gameWidth, gameHeight, scaleRatio) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.scaleRatio = scaleRatio;
    
    // Array to hold active burgers
    this.burgers = [];
    
    // Spawn timer and interval
    this.spawnTimer = 0;
    // Normal spawn rate for burgers (20-40 seconds)
    this.minSpawnInterval = 20000; // 20 seconds minimum
    this.maxSpawnInterval = 40000; // 40 seconds maximum
    // Faster spawn rate during hacker loading phase (5-10 seconds)
    this.hackerMinSpawnInterval = 5000; // 5 seconds minimum during hacker loading
    this.hackerMaxSpawnInterval = 10000; // 10 seconds maximum during hacker loading
    this.spawnInterval = this.getRandomSpawnInterval();
    
    // Sound effect for burger collection
    this.burgerSound = new Audio('/games/phish404/audio/yay-6120.mp3');
    
    // Notification properties
    this.showNotification = false;
    this.notificationTimer = 0;
    this.notificationDuration = 4000; // Show notification for 4 seconds
    this.notificationText = "EAT A BURGER FOR EXTRA HEALTH AND ENERGY!";
    this.notificationOpacity = 1.0;
    this.notificationBlinkRate = 500; // Blink every 500ms
    this.notificationCount = 0; // Track how many times notification has been shown
    this.maxNotifications = 2; // Maximum number of times to show notification
  }
  
  // Get a random spawn interval based on current game state
  getRandomSpawnInterval() {
    const hackerLoading = window.hackerIsLoading || false;
    
    // Always use faster spawn rate during hacker loading phase
    if (hackerLoading) {
      return Math.random() * (this.hackerMaxSpawnInterval - this.hackerMinSpawnInterval) + 
             this.hackerMinSpawnInterval;
    } else {
      // Normal spawn rate
      return Math.random() * (this.maxSpawnInterval - this.minSpawnInterval) + 
             this.minSpawnInterval;
    }
  }
  
  // Reset method to clear all burgers
  reset() {
    console.log('Clearing all burgers from BurgerController');
    this.burgers = [];
    this.spawnTimer = 0;
    this.spawnInterval = this.getRandomSpawnInterval();
  }
  
  update(deltaTime) {
    // Check if we should spawn burgers (always spawn, but adjust rate based on loading state)
    const hackerLoading = window.hackerIsLoading || false;
    
    // Update spawn timer
    this.spawnTimer += deltaTime;
    
    // Check if we need to update the spawn interval (in case hacker loading state changed)
    const currentInterval = this.spawnInterval;
    const newInterval = this.getRandomSpawnInterval();
    
    // If the interval changed significantly (more than 10%), update it
    if (Math.abs(currentInterval - newInterval) > (currentInterval * 0.1)) {
      this.spawnInterval = newInterval;
    }
    
    // Spawn new burger if it's time
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnBurger();
      this.spawnTimer = 0;
      this.spawnInterval = this.getRandomSpawnInterval();
    }
    
    // Update all active burgers
    this.burgers.forEach(burger => burger.update(deltaTime));
    
    // Remove inactive burgers
    this.burgers = this.burgers.filter(burger => burger.active);
  }
  
  draw(ctx, deltaTime) {
    // Draw all active burgers
    this.burgers.forEach(burger => burger.draw(ctx));
    
    // Hide notification if no burgers are visible
    if (this.burgers.length === 0 && this.showNotification) {
      this.showNotification = false;
    }
    
    // Draw notification if active
    if (this.showNotification) {
      this.drawNotification(ctx, deltaTime);
    }
  }
  
  drawNotification(ctx, deltaTime) {
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
    ctx.save();
    ctx.fillStyle = `rgba(0, 200, 0, ${this.notificationOpacity})`; // Green with opacity
    ctx.strokeStyle = `rgba(0, 0, 0, ${this.notificationOpacity})`; // Black outline with opacity
    ctx.lineWidth = 2;
    ctx.font = '14px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Position in the middle of the screen
    const x = this.gameWidth / 2;
    const y = this.gameHeight / 3 + 30; // Position below milk notification
    
    // Draw text with outline for better visibility
    ctx.strokeText(this.notificationText, x, y);
    ctx.fillText(this.notificationText, x, y);
    ctx.restore();
  }
  
  spawnBurger() {
    // Create a new burger and add it to the array
    const burger = new Burger(this.gameWidth, this.gameHeight, this.scaleRatio);
    this.burgers.push(burger);
    console.log("Burger spawned!");
    
    // Show notification when burger appears (only for the first 2 times)
    if (this.notificationCount < this.maxNotifications) {
      this.showNotification = true;
      this.notificationTimer = 0;
      this.notificationOpacity = 1.0;
      this.notificationCount++;
    }
  }
  
  checkCollision(player) {
    // Check collision with each burger
    for (let i = 0; i < this.burgers.length; i++) {
      if (this.burgers[i].checkCollision(player)) {
        // Burger was collected
        this.burgers[i].active = false;
        
        // Play burger collection sound
        this.burgerSound.currentTime = 0;
        if (this.burgerSound && !window.isMuted) {
          this.burgerSound.play().catch(e => console.log("Error playing burger sound:", e));
        }
        
        // Return true to indicate a collision occurred
        return true;
      }
    }
    
    // No collision
    return false;
  }
  
  // Reset the burger controller to initial state
  reset() {
    // Clear all active burgers
    this.burgers = [];
    
    // Reset timers
    this.spawnTimer = 0;
    this.spawnInterval = this.getRandomSpawnInterval();
    
    // Reset notification
    this.showNotification = false;
    this.notificationTimer = 0;
    
    console.log('BurgerController reset complete');
  }
}
