class Hacker {
  constructor(ctx, x, y, width, height) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    
    // Fixed position on right side (slightly inset from edge)
    this.fixedX = x - width * 1.2;
    
    // Movement properties for floating effect
    this.floatAmplitude = 10; // How far up/down to float
    this.floatSpeed = 0.002; // Speed of floating
    this.floatOffset = Math.random() * Math.PI * 2; // Random starting position
    
    // Animation properties
    this.frameIndex = 0;
    this.tickCount = 0;
    this.ticksPerFrame = 5;
    this.numberOfFrames = 7;
    
    // Shooting properties
    this.shootTimer = 0;
    this.shootInterval = 2000; // Shoot every 2 seconds
    this.active = false; // Whether the hacker is currently active/visible
    
    // Load hacker images
    this.images = [];
    for (let i = 1; i <= this.numberOfFrames; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/hacker/hacker${i}.png`;
      this.images.push(img);
    }
    
    this.type = 'hacker';
  }
  
  update(frameTimeDelta, gameSpeed) {
    // Don't update if not active
    if (!this.active) return;
    
    // Update floating position
    this.y = this.y + Math.sin((this.floatOffset + performance.now()) * this.floatSpeed) * this.floatAmplitude * 0.05;
    
    // Update animation
    this.tickCount++;
    if (this.tickCount > this.ticksPerFrame) {
      this.tickCount = 0;
      this.frameIndex = (this.frameIndex + 1) % this.numberOfFrames;
    }
    
    // Update shoot timer
    this.shootTimer += frameTimeDelta;
  }
  
  draw() {
    // Don't draw if not active
    if (!this.active) return;
    
    if (this.images[this.frameIndex] && this.images[this.frameIndex].complete) {
      this.ctx.drawImage(
        this.images[this.frameIndex],
        this.fixedX,
        this.y,
        this.width,
        this.height
      );
    }
  }
  
  canShoot() {
    // Check if it's time to shoot
    return this.active && this.shootTimer >= this.shootInterval;
  }
  
  resetShootTimer() {
    this.shootTimer = 0;
  }
  
  activate() {
    this.active = true;
  }
  
  deactivate() {
    this.active = false;
  }
}
