class SkullProjectile {
  constructor(ctx, x, y, width, height, angle, speed = 5) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    // Convert angle (in degrees) to radians
    const radians = angle * Math.PI / 180;
    
    // Use the provided speed or default to 5
    const projectileSpeed = speed;
    
    // Calculate speed components based on angle
    this.speedX = projectileSpeed * Math.cos(radians);
    this.speedY = projectileSpeed * Math.sin(radians);
    
    // Animation properties
    this.frameIndex = 0;
    this.tickCount = 0;
    this.ticksPerFrame = 5;
    this.numberOfFrames = 5;
    
    // Load skull images
    this.images = [];
    for (let i = 1; i <= this.numberOfFrames; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/skull/skull${i}.png`;
      this.images.push(img);
    }
    
    this.type = 'skullProjectile';
  }
  
  update(gameSpeed) {
    // Update position based on speed vectors
    this.x -= this.speedX * gameSpeed;
    this.y += this.speedY * gameSpeed;
    
    // Update animation
    this.tickCount++;
    if (this.tickCount > this.ticksPerFrame) {
      this.tickCount = 0;
      this.frameIndex = (this.frameIndex + 1) % this.numberOfFrames;
    }
  }
  
  draw() {
    if (this.images[this.frameIndex] && this.images[this.frameIndex].complete) {
      this.ctx.drawImage(
        this.images[this.frameIndex],
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
  }
  
  isOffScreen() {
    return this.x < -this.width || this.y < -this.height || this.y > this.ctx.canvas.height;
  }
  
  collideWith(player) {
    // Check for collision with player
    const padding = 10; // Smaller hitbox for better gameplay feel
    
    if (
      this.x + padding < player.x + player.width &&
      this.x + this.width - padding > player.x &&
      this.y + padding < player.y + player.height &&
      this.y + this.height - padding > player.y
    ) {
      return true;
    }
    
    return false;
  }
}
