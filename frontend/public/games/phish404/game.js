// Define classes directly since browser module imports can be tricky in some environments
// We'll use the classes from the separate files that are loaded via <script> tags

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Game initializing...', new Date().toISOString());
  console.log('Canvas element exists:', !!document.getElementById('game'));
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const GAME_SPEED_S = 1;
  const GAME_SPEED_ICR = 0.00001;

  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 300; // Increased from 200 to match canvas height
  const PLAYER_WIDTH = 2048 / 32;
  const PLAYER_HEIGHT = 2048 / 32;
  const MAX_JUMP_HEIGHT = 180; // Reduced from GAME_HEIGHT to a more reasonable height
  const MIN_JUMP_HEIGHT = 140; // Increased from 100 to ensure short jumps can clear obstacles
  const GROUND_WIDTH = 2048;
  const GROUND_HEIGHT = 2048;
  const GROUND_AND_OBSTACLE_SPEED = 0.5;

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
  
  // Lives system
  let lives = 3;

  let player = null;
  let ground = null;
  let obstacleController = null;

  let scaleRatio = null;
  let previousTime = null;
  let gameSpeed = GAME_SPEED_S;
  let gameOver = false;
  let waitingToStart = true;
  let popupVisible = false; // Track if any popup is currently visible

  function createSprite() {
    const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
    const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;
    const minJumpHeightInGame = MIN_JUMP_HEIGHT * scaleRatio;
    const maxJumpHeightInGame = MAX_JUMP_HEIGHT * scaleRatio;

    const groundWidthInGame = GROUND_WIDTH * scaleRatio;
    const groundHeightInGame = GROUND_HEIGHT * scaleRatio;

    player = new Player(ctx, playerWidthInGame, playerHeightInGame, minJumpHeightInGame, maxJumpHeightInGame, scaleRatio);
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

  function showStartGameText() {
    const fontSize = 20 * scaleRatio;
    ctx.font = `${fontSize}px Verdana`;
    ctx.fillStyle = 'darkblue';
    const x = canvas.width / 3;
    const y = canvas.height / 4;
    ctx.fillText("Press Space to start", x, y);
    ctx.fillText("Try your best to help this CAR survive!", x, y + fontSize * 1.5);
    gameOver = false;
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
    for (let i = 1; i <= 3; i++) {
      const heartElement = document.getElementById(`heart${i}`);
      if (heartElement) {
        heartElement.src = i <= lives ? "/games/phish404/img/heart-filled.png" : "/games/phish404/img/heart-deplete.png";
      }
    }
  }

  function loseLife() {
    lives--;
    updateLivesDisplay();
    
    // If no lives left, game over
    if (lives <= 0) {
      gameOver = true;
      console.log('Game over, no lives left');
    }
    
    // Stop the game loop when a life is lost
    stopGameLoop();
  }

  // Game animation frame ID to keep track of the loop
  let gameAnimationId = null;
  
  function startGameLoop() {
    // Only start a new loop if there isn't one already running
    if (gameAnimationId === null) {
      // Reset timing
      previousTime = null;
      
      // Start a new game loop
      gameAnimationId = requestAnimationFrame(gameLoop);
      console.log('Game loop started with ID:', gameAnimationId);
    } else {
      console.log('Game loop already running with ID:', gameAnimationId);
    }
  }
  
  function stopGameLoop() {
    // Cancel the animation frame if it exists
    if (gameAnimationId !== null) {
      cancelAnimationFrame(gameAnimationId);
      gameAnimationId = null;
      console.log('Game loop stopped');
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
    
    // Initialize previousTime if needed
    if (previousTime === null) {
      previousTime = currentTime;
      gameAnimationId = requestAnimationFrame(gameLoop);
      return;
    }
    
    // Calculate time delta and update previous time
    const frametimeDelta = currentTime - previousTime;
    previousTime = currentTime;
    
    // Clear the screen
    clearScreen();

    // Update game objects if game is active
    if (!gameOver && !waitingToStart) {
      // Update player, obstacles, and ground
      player.update(gameSpeed, frametimeDelta);
      obstacleController.update(gameSpeed, frametimeDelta);
      ground.update(gameSpeed, frametimeDelta);
      updateGameSpeed(frametimeDelta);

      // Check for collisions
      for (let i = 0; i < obstacleController.obstacle.length; i++) {
        const obstacle = obstacleController.obstacle[i];
        if (checkCollision(player, obstacle)) {
          // Only lose life for regular obstacles, not interactive ones
          if (!obstacle.image.src.includes("email.png") && !obstacle.image.src.includes("phone.png")) {
            loseLife();
          } else {
            // Just stop the game loop for interactive obstacles
            stopGameLoop();
            gameOver = true;
            
            // Remove the obstacle to prevent duplicate collisions
            obstacleController.obstacle.splice(i, 1);
            
            if (obstacle.image.src.includes("email.png")) {
              showEmailPhishingPopup();
              return; // Stop processing after showing popup
            } else if (obstacle.image.src.includes("phone.png")) {
              showPhoneVishingPopup();
              return; // Stop processing after showing popup
            }
          }
        }
      }
    }

    // Draw game objects
    ground.draw();
    obstacleController.draw();
    player.draw();

    // Show start game text if waiting to start
    if (waitingToStart) {
      showStartGameText();
    }

    // Request next animation frame if game is not over
    if (!gameOver) {
      gameAnimationId = requestAnimationFrame(gameLoop);
    }
  }

  // Popup result functions
  function showResultPopup(isPhished) {
    const resultTitle = document.getElementById('resultTitle');

    if (isPhished) {
      resultTitle.innerText = "You have been PHISHED!";
    } else {
      resultTitle.innerText = "Congratulations!";
    }

    // Show the popup immediately
    document.getElementById('resultPopup').style.display = 'block';
    console.log('Result popup should be visible now');
  }

  // Function to reset the game to its initial state
  function resetGame() {
    console.log('Resetting game', new Date().toISOString());
    
    // Reset game state variables
    gameOver = false;
    waitingToStart = true;
    lives = 3;
    gameSpeed = GAME_SPEED_S;
    previousTime = null;
    
    // Re-initialize player and obstacles instead of calling reset()
    player = new Player(
      ctx,
      PLAYER_WIDTH * scaleRatio,
      PLAYER_HEIGHT * scaleRatio,
      MIN_JUMP_HEIGHT * scaleRatio,
      MAX_JUMP_HEIGHT * scaleRatio,
      scaleRatio
    );
    
    // Re-initialize obstacle controller with properly loaded images
    obstacleController = new ObstacleController(
      ctx,
      obstacleImages.map(obstacle => ({
        width: obstacle.width * scaleRatio,
        height: obstacle.height * scaleRatio,
        image: obstacle.image
      })),
      GROUND_AND_OBSTACLE_SPEED * scaleRatio,
      scaleRatio
    );
    
    // Update the lives display
    updateLivesDisplay();
    
    // Hide all popups
    document.getElementById('resultPopup').style.display = 'none';
    document.getElementById('vishingResultPopup').style.display = 'none';
    document.getElementById('emailPopup').style.display = 'none';
    document.getElementById('phonePopup').style.display = 'none';
    
    // Restart the game loop
    stopGameLoop();
    startGameLoop();
    
    console.log('Game reset complete');
  }
  
  // Function to explicitly resume the game
  function resumeGame() {
    console.log('Explicitly resuming game', new Date().toISOString());
    
    // Hide all popups to ensure they're closed
    document.getElementById('resultPopup').style.display = 'none';
    document.getElementById('vishingResultPopup').style.display = 'none';
    document.getElementById('emailPopup').style.display = 'none';
    document.getElementById('phonePopup').style.display = 'none';
    
    // Force reset of critical game state variables
    gameOver = false;
    waitingToStart = false;
    popupVisible = false; // Ensure popup flag is reset
    
    // Make sure we have a valid previous time
    previousTime = performance.now();
    
    // Cancel any existing animation frame to avoid duplicates
    if (gameAnimationId !== null) {
      cancelAnimationFrame(gameAnimationId);
      gameAnimationId = null;
    }
    
    // Re-enable keyboard controls
    document.removeEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);
    
    // Use setTimeout to ensure the game loop starts after the current execution context
    setTimeout(() => {
      // Start a new game loop
      console.log('Starting new game loop after delay', new Date().toISOString());
      gameAnimationId = requestAnimationFrame(gameLoop); // Directly request animation frame
      
      console.log('Game state after resume:', { 
        gameOver, 
        waitingToStart, 
        lives,
        previousTime,
        gameAnimationId,
        popupVisible
      });
    }, 50);
  }

  function closeResultPopup() {
    console.log('Closing result popup, lives:', lives);
    document.getElementById('resultPopup').style.display = 'none';
    popupVisible = false; // Reset popup visible flag
    if (lives > 0) {
      resumeGame();
    } else {
      console.log('Resetting game');
      resetGame();
    }
  }

  function showVishingResultPopup(isPhished) {
    console.log('Showing vishing result popup, isPhished:', isPhished);
    
    // Get popup elements with null checks
    const titleEl = document.getElementById('vishingResultTitle');
    const messageEl = document.getElementById('vishingResultMessage');
    const popup = document.getElementById('vishingResultPopup');
    
    if (!popup) {
      console.error('Vishing result popup element not found!');
      return;
    }
    
    // Set content if elements exist
    if (titleEl) {
      titleEl.innerText = isPhished ? "You have been PHISHED!" : "Congratulations!";
    } else {
      console.warn('Vishing result title element not found');
    }
    
    if (messageEl) {
      messageEl.innerText = isPhished 
        ? "This was a vishing attempt. Stay cautious next time!" 
        : "You correctly identified the vishing attempt.";
    } else {
      console.warn('Vishing result message element not found');
    }

    // Set popup visible flag before showing popup
    popupVisible = true;
    
    // Show the popup immediately
    popup.style.display = 'block';
    console.log('Vishing result popup should be visible now, popupVisible:', popupVisible);
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
        // Only decrement life if the player chooses the wrong option
        if (lives > 0) lives--;
        updateLivesDisplay();
        showVishingResultPopup(true);
      });
      
      // "Skip" button - show vishing result popup with success message
      phoneSkipBtn.addEventListener('click', function() {
        console.log('Phone "Skip" button clicked');
        document.getElementById('phonePopup').style.display = 'none';
        showVishingResultPopup(false);
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
    
    console.log('All event listeners initialized');
  }
  
  // Initialize all event listeners with a short delay to ensure DOM is ready
  setTimeout(initEventListeners, 500);

  requestAnimationFrame(gameLoop);

  // Apply styles after a short delay to ensure all elements are loaded
  setTimeout(stylePopups, 500);
  
  // Initialize audio controls
  initAudioControls();
  
  // Function to initialize audio controls
  function initAudioControls() {
    const muteButton = document.getElementById('muteButton');
    const musicToggleButton = document.getElementById('musicToggleButton');
    const volumeSlider = document.getElementById('volumeSlider');
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    // Set initial volume
    gameVolume = volumeSlider.value / 100;
    updateAudioVolume();
    
    // Start background music (will only play when user interacts with the page)
    backgroundMusic.volume = isMuted ? 0 : gameVolume * 0.5; // Background music at half volume
    
    // Music toggle button click handler
    musicToggleButton.addEventListener('click', function() {
      musicEnabled = !musicEnabled;
      musicToggleButton.textContent = musicEnabled ? '🎵' : '🔕';
      
      if (musicEnabled) {
        backgroundMusic.play().catch(error => console.log('Error playing background music:', error));
      } else {
        backgroundMusic.pause();
      }
    });
    
    // Mute button click handler
    muteButton.addEventListener('click', function() {
      isMuted = !isMuted;
      muteButton.textContent = isMuted ? '🔇' : '🔊';
      updateAudioVolume();
    });
    
    // Volume slider change handler
    volumeSlider.addEventListener('input', function() {
      gameVolume = volumeSlider.value / 100;
      if (gameVolume > 0 && isMuted) {
        isMuted = false;
        muteButton.textContent = '🔊';
      }
      updateAudioVolume();
    });
    
    // Start music when user interacts with the game
    window.addEventListener('keydown', function startMusicOnInteraction() {
      if (musicEnabled) {
        backgroundMusic.play().catch(error => console.log('Error playing background music:', error));
      }
      window.removeEventListener('keydown', startMusicOnInteraction);
    }, { once: true });
    
    window.addEventListener('touchstart', function startMusicOnInteraction() {
      if (musicEnabled) {
        backgroundMusic.play().catch(error => console.log('Error playing background music:', error));
      }
      window.removeEventListener('touchstart', startMusicOnInteraction);
    }, { once: true });
  }
  
  // Function to update audio volume for all audio elements
  function updateAudioVolume() {
    const allAudio = [correctSound, wrongSound, vishingSound, player?.jumpSound].filter(Boolean);
    const backgroundMusic = document.getElementById('backgroundMusic');
    
    allAudio.forEach(audio => {
      if (audio) {
        audio.volume = isMuted ? 0 : gameVolume;
      }
    });
    
    // Background music at half volume of sound effects
    if (backgroundMusic) {
      backgroundMusic.volume = isMuted ? 0 : gameVolume * 0.5;
    }
  }

  // Event listeners for popups
  document.getElementById('emailClean').addEventListener('click', () => {
    document.getElementById('emailPopup').style.display = 'none';
    wrongSound.currentTime = 0;
    wrongSound.play();
    // Lose a life for incorrect choice
    loseLife();
    showResultPopup(true); // This is correct - Clean is wrong choice for phishing email
  });
  
  // Event listener for the phishing link
  document.getElementById('phishingLink').addEventListener('click', (e) => {
    e.preventDefault(); // Prevent default link behavior
    document.getElementById('emailPopup').style.display = 'none';
    wrongSound.currentTime = 0;
    wrongSound.play();
    // Lose a life for incorrect choice
    loseLife();
    showResultPopup(true);
  });

  document.getElementById('emailMalicious').addEventListener('click', () => {
    document.getElementById('emailPopup').style.display = 'none';
    correctSound.currentTime = 0;
    correctSound.play();
    // No life lost for correct choice
    showResultPopup(false); // Report is correct choice, show congratulations
  });

  // NOTE: Removed duplicate event listeners for phone popup buttons
  // These are already handled in setupPopupEventListeners()

  // Space key to start the game
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space' && waitingToStart) {
      waitingToStart = false;
    }
  });
});
