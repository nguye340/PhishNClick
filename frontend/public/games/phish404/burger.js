class Burger {
  constructor(gameWidth, gameHeight, scaleRatio) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.scaleRatio = scaleRatio;
    
    // Size of the burger
    this.width = 40 * scaleRatio;
    this.height = 40 * scaleRatio;
    
    // Position the burger randomly along the x-axis
    this.x = gameWidth;
    
    // Position burger at a fixed, safe height to ensure it's always fully visible
    // Fixed position at 1/4 of the game height from the top (slightly higher than milk)
    this.y = gameHeight * 0.25;
    
    // Add a safety check to ensure burger is never positioned too low
    if (this.y + this.height > gameHeight * 0.5) {
      this.y = gameHeight * 0.25;
    }
    
    // Load burger images for animation
    this.images = [new Image(), new Image()];
    this.images[0].src = "/games/phish404/img/burger1.png";
    this.images[1].src = "/games/phish404/img/burger2.png";
    
    // Animation properties
    this.frameIndex = 0;
    this.frameCount = 2;
    this.frameTimer = 0;
    this.frameInterval = 200; // milliseconds between frames
    
    // Movement speed (slightly slower than obstacles)
    this.speed = 0.25;
    
    // Burger is initially active
    this.active = true;
  }
  
  update(deltaTime) {
    if (!this.active) return;
    
    // Move burger from right to left
    this.x -= this.speed * deltaTime;
    
    // Handle animation timing
    this.frameTimer += deltaTime;
    if (this.frameTimer >= this.frameInterval) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % this.frameCount;
    }
    
    // Remove burger if it goes off screen
    if (this.x + this.width < 0) {
      this.active = false;
    }
  }
  
  draw(ctx) {
    if (!this.active) return;
    
    // Draw the current frame of the burger animation
    ctx.drawImage(
      this.images[this.frameIndex],
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
  
  checkCollision(player) {
    if (!this.active) return false;
    
    // Simple rectangle collision detection
    return (
      player.x < this.x + this.width &&
      player.x + player.width > this.x &&
      player.y < this.y + this.height &&
      player.y + player.height > this.y
    );
  }
}
