class Coin {
  constructor(gameWidth, gameHeight, scaleRatio) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.scaleRatio = scaleRatio;
    
    // Size of the coin
    this.width = 50 * scaleRatio;
    this.height = 50 * scaleRatio;
    
    // Position the coin randomly along the x-axis, but above the ground
    this.x = gameWidth;
    this.y = Math.random() * (gameHeight * 0.4) + gameHeight * 0.1; // Random height between 10% and 70% of game height
    
    // Load coin images for animation
    this.images = [];
    for (let i = 1; i <= 10; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/coin${i}.png`;
      this.images.push(img);
    }
    
    // Animation properties
    this.frameIndex = 0;
    this.frameCount = this.images.length;
    this.frameTimer = 0;
    this.frameInterval = 50; // milliseconds between frame changes (faster for more frames)
    
    // Coin movement speed
    this.speed = 5 * scaleRatio;
    
    // Coin state
    this.collected = false;
  }
  
  update(gameSpeed, deltaTime) {
    // Move the coin from right to left
    this.x -= gameSpeed;
    
    // Update animation frame
    if (!this.collected) {
      this.frameTimer += deltaTime;
      if (this.frameTimer >= this.frameInterval) {
        this.frameIndex = (this.frameIndex + 1) % this.frameCount;
        this.frameTimer = 0;
      }
    }
  }
  
  draw(ctx) {
    if (!this.collected && this.images[this.frameIndex]) {
      ctx.drawImage(this.images[this.frameIndex], this.x, this.y, this.width, this.height);
    }
  }
  
  // Check if the coin is off-screen
  isOffScreen() {
    return this.x < -this.width;
  }
}
