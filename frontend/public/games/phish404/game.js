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

  // Global audio settings - set to on by default
  let gameVolume = 1.0;
  let isMuted = false;  // Sound effects on by default
  let musicEnabled = true;  // Music on by default
  const gameSounds = []; // Array to store all game sound effects
  
  // Initialize sound effects
  const correctSound = new Audio('/games/phish404/audio/correct.mp3');
  gameSounds.push(correctSound);
  const wrongSound = new Audio('/games/phish404/audio/wrong.mp3');
  gameSounds.push(wrongSound);
  
  // Shield sounds
  const shieldSound = new Audio('/games/phish404/audio/coin-hit.mp3');
  gameSounds.push(shieldSound);
  const shieldBreakSound = new Audio('/games/phish404/audio/shield-break.mp3');
  gameSounds.push(shieldBreakSound);
  const shieldGuardSound = new Audio('/games/phish404/audio/shield-guard.mp3');
  gameSounds.push(shieldGuardSound);
  
  // Burger powerup sound
  const burgerSound = new Audio('/games/phish404/audio/yay-6120.mp3');
  gameSounds.push(burgerSound);
  
  // Cat meow sound for low energy
  const catMeowSound = new Audio('/games/phish404/audio/cat-meow-hungry.mp3');
  gameSounds.push(catMeowSound);
  
  // Cat hit sound
  const catHitSound = new Audio('/games/phish404/audio/cat-hit.mp3');
  gameSounds.push(catHitSound);
  
  // Set initial volumes and reduce jump sound volume
  gameSounds.forEach(sound => {
    if (sound) {
      // Reduce volume for jump sound specifically
      if (sound.src.includes('jump.mp3')) {
        sound.volume = gameVolume * 0.4;
      } else {
        sound.volume = gameVolume;
      }
    }
  });
  
  // Load saved audio preferences
  (function loadAudioPreferences() {
    // Default values if not set in localStorage
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
  let lives = 6; // Increased from 3 to 6 for better player experience
  
  // Energy system
  let energy = 100;
  const MAX_ENERGY = 100;
  const ENERGY_DECREASE_RATE = 0.02; // Energy decreases by 0.02 per frame (slower drain for better gameplay balance)
  const ENERGY_CRITICAL_THRESHOLD = 30; // Below this threshold, show warning
  const ENERGY_FROM_MILK = 40; // Energy gained from collecting milk
  const ENERGY_FROM_BURGER = MAX_ENERGY; // Burger restores full energy
  let isEnergyWarningShown = false;
  let isEnergyWarningSound = false;
  
  let player = null;
  let ground = null;
  // Define controllers as local variables first
  let obstacleController = null;
  let coinController = null;
  let milkController = null;
  let burgerController = null;
  let skullController = null;
  let hackerController = null;
  let shieldController = null;
  let attackPowerupController = null;
  
  // Also expose controllers to window object for access by other components
  window.obstacleController = null;
  window.coinController = null;
  window.milkController = null;
  window.burgerController = null;
  window.skullController = null;
  window.hackerController = null;
  window.shieldController = null;
  window.attackPowerupController = null;
  window.electricBallController = null;
  
  // Global flag to track when hacker is in loading mode
  // This is used to prevent drawing viruses and obstacles during loading
  window.hackerIsLoading = false;

  let scaleRatio = null;
  let previousTime = null;
  let gameSpeed = GAME_SPEED_S;
  let gameOver = false;
  let waitingToStart = true;
  let popupVisible = false; // Track if any popup is currently visible
  let gameLoopRunning = false; // Track if game loop is running
  let hackerIsLoading = false; // Global flag to track if hacker is in loading mode

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
    window.obstacleController = obstacleController;
    
    // Create coin controller
    coinController = new CoinController(canvas.width, canvas.height, scaleRatio);
    window.coinController = coinController;
    
    // Create milk controller
    milkController = new MilkController(ctx, canvas.width, canvas.height, scaleRatio);
    window.milkController = milkController;
    
    // Create burger controller
    burgerController = new BurgerController(canvas.width, canvas.height, scaleRatio);
    window.burgerController = burgerController;
    
    // Create skull controller
    skullController = new SkullController(ctx, canvas.width, canvas.height, GROUND_AND_OBSTACLE_SPEED, scaleRatio);
    window.skullController = skullController;
    
    // Create hacker controller with reference to obstacle controller for pausing obstacles during boss battles
    hackerController = new HackerController(ctx, canvas.width, canvas.height, GROUND_AND_OBSTACLE_SPEED, scaleRatio, obstacleController);
    window.hackerController = hackerController;
    
    // Create shield controller
    shieldController = new ShieldPowerupController(canvas.width, canvas.height, scaleRatio);
    shieldController.onlyDuringHackerLoading = true; // Only spawn during hacker loading phase
    window.shieldController = shieldController;
    
    // Create attack powerup controller
    attackPowerupController = new AttackPowerupController(canvas.width, canvas.height, scaleRatio);
    window.attackPowerupController = attackPowerupController;
    
    // Create electric ball controller
    electricBallController = new ElectricBallController(canvas.width, canvas.height, scaleRatio);
    window.electricBallController = electricBallController;
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
    
    // Setup text rendering
    const fontSize = 15 * scaleRatio;
    ctx.font = `${fontSize}px "Press Start 2P", "Courier New", monospace`;
    ctx.textAlign = 'center';
    const centerX = canvas.width / 2;
    const startY = canvas.height / 4;
    const lineHeight = fontSize * 1.5;
    
    // Draw title with flashing SPACE text
    const flashSpeed = 300; // milliseconds per flash cycle
    const isFlashing = Math.floor(Date.now() / flashSpeed) % 2 === 0;
    
    // First draw the regular text in dark blue
    ctx.fillStyle = 'darkblue';
    ctx.fillText("Press      to start", centerX, startY);
    
    // Then overlay the flashing SPACE text
    ctx.fillStyle = isFlashing ? '#00FFFF' : '#0066CC'; // Alternate between cyan and blue
    
    // Calculate the position to place SPACE
    ctx.textAlign = 'left';
    const pressWidth = ctx.measureText("Press ").width;
    const fullText = "Press SPACE to start";
    const fullWidth = ctx.measureText(fullText).width;
    const startX = centerX - (fullWidth / 2) + pressWidth;
    
    ctx.fillText("SPACE", startX, startY);
    
    // Reset to center alignment for remaining text
    ctx.textAlign = 'center';
    
    // Second line
    ctx.fillStyle = 'darkblue';
    ctx.fillText("Try your best to help this CAR* survive!", centerX, startY + lineHeight);
    
    // Add some vertical spacing before instructions
    let currentY = startY + lineHeight * 3;
    
    // Email/call instructions
    ctx.fillStyle = '#0066CC'; // Blue for normal obstacles
    ctx.fillText("ANSWER EMAILS or CALLS for $$$", centerX, currentY);
    currentY += lineHeight;
    ctx.fillText("+10$ +1LV (right) or -1 life (wrong)", centerX, currentY);
    currentY += lineHeight * 1.5;
    
    // Skull/hacker warning
    ctx.fillStyle = '#AD0710'; // Red for dangerous obstacles
    ctx.fillText("AVOID the hacker's VIRUSES!", centerX, currentY);
    currentY += lineHeight;
    ctx.fillText("-1 life", centerX, currentY);
    
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

  function decrementLife() {
    console.log('decrementLife called. Current lives:', lives);
    
    if (lives <= 0) {
      console.log('No lives left to decrement');
      return false;
    }
    
    // Decrement life
    lives--;
    console.log('Life decremented. Remaining lives:', lives);
    
    // Update the display
    updateLivesDisplay();
    
    // Check for game over
    if (lives <= 0) {
      gameOver = true;
      console.log('Game over triggered - no lives left');
      
      // Show game over screen after a short delay
      setTimeout(() => {
        showGameOver();
      }, 500);
      
      return false; // Game over
    }
    
    return true; // Life lost but game continues
  }

  function updateLivesDisplay() {
    console.log('Updating lives display. Current lives:', lives);
    
    // Update heart images for all 6 hearts
    for (let i = 1; i <= 6; i++) {
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
  
  // Pause/resume game function that can be called from other components
  // Make it available globally
  let gamePausedReasons = {}; // Track different reasons for pausing
  
  function pauseGame(shouldPause, reason = 'default') {
    if (shouldPause) {
      // Add this reason to pause reasons
      gamePausedReasons[reason] = true;
      console.log(`Game paused for reason: ${reason}`, gamePausedReasons);
    } else {
      // Remove this reason from pause reasons
      delete gamePausedReasons[reason];
      console.log(`Game resumed for reason: ${reason}`, gamePausedReasons);
    }
    
    // Game is paused if there's at least one reason to pause
    const isPaused = Object.keys(gamePausedReasons).length > 0;
    
    // Update global pause state
    window.gamePaused = isPaused;
    
    return isPaused;
  }
  
  // Make pauseGame available globally
  window.pauseGame = pauseGame;

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
    
    // Check if game is paused by any component
    if (window.gamePaused) {
      // Continue the animation loop but don't update game state
      gameAnimationId = requestAnimationFrame(gameLoop);
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
    
    // Check if we're in boss loading phase
    const isHackerActive = hackerController && hackerController.hacker && hackerController.hacker.active;
    const isHackerLoading = hackerController && hackerController.hacker && hackerController.hacker.isLoading;
    
    // Set global loading state for other controllers (but don't override if hacker controller already set it)
    // The hacker controller manages this flag during loading transitions
    if (isHackerLoading !== undefined) {
      const oldValue = window.hackerIsLoading;
      window.hackerIsLoading = isHackerLoading;
      
      // Debug logging when the flag changes
      if (oldValue !== isHackerLoading) {
        console.log(`GAME LOOP: window.hackerIsLoading changed from ${oldValue} to ${isHackerLoading}`);
      }
    }
    
    // Debug logging (throttled to avoid console spam)
    const now = Date.now();
    if (now - (hackerController.lastDebugLog || 0) > 2000) { // Log every 2 seconds
      console.log('Hacker state - Active:', isHackerActive, 'Loading:', isHackerLoading);
      hackerController.lastDebugLog = now;
    }
    
    // Update shield powerups during hacker loading phase
    if (shieldController) {
      shieldController.update(deltaTime, gameSpeed, isHackerLoading);
      if (player && shieldController.checkCollision) {
        const shieldCollected = shieldController.checkCollision(player);
        if (shieldCollected) {
          console.log('Player collected a shield!');
        }
      }
    } else {
      console.error('Shield controller not available in game loop!');
    }
    
    // Update attack powerups during hacker loading phase
    if (attackPowerupController) {
      attackPowerupController.update(deltaTime, isHackerLoading);
      if (player && attackPowerupController.checkCollision) {
        const attackPowerupCollected = attackPowerupController.checkCollision(player);
        if (attackPowerupCollected) {
          console.log('Player collected an attack powerup!');
          // Add any power-up collection logic here
        }
      }
    } else {
      console.error('Attack powerup controller not available in game loop!');
    }
    
    // Update electric ball controller
    if (electricBallController) {
      electricBallController.update(deltaTime, player, hackerController.hacker);
      
      // Show/hide star instruction based on hacker loading state
      if (isHackerLoading && electricBallController.getShotsRemaining() === 0) {
        electricBallController.showStarInstruction();
      } else {
        electricBallController.hideStarInstruction();
      }
    }
    
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
    
    // Always draw these game elements, regardless of loading state
    // Draw obstacles (except during hacker loading phase)
    if (!window.hackerIsLoading) {
      obstacleController.draw();
    }
    
    // Always draw coins
    coinController.draw(ctx);
    
    // Always draw milk bottles with deltaTime for notification animation
    milkController.draw(deltaTime);
    
    // Always draw burger collectibles with deltaTime for notification animation
    burgerController.draw(ctx, deltaTime);
    
    // Draw skull obstacles (except during hacker loading phase)
    if (!window.hackerIsLoading) {
      skullController.draw();
    }
    
    if (window.hackerIsLoading) {
      console.log('Hacker loading phase - drawing all collectibles but skipping some obstacles');
    }
    
    // Draw hacker obstacles - always draw the hacker itself, but conditionally draw projectiles
    // The draw method will handle this internally based on the loading state
    hackerController.draw(deltaTime, window.hackerIsLoading);
    
    // Draw shield powerups - ALWAYS draw for debugging
    if (shieldController) {
      console.log('Drawing shield powerups (debug mode)');
      shieldController.draw(ctx);
    } else {
      console.error('Shield controller not available for drawing!');
    }
    
    // Draw attack powerups
    if (attackPowerupController) {
      console.log('Drawing attack powerups');
      attackPowerupController.draw(ctx);
    } else {
      console.error('Attack powerup controller not available for drawing!');
    }
    
    // Draw electric ball effects
    if (electricBallController) {
      electricBallController.draw(ctx, hackerController.hacker);
    }
    
    // Draw hacker controller (hacker and projectiles)
    if (hackerController) {
      hackerController.draw(deltaTime, isHackerLoading);
    }
    
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
      if (lives < 6) { // Updated to match new maximum of 6 lives
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
    
    // Check for skull collisions - only if hacker is not loading
    if (!window.hackerIsLoading) {
      const skullCollision = skullController.checkCollision(player);
      if (skullCollision) {
        // Check if player has shield first
        if (player.shieldHits > 0) {
          // Use player's takeDamage method which will handle shield hits
          const damageResult = player.takeDamage(1);
          
          // If shield absorbed the hit, log it
          if (!damageResult) {
            console.log('Shield protected player from virus!');
            // Note: The shield guard sound is now played in the player.takeDamage method
          }
        } else {
          // No shield, lose a life when hitting a skull
          if (typeof window.loseLife === 'function') {
            window.loseLife();
          } else if (window.game && typeof window.game.loseLife === 'function') {
            window.game.loseLife();
          } else {
            console.error('loseLife function not found!');
          }
          
          // Play cat hit sound
          catHitSound.volume = gameVolume;
          if (!isMuted) {
            catHitSound.play().catch(e => console.log("Error playing cat hit sound:", e));
          }
        }
      }
    } else {
      console.log('Skipping skull collision detection during hacker loading phase');
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
  function resumeGameAfterPopup() {
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
    if (shieldController) shieldController.draw(ctx);
    if (attackPowerupController) attackPowerupController.draw(ctx);
    
    // Start the game loop with a small delay to ensure everything is ready
    setTimeout(() => {
      console.log('Starting game loop after resume');
      gameAnimationId = requestAnimationFrame(gameLoop);
    }, 100);
  }
  
  // Function to show legitimate email education result
  function showLegitimateEmailResult() {
    console.log('[LegitimateResult] Showing legitimate email education popup');
    console.log('[LegitimateResult] Current email data:', currentEmailData);
    
    // Update the result popup with legitimate email information (using correct HTML element IDs)
    const resultTitle = document.getElementById('resultTitle');
    const phishingIntent = document.getElementById('phishingIntent');
    const phishingTechnique = document.getElementById('phishingTechnique');
    const phishingTarget = document.getElementById('phishingTarget');
    const phishingLabel = document.getElementById('phishingLabel');
    const resultMessage = document.getElementById('resultMessage');
    
    // Clear and update title
    if (resultTitle) {
      resultTitle.textContent = 'Good Job!';
      resultTitle.style.color = '#4CAF50'; // Green for legitimate
    }
    
    // Clear and update email details with legitimate email data
    if (phishingIntent) {
      phishingIntent.textContent = currentEmailData?.intent || 'Legitimate Communication';
      console.log('[LegitimateResult] Updated intent to:', currentEmailData?.intent);
    }
    if (phishingTechnique) {
      phishingTechnique.textContent = currentEmailData?.technique || 'N/A';
      console.log('[LegitimateResult] Updated technique to:', currentEmailData?.technique);
    }
    if (phishingTarget) {
      phishingTarget.textContent = currentEmailData?.target || 'General';
      console.log('[LegitimateResult] Updated target to:', currentEmailData?.target);
    }
    
    // Clear and update label
    if (phishingLabel) {
      phishingLabel.textContent = 'LEGITIMATE';
      phishingLabel.style.color = '#4CAF50'; // Green for legitimate
      console.log('[LegitimateResult] Updated label to: LEGITIMATE');
    }
    
    if (resultMessage) {
      resultMessage.innerHTML = `
        That was a <strong>legitimate email</strong>. Here's how to identify safe messages:
        <ul style="text-align: left; margin: 10px 0;">
          <li>Check for proper sender domain and spelling</li>
          <li>Look for personalized greetings with your actual name</li>
          <li>Verify the content matches expected communications</li>
          <li>Check for professional formatting and grammar</li>
          <li>Confirm any requests through official channels</li>
        </ul>
        <strong>Stay alert and trust your instincts when something feels off!</strong>
      `;
    }
    
    // Show the result popup
    const resultPopup = document.getElementById('resultPopup');
    if (resultPopup) {
      resultPopup.style.display = 'block';
      popupVisible = true;
      
      // Set up the continue button
      const continueButton = resultPopup.querySelector('button');
      if (continueButton) {
        const newButton = continueButton.cloneNode(true);
        continueButton.parentNode.replaceChild(newButton, continueButton);
        
        newButton.onclick = function() {
          console.log('Legitimate result popup continue button clicked');
          resultPopup.style.display = 'none';
          popupVisible = false;
          resumeGameAfterPopup();
        };
      }
    }
    
    console.log('[LegitimateResult] Result popup displayed');
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
    if (shieldController && typeof shieldController.reset === 'function') shieldController.reset();
    
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

  // Email dataset for diverse phishing content
  const emailDataset = [
    {"id":"phish-0001","subject":"Urgent: Account Verification Required","body":"Your account will be locked in 24 hours. Verify now at: https://secure-login-verify.com","intent":"Credential Harvesting","technique":"Link Spoofing with Urgency","target":"Banking","spoofed_sender":"security@bankofamerica-alert.com","label":"phishing"},
    {"id":"phish-0002","subject":"Invoice #3921 Overdue","body":"Your payment is overdue. Download invoice here: [attachment: invoice.exe]","intent":"Malware Delivery","technique":"Attachment with Malicious Payload","target":"SMBs / Finance","spoofed_sender":"billing@vendorpay.com","label":"phishing"},
    {"id":"phish-0003","subject":"Unusual Activity Detected","body":"Suspicious login from Russia. Reset password now: https://g00gle-security.com","intent":"Credential Harvesting","technique":"Homoglyph Link Spoofing","target":"Google","spoofed_sender":"no-reply@g00gle.com","label":"phishing"},
    {"id":"phish-0004","subject":"Tax Refund Processing Error","body":"Your refund is delayed. Submit details at: https://irs-gov-refund.org","intent":"Credential Harvesting","technique":"Fake Government Alert","target":"Taxpayers","spoofed_sender":"service@irs-notify.org","label":"phishing"},
    {"id":"phish-0005","subject":"Your Package Awaits!","body":"Delivery issue detected. Update address via: [attachment: shipping_update.zip]","intent":"Malware Delivery","technique":"Attachment with Malicious Payload","target":"E-commerce","spoofed_sender":"support@fedex-delivery.com","label":"phishing"},
    {"id":"phish-0006","subject":"Security Alert: Account Compromised","body":"Your social media account was accessed from China. Secure it: https://fb-security.com","intent":"Credential Harvesting","technique":"Urgency & Fake Security Alert","target":"Social Media","spoofed_sender":"alert@facebook-notify.com","label":"phishing"},
    {"id":"phish-0007","subject":"Exclusive Offer: Free Gift Card","body":"Claim your $200 Amazon gift card: https://amaz0n-rewards.com","intent":"Credential Harvesting","technique":"Fake Reward with Homoglyph","target":"Retail","spoofed_sender":"rewards@amazon-offer.com","label":"phishing"},
    {"id":"phish-0008","subject":"Healthcare Plan Update","body":"Your insurance plan needs renewal. Confirm details: https://healthcare-login.net","intent":"Credential Harvesting","technique":"Fake Service Update","target":"Healthcare","spoofed_sender":"support@bluecross-plan.com","label":"phishing"},
    {"id":"phish-0009","subject":"CEO Request: Urgent Wire Transfer","body":"Please process a $10,000 transfer by EOD. Details in attached PDF.","intent":"Financial Scam","technique":"Business Email Compromise","target":"Corporate","spoofed_sender":"ceo@company-internal.com","label":"phishing"},
    {"id":"phish-0010","subject":"Your Cloud Storage is Full","body":"Free up space or upgrade now: https://dropb0x-upgrade.com","intent":"Credential Harvesting","technique":"Homoglyph Link Spoofing","target":"Cloud Storage","spoofed_sender":"no-reply@dropbox-service.com","label":"phishing"},
    {"id":"benign-0001","subject":"Weekly Team Meeting","body":"Don't forget our team meeting tomorrow at 2 PM in Conference Room A.","intent":"Legitimate Communication","technique":"N/A","target":"Corporate","spoofed_sender":"manager@company.com","label":"legitimate"},
    {"id":"benign-0002","subject":"Your Order Has Shipped","body":"Your order #12345 has been shipped and will arrive in 2-3 business days.","intent":"Order Notification","technique":"N/A","target":"E-commerce","spoofed_sender":"orders@amazon.com","label":"legitimate"},
    {"id":"benign-0003","subject":"Monthly Newsletter","body":"Check out our latest updates and company news in this month's newsletter.","intent":"Newsletter","technique":"N/A","target":"General","spoofed_sender":"newsletter@company.com","label":"legitimate"}
  ];

  // Current email data for the popup
  let currentEmailData = null;

  // Function to convert URLs and attachments to clickable elements
  function makeLinksClickable(text) {
    // Convert HTTP(S) URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let processedText = text.replace(urlRegex, '<a href="#" class="phishing-link" data-url="$1" style="color: #FF5722; font-weight: bold; text-decoration: underline;">$1</a>');
    
    // Convert attachments to clickable elements with file icon
    const attachmentRegex = /\[attachment:\s*([^\]]+)\]/g;
    processedText = processedText.replace(attachmentRegex, (match, filename) => {
      // Determine file type for appropriate icon
      let fileIcon = '📎'; // Default paperclip
      if (filename.includes('.exe') || filename.includes('.zip') || filename.includes('.rar')) {
        fileIcon = '⚠️'; // Warning for potentially dangerous files
      } else if (filename.includes('.pdf')) {
        fileIcon = '📄';
      } else if (filename.includes('.doc') || filename.includes('.docx')) {
        fileIcon = '📝';
      } else if (filename.includes('.xls') || filename.includes('.xlsx')) {
        fileIcon = '📊';
      }
      
      return `<span class="attachment-link" data-filename="${filename}" style="display: inline-block; background: #f0f0f0; border: 1px solid #ccc; padding: 4px 8px; margin: 2px; border-radius: 4px; cursor: pointer; color: #333; font-weight: bold;">${fileIcon} ${filename}</span>`;
    });
    
    return processedText;
  }

  // Email phishing popup
  function showEmailPhishingPopup() {
    // Pause the game loop
    stopGameLoop();
    
    // Set game state
    gameOver = true;
    popupVisible = true; // Set popup visible flag
    
    // Select random email from dataset
    currentEmailData = emailDataset[Math.floor(Math.random() * emailDataset.length)];
    console.log('[EmailPopup] Selected email data:', currentEmailData);
    
    // Update email popup content
    document.getElementById('emailFrom').innerHTML = `From: ${currentEmailData.spoofed_sender}`;
    document.getElementById('emailSubject').innerHTML = `Subject: ${currentEmailData.subject}`;
    console.log('[EmailPopup] Updated email popup with:', {
      sender: currentEmailData.spoofed_sender,
      subject: currentEmailData.subject,
      intent: currentEmailData.intent,
      technique: currentEmailData.technique,
      target: currentEmailData.target,
      label: currentEmailData.label
    });
    
    // Process email body to make links clickable
    const processedBody = makeLinksClickable(currentEmailData.body);
    document.getElementById('emailBody').innerHTML = `<p>${processedBody}</p>`;
    
    // Add click handlers to phishing links and attachments
    setTimeout(() => {
      // Handle URL links
      const phishingLinks = document.querySelectorAll('.phishing-link');
      phishingLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (currentEmailData.label === 'phishing') {
            showPhishingResult();
          } else {
            // For legitimate emails, just close the popup
            hideEmailPopup();
            resumeGame();
          }
        });
      });
      
      // Handle attachment clicks
      const attachmentLinks = document.querySelectorAll('.attachment-link');
      attachmentLinks.forEach(attachment => {
        attachment.addEventListener('click', (e) => {
          e.preventDefault();
          const filename = attachment.getAttribute('data-filename');
          console.log('Attachment clicked:', filename);
          
          if (currentEmailData.label === 'phishing') {
            // Show phishing result for malicious attachments
            showPhishingResult();
          } else {
            // For legitimate emails, show a safe download message or just close
            alert('Safe attachment downloaded: ' + filename);
            hideEmailPopup();
            resumeGame();
          }
        });
      });
    }, 100);
    
    // Show the email popup with options
    document.getElementById('emailPopup').style.display = 'block';
    
    // Play phishing sound
    wrongSound.currentTime = 0;
    wrongSound.volume = isMuted ? 0 : gameVolume;
  }

  // Function to show phishing result with details
  function showPhishingResult() {
    // Hide email popup
    document.getElementById('emailPopup').style.display = 'none';
    
    // Debug: Log current email data
    console.log('[PhishingResult] Current email data:', currentEmailData);
    
    // Update result popup with phishing details
    const resultTitle = document.getElementById('resultTitle');
    const phishingIntent = document.getElementById('phishingIntent');
    const phishingTechnique = document.getElementById('phishingTechnique');
    const phishingTarget = document.getElementById('phishingTarget');
    const phishingLabel = document.getElementById('phishingLabel');
    
    if (resultTitle) {
      resultTitle.innerHTML = 'You have been PHISHED!';
      resultTitle.style.color = '#FF5555'; // Always red for phishing
    }
    if (phishingIntent) {
      phishingIntent.innerHTML = currentEmailData.intent || 'Unknown Intent';
      console.log('[PhishingResult] Set intent to:', currentEmailData.intent);
    }
    if (phishingTechnique) {
      phishingTechnique.innerHTML = currentEmailData.technique || 'Unknown Technique';
      console.log('[PhishingResult] Set technique to:', currentEmailData.technique);
    }
    if (phishingTarget) {
      phishingTarget.innerHTML = currentEmailData.target || 'Unknown Target';
      console.log('[PhishingResult] Set target to:', currentEmailData.target);
    }
    if (phishingLabel) {
      phishingLabel.innerHTML = (currentEmailData.label || 'unknown').toUpperCase();
      phishingLabel.style.color = currentEmailData.label === 'phishing' ? '#FF5555' : '#00AA00';
      console.log('[PhishingResult] Set label to:', currentEmailData.label);
    }
    
    // Update message content for phishing emails
    const resultMessage = document.getElementById('resultMessage');
    if (resultMessage) {
      resultMessage.innerHTML = `
        <p>That was a <strong>phishing email</strong>. Here's how to spot them:</p>
        <ul style="padding-left: 20px;">
          <li>Check the sender's email address for misspellings.</li>
          <li>Hover over links before clicking to see the real URL.</li>
          <li>Be suspicious of urgent requests or threats.</li>
          <li>Look for generic greetings like "Dear Customer" instead of your name.</li>
          <li>If it feels off, it probably is - <strong>trust your instincts!</strong></li>
        </ul>
        <p><strong>Stay alert. Stop. Think twice before you click!</strong></p>
      `;
      console.log('[PhishingResult] Updated message content for phishing email');
    }
    
    // Show result popup
    document.getElementById('resultPopup').style.display = 'block';
    console.log('[PhishingResult] Result popup displayed');
  }

  // Function to hide email popup
  function hideEmailPopup() {
    document.getElementById('emailPopup').style.display = 'none';
    popupVisible = false;
  }

  // Function to show vishing result popup with appropriate content
  function showVishingResultPopup(isFailure) {
    console.log('[VishingResult] Showing vishing result popup, isFailure:', isFailure);
    
    // Get current voice call data to determine if it was legitimate or vishing
    const currentCall = window.currentVoiceCall || { isPhishing: true };
    console.log('[VishingResult] Current call data:', currentCall);
    
    // Update the vishing result popup content
    const vishingResultTitle = document.getElementById('vishingResultTitle');
    const vishingResultMessage = document.getElementById('vishingResultMessage');
    
    if (isFailure) {
      // Wrong choice - show educational content based on call type
      if (currentCall.isPhishing) {
        // Failed to identify vishing call - show vishing education
        if (vishingResultTitle) {
          vishingResultTitle.textContent = 'You have been VISHED!';
          vishingResultTitle.style.color = '#FF5555'; // Red for vishing
        }
        
        if (vishingResultMessage) {
          vishingResultMessage.innerHTML = `
            <p>That was a <strong>vishing call</strong>. Here's how to spot them:</p>
            <ul style="padding-left: 20px;">
              <li>Never share personal information over the phone with unknown callers.</li>
              <li>Be suspicious of callers creating urgency or fear.</li>
              <li>Hang up and call the official number of the company to verify legitimacy.</li>
              <li>Don't trust caller ID - it can be spoofed.</li>
              <li>Remember that legitimate organizations won't ask for sensitive information over the phone.</li>
            </ul>
            <p><strong>Stay alert. Stop. Think twice before sharing!</strong></p>
          `;
        }
      } else {
        // Failed to identify legitimate call - show legitimate call education
        if (vishingResultTitle) {
          vishingResultTitle.textContent = 'Oops!';
          vishingResultTitle.style.color = '#FF5555'; // Red for wrong choice
        }
        
        if (vishingResultMessage) {
          vishingResultMessage.innerHTML = `
            <p>That was a <strong>legitimate call</strong>. Here's how to identify safe calls:</p>
            <ul style="padding-left: 20px;">
              <li>Caller has your correct personal information and account details.</li>
              <li>Call comes from a verified official number you can independently confirm.</li>
              <li>No pressure tactics or urgent threats are used.</li>
              <li>Request is reasonable and matches expected business communications.</li>
              <li>You can call back through official channels to verify the request.</li>
            </ul>
            <p><strong>When in doubt, hang up and call the official number!</strong></p>
          `;
        }
      }
    } else {
      // Correct choice - show positive feedback based on call type
      if (currentCall.isPhishing) {
        // Correctly identified vishing call
        if (vishingResultTitle) {
          vishingResultTitle.textContent = 'Great Job!';
          vishingResultTitle.style.color = '#4CAF50'; // Green for success
        }
        
        if (vishingResultMessage) {
          vishingResultMessage.innerHTML = `
            <p>You correctly identified that <strong>vishing call</strong>! Here's what gave it away:</p>
            <ul style="padding-left: 20px;">
              <li>Never share personal information over the phone with unknown callers.</li>
              <li>Be suspicious of callers creating urgency or fear.</li>
              <li>Hang up and call the official number of the company to verify legitimacy.</li>
              <li>Don't trust caller ID - it can be spoofed.</li>
              <li>Remember that legitimate organizations won't ask for sensitive information over the phone.</li>
            </ul>
            <p><strong>Stay alert. Stop. Think twice before sharing!</strong></p>
          `;
        }
      } else {
        // Correctly identified legitimate call
        if (vishingResultTitle) {
          vishingResultTitle.textContent = 'Great Job!';
          vishingResultTitle.style.color = '#4CAF50'; // Green for success
        }
        
        if (vishingResultMessage) {
          vishingResultMessage.innerHTML = `
            <p>You correctly identified that <strong>legitimate call</strong>! Here's how to spot safe calls:</p>
            <ul style="padding-left: 20px;">
              <li>Caller has your correct personal information and account details.</li>
              <li>Call comes from a verified official number you can independently confirm.</li>
              <li>No pressure tactics or urgent threats are used.</li>
              <li>Request is reasonable and matches expected business communications.</li>
              <li>You can call back through official channels to verify the request.</li>
            </ul>
            <p><strong>When in doubt, hang up and call the official number!</strong></p>
          `;
        }
      }
    }
    
    // Show the vishing result popup
    const vishingResultPopup = document.getElementById('vishingResultPopup');
    if (vishingResultPopup) {
      vishingResultPopup.style.display = 'block';
      popupVisible = true;
      
      console.log('[VishingResult] Vishing result popup displayed');
    }
  }
  
  async function showPhoneVishingPopup() {
    // Pause the game loop
    stopGameLoop();
    
    // Set game state
    gameOver = true;
    popupVisible = true; // Set popup visible flag
    
    // Get the phone popup buttons
    const phoneDoItBtn = document.getElementById('phoneDoIt');
    const phoneSkipBtn = document.getElementById('phoneSkip');
    
    // Keep buttons enabled during the call - users can interrupt anytime
    phoneDoItBtn.disabled = false;
    phoneSkipBtn.disabled = false;
    
    // Ensure buttons are fully visible and clickable
    phoneDoItBtn.style.opacity = '1';
    phoneSkipBtn.style.opacity = '1';
    phoneDoItBtn.style.cursor = 'pointer';
    phoneSkipBtn.style.cursor = 'pointer';
    
    try {
      // Clean up any previously playing audio
      window.voiceCallManager.cleanup();
      
      // Get voice call data (first call uses vishing.mp3, subsequent calls use database)
      const voiceCallData = await window.voiceCallManager.getVoiceCall();
      
      // Store current voice call info for button logic
      window.currentVoiceCall = voiceCallData;
      
      // Voice call popup is now ready with simplified UI (no caller info)
      
      console.log('Playing voice call:', {
        isPhishing: voiceCallData.isPhishing,
        correctChoice: window.voiceCallManager.getCorrectChoice(voiceCallData.isPhishing),
        caller: voiceCallData.caller.name,
        isStatic: voiceCallData.isStatic
      });
      
      // Create audio context if it doesn't exist
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!window.audioContext) {
        window.audioContext = new AudioContext();
      }
      
      // Create audio element
      const currentAudio = new Audio(voiceCallData.audioUrl);
      
      // Store reference for cleanup
      window.voiceCallManager.currentAudio = currentAudio;
      
      try {
        // Wait for audio context to be in 'running' state
        if (window.audioContext.state === 'suspended') {
          await window.audioContext.resume();
        }
        
        // Create audio source and gain node
        const source = window.audioContext.createMediaElementSource(currentAudio);
        const gainNode = window.audioContext.createGain();
        
        // Increase volume by 100% (2x) over the base volume
        const baseVolume = isMuted ? 0 : gameVolume;
        gainNode.gain.value = baseVolume * 2; // Double the volume
        
        // Connect nodes: source -> gain -> destination
        source.connect(gainNode);
        gainNode.connect(window.audioContext.destination);
        
        // Play the audio
        currentAudio.currentTime = 0;
        await currentAudio.play();
      } catch (error) {
        console.error('Error setting up Web Audio API, falling back to standard audio:', error);
        // Fallback to standard audio if Web Audio API fails
        currentAudio.volume = isMuted ? 0 : Math.min(gameVolume * 1.5, 1.0); // Still boost volume a bit
        await currentAudio.play();
      }
      
      // Show audio indicator and update call status when audio starts
      showAudioIndicator(true);
      updateCallStatus('PLAYING', '#00d4ff');
      
      // Hide audio indicator when audio ends
      currentAudio.onended = function() {
        showAudioIndicator(false);
        updateCallStatus('WAITING FOR RESPONSE', '#ffaa00');
        console.log('Voice call audio ended, waiting for user response');
      };
      
    } catch (error) {
      console.error('Error loading voice call:', error);
      
      // Fallback to original vishing sound
      vishingSound.currentTime = 0;
      vishingSound.volume = isMuted ? 0 : gameVolume;
      vishingSound.play()
        .catch(err => console.log('Error playing fallback vishing sound:', err));
      
      // Set fallback voice call data
      window.currentVoiceCall = {
        isPhishing: true,
        caller: { name: 'Bank Security', number: '+1-800-555-0199' }
      };
      
      // Enable buttons when fallback audio ends
      vishingSound.onended = function() {
        phoneDoItBtn.disabled = false;
        phoneSkipBtn.disabled = false;
        phoneDoItBtn.style.opacity = '1';
        phoneSkipBtn.style.opacity = '1';
        phoneDoItBtn.style.cursor = 'pointer';
        phoneSkipBtn.style.cursor = 'pointer';
        console.log('Fallback vishing audio ended, buttons enabled');
      };
    }
    
    // Show the phone popup with options
    document.getElementById('phonePopup').style.display = 'block';
  }

  // Create audio objects once to prevent duplication
  const vishingSound = new Audio('/games/phish404/audio/vishing.mp3');
  const gameOverSound = new Audio('/games/phish404/audio/losetrumpet.mp3');
  const declineSound = new Audio('/games/phish404/audio/Decline.wav');
  
  // Store audio context reference globally
  window.audioContext = null;
  
  // Shield sound effects
  window.shieldSound = new Audio('/games/phish404/audio/coin-hit.mp3');
  window.shieldHitSound = new Audio('/games/phish404/audio/coin-hit.mp3');
  window.shieldBreakSound = new Audio('/games/phish404/audio/shield_break.mp3');
  
  // Add shield sounds to gameSounds for volume control
  gameSounds.push(window.shieldSound, window.shieldHitSound, window.shieldBreakSound);
  
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

  // Helper functions for improved voice call UI experience
  function updateCallStatus(status, color) {
    const callStatusElement = document.getElementById('callStatus');
    if (callStatusElement) {
      callStatusElement.textContent = `🔴 ${status}`;
      callStatusElement.style.background = color;
    }
  }

  function showAudioIndicator(show) {
    const audioIndicator = document.getElementById('audioIndicator');
    if (audioIndicator) {
      audioIndicator.style.display = show ? 'block' : 'none';
    }
  }

  function updateCallerInfo(callerData) {
    // Update caller name
    const callerNameElement = document.getElementById('callerName');
    if (callerNameElement && callerData && callerData.name) {
      callerNameElement.textContent = callerData.name;
    }
    
    // Update caller number
    const callerNumberElement = document.getElementById('callerNumber');
    if (callerNumberElement && callerData && callerData.number) {
      callerNumberElement.textContent = callerData.number;
    }
    
    // Update call message if available
    const callMessageElement = document.getElementById('callMessage');
    if (callMessageElement) {
      if (callerData && callerData.message) {
        callMessageElement.textContent = callerData.message;
      } else {
        callMessageElement.textContent = "Incoming call... Listen carefully to identify if this is legitimate or suspicious.";
      }
    }
  }

  // Initialize the game
  setScreen();
  window.addEventListener('resize', setScreen);
  
  // Force create a shield for testing
  setTimeout(() => {
    console.log('FORCING SHIELD CREATION FOR TESTING');
    if (window.shieldController) {
      window.shieldController.debugMode = true;
      window.shieldController.spawnShield(true);
    } else {
      console.error('Shield controller not initialized!');
    }
  }, 3000); // Wait 3 seconds after game starts
  
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
      // "Safe to Accept" button - dynamic logic based on voice call type
      phoneDoItBtn.addEventListener('click', function() {
        console.log('Phone "Safe to Accept" button clicked');
        
        // Stop any playing audio immediately when button is clicked
        if (window.voiceCallManager && window.voiceCallManager.currentAudio) {
          window.voiceCallManager.currentAudio.pause();
          window.voiceCallManager.currentAudio.currentTime = 0;
          console.log('Voice call audio stopped');
        }
        
        // Hide popup and update call status
        document.getElementById('phonePopup').style.display = 'none';
        updateCallStatus('ACCEPTED', '#00ff88');
        
        // Get current voice call data
        const currentCall = window.currentVoiceCall || { isPhishing: true }; // Default to phishing for safety
        const correctChoice = window.voiceCallManager.getCorrectChoice(currentCall.isPhishing);
        const isCorrectChoice = correctChoice === 'doIt';
        
        console.log('Voice call analysis:', {
          isPhishing: currentCall.isPhishing,
          correctChoice: correctChoice,
          playerChoice: 'doIt',
          isCorrect: isCorrectChoice
        });
        
        if (isCorrectChoice) {
          // Correct choice - play success sound and reward player
          correctSound.currentTime = 0;
          correctSound.play();
          
          // Add 10 coins for correct answer
          coinController.coinsCollected += 10;
          document.getElementById('coinCount').textContent = coinController.coinsCollected;
          
          // Increase player level for correct answer
          increasePlayerLevel();
          
          // Show success message and resume game
          showVishingResultPopup(false); // false = success
        } else {
          // Wrong choice - play wrong sound and lose life
          wrongSound.currentTime = 0;
          wrongSound.play();
          
          // Use the safe decrement function
          const lifeLost = decrementLife();
          
          if (lifeLost) {
            console.log('Showing vishing result popup after life loss');
            // Show vishing result popup and let it handle game resumption
            showVishingResultPopup(true); // true = failure
          } else if (gameOver) {
            console.log('Game over already triggered from phone popup');
            showGameOver();
          } else {
            console.error('Failed to process life loss from phone popup');
            // Still show the vishing result popup even if life decrement failed
            showVishingResultPopup(true);
          }
        }
      });
      
      // "Skip" button - dynamic logic based on voice call type
      phoneSkipBtn.addEventListener('click', function() {
        console.log('Phone "Skip" button clicked');
        
        // Stop any playing audio immediately when button is clicked
        if (window.voiceCallManager && window.voiceCallManager.currentAudio) {
          window.voiceCallManager.currentAudio.pause();
          window.voiceCallManager.currentAudio.currentTime = 0;
          console.log('Voice call audio stopped');
        }
        
        // Hide popup and update call status
        document.getElementById('phonePopup').style.display = 'none';
        updateCallStatus('DECLINED', '#ff4444');
        
        // Get current voice call data
        const currentCall = window.currentVoiceCall || { isPhishing: true }; // Default to phishing for safety
        const correctChoice = window.voiceCallManager.getCorrectChoice(currentCall.isPhishing);
        const isCorrectChoice = correctChoice === 'skip';
        
        console.log('Voice call analysis:', {
          isPhishing: currentCall.isPhishing,
          correctChoice: correctChoice,
          playerChoice: 'skip',
          isCorrect: isCorrectChoice
        });
        
        if (isCorrectChoice) {
          // Correct choice - play success sound and reward player
          correctSound.currentTime = 0;
          correctSound.play();
          
          // Add 10 coins for correct answer
          coinController.coinsCollected += 10;
          document.getElementById('coinCount').textContent = coinController.coinsCollected;
          
          // Increase player level for correct answer
          increasePlayerLevel();
          
          // Show success message and resume game
          showVishingResultPopup(false); // false = success
        } else {
          // Wrong choice - play wrong sound and lose life
          wrongSound.currentTime = 0;
          wrongSound.play();
          
          // Use the safe decrement function
          const lifeLost = decrementLife();
          
          if (lifeLost) {
            console.log('Showing vishing result popup after life loss');
            // Show vishing result popup and let it handle game resumption
            showVishingResultPopup(true); // true = failure
          } else if (gameOver) {
            console.log('Game over already triggered from phone popup');
            showGameOver();
          } else {
            console.error('Failed to process life loss from phone popup');
            // Still show the vishing result popup even if life decrement failed
            showVishingResultPopup(true);
          }
        }
        
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
    const audioControls = document.getElementById('audioControls');
    const volumeSlider = document.getElementById('volumeSlider');
    const muteButton = document.getElementById('muteButton');
    const musicButton = document.getElementById('musicButton');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    if (!audioControls || !volumeSlider || !muteButton || !musicButton) {
      console.log('Audio control elements not found');
      return;
    }
    
    // Ensure sound and music are on by default for new users
    if (localStorage.getItem('isMuted') === null) {
      isMuted = false;
      localStorage.setItem('isMuted', 'false');
    }
    
    if (localStorage.getItem('musicEnabled') === null) {
      musicEnabled = true;
      localStorage.setItem('musicEnabled', 'true');
    }
    
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
    lives = 6; // Reset lives to starting value of 6
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
    if (shieldController) shieldController.reset();
    if (attackPowerupController) attackPowerupController.reset();
    if (electricBallController) electricBallController.reset();
    
    // Reset voice call manager
    if (window.voiceCallManager) {
      window.voiceCallManager.reset();
      console.log('Voice call manager reset');
    }
    
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
    console.log('Showing game over screen - triggering React GameOverModal');
    
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
    
    // Send game over message to parent React component to trigger GameOverModal
    if (window.parent && window.parent !== window) {
      const gameOverData = {
        type: 'PHISH404_GAME_OVER',
        // Use coinController.coinsCollected for score; 'score' variable does not exist here
        score: (coinController && typeof coinController.coinsCollected === 'number') ? coinController.coinsCollected : 0,
        // Use playerLevel for level; 'level' variable does not exist here
        level: (typeof playerLevel === 'number' && playerLevel > 0) ? playerLevel : 1,
        lives: lives || 0,
        timestamp: Date.now()
      };
      console.log('Sending game over message to parent:', gameOverData);
      window.parent.postMessage(gameOverData, window.location.origin);
    }
    
    // Return early - let React GameOverModal handle the UI
    return;
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
      console.log('Email Clean button clicked', new Date().toISOString());
      document.getElementById('emailPopup').style.display = 'none';
      
      // Check if this is a legitimate or phishing email
      if (currentEmailData && currentEmailData.label === 'legitimate') {
        // Correct action for legitimate email
        console.log('Correct choice - legitimate email marked as clean');
        correctSound.currentTime = 0;
        correctSound.play();
        
        // Add 10 coins for correct answer
        coinController.coinsCollected += 10;
        document.getElementById('coinCount').textContent = coinController.coinsCollected;
        
        // Show legitimate email tips
        showLegitimateEmailResult();
      } else {
        // Wrong action for phishing email
        console.log('Wrong choice - phishing email marked as clean');
        wrongSound.currentTime = 0;
        wrongSound.play();
        
        // Use the safe decrement function
        const lifeLost = decrementLife();
        
        if (lifeLost) {
          console.log('Showing result popup after life loss');
          showPhishingResult();
        } else if (gameOver) {
          console.log('Game over already triggered');
        } else {
          console.error('Failed to process life loss');
        }
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
        showPhishingResult();
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
      console.log('Email Malicious button clicked');
      document.getElementById('emailPopup').style.display = 'none';
      
      // Check if this is a legitimate or phishing email
      if (currentEmailData && currentEmailData.label === 'phishing') {
        // Correct action for phishing email
        console.log('Correct choice - phishing email reported');
        correctSound.currentTime = 0;
        correctSound.play();
        
        // Add 10 coins for correct answer
        coinController.coinsCollected += 10;
        document.getElementById('coinCount').textContent = coinController.coinsCollected;
        
        // Increase player level for correct answer
        playerLevel++;
        console.log(`Player leveled up to level ${playerLevel}`);
        
        // Show phishing education result
        showPhishingResult();
      } else {
        // Wrong action for legitimate email
        console.log('Wrong choice - legitimate email reported as malicious');
        wrongSound.currentTime = 0;
        wrongSound.play();
        
        // Use the safe decrement function
        const lifeLost = decrementLife();
        
        if (lifeLost) {
          console.log('Showing result popup after life loss');
          showLegitimateEmailResult();
        } else if (gameOver) {
          console.log('Game over already triggered');
        } else {
          console.error('Failed to process life loss');
        }
      }
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
  window.decrementLife = decrementLife;
  console.log('Game controllers exposed to window scope for game-fixes.js');
});
