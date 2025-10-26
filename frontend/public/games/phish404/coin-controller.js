class CoinController {
  constructor(gameWidth, gameHeight, scaleRatio) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.scaleRatio = scaleRatio;
    
    this.coins = [];
    
    // Timing for spawning coins
    this.coinSpawnTimer = 0;
    this.coinSpawnInterval = 3000; // Spawn a coin every 3 seconds
    
    // Load coin sound
    this.coinSound = new Audio("/games/phish404/audio/coin-hit.mp3");
    
    // Score tracking
    this.coinsCollected = 0;
  }
  
  reset() {
    this.coins = [];
    this.coinSpawnTimer = 0;
    this.coinsCollected = 0;
  }
  
  update(deltaTime, gameSpeed) {
    // Spawn new coins based on timer
    if (this.coinSpawnTimer <= 0) {
      // Add a new coin
      this.coins.push(new Coin(this.gameWidth, this.gameHeight, this.scaleRatio));
      
      // Reset timer with some randomness
      this.coinSpawnTimer = this.coinSpawnInterval + Math.random() * 1000;
    } else {
      // Decrease timer
      this.coinSpawnTimer -= deltaTime;
    }
    
    // Update all coins
    this.coins.forEach(coin => {
      coin.update(gameSpeed, deltaTime);
    });
    
    // Remove off-screen coins
    this.coins = this.coins.filter(coin => !coin.isOffScreen() && !coin.collected);
  }
  
  draw(ctx) {
    // Draw all coins
    this.coins.forEach(coin => {
      coin.draw(ctx);
    });
    


    // Draw coin counter
    const coinCountElement = document.getElementById("coinCount");
    coinCountElement.textContent = this.coinsCollected * 10;
    //ctx.fillStyle = "darkblue";
    //ctx.font = "20px Arial";
    //ctx.fillText(`Coins: ${this.coinsCollected}`, 20, 30);
  }
  
  getCoinsCollected() {
    return this.coinsCollected;
  }
  
  checkCollision(player) {
    this.coins.forEach(coin => {
      if (!coin.collected && this.detectCollision(player, coin)) {
        // Mark coin as collected
        coin.collected = true;
        
        // Play sound
        this.coinSound.currentTime = 0;
        if (this.coinSound && !window.isMuted) {
          this.coinSound.play().catch(e => console.log("Error playing coin sound:", e));
        }
        
        // Increment counter
        this.coinsCollected++;
        
        // Record telemetry: coin collected (correct action)
        if (window.GameTelemetry) {
          window.GameTelemetry.recordInteraction(
            'phish404-coin-' + Date.now(),
            'click',
            true, // Collecting coin is correct
            0 // No specific reaction time for auto-collection
          );
        }
      }
    });
  }
  
  detectCollision(player, coin) {
    return (
      player.x < coin.x + coin.width &&
      player.x + player.width > coin.x &&
      player.y < coin.y + coin.height &&
      player.y + player.height > coin.y
    );
  }
}
