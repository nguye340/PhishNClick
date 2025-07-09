class Ground {
  constructor(ctx, width, height, speed, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.scaleRatio = scaleRatio;

    this.x = 0;
    this.y = this.canvas.height - this.height;

    this.image = new Image();
    this.image.src = "/games/phish404/img/ground2.png";
  }

  update(gameSpeed, frameTimeDelta) {
    this.x -= gameSpeed * frameTimeDelta * this.speed * this.scaleRatio;

    if (this.x < -this.width) {
      this.x = 0;
    }
  }

  draw() {
    this.ctx.drawImage(
      this.image,
      this.x,
      this.y,
      this.width,
      this.height
    );

    this.ctx.drawImage(
      this.image,
      this.x + this.width,
      this.y,
      this.width,
      this.height
    );
  }
}
