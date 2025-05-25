class Obstacle {
  constructor(ctx, x, y, width, height, image) {
    this.ctx = ctx;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.image = image;
  }

  update(speed, gameSpeed, frameTimeDelta, scaleRatio) {
    this.x -= speed * frameTimeDelta * gameSpeed * scaleRatio;
  }

  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  collideWith(sprite) {
    const padding = 10;
    
    if (
      this.x + padding < sprite.x + sprite.width &&
      this.x + this.width - padding > sprite.x &&
      this.y + padding < sprite.y + sprite.height &&
      this.y + this.height - padding > sprite.y
    ) {
      return true;
    } else {
      return false;
    }
  }
}
