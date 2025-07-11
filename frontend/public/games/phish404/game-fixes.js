// This file contains fixes for the Phish404 game

// Function to preserve coin count during controller resets
function preserveCoinsAndResetControllers() {
  // Access controllers from window scope to ensure they're available
  const coinCtrl = window.coinController;
  const milkCtrl = window.milkController;
  const burgerCtrl = window.burgerController;
  const skullCtrl = window.skullController;
  const hackerCtrl = window.hackerController;
  const obstacleCtrl = window.obstacleController;
  
  // Store current coin count before resetting controllers
  let currentCoins = 0;
  if (coinCtrl) {
    currentCoins = coinCtrl.coinsCollected;
    console.log('Preserving coin count:', currentCoins);
  }
  
  // Reset all controllers except coin count
  if (milkCtrl && typeof milkCtrl.reset === 'function') milkCtrl.reset();
  if (burgerCtrl && typeof burgerCtrl.reset === 'function') burgerCtrl.reset();
  if (skullCtrl && typeof skullCtrl.reset === 'function') skullCtrl.reset();
  if (hackerCtrl && typeof hackerCtrl.reset === 'function') hackerCtrl.reset();
  if (obstacleCtrl && typeof obstacleCtrl.reset === 'function') obstacleCtrl.reset();
  
  // Reset coin controller but preserve the coin count
  if (coinCtrl && typeof coinCtrl.reset === 'function') {
    coinCtrl.reset();
    coinCtrl.coinsCollected = currentCoins;
    document.getElementById('coinCount').textContent = currentCoins;
  }
}

// Function to ensure loseLife is called correctly
function safelyLoseLife() {
  console.log('Safely losing life');
  if (typeof window.loseLife === 'function') {
    window.loseLife();
  } else {
    console.error('loseLife function not found, trying alternatives');
    if (window.game && typeof window.game.loseLife === 'function') {
      window.game.loseLife();
    } else if (window.lives > 0) {
      console.log('Using manual life reduction');
      window.lives--;
      if (typeof window.updateLivesDisplay === 'function') {
        window.updateLivesDisplay();
      }
    }
  }
}
