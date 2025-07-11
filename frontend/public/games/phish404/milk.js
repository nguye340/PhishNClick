class Milk {
  constructor(gameWidth, gameHeight, scaleRatio) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.scaleRatio = scaleRatio;
    
    // Size of the milk bottle (increased size)
    this.width = 50 * scaleRatio;
    this.height = 50 * scaleRatio;
    
    // Position the milk randomly along the x-axis, but above the ground
    this.x = gameWidth;
    
    // Position milk at a fixed, safe height to ensure it's always fully visible
    // Use a much larger ground offset to keep milk well above the bottom edge
    
    // Fixed position at 1/3 of the game height from the top
    // This ensures it's always visible in the upper part of the screen
    this.y = gameHeight * 0.33;
    
    // Add a safety check to ensure milk is never positioned too low
    if (this.y + this.height > gameHeight * 0.5) {
      this.y = gameHeight * 0.33;
    }
    
    // Add console logging to help debug the position
    console.log('Milk spawned at y:', this.y, 'gameHeight:', gameHeight, 'milk height:', this.height);
    
    // Load milk image
    this.image = new Image();
    this.image.src = "/games/phish404/img/milkBox.png";
    
    // Milk movement speed
    this.speed = 5 * scaleRatio;
    
    // Milk state
    this.collected = false;
  }
  
  update(gameSpeed, deltaTime) {
    // Move the milk from right to left
    this.x -= gameSpeed;
  }
  
  draw(ctx) {
    if (!this.collected && this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }
  
  collideWith(sprite) {
    if (this.collected) return false;
    
    const padding = 10;
    
    if (
      this.x + padding < sprite.x + sprite.width &&
      this.x + this.width - padding > sprite.x &&
      this.y + padding < sprite.y + sprite.height &&
      this.y + this.height - padding > sprite.y
    ) {
      this.collected = true;
      return true;
    }
    
    return false;
  }
}
