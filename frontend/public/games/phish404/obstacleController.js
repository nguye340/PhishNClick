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
  }
  
  resetTimer() {
    this.timerRandomSpawn = 0;
    this.nextSpawnTime = this.getRandomSpawnTime();
  }
  
  getRandomSpawnTime() {
    return Math.floor(Math.random() * (this.maxSpawnTime - this.minSpawnTime + 1) + this.minSpawnTime);
  }
  
  createObstacle() {
    const index = Math.floor(Math.random() * this.obstacleImages.length);
    const obstacleImage = this.obstacleImages[index];
    
    const x = this.canvas.width;
    const y = this.canvas.height - obstacleImage.height - 1.5 * this.scaleRatio;
    
    const obstacle = new Obstacle(
      this.ctx,
      x,
      y,
      obstacleImage.width,
      obstacleImage.height,
      obstacleImage.image
    );
    
    this.obstacle.push(obstacle);
  }
  
  update(gameSpeed, frameTimeDelta) {
    this.timerRandomSpawn += frameTimeDelta;
    
    if (this.timerRandomSpawn >= this.nextSpawnTime) {
      this.createObstacle();
      this.resetTimer();
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
    return this.obstacle.some(obstacle => obstacle.collideWith(sprite));
  }
}
