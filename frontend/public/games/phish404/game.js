// Define classes directly since browser module imports can be tricky in some environments
// We'll use the classes from the separate files that are loaded via <script> tags

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Game initializing...', new Date().toISOString());
  console.log('Canvas element exists:', !!document.getElementById('game'));
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  
  // Make the game object available globally
  window.game = {};

  const GAME_SPEED_S = 0.7; // Reduced from 1.0 for slower initial game speed
  const GAME_SPEED_ICR = 0.000005; // Reduced from 0.00001 for slower speed increase

  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 300; // Increased from 200 to match canvas height
  const PLAYER_WIDTH = 2048 / 32;
  const PLAYER_HEIGHT = 2048 / 32;
  const MAX_JUMP_HEIGHT = 180; // Reduced from GAME_HEIGHT to a more reasonable height
  const MIN_JUMP_HEIGHT = 140; // Increased from 100 to ensure short jumps can clear obstacles
  const GROUND_WIDTH = 2048;
  const GROUND_HEIGHT = 2048;
  const GROUND_AND_OBSTACLE_SPEED = 0.3; // Reduced from 0.5 for slower obstacle movement

  // Create proper Image objects for obstacles
  const OBSTACLE_CONFIG = [
    { width: 2048 / 40, height: 2048 / 40, imagePath: "/games/phish404/img/email.png" },
    { width: 2048 / 40, height: 2048 / 40, imagePath: "/games/phish404/img/phone.png" }
  ];
  
  // Preload obstacle images
  const obstacleImages = [];
  OBSTACLE_CONFIG.forEach(config => {
    const img = new Image();
    img.src = config.imagePath;
    obstacleImages.push({
      width: config.width,
      height: config.height,
      image: img
    });
  });

  const correctSound = new Audio('/games/phish404/audio/correct.mp3');
  const wrongSound = new Audio('/games/phish404/audio/wrong.mp3');

  // Global audio settings
  let gameVolume = 1.0;
  let isMuted = false;
  let musicEnabled = true;
  
  // Load saved audio preferences
  (function loadAudioPreferences() {
    const savedVolume = parseFloat(localStorage.getItem('gameVolume'));
    const savedMuted = localStorage.getItem('isMuted') === 'true';
    const savedMusicEnabled = localStorage.getItem('musicEnabled') !== 'false'; // Default to true if not set
    
    if (!isNaN(savedVolume)) {
      gameVolume = Math.min(1, Math.max(0, savedVolume));
    }
    
    if (savedMuted !== null) {
      isMuted = savedMuted;
    }
    
    musicEnabled = savedMusicEnabled;
    
    // Update volume slider if it exists
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
      volumeSlider.value = Math.round(gameVolume * 100);
    }
  })();
  
  // Player level tracking
  let playerLevel = 1;
  
  // Lives system
  let lives = 3;
  
  // Energy system
  let energy = 100;
  const MAX_ENERGY = 100;
  const ENERGY_DECREASE_RATE = 0.02; // Energy decreases by 0.02 per frame (slower drain for better gameplay balance)
  const ENERGY_CRITICAL_THRESHOLD = 30; // Below this threshold, show warning
  const ENERGY_FROM_MILK = 40; // Energy gained from collecting milk
  const ENERGY_FROM_BURGER = MAX_ENERGY; // Burger restores full energy
  let isEnergyWarningShown = false;
  let isEnergyWarningSound = false;
  
  // Burger powerup sound
  const burgerSound = new Audio('/games/phish404/audio/powerup.mp3');
  
  // Cat meow sound for low energy
  const catMeowSound = new Audio('/games/phish404/audio/cat-meow-hungry.mp3');

  let player = null;
  let ground = null;
  let obstacleController = null;
  let coinController = null;
  let milkController = null;
  let burgerController = null;
  let skullController = null;
  let hackerController = null;

  let scaleRatio = null;
  let previousTime = null;
  let gameSpeed = GAME_SPEED_S;
  let gameOver = false;
  let waitingToStart = true;
  let popupVisible = false; // Track if any popup is currently visible
  let gameLoopRunning = false; // Track if game loop is running

  function createSprite() {
    const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
    const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;
    const minJumpHeightInGame = MIN_JUMP_HEIGHT * scaleRatio;
    const maxJumpHeightInGame = MAX_JUMP_HEIGHT * scaleRatio;

    const groundWidthInGame = GROUND_WIDTH * scaleRatio;
    const groundHeightInGame = GROUND_HEIGHT * scaleRatio;

    player = new Player(ctx, playerWidthInGame, playerHeightInGame, minJumpHeightInGame, maxJumpHeightInGame, scaleRatio);
    // Expose player globally for the hacker controller to access
    window.gamePlayer = player;
    ground = new Ground(ctx, groundWidthInGame, groundHeightInGame, GROUND_AND_OBSTACLE_SPEED, scaleRatio);

    // Use the preloaded obstacle images
    const scaledObstacleImages = obstacleImages.map(obstacle => {
      return {
        image: obstacle.image,
        width: obstacle.width * scaleRatio,
        height: obstacle.height * scaleRatio
      };
    });

    obstacleController = new ObstacleController(ctx, scaledObstacleImages, GROUND_AND_OBSTACLE_SPEED, scaleRatio);
    
    // Create coin controller
    coinController = new CoinController(canvas.width, canvas.height, scaleRatio);
    
    // Create milk controller
    milkController = new MilkController(ctx, canvas.width, canvas.height, scaleRatio);
    
    // Create burger controller
    burgerController = new BurgerController(canvas.width, canvas.height, scaleRatio);
    
    // Create skull controller
    skullController = new SkullController(ctx, canvas.width, canvas.height, GROUND_AND_OBSTACLE_SPEED, scaleRatio);
    
    // Create hacker controller with reference to obstacle controller for pausing obstacles during boss battles
    hackerController = new HackerController(ctx, canvas.width, canvas.height, GROUND_AND_OBSTACLE_SPEED, scaleRatio, obstacleController);
  }

  function setScreen() {
    // Get the container dimensions
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // Calculate the game aspect ratio
    const gameAspectRatio = GAME_WIDTH / GAME_HEIGHT;
    
    // Set canvas to fill width while maintaining aspect ratio
    let newWidth = containerWidth;
    let newHeight = newWidth / gameAspectRatio;
    
    // If height is too tall for the screen, constrain by height instead
    if (newHeight > containerHeight * 0.8) {
      newHeight = containerHeight * 0.8;
      newWidth = newHeight * gameAspectRatio;
    }
    
    // Update scale ratio based on new dimensions
    scaleRatio = newWidth / GAME_WIDTH;
    
    // Set canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    console.log('Canvas dimensions updated:', canvas.width, canvas.height, 'Scale ratio:', scaleRatio);
    createSprite();
  }

  function getScaleRatio() {
    const screenHeight = Math.min(window.innerHeight, document.documentElement.clientHeight);
    const screenWidth = Math.min(window.innerWidth, document.documentElement.clientWidth);
    return screenWidth / screenHeight < GAME_WIDTH / GAME_HEIGHT
      ? screenWidth / GAME_WIDTH
      : screenHeight / GAME_HEIGHT;
  }

  function clearScreen() {
    ctx.fillStyle = 'lightblue';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Audio control positions and sizes (kept for reference, not used for drawing)

  function showStartGameText() {
    // Draw the ground first
    if (ground) {
      ground.draw();
    }
    
    // Draw the player on the start screen
    if (player) {
      player.draw();
      
      // Animate the cat even on the start screen
      const currentTime = performance.now();
      const deltaTime = previousTime ? currentTime - previousTime : 0;
      previousTime = currentTime;
      player.handlePlayerFrame(deltaTime);
    }
    
    const fontSize = 15 * scaleRatio;
    ctx.font = `${fontSize}px "Press Start 2P", "Courier New", monospace`;
    const x = canvas.width / 4; // Adjusted for wider arcade font
    const y = canvas.height / 4;
    
    // First part of text
    ctx.fillStyle = 'darkblue';
    ctx.fillText("Press ", x, y);
    
    // Highlight the word "SPACE" with flashing effect
    const pressText = "Press ";
    const spaceText = "SPACE";
    const pressWidth = ctx.measureText(pressText).width;
    
    // Create flashing effect using timestamp
    const flashSpeed = 300; // milliseconds per flash cycle
    const isFlashing = Math.floor(Date.now() / flashSpeed) % 2 === 0;
    
    ctx.fillStyle = isFlashing ? '#00FFFF' : '#0066CC'; // Alternate between cyan and blue
    ctx.fillText(spaceText, x + pressWidth, y);
    
    // Rest of the first line
    const spaceWidth = ctx.measureText(spaceText).width;
    ctx.fillStyle = 'darkblue';
    ctx.fillText(" to start", x + pressWidth + spaceWidth, y);
    
    // Second line
    ctx.fillText("Try your best to help this CAR* survive!", x, y + fontSize * 1.5);
    
    // Game instructions
    const lineHeight = fontSize * 1.5;
    let currentY = y + lineHeight * 3;
    
    // Email/call instructions
    ctx.fillStyle = '#0066CC'; // Blue for normal obstacles
    ctx.fillText("• Answer emails and calls for COINS", x, currentY);
    currentY += lineHeight;
    ctx.fillText("  (only wrong ones cost lives)", x, currentY);
    currentY += lineHeight * 1.5;
    
    // Skull/hacker warning
    ctx.fillStyle = '#AD0709'; // Red for dangerous obstacles
    ctx.fillText("• AVOID skull virus and hackers!", x, currentY);
    currentY += lineHeight;
    ctx.fillText("  They will cost you 1 life!", x, currentY);
    
    gameOver = false;
    
    // Continue the animation loop
    gameAnimationId = requestAnimationFrame(gameLoop);
  }

  function updateGameSpeed(frametimeDelta) {
    gameSpeed += GAME_SPEED_ICR * frametimeDelta;
  }

  function checkCollision(player, obstacle) {
    const playerRect = {
      x: player.x,
      y: player.y,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT
    };

    const obstacleRect = {
      x: obstacle.x,
      y: obstacle.y,
      width: obstacle.width,
      height: obstacle.height
    };

    return (
      playerRect.x < obstacleRect.x + obstacleRect.width &&
      playerRect.x + playerRect.width > obstacleRect.x &&
      playerRect.y < obstacleRect.y + obstacleRect.height &&
      playerRect.y + playerRect.height > obstacleRect.y
    );
  }

  function updateLivesDisplay() {
    console.log('Updating lives display. Current lives:', lives);
    
    // Update heart images
    for (let i = 1; i <= 3; i++) {
      const heartElement = document.getElementById(`heart${i}`);
      if (heartElement) {
        heartElement.src = i <= lives ? "/games/phish404/img/heart.gif" : "/games/phish404/img/heart-deplete.png";
        console.log(`Heart ${i} updated to ${i <= lives ? 'active' : 'depleted'}`);
      } else {
        console.error(`Heart element ${i} not found`);
      }
    }
    
    // Update lives counter text if it exists
    const livesCounter = document.getElementById('lives');
    if (livesCounter) {
      livesCounter.textContent = lives;
      console.log('Lives counter updated to:', lives);
    }
  }
  
  function updateEnergyBar() {
    // Update energy bar width based on current energy
    const energyBar = document.getElementById('energyBar');
    const energyWarning = document.getElementById('energyWarning');
    
    if (energyBar) {
      // Set width as percentage of max energy
      const energyPercentage = Math.max(0, Math.min(100, (energy / MAX_ENERGY) * 100));
      energyBar.style.width = `${energyPercentage}%`;
      
      // Change color based on energy level
      if (energyPercentage > 60) {
        energyBar.style.backgroundColor = '#00ff00'; // Green
      } else if (energyPercentage > 30) {
        energyBar.style.backgroundColor = '#ffff00'; // Yellow
      } else {
        energyBar.style.backgroundColor = '#ff0000'; // Red
      }
    }
    
    // Show warning if energy is critically low
    if (energyWarning) {
      if (energy <= ENERGY_CRITICAL_THRESHOLD) {
        energyWarning.style.display = 'block';
        
        // Play meow sound when energy first becomes critical
        if (!isEnergyWarningSound) {
          catMeowSound.currentTime = 0;
          catMeowSound.play();
          isEnergyWarningSound = true;
          
          // Reset the sound flag after a delay to allow it to play again
          setTimeout(() => {
            isEnergyWarningSound = false;
          }, 5000);
        }
      } else {
        energyWarning.style.display = 'none';
        isEnergyWarningSound = false;
      }
    }
  }

  // Define loseLife function
  function loseLife() {
    console.log('loseLife function called', new Date().toISOString());
    
    // Don't lose life if already game over
    if (gameOver) {
      console.log('Game already over, not losing life');
      return;
    }
    
    // Don't lose life if already invincible
    if (player && player.isInvincible) {
      console.log('Player is invincible, not losing life');
      return;
    }
    
    // Decrease lives and update display
    lives--;
    console.log('Life lost! Lives remaining:', lives);
    
    // Force update the lives display
    const livesDisplay = document.getElementById('lives');
    if (livesDisplay) {
      livesDisplay.textContent = lives;
      console.log('Lives display updated to:', lives);
    } else {
      console.error('Lives display element not found');
    }
    
    // Call the standard update function as well
    updateLivesDisplay();
    
    // If no lives left, game over
    if (lives <= 0) {
      gameOver = true;
      console.log('Game over, no lives left');
      
      // Show game over screen after a short delay to allow the hit animation to complete
      setTimeout(() => {
        showGameOver();
      }, 500);
      
      return; // Don't resume if game over
    }
    
    // Make player invincible for a short time
    if (player) {
      player.isInvincible = true;
      
      // Flash the player to indicate damage
      let flashCount = 0;
      const maxFlashes = 6;
      const flashInterval = setInterval(() => {
        if (!player) {
          clearInterval(flashInterval);
          return;
        }
        
        player.isVisible = !player.isVisible;
        flashCount++;
        
        if (flashCount >= maxFlashes) {
          clearInterval(flashInterval);
          if (player) {
            player.isVisible = true;
            // Keep invincible for a bit longer than the flash
            setTimeout(() => {
              if (player) {
                player.isInvincible = false;
                console.log('Player is no longer invincible');
              }
            }, 500);
          }
        }
      }, 200);
    }
    
    // Stop the game loop briefly when a life is lost
    stopGameLoop();
    
    // Resume the game after a short delay (1 second)
    setTimeout(() => {
      if (!gameOver) {
        console.log('Resuming game after life loss');
        startGameLoop();
      }
    }, 1000);
  }
  
  // Make the function available globally and on window.game for backward compatibility
  window.loseLife = loseLife;
  window.game = window.game || {};
  window.game.loseLife = loseLife;

  // Game animation frame ID to keep track of the loop
  let gameAnimationId = null;
  
  function startGameLoop() {
    console.log('Starting game loop');
    if (!gameLoopRunning) {
      gameLoopRunning = true;
      gameAnimationId = requestAnimationFrame(gameLoop);
      console.log('Game loop started, running:', gameLoopRunning);
    } else {
      console.log('Game loop already running with ID:', gameAnimationId);
    }
  }
  
  function stopGameLoop() {
    console.log('Stopping game loop');
    if (gameLoopRunning) {
      cancelAnimationFrame(gameAnimationId);
      gameLoopRunning = false;
      console.log('Game loop stopped, running:', gameLoopRunning);
    }
  }

  function gameLoop(currentTime) {
    // If popup is visible, don't process game logic but continue the animation loop
    if (popupVisible) {
      console.log('Game logic paused due to popup visible');
      gameAnimationId = requestAnimationFrame(gameLoop);
      return;
    }
    
    // If game is over, don't continue processing
    if (gameOver) {
      console.log('Game loop paused due to gameOver state');
      return;
    }
    
    // Clear the canvas
    clearScreen();

    // Calculate the time difference
    let deltaTime = 0;

    if (previousTime) {
      deltaTime = currentTime - previousTime;
    }

    previousTime = currentTime;

    if (waitingToStart) {
      showStartGameText();
      return;
    }

    // Update game speed
    updateGameSpeed(deltaTime);

    // Update ground
    ground.update(gameSpeed, deltaTime);
    ground.draw();

    // Update player with current energy level
    player.update(gameSpeed, deltaTime, energy);

    // Update obstacles
    obstacleController.update(gameSpeed, deltaTime);
    
    // Update coins
    coinController.update(deltaTime, gameSpeed);
    
    // Update milk bottles with current energy level
    milkController.update(gameSpeed, deltaTime, energy);
    
    // Update burger collectibles
    burgerController.update(deltaTime);
    
    // Update skull obstacles
    skullController.update(gameSpeed, deltaTime);
    
    // Update hacker obstacles
    hackerController.update(gameSpeed, deltaTime);
    
    // Check for hacker projectile collisions with player
    if (hackerController.checkProjectileCollisions) {
      const projectileHit = hackerController.checkProjectileCollisions(player);
      if (projectileHit) {
        console.log('Player hit by hacker projectile!');
      }
    } else {
      console.error('hackerController.checkProjectileCollisions is not a function');
    }
    
    // Draw player
    player.draw();
    
    // Draw obstacles
    obstacleController.draw();
    
    // Draw coins
    coinController.draw(ctx);
    
    // Draw milk bottles with deltaTime for notification animation
    milkController.draw(deltaTime);
    
    // Draw burger collectibles with deltaTime for notification animation
    burgerController.draw(ctx, deltaTime);
    
    // Draw skull obstacles
    skullController.draw();
    
    // Draw hacker obstacles
    hackerController.draw(deltaTime);
    
    // Check for coin collisions
    coinController.checkCollision(player);
    
    // Note: The coin controller already plays the sound and updates the counter internally
    // The coin counter UI is also updated in the coin controller's draw method
    
    // Check for milk bottle collisions
    const milkCollision = milkController.checkCollisions(player);
    if (milkCollision) {
      // Replenish energy when milk is collected
      energy = Math.min(MAX_ENERGY, energy + ENERGY_FROM_MILK);
      updateEnergyBar();
    }
    
    // Check for burger collisions
    if (burgerController.checkCollision(player)) {
      // Burger collected - special power-up effect
      
      // 1. Restore one life if not at max
      if (lives < 3) {
        lives++;
        updateLivesDisplay();
      }
      
      // 2. Restore full energy
      energy = MAX_ENERGY;
      updateEnergyBar();
      
      // 3. Reset energy warning flags
      isEnergyWarningShown = false;
      document.getElementById('energyWarning').style.display = 'none';
      
      // 4. Play special power-up sound
      burgerSound.currentTime = 0;
      burgerSound.play().catch(e => console.log("Error playing burger sound:", e));
      
      // 5. Visual feedback (flash screen)
      canvas.style.animation = 'flash 0.5s';
      setTimeout(() => {
        canvas.style.animation = '';
      }, 500);
    }
    
    // Check for skull collisions
    const skullCollision = skullController.checkCollision(player);
    if (skullCollision) {
      // Lose a life when hitting a skull
      if (typeof window.loseLife === 'function') {
        window.loseLife();
      } else if (window.game && typeof window.game.loseLife === 'function') {
        window.game.loseLife();
      } else {
        console.error('loseLife function not found!');
      }
      
      // Play cat hit sound
      const catHitSound = new Audio('/games/phish404/audio/cat-hit.mp3');
      catHitSound.volume = gameVolume;
      if (!isMuted) {
        catHitSound.play().catch(e => console.log("Error playing cat hit sound:", e));
      }
    }
    
    // Check for hacker collisions
    const hackerCollision = hackerController.checkCollision(player);
    if (hackerCollision) {
      // Lose a life when hitting a hacker
      if (typeof window.loseLife === 'function') {
        window.loseLife();
      } else if (window.game && typeof window.game.loseLife === 'function') {
        window.game.loseLife();
      } else {
        console.error('loseLife function not found!');
      }
      
      // Play wrong sound
      wrongSound.currentTime = 0;
      wrongSound.play().catch(e => console.log("Error playing wrong sound:", e));
    }
    
    // Check for projectile collisions from the hacker
    console.log('Checking for projectile collisions in game loop');
    const projectileCollision = hackerController.checkProjectileCollisions(player);
    console.log('Projectile collision result:', projectileCollision);
    
    if (projectileCollision) {
      console.log('PROJECTILE HIT DETECTED! Losing a life...');
      // Lose a life when hit by a projectile
      if (typeof loseLife === 'function') {
        loseLife();
      } else {
        console.error('loseLife function not found!');
        // Fallback to direct life decrement if loseLife is not available
        lives--;
        updateLivesDisplay();
        if (lives <= 0) {
          gameOver = true;
          showGameOver();
        }
      }
    }
    
    // Decrease energy over time
    if (!gameOver && !waitingToStart) {
      energy = Math.max(0, energy - ENERGY_DECREASE_RATE);
      updateEnergyBar();
      
      // Show warning when energy is critically low
      if (energy <= ENERGY_CRITICAL_THRESHOLD && !isEnergyWarningShown) {
        isEnergyWarningShown = true;
        document.getElementById('energyWarning').style.display = 'block';
        
        // Play cat meow sound when energy is low (if not already played)
        if (!isEnergyWarningSound) {
          catMeowSound.currentTime = 0;
          catMeowSound.play().catch(e => console.log("Error playing meow sound:", e));
          isEnergyWarningSound = true;
          
          // Reset the sound flag after a delay
          setTimeout(() => {
            isEnergyWarningSound = false;
          }, 10000); // Only play sound again after 10 seconds
        }
      }
    }

    // Check for collisions with obstacles
    const collision = obstacleController.collideWith(player);

    if (collision) {
      console.log('Collision detected with:', collision.type);
      if (collision.type === 'email') {
        showEmailPhishingPopup();
        return; // Early return to prevent further game loop execution
      } else if (collision.type === 'phone') {
        showPhoneVishingPopup();
        return; // Early return to prevent further game loop execution
      }
    }

    // Show start game text if waiting to start
    if (waitingToStart) {
      showStartGameText();
    }

    // Request next animation frame if game is not over
    if (!gameOver) {
      gameAnimationId = requestAnimationFrame(gameLoop);
    }
  }

  // Function to increase player level and update UI
  function increasePlayerLevel() {
    playerLevel++;
    const levelElement = document.getElementById('levelCount');
    if (levelElement) {
      levelElement.textContent = `LV${playerLevel}`;
    }
    
    // Play level up sound
    correctSound.currentTime = 0;
    correctSound.play();
    
    console.log(`Player leveled up to level ${playerLevel}`);
  }

  // Popup result functions
  function showResultPopup(isPhished) {
    console.log(`Showing result popup. isPhished: ${isPhished}`);
    const resultPopup = document.getElementById('resultPopup');
    const resultTitle = document.getElementById('resultTitle');

    if (!resultPopup) {
      console.error('Result popup element not found!');
      return;
    }
    
    if (resultTitle) {
      resultTitle.innerText = isPhished ? "You have been PHISHED!" : "Great Job!";
    }
    
    // Note: We don't call loseLife() here anymore since it's called before showing the popup
    
    resultPopup.style.display = 'block';
    popupVisible = true;
    
    const continueButton = resultPopup.querySelector('button');
    if (continueButton) {
      // Remove any existing event listeners by replacing the button
      const newButton = continueButton.cloneNode(true);
      continueButton.parentNode.replaceChild(newButton, continueButton);
      
      // Add new event listener
      newButton.onclick = function() {
        console.log('Result popup continue button clicked');
        resultPopup.style.display = 'none';
        popupVisible = false;
        
        // Don't reset controllers here - just resume the game
        resumeGameAfterPopup();
      };
    } else {
      console.error('Continue button not found in result popup');
    }
    
    // Set message based on whether player was phished
    const resultMessage = document.getElementById('resultMessage');
    if (resultMessage) {
      if (isPhished) {
        resultMessage.innerText = "You clicked on a suspicious link or followed instructions from an unknown caller. Always verify before clicking links or following phone instructions.";
      } else {
        resultMessage.innerText = "You correctly identified the phishing attempt. Stay vigilant!";
      }
    }
  }

  // Function to explicitly resume the game after popup interactions
  function resumeGame() {
    console.log('Resuming game after popup, preserving coin count', new Date().toISOString());
    
    // Hide all popups to ensure they're closed
    document.getElementById('resultPopup').style.display = 'none';
    document.getElementById('vishingResultPopup').style.display = 'none';
    document.getElementById('emailPopup').style.display = 'none';
    document.getElementById('phonePopup').style.display = 'none';
    
    // Reset game state
    gameOver = false;
    popupVisible = false;
    waitingToStart = false;
    
    // Reset the player's position and state
    if (player && typeof player.reset === 'function') {
      player.reset();
    }
    
    // Use the helper function to preserve coins while resetting controllers
    preserveCoinsAndResetControllers();
    
    // Reset previous time for smooth animation
    previousTime = performance.now();
    
    // Cancel any existing animation frame to avoid duplicates
    if (gameAnimationId !== null) {
      cancelAnimationFrame(gameAnimationId);
      gameAnimationId = null;
    }
    
    // Re-enable keyboard controls
    setupKeyboardListeners();
    
    // Clear the screen and redraw
    clearScreen();
    if (ground) ground.draw();
    if (player) player.draw();
    if (obstacleController) obstacleController.draw();
    if (coinController) coinController.draw(ctx);
    if (milkController) milkController.draw(0);
    if (burgerController) burgerController.draw(ctx, 0);
    if (skullController) skullController.draw();
    if (hackerController) hackerController.draw(0);
    
    // Start the game loop with a small delay to ensure everything is ready
    setTimeout(() => {
      console.log('Starting game loop after resume');
      gameAnimationId = requestAnimationFrame(gameLoop);
    }, 100);
  }
  
  function closeResultPopup() {
    console.log('Closing result popup, lives:', lives);
    document.getElementById('resultPopup').style.display = 'none';
    document.getElementById('vishingResultPopup').style.display = 'none';
    document.getElementById('emailPopup').style.display = 'none';
    document.getElementById('phonePopup').style.display = 'none';
    
    popupVisible = false; // Reset popup visible flag
    
    // Reset controllers
    if (coinController && typeof coinController.reset === 'function') coinController.reset();
    if (milkController && typeof milkController.reset === 'function') milkController.reset();
    if (burgerController && typeof burgerController.reset === 'function') burgerController.reset();
    if (skullController && typeof skullController.reset === 'function') skullController.reset();
    if (hackerController && typeof hackerController.reset === 'function') hackerController.reset();
    
    // Reset player position
    if (player && typeof player.reset === 'function') player.reset();
    
    if (lives > 0) {
      resumeGame();
    } else {
      console.log('Resetting game');
      resetGame();
    }
  }

  function showVishingResultPopup(isPhished) {
    console.log(`Showing vishing result popup. isPhished: ${isPhished}`);
    const vishingResultPopup = document.getElementById('vishingResultPopup');
    const vishingResultTitle = document.getElementById('vishingResultTitle');
    
    if (!vishingResultPopup) {
      console.error('Vishing result popup element not found!');
      return;
    }
    
    if (vishingResultTitle) {
      vishingResultTitle.innerText = isPhished ? "You have been VISHED!" : "Great Job!";
    }
    
    // Note: We don't call loseLife() here anymore since it's called before showing the popup
    
    vishingResultPopup.style.display = 'block';
    popupVisible = true;
    
    // Set up the continue button to resume the game
    const continueButton = vishingResultPopup.querySelector('button');
    if (continueButton) {
      // Remove any existing event listeners to prevent duplicates
      const newButton = continueButton.cloneNode(true);
      continueButton.parentNode.replaceChild(newButton, continueButton);
      
      newButton.onclick = function() {
        console.log('Vishing result popup continue button clicked');
        vishingResultPopup.style.display = 'none';
        popupVisible = false;
        
        // Use the helper function to preserve coins while resetting controllers
        preserveCoinsAndResetControllers();
        
        // Reset player position with type checking
        if (player && typeof player.reset === 'function') player.reset();
        
        // Resume game if lives remaining, otherwise reset
        if (lives > 0) {
          console.log('Lives remaining, resuming game after vishing popup');
          resumeGame();
        } else {
          console.log('No lives remaining, resetting game after vishing popup');
          resetGame();
        }
      };
    } else {
      console.error('Continue button not found in vishing result popup');
    }
    
    // Set message based on whether player was vished
    const vishingResultMessage = document.getElementById('vishingResultMessage');
    if (vishingResultMessage) {
      if (isPhished) {
        vishingResultMessage.innerText = "You followed instructions from an unknown caller. Always verify the identity of callers before providing information or following instructions.";
      } else {
        vishingResultMessage.innerText = "You correctly identified the vishing attempt. Stay vigilant!";
      }
    }
    
    console.log('Vishing result popup shown, popupVisible:', popupVisible);
  }

  // Setup keyboard event listeners
  function setupKeyboardListeners() {
    console.log('Setting up keyboard listeners');
    // Remove any existing listeners first to prevent duplicates
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    
    // Add fresh listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    console.log('Keyboard listeners set up');
  }
  
  // Handle keydown events
  function handleKeyDown(event) {
    if (event.code === 'Space') {
      if (waitingToStart) {
        waitingToStart = false;
        return;
      }
      
      // Only process space if no popup is visible
      if (!popupVisible && !gameOver) {
        if (player) player.startJump();
      }
    }
  }
  
  // Handle keyup events
  function handleKeyUp(event) {
    if (event.code === 'Space') {
      // Only process space if no popup is visible
      if (!popupVisible && !gameOver) {
        if (player) player.endJump();
      }
    }
  }
  
  // Make resumeGame globally accessible for inline HTML handlers
  window.resumeGame = function() {
    console.log('Resuming game from global handler, lives:', lives);
    // Reset game state flags
    gameOver = false;
    popupVisible = false;
    waitingToStart = false;
    
    // Clear the screen first
    clearScreen();
    
    // Make sure the player and obstacles are visible
    if (player) player.draw(ctx);
    if (obstacleController) obstacleController.draw(ctx);
    
    // Ensure keyboard event listeners are active
    setupKeyboardListeners();
    
    // Start the game loop with a slight delay to ensure everything is ready
    setTimeout(() => {
      startGameLoop();
      console.log('Game loop started after delay');
    }, 100);
    
    console.log('Game resumed');
  };
  
  function resumeGame() {
    // Call the global version
    window.resumeGame();
  }
  
  function closeVishingResultPopup() {
    console.log('Closing vishing result popup, lives:', lives);
    document.getElementById('vishingResultPopup').style.display = 'none';
    popupVisible = false; // Reset popup visible flag
    if (lives > 0) {
      resumeGame();
    } else {
      console.log('Resetting game');
      resetGame();
    }
  }

  // Email phishing popup
  function showEmailPhishingPopup() {
    // Pause the game loop
    stopGameLoop();
    
    // Set game state
    gameOver = true;
    popupVisible = true; // Set popup visible flag
    
    // Show the email popup with options
    document.getElementById('emailPopup').style.display = 'block';
    
    // Play phishing sound
    wrongSound.currentTime = 0;
    wrongSound.volume = isMuted ? 0 : gameVolume;
  }
  
  function showPhoneVishingPopup() {
    // Pause the game loop
    stopGameLoop();
    
    // Set game state
    gameOver = true;
    popupVisible = true; // Set popup visible flag
    
    // Get the phone popup buttons
    const phoneDoItBtn = document.getElementById('phoneDoIt');
    const phoneSkipBtn = document.getElementById('phoneSkip');
    
    // Disable the buttons until audio is done playing
    phoneDoItBtn.disabled = true;
    phoneSkipBtn.disabled = true;
    
    // Add visual indication that buttons are disabled
    phoneDoItBtn.style.opacity = '0.5';
    phoneSkipBtn.style.opacity = '0.5';
    phoneDoItBtn.style.cursor = 'not-allowed';
    phoneSkipBtn.style.cursor = 'not-allowed';
    
    // Play vishing sound
    vishingSound.currentTime = 0;
    vishingSound.volume = isMuted ? 0 : gameVolume;
    vishingSound.play()
      .catch(error => console.log('Error playing vishing sound:', error));
    
    // Enable buttons when audio ends
    vishingSound.onended = function() {
      phoneDoItBtn.disabled = false;
      phoneSkipBtn.disabled = false;
      phoneDoItBtn.style.opacity = '1';
      phoneSkipBtn.style.opacity = '1';
      phoneDoItBtn.style.cursor = 'pointer';
      phoneSkipBtn.style.cursor = 'pointer';
      console.log('Vishing audio ended, buttons enabled');
    };
    
    // Show the phone popup with options
    document.getElementById('phonePopup').style.display = 'block';
  }

  // Create audio objects once to prevent duplication
  const vishingSound = new Audio('/games/phish404/audio/vishing.mp3');
  const gameOverSound = new Audio('/games/phish404/audio/losetrumpet.mp3');
  const declineSound = new Audio('/games/phish404/audio/Decline.wav');
  
  // Store all game sounds for volume control
  const gameSounds = [vishingSound, gameOverSound, declineSound, correctSound, wrongSound, catMeowSound];
  
  // Update initial volume for all sounds
  updateAudioVolume();

  // Function to style popups for better readability
  function stylePopups() {
    // Style all popups with dark background and light text
    const popups = [
      document.getElementById('emailPopup'),
      document.getElementById('phonePopup'),
      document.getElementById('resultPopup'),
      document.getElementById('vishingResultPopup')
    ];
  
    popups.forEach(popup => {
      if (popup) {
        popup.style.backgroundColor = '#1a1a2e';
        popup.style.color = '#ffffff';
        popup.style.border = '2px solid rgb(0, 183, 255)';
        popup.style.borderRadius = '8px';
        popup.style.boxShadow = '0 0 15px rgba(0, 183, 255, 0.7)';
      }
    });
  
    // Style all buttons for better visibility
    const buttons = document.querySelectorAll('#emailPopup button, #phonePopup button, #resultPopup button, #vishingResultPopup button');
    buttons.forEach(button => {
      button.style.backgroundColor = 'rgb(0, 183, 255)';
      button.style.color = '#ffffff';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.padding = '10px 15px';
      button.style.margin = '5px';
      button.style.cursor = 'pointer';
    });
  }

  // Initialize the game
  setScreen();
  window.addEventListener('resize', setScreen);
  
  // Define the key handler function
  function handleKeyDown(event) {
    if (event.code === 'Space' && gameOver && lives > 0) {
      gameOver = false;
      startGameLoop();
    } else if (event.code === 'Space' && waitingToStart) {
      waitingToStart = false;
      startGameLoop();
    } else if (event.code === 'Space' && !gameOver && !player.jumpInProgress) {
      player.jumpPressed = true;
      player.jumpStartTime = Date.now();
    }
  }
  
  // Start the game
  window.addEventListener('keydown', handleKeyDown);
  
  // Add event listeners for popup close buttons
  function setupPopupEventListeners() {
    console.log('Setting up popup event listeners');
    
    // Find all close buttons in result popups
    const resultPopupButtons = document.querySelectorAll('#resultPopup button');
    if (resultPopupButtons.length > 0) {
      // Add event listener to all buttons in the result popup
      resultPopupButtons.forEach(button => {
        button.addEventListener('click', function() {
          console.log('Result popup close button clicked', new Date().toISOString());
          document.getElementById('resultPopup').style.display = 'none';
          if (lives > 0) {
            console.log('Lives remaining, resuming game');
            resumeGame();
          } else {
            console.log('No lives remaining, resetting game');
            resetGame();
          }
        });
      });
      console.log('Result popup close button listeners added');
    } else {
      console.error('Could not find any buttons in the result popup');
    }
    
    // Find all close buttons in vishing result popup
    const vishingPopupButtons = document.querySelectorAll('#vishingResultPopup button');
    if (vishingPopupButtons.length > 0) {
      // Add event listener to all buttons in the vishing popup
      vishingPopupButtons.forEach(button => {
        // Remove any existing event listeners first
        button.removeEventListener('click', closeVishingResultPopup);
        
        // Add fresh event listener
        button.addEventListener('click', function() {
          console.log('Vishing popup close button clicked', new Date().toISOString());
          document.getElementById('vishingResultPopup').style.display = 'none';
          popupVisible = false; // Reset popup visible flag
          
          // Force redraw of the game elements
          clearScreen();
          if (player) player.draw(ctx);
          if (obstacleController) obstacleController.draw(ctx);
          
          if (lives > 0) {
            console.log('Lives remaining, resuming game');
            // Use a direct approach to resume the game
            gameOver = false;
            waitingToStart = false;
            
            // Ensure keyboard event listeners are active
            setupKeyboardListeners();
            
            // Start the game loop with a slight delay
            setTimeout(() => {
              startGameLoop();
              console.log('Game loop started after vishing popup close');
            }, 100);
          } else {
            console.log('No lives remaining, resetting game');
            resetGame();
          }
        });
      });
      console.log('Vishing popup close button listeners added');
    } else {
      console.error('Could not find any buttons in the vishing popup');
    }
    
    // Add event handlers for phone popup buttons
    const phoneDoItBtn = document.getElementById('phoneDoIt');
    const phoneSkipBtn = document.getElementById('phoneSkip');
    
    if (phoneDoItBtn && phoneSkipBtn) {
      // "Do what it says" button - lose a life and show vishing result popup
      phoneDoItBtn.addEventListener('click', function() {
        console.log('Phone "Do what it says" button clicked');
        document.getElementById('phonePopup').style.display = 'none';
        
        // Play wrong sound for incorrect choice
        wrongSound.currentTime = 0;
        wrongSound.play();
        
        // Use the safe decrement function
        const lifeLost = decrementLife();
        
        if (lifeLost) {
          console.log('Showing vishing result popup after life loss');
          // Show vishing result popup and let it handle game resumption
          showVishingResultPopup(true);
        } else if (gameOver) {
          console.log('Game over already triggered from phone popup');
          showGameOver();
        } else {
          console.error('Failed to process life loss from phone popup');
          // Still show the vishing result popup even if life decrement failed
          showVishingResultPopup(true);
        }
      });
      
      // "Skip" button - show vishing result popup with success message
      phoneSkipBtn.addEventListener('click', function() {
        console.log('Phone "Skip" button clicked');
        document.getElementById('phonePopup').style.display = 'none';
        
        // Play correct sound for correct choice
        correctSound.currentTime = 0;
        correctSound.play();
        
        // Add 10 coins for correct answer
        coinController.coinsCollected += 10;
        document.getElementById('coinCount').textContent = coinController.coinsCollected;
        
        // Increase player level for correct answer
        increasePlayerLevel();
        
        // Don't show result popup for correct answers, just resume the game
        resumeGameAfterPopup();
      });
      
      console.log('Phone popup button listeners added');
    } else {
      console.error('Could not find phone popup buttons');
    }
  }
  
  // Call this function once at startup to set up all event listeners
  function initEventListeners() {
    // Set up popup event listeners
    setupPopupEventListeners();
    
    // Set up keyboard event listeners
    setupKeyboardListeners();
    
    // Initialize audio controls
    initAudioControls();
    
    console.log('All event listeners initialized');
  }
  
  // Initialize all event listeners with a short delay to ensure DOM is ready
  setTimeout(initEventListeners, 500);

  requestAnimationFrame(gameLoop);

  // Apply styles after a short delay to ensure all elements are loaded
  setTimeout(stylePopups, 500);
  
  // Function to initialize audio controls
  function initAudioControls() {
    const volumeSlider = document.getElementById('volumeSlider');
    const muteButton = document.getElementById('muteButton');
    const musicButton = document.getElementById('musicButton');
    const audioControls = document.getElementById('audioControls');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    // Set initial volume from slider if available
    if (volumeSlider) {
      gameVolume = volumeSlider.value / 100;
      updateVolumeBar();
      
      // Update volume when slider changes
      volumeSlider.addEventListener('input', function() {
        gameVolume = this.value / 100;
        if (gameVolume > 0 && isMuted) {
          isMuted = false;
          updateMuteButton();
        }
        updateAudioVolume();
      });
    }
    
    // Set up mute button
    if (muteButton) {
      updateMuteButton();
      muteButton.addEventListener('click', function() {
        isMuted = !isMuted;
        updateMuteButton();
        updateAudioVolume();
      });
    }
    
    // Set up music button
    if (musicButton) {
      updateMusicButton();
      musicButton.addEventListener('click', function() {
        musicEnabled = !musicEnabled;
        updateMusicButton();
        updateAudioVolume();
      });
    }
    
    // Initial volume update
    updateAudioVolume();
    
    // Start music when user interacts with the game
    const startMusic = () => {
      if (backgroundMusic && !isMuted && musicEnabled) {
        backgroundMusic.volume = gameVolume * 0.5; // Background music at half volume
        backgroundMusic.play().catch(error => console.log('Error playing background music:', error));
      }
      
      // Show audio controls after first interaction
      if (audioControls) {
        audioControls.style.display = 'flex';
      }
      
      window.removeEventListener('keydown', startMusic);
      window.removeEventListener('click', startMusic);
      window.removeEventListener('touchstart', startMusic);
    };
    
    // Start with controls hidden (will show after first interaction)
    if (audioControls) {
      audioControls.style.display = 'none';
    }
    
    // Add interaction listeners
    window.addEventListener('keydown', startMusic, { once: true });
    window.addEventListener('click', startMusic, { once: true });
    window.addEventListener('touchstart', startMusic, { once: true });
  }
  
  // Update the volume bar width based on current volume
  function updateVolumeBar() {
    const volumeBar = document.getElementById('volumeBar');
    if (volumeBar) {
      volumeBar.style.width = `${gameVolume * 100}%`;
    }
  }
  
  // Update the mute button text based on mute state
  function updateMuteButton() {
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
      muteButton.textContent = `SOUND: ${isMuted ? 'OFF' : 'ON'}`;
      muteButton.style.backgroundColor = isMuted ? '#7a0f0f' : '#0f5c0f';
    }
  }
  
  // Update the music button text based on music state
  function updateMusicButton() {
    const musicButton = document.getElementById('musicButton');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    if (musicButton) {
      musicButton.textContent = `MUSIC: ${musicEnabled ? 'ON' : 'OFF'}`;
      musicButton.style.backgroundColor = musicEnabled ? '#0f5c0f' : '#7a0f0f';
      
      // Pause or play music based on state
      if (backgroundMusic) {
        if (musicEnabled && !isMuted) {
          backgroundMusic.volume = gameVolume * 0.5;
          backgroundMusic.play().catch(error => console.log('Error playing music:', error));
        } else {
          backgroundMusic.pause();
        }
      }
    }
  }
  
  // Function to update audio volume for all game sounds
  function updateAudioVolume() {
    const volume = isMuted ? 0 : gameVolume;
    
    // Update all game sounds
    gameSounds.forEach(sound => {
      if (sound) {
        sound.volume = volume;
      }
    });
    
    // Update background music (at half volume)
    const backgroundMusic = document.getElementById('backgroundMusic');
    if (backgroundMusic) {
      if (musicEnabled && !isMuted) {
        backgroundMusic.volume = volume * 0.5;
        backgroundMusic.play().catch(error => console.log('Error playing music:', error));
      } else {
        backgroundMusic.pause();
      }
    }
    
    // Update volume bar display
    updateVolumeBar();
    
    // Save preferences
    localStorage.setItem('gameVolume', gameVolume);
    localStorage.setItem('isMuted', isMuted);
    localStorage.setItem('musicEnabled', musicEnabled);
  }

  // Track if we're currently processing a life loss
  let isProcessingLifeLoss = false;

  // Function to safely decrement player lives
  function decrementLife() {
    if (isProcessingLifeLoss) {
      console.log('Life loss already being processed, ignoring duplicate call');
      return false;
    }

    if (lives <= 0) {
      console.log('No lives left, cannot decrement further');
      return false;
    }

    isProcessingLifeLoss = true;
    try {
      lives--;
      console.log('Life decremented. Remaining lives:', lives);
      updateLivesDisplay();
      
      if (lives <= 0) {
        console.log('No lives remaining, showing game over');
        gameOver = true;
        setTimeout(() => showGameOver(), 500); // Small delay before showing game over
      }
      
      return true;
    } catch (error) {
      console.error('Error in decrementLife:', error);
      return false;
    } finally {
      isProcessingLifeLoss = false;
    }
  }

  // Function to reset the game to initial state
  function resetGame() {
    console.log('Resetting game to initial state');
    
    // Reset game state
    gameOver = false;
    waitingToStart = true;
    popupVisible = false;
    lives = 3; // Reset lives to starting value
    playerLevel = 1; // Reset level to 1
    
    // Reset player
    if (player) {
      player.reset();
      player.isInvincible = false;
      player.isVisible = true;
    }
    
    // Reset controllers
    if (coinController) {
      coinController.reset();
      coinController.coinsCollected = 0; // Reset coins to 0
      document.getElementById('coinCount').textContent = '0';
    }
    
    if (milkController) milkController.reset();
    if (burgerController) burgerController.reset();
    if (skullController) skullController.reset();
    if (hackerController) hackerController.reset();
    if (obstacleController) obstacleController.reset();
    
    // Update UI
    updateLivesDisplay();
    
    // Update level display
    const levelElement = document.getElementById('levelCount');
    if (levelElement) {
      levelElement.textContent = `LV${playerLevel}`;
    }
    
    // Clear the canvas
    clearScreen();
    
    // Show start screen
    showStartGameText();
    
    // Reset game loop
    stopGameLoop();
    
    console.log('Game has been reset');
  }
  
  // Function to show game over screen with flashy effects
  function showGameOver() {
    console.log('Showing game over screen');
    
    // Pause all game elements
    stopGameLoop();
    
    // Hide all other popups
    const popups = ['emailPopup', 'phonePopup', 'resultPopup', 'vishingResultPopup'];
    popups.forEach(popupId => {
      const popup = document.getElementById(popupId);
      if (popup) popup.style.display = 'none';
    });
    
    // Play game over sound
    gameOverSound.currentTime = 0;
    gameOverSound.volume = isMuted ? 0 : gameVolume;
    gameOverSound.play().catch(e => console.log('Error playing game over sound:', e));
    
    // Stop background music
    const backgroundMusic = document.getElementById('backgroundMusic');
    if (backgroundMusic) {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    }
    
    // Create or get game over popup
    let gameOverPopup = document.getElementById('gameOverPopup');
    if (!gameOverPopup) {
      gameOverPopup = document.createElement('div');
      gameOverPopup.id = 'gameOverPopup';
      document.body.appendChild(gameOverPopup);
    }
    
    // Style the game over popup
    gameOverPopup.style.position = 'fixed';
    gameOverPopup.style.top = '0';
    gameOverPopup.style.left = '0';
    gameOverPopup.style.width = '100%';
    gameOverPopup.style.height = '100%';
    gameOverPopup.style.display = 'flex';
    gameOverPopup.style.flexDirection = 'column';
    gameOverPopup.style.justifyContent = 'center';
    gameOverPopup.style.alignItems = 'center';
    gameOverPopup.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    gameOverPopup.style.color = 'white';
    gameOverPopup.style.zIndex = '2000'; // Higher z-index to ensure it's on top
    gameOverPopup.style.fontFamily = '"Press Start 2P", cursive, Arial, sans-serif';
    gameOverPopup.style.textAlign = 'center';
    gameOverPopup.style.padding = '20px';
    gameOverPopup.style.boxSizing = 'border-box';
    gameOverPopup.style.backdropFilter = 'blur(3px)';
    
    // Game over content with pixel art style
    gameOverPopup.innerHTML = `
      <div style="
        background: rgba(20, 20, 30, 0.85);
        border: 4px solid #ff3366;
        border-radius: 10px;
        padding: 30px 40px;
        box-shadow: 0 0 30px rgba(255, 51, 102, 0.6);
        max-width: 80%;
        position: relative;
        overflow: hidden;
      ">
        <!-- Glass overlay effect -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.1) 0%,
            rgba(255, 255, 255, 0) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          pointer-events: none;
        "></div>
        
        <h1 style="
          font-size: 3rem;
          color: #ff3366;
          text-shadow: 3px 3px 0 #000, 5px 5px 0 #ff3366;
          margin: 0 0 20px 0;
          letter-spacing: 3px;
          position: relative;
          z-index: 1;
        ">GAME OVER</h1>
        
        <p style="
          font-size: 1.1rem;
          margin-bottom: 30px;
          line-height: 1.5;
          color: #f0f0f0;
          position: relative;
          z-index: 1;
        ">You've been phished! Better luck next time!</p>
        
        <button id="restartButton" style="
          background: linear-gradient(180deg, #4a6cf7 0%, #3a5bd9 100%);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 12px 24px;
          font-size: 1rem;
          font-family: 'Press Start 2P', cursive, Arial, sans-serif;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 1px;
          position: relative;
          overflow: hidden;
          z-index: 1;
          box-shadow: 0 4px 0 #2d46b9, 0 6px 0 #1e3a8a;
          transition: all 0.1s ease;
          outline: none;
        ">
          <span style="position: relative; z-index: 2;">PLAY AGAIN</span>
          <!-- Pixel art glass effect -->
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.4) 0%,
              rgba(255, 255, 255, 0.1) 50%,
              rgba(255, 255, 255, 0.4) 100%
            );
            opacity: 0.6;
            pointer-events: none;
          "></div>
        </button>
      </div>
      
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        #restartButton {
          animation: pulse 1.5s infinite;
        }
        #restartButton:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #2d46b9, 0 8px 0 #1e3a8a;
        }
        #restartButton:active {
          transform: translateY(4px);
          box-shadow: 0 2px 0 #2d46b9, 0 4px 0 #1e3a8a;
          background: linear-gradient(180deg, #3a5bd9 0%, #2d46b9 100%);
        }
      </style>
    `;
    
    // Add restart button handler
    const restartButton = document.getElementById('restartButton');
    if (restartButton) {
      restartButton.onclick = function() {
        // Play decline sound on restart
        declineSound.currentTime = 0;
        declineSound.volume = isMuted ? 0 : gameVolume;
        declineSound.play().catch(e => console.log('Error playing decline sound:', e));
        
        // Fade out the game over screen
        gameOverPopup.style.transition = 'opacity 0.5s ease-out';
        gameOverPopup.style.opacity = '0';
        
        // Remove the popup after fade out and reset the game
        setTimeout(() => {
          gameOverPopup.remove();
          resetGame();
        }, 500);
      };
    }
  }
  
  // Function to handle game resumption after popup
  function resumeGameAfterPopup() {
    console.log('Resuming game after popup, preserving coin count');
    
    // Hide all popups
    document.getElementById('resultPopup').style.display = 'none';
    document.getElementById('vishingResultPopup').style.display = 'none';
    document.getElementById('emailPopup').style.display = 'none';
    document.getElementById('phonePopup').style.display = 'none';
    
    // Only update these flags if not already set
    if (gameOver) gameOver = false;
    if (waitingToStart) waitingToStart = false;
    if (popupVisible) popupVisible = false;
    
    // Don't reset player position here - let the game loop handle it
    // Just make sure the player is visible and not invincible
    if (player) {
      player.isVisible = true;
      player.isInvincible = false;
    }
    
    // Don't reset controllers here - we want to preserve the game state
    // Just make sure the game loop is running
    if (typeof gameLoopRunning === 'undefined' || !gameLoopRunning) {
      console.log('Game loop was stopped or not defined, starting it');
      stopGameLoop(); // Ensure any existing loop is stopped
      startGameLoop();
    } else {
      console.log('Game loop already running, not restarting');
    }
    
    console.log('Game resumed after popup. Game loop running:', gameLoopRunning);
  }

  // Event listeners for popups
  const emailCleanBtn = document.getElementById('emailClean');
  if (emailCleanBtn) {
    emailCleanBtn.addEventListener('click', () => {
      console.log('Email Clean button clicked - wrong choice', new Date().toISOString());
      document.getElementById('emailPopup').style.display = 'none';
      wrongSound.currentTime = 0;
      wrongSound.play();
      
      // Use the safe decrement function
      const lifeLost = decrementLife();
      
      if (lifeLost) {
        console.log('Showing result popup after life loss');
        showResultPopup(true);
      } else if (gameOver) {
        console.log('Game over already triggered');
      } else {
        console.error('Failed to process life loss');
      }
    });
  } else {
    console.error('Email Clean button not found');
  }
  
  // Event listener for the phishing link
  const phishingLinkBtn = document.getElementById('phishingLink');
  if (phishingLinkBtn) {
    phishingLinkBtn.addEventListener('click', (e) => {
      console.log('Phishing link clicked - wrong choice', new Date().toISOString());
      e.preventDefault(); // Prevent default link behavior
      document.getElementById('emailPopup').style.display = 'none';
      wrongSound.currentTime = 0;
      wrongSound.play();
      
      // Use the safe decrement function
      const lifeLost = decrementLife();
      
      if (lifeLost) {
        console.log('Showing result popup after phishing link click');
        showResultPopup(true);
      } else if (gameOver) {
        console.log('Game over already triggered from phishing link');
      } else {
        console.error('Failed to process life loss from phishing link');
      }
    });
  } else {
    console.error('Phishing link not found');
  }

  const emailMaliciousBtn = document.getElementById('emailMalicious');
  if (emailMaliciousBtn) {
    emailMaliciousBtn.addEventListener('click', () => {
      console.log('Email Malicious button clicked - correct choice');
      document.getElementById('emailPopup').style.display = 'none';
      correctSound.currentTime = 0;
      correctSound.play();
      
      // Add 10 coins for correct answer
      coinController.coinsCollected += 10;
      document.getElementById('coinCount').textContent = coinController.coinsCollected;
      
      // Increase player level for correct answer
      increasePlayerLevel();
      
      // Don't show result popup for correct answers, just resume the game
      resumeGameAfterPopup();
    });
  } else {
    console.error('Email Malicious button not found');
  }

  // NOTE: Removed duplicate event listeners for phone popup buttons
  // These are already handled in setupPopupEventListeners()

  // Space key to start the game
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && waitingToStart) {
      waitingToStart = false;
    }
  });
  
  // Expose controllers and game variables to the window scope for game-fixes.js
  window.coinController = coinController;
  window.milkController = milkController;
  window.burgerController = burgerController;
  window.skullController = skullController;
  window.hackerController = hackerController;
  window.obstacleController = obstacleController;
  window.player = player;
  window.lives = lives;
  window.updateLivesDisplay = updateLivesDisplay;
  console.log('Game controllers exposed to window scope for game-fixes.js');
});
