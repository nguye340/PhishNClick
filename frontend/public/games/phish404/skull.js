class Skull {
  constructor(ctx, x, y, width, height) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
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
    
    this.type = 'skull';
  }
  
  update(speed, gameSpeed) {
    // Update position
    this.x -= speed * gameSpeed;
    
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
    return this.x < -this.width;
  }
}
