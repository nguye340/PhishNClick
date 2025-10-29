class ObstacleController {
  constructor(ctx, obstacleImages, speed, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.obstacleImages = obstacleImages;
    this.speed = speed;
    this.scaleRatio = scaleRatio;
    
    this.obstacle = [];
    
    this.timerRandomSpawn = 0;
    this.minSpawnTime = 1000;
    this.maxSpawnTime = 3000;
    this.nextSpawnTime = this.minSpawnTime;
    
    // Flag to pause obstacle spawning during boss battles
    this.pauseSpawning = false;
  }
  
  resetTimer() {
    this.timerRandomSpawn = 0;
    this.nextSpawnTime = this.getRandomSpawnTime();
  }
  
  // Reset method to clear all obstacles
  reset() {
    debugLog('Clearing all obstacles from ObstacleController');
    this.obstacle = [];
    this.resetTimer();
  }
  
  getRandomSpawnTime() {
    return Math.floor(Math.random() * (this.maxSpawnTime - this.minSpawnTime + 1) + this.minSpawnTime);
  }
  
  createObstacle() {
    const index = Math.floor(Math.random() * this.obstacleImages.length);
    const obstacleImage = this.obstacleImages[index];
    
    const x = this.canvas.width;
    
    // Define three distinct height levels (low, mid, high)
    // Low: ground level (0 height variation)
    // Mid: medium height (40px scaled)
    // High: highest position (80px scaled)
    const heightLevels = [
      0,                         // Low level (ground)
      40 * this.scaleRatio,      // Mid level
      80 * this.scaleRatio       // High level
    ];
    
    // Randomly select one of the three height levels
    const levelIndex = Math.floor(Math.random() * heightLevels.length);
    const heightVariation = heightLevels[levelIndex];
    
    // Base position (ground level) minus the selected height level
    const y = this.canvas.height - obstacleImage.height - 1.5 * this.scaleRatio - heightVariation;
    
    const obstacle = new Obstacle(
      this.ctx,
      x,
      y,
      obstacleImage.width,
      obstacleImage.height,
      obstacleImage.image
    );
    
    // Add type property based on the image path
    const imagePath = obstacleImage.image.src.toLowerCase();
    if (imagePath.includes('email')) {
      obstacle.type = 'email';
    } else if (imagePath.includes('phone')) {
      obstacle.type = 'phone';
    }
    
    this.obstacle.push(obstacle);
  }
  
  update(gameSpeed, frameTimeDelta) {
    // Only spawn new obstacles if not paused
    if (!this.pauseSpawning) {
      this.timerRandomSpawn += frameTimeDelta;
      
      if (this.timerRandomSpawn >= this.nextSpawnTime) {
        this.createObstacle();
        this.resetTimer();
      }
    }
    
    this.obstacle.forEach((obstacle) => {
      obstacle.update(this.speed, gameSpeed, frameTimeDelta, this.scaleRatio);
    });
    
    this.obstacle = this.obstacle.filter(obstacle => obstacle.x > -obstacle.width);
  }
  
  draw() {
    this.obstacle.forEach((obstacle) => {
      obstacle.draw();
    });
  }
  
  collideWith(sprite) {
    for (let i = 0; i < this.obstacle.length; i++) {
      // Skip obstacles that have already been collided with
      if (this.obstacle[i].hasCollided) {
        continue;
      }
      
      if (this.obstacle[i].collideWith(sprite)) {
        // Mark this obstacle as collided so we don't detect it again
        this.obstacle[i].hasCollided = true;
        return this.obstacle[i];
      }
    }
    return null;
  }
  
  reset() {
    debugLog('Resetting obstacle controller');
    // Clear all obstacles
    this.obstacle = [];
    // Reset spawn timer
    this.timerRandomSpawn = 0;
    this.nextSpawnTime = this.getRandomSpawnTime();
    // Reset pause flag
    this.pauseSpawning = false;
  }
}
