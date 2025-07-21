class HackerController {
  constructor(ctx, width, height, speed, scaleRatio, obstacleController) {
    this.ctx = ctx;
    this.canvas = { width, height };
    this.speed = speed;
    this.scaleRatio = scaleRatio;
    this.obstacleController = obstacleController; // Store reference to obstacle controller
    
    // Single boss hacker instead of multiple hackers
    this.hacker = null;
    
    // Skull projectiles
    this.skullProjectiles = [];
    
    // Hacker dimensions
    this.hackerWidth = 2048 / 20; // Much larger for boss appearance
    this.hackerHeight = 2048 / 20;
    
    // Skull projectile dimensions - make them larger and consistent with other obstacles
    this.skullWidth = 2048 / 35;
    this.skullHeight = 2048 / 35;
    
    // Boss appearance settings
    this.stayDuration = 15000; // Boss stays for 15 seconds
    this.bossSpeed = 1.0; // Base boss speed multiplier
    this.cautionDuration = 3000; // Show caution for 3 seconds before boss appears
    this.showingCaution = false; // Flag to track if caution is currently showing
    this.minSpawnY = 50;
    this.maxSpawnY = height - 120; // Adjust based on ground height
    
    // Caution animation settings
    this.cautionBlinkTimer = 0;
    this.cautionBlinkInterval = 200; // Blink every 200ms
    this.cautionBlinkState = true;
    this.cautionGlitchTimer = 0;
    this.cautionGlitchInterval = 100; // Glitch effect every 100ms
    this.cautionGlitchOffset = 0;
    this.cautionGlitchState = false;
    
    // Points-based boss trigger
    this.lastBossPoints = 0;
    this.pointsThreshold = 500; // Boss appears every 500 points
    this.bossReady = false; // Flag to indicate boss is ready to appear
    
    // Track boss appearances for increasing difficulty
    this.bossAppearanceCount = 0;
    this.projectileCount = 3; // Start with 3 projectiles
    
    // Notification settings
    this.showNotification = false;
    this.notificationOpacity = 0;
    this.notificationTimer = 0;
    this.notificationCount = 0;
    this.maxNotifications = 2;
    
    // Initialize sounds
    this.evilLaughSound = new Audio('/games/phish404/audio/evil_laugh_02.ogg');
    this.evilLaughSound.volume = 0.3; // Reduced volume for evil laugh
    this.catHitSound = new Audio('/games/phish404/audio/cat-hit.mp3');
    this.eraseSound = new Audio('/games/phish404/audio/erase.wav');
    // Use an existing sound for loading phase
    this.loadingSound = new Audio('/games/phish404/audio/Catsong.mp3'); // Using Catsong for virus loading
    this.loadingSound.loop = true; // Loop the song during the entire loading phase
    // Use erase sound for clearing viruses
    this.clearSound = this.eraseSound; // Reuse the erase sound for virus clearing effect
    // Sound for player attacking the hacker
    this.attackSound = new Audio('/games/phish404/audio/attack.mp3');
    // Victory sound when hacker is defeated
    this.victorySound = new Audio('/games/phish404/audio/victory.mp3');
    
    // Music
    this.bossBattleMusic = new Audio('/games/phish404/audio/boss-battle.WAV');
    this.bossBattleMusic.volume = 0.3; // Reduced volume for boss music
    this.bossBattleMusic.loop = true;
    this.normalBackgroundMusic = null; // Will be set in update method
    
    // Popup tracking
    this.popupCheckInterval = 500; // Check for popups every 500ms
    this.popupCheckTimer = 0;
    
    // Track when obstacles are cleared for boss battle timing
    this.clearObstacleTime = null;
    
    // Boss battle state
    this.bossPaused = false;
    this.remainingBossTime = 0;
    this.bossStartTime = 0;
    
    // Initialize loading state variables
    this.isLoading = false;
    this.loadingTimer = 0;
    this.loadingPhaseActive = false;
    this.loadingStartTime = 0;
    this.loadingDuration = 10000; // 10 seconds loading phase
    
    // Initialize global flag for other controllers
    window.hackerIsLoading = false;
    
    // Debug logging
    this.lastDebugLog = 0;
    this.debugInterval = 1000; // Log every second
    
    // Track loading state changes
    this.loadingStateListeners = [];
  }
  
  // Set the loading state and notify listeners
  setLoadingState(isLoading) {
    if (this.isLoading !== isLoading) {
      this.isLoading = isLoading;
      window.hackerIsLoading = isLoading;
      
      if (isLoading) {
        this.loadingStartTime = Date.now();
        console.log('Hacker loading phase started');
      } else {
        console.log('Hacker loading phase ended');
      }
      
      // Notify listeners
      this.notifyLoadingStateChange(isLoading);
    }
  }
  
  // Add a listener for loading state changes
  addLoadingStateListener(callback) {
    if (typeof callback === 'function') {
      this.loadingStateListeners.push(callback);
    }
  }
  
  // Remove a loading state listener
  removeLoadingStateListener(callback) {
    const index = this.loadingStateListeners.indexOf(callback);
    if (index !== -1) {
      this.loadingStateListeners.splice(index, 1);
    }
  }
  
  // Notify all listeners of loading state change
  notifyLoadingStateChange(isLoading) {
    for (const listener of this.loadingStateListeners) {
      try {
        listener(isLoading);
      } catch (e) {
        console.error('Error in loading state listener:', e);
      }
    }
  }
  
  reset() {
    // Reset all properties for game restart
    this.skullProjectiles = [];
    this.lastBossPoints = 0;
    
    // Make sure to clear the loading flag
    window.hackerIsLoading = false;
    this.bossReady = false;
    this.bossAppearanceCount = 0;
    this.projectileCount = 1; // Start with only 1 projectile for first boss
    this.bossSpeed = 0.8; // Start with slower speed for first boss
    this.popupCheckTimer = 0;
    
    // Track when obstacles are cleared for boss battle timing
    this.clearObstacleTime = null;
    
    // Clear global flag
    window.hackerIsLoading = false;
    
    // Reset hacker lives when resetting the controller
    if (this.hacker) {
      this.hacker.lives = this.hacker.maxLives;
    }
    this.hacker = null;
    
    // Reset notification
    this.showNotification = false;
    this.notificationOpacity = 0;
    this.notificationTimer = 0;
    this.notificationCount = 0;
    
    // Reset boss music
    if (this.bossBattleMusic) {
      this.bossBattleMusic.pause();
      this.bossBattleMusic.currentTime = 0;
      this.bossBattleMusic.volume = 1.0;
    }
    
    // Resume normal background music if it was playing
    if (this.normalBackgroundMusic && !this.normalBackgroundMusic.paused) {
      this.normalBackgroundMusic.play().catch(e => console.log("Error resuming background music:", e));
    }
  }
  
  // Add method to check if any popup is active and close them
  async closeAllPopups() {
    const popups = [
      'emailPopup',
      'phonePopup',
      'resultPopup',
      'vishingPopup'
    ];
    
    let anyPopupWasActive = false;
    
    // Close all popups
    for (const popupId of popups) {
      const popup = document.getElementById(popupId);
      if (popup && (popup.style.display === 'block' || popup.style.visibility === 'visible')) {
        popup.style.display = 'none';
        popup.style.visibility = 'hidden';
        anyPopupWasActive = true;
        console.log(`Closed popup: ${popupId}`);
      }
    }
    
    // Check for any other popups that might have different IDs but are visible
    const allVisiblePopups = document.querySelectorAll('.popup, [id*="popup"], [id*="Popup"], [class*="popup"], [class*="Popup"]');
    for (const popup of allVisiblePopups) {
      if (popup.style.display === 'block' || popup.style.visibility === 'visible') {
        popup.style.display = 'none';
        popup.style.visibility = 'hidden';
        anyPopupWasActive = true;
        console.log(`Closed additional popup: ${popup.id || 'unnamed'}`);
      }
    }
    
    // If any popup was closed, wait a moment before continuing
    if (anyPopupWasActive) {
      console.log('Waiting for popups to fully clear...');
      await new Promise(resolve => setTimeout(resolve, 800)); // 800ms delay to ensure animations complete
    }
    
    return anyPopupWasActive;
  }
  
  // Add method to check if any popup is active
  isAnyPopupActive() {
    const popups = [
      'emailPopup',
      'phonePopup',
      'resultPopup',
      'vishingPopup'
    ];
    
    return popups.some(popupId => {
      const popup = document.getElementById(popupId);
      return popup && (popup.style.display === 'block' || popup.style.visibility === 'visible');
    });
  }
  
  // Add method to pause boss timer
  pauseBossTimer() {
    if (this.bossAppearTimer) {
      clearTimeout(this.bossAppearTimer);
      this.bossAppearTimer = null;
    }
    this.cautionStartTime = null;
    this.showingCaution = false;
    console.log('Boss timer paused due to popup');
  }
  
  // Add method to resume boss timer
  resumeBossTimer() {
    if (!this.hacker && this.bossReady) {
      this.showingCaution = true;
      this.cautionStartTime = Date.now();
      this.startBossAppearTimer();
      console.log('Boss timer resumed after popup');
    }
  }
  
  // Spawn the boss hacker
  spawnBoss() {
    if (this.hacker || !this.showingCaution) return;
    
    console.log('Spawning boss!');
    this.showingCaution = false;
    
    // Update the last boss points threshold to current threshold
    const coinCountElement = document.getElementById("coinCount");
    const currentScore = coinCountElement ? parseInt(coinCountElement.textContent) : 0;
    this.lastBossPoints = Math.floor(currentScore / this.pointsThreshold) * this.pointsThreshold;
    
    // Random Y position within bounds
    const randomY = Math.floor(Math.random() * (this.maxSpawnY - this.minSpawnY + 1)) + this.minSpawnY;
    
    // Increment boss appearance count
    this.bossAppearanceCount++;
    
    // Scale difficulty with each appearance - easier for new players
    if (this.bossAppearanceCount === 1) {
      // First boss: 1 very slow projectile
      this.projectileCount = 1;
      this.bossSpeed = 0.6; // Slower speed for first encounter
    } else if (this.bossAppearanceCount === 2) {
      // Second boss: 1 slightly faster projectile
      this.projectileCount = 1;
      this.bossSpeed = 0.8;
    } else if (this.bossAppearanceCount === 3) {
      // Third boss: 2 projectiles at moderate speed
      this.projectileCount = 2;
      this.bossSpeed = 0.9;
    } else if (this.bossAppearanceCount === 4) {
      // Fourth boss: 2 projectiles at normal speed
      this.projectileCount = 2;
      this.bossSpeed = 1.0;
    } else if (this.bossAppearanceCount === 5) {
      // Fifth boss: 3 projectiles at normal speed
      this.projectileCount = 3;
      this.bossSpeed = 1.0;
    } else {
      // Subsequent bosses: increase difficulty more gradually
      this.projectileCount = Math.min(3 + Math.floor((this.bossAppearanceCount - 5) / 2), 6); // Cap at 6 projectiles
      this.bossSpeed = 1.0 + (this.bossAppearanceCount * 0.1); // Increase speed by 10% each time
    }
    
    console.log(`Boss appearance #${this.bossAppearanceCount}: Speed ${this.bossSpeed.toFixed(1)}x, Projectiles: ${this.projectileCount}`);
    
    // Create new hacker boss
    this.hacker = new Hacker(
      this.ctx,
      this.canvas.width,
      randomY,
      this.hackerWidth * this.scaleRatio,
      this.hackerHeight * this.scaleRatio
    );
    
    // Apply increased difficulty stats
    const bonusLives = Math.floor(this.bossAppearanceCount / 2); // Extra life every 2 defeats
    this.hacker.resetLives(bonusLives);
    
    console.log(`HACKER CONTROLLER: Spawning boss #${this.bossAppearanceCount + 1} with ${this.hacker.lives} lives, ${this.projectileCount} projectiles, speed ${this.bossSpeed}x`);
    
    // Activate the hacker
    this.hacker.activate();
    
    // Pause obstacle spawning during boss battle
    if (this.obstacleController) {
      this.obstacleController.pauseSpawning = true;
      console.log('Paused obstacle spawning for boss battle');
    }
    
    // Music transition: pause normal background music and play boss battle music
    if (this.normalBackgroundMusic) {
      this.normalBackgroundMusic.pause();
    }
    this.bossBattleMusic.currentTime = 0;
    this.bossBattleMusic.play().catch(e => console.log("Error playing boss battle music:", e));
    
    // Play evil laugh sound
    this.evilLaughSound.currentTime = 0;
    this.evilLaughSound.play().catch(e => console.log("Error playing evil laugh sound:", e));
    
    // Show notification if we haven't shown too many
    if (this.notificationCount < this.maxNotifications) {
      this.showNotification = true;
      this.notificationOpacity = 1;
      this.notificationTimer = 0;
      this.notificationCount++;
    }
    
    // Start the boss end timer
    this.startBossEndTimer();
  }
  
  async startBossSequence() {
    if (this.showingCaution || this.hacker) return;
    
    console.log('Starting boss sequence...');
    
    try {
      // Clear all obstacles when the warning appears for a fair boss battle
      if (this.obstacleController) {
        // Clear all existing obstacles
        this.obstacleController.obstacles = [];
        console.log('Cleared all obstacles for boss battle');
        
        // Pause obstacle spawning immediately when warning appears
        this.obstacleController.pauseSpawning = true;
        this.obstacleController.pauseEmailPhone = true;
        console.log('Paused obstacle spawning for boss battle warning');
      }
      
      // First, close any open popups and wait for them to clear
      const hadPopups = await this.closeAllPopups();
      
      // If there were popups, wait a moment for them to animate out
      if (hadPopups) {
        console.log('Popups were closed, waiting before showing warning...');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Play a warning sound to alert the player
      if (this.evilLaughSound) {
        this.evilLaughSound.currentTime = 0;
        this.evilLaughSound.play().catch(e => console.log("Error playing warning sound:", e));
      }
      
      // Now show the caution
      this.showingCaution = true;
      this.cautionStartTime = Date.now();
      
      // Show notification if we haven't shown too many
      if (this.notificationCount < this.maxNotifications) {
        this.showNotification = true;
        this.notificationOpacity = 1;
        this.notificationTimer = 0;
        this.notificationCount++;
      }
      
      // Start the boss appear timer
      this.startBossAppearTimer();
      
      console.log('Warning sign activated!');
    } catch (error) {
      console.error('Error in boss sequence:', error);
    }
  }
  
  startBossAppearTimer() {
    if (this.bossAppearTimer) clearTimeout(this.bossAppearTimer);
    
    const elapsed = this.cautionStartTime ? (Date.now() - this.cautionStartTime) : 0;
    const remainingTime = Math.max(0, this.cautionDuration - elapsed);
    
    this.bossAppearTimer = setTimeout(() => {
      this.spawnBoss();
    }, remainingTime);
  }
  
  startBossEndTimer() {
    // Clear any existing timer
    if (this.bossEndTimer) {
      clearTimeout(this.bossEndTimer);
    }
    
    // Record the start time but don't set a timer to end the battle
    // The hacker will only leave when defeated by the player
    this.bossStartTime = Date.now();
    console.log('Boss battle started - hacker will remain until defeated');
    
    // Note: We're not setting this.bossEndTimer anymore
    // The hacker will only be removed when all lives are depleted
  }
  
  pauseBossTimer() {
    if (this.bossEndTimer && !this.bossPaused) {
      // Calculate remaining time
      const elapsed = Date.now() - this.bossStartTime;
      this.remainingBossTime = Math.max(0, this.stayDuration - elapsed);
      
      // Clear the current timer
      clearTimeout(this.bossEndTimer);
      this.bossEndTimer = null;
      this.bossPaused = true;
      
      // Pause boss battle music
      if (this.bossBattleMusic) {
        this.bossBattleMusic.pause();
      }
      
      console.log('Paused boss battle timer');
    }
  }
  
  update(gameSpeed, frameTimeDelta) {
    // Get reference to the background music if we don't have it yet
    if (!this.normalBackgroundMusic) {
      // Find the background music element
      const audioElements = document.querySelectorAll('audio');
      for (let audio of audioElements) {
        if (audio.src.includes('background.mp3')) {
          this.normalBackgroundMusic = audio;
          break;
        }
      }
      
      // If not found, create one (fallback)
      if (!this.normalBackgroundMusic) {
        this.normalBackgroundMusic = new Audio('/games/phish404/audio/background.mp3');
        this.normalBackgroundMusic.loop = true;
      }
    }
    
    // Update popup check timer
    this.popupCheckTimer += frameTimeDelta;
    
    // Check for active popups and obstacles periodically
    if (this.popupCheckTimer >= this.popupCheckInterval) {
      this.popupCheckTimer = 0;
      
      // Check if any popups are visible
      const emailPopup = document.getElementById('emailPopup');
      const phonePopup = document.getElementById('phonePopup');
      const resultPopup = document.getElementById('resultPopup');
      const vishingPopup = document.getElementById('vishingPopup');
      
      const popupsActive = emailPopup && emailPopup.style.display === 'block' ||
                         phonePopup && phonePopup.style.display === 'block' ||
                         resultPopup && resultPopup.style.display === 'block' ||
                         vishingPopup && vishingPopup.style.display === 'block';
      
      // Check if ANY obstacles are on screen (not just near player)
      const anyObstaclesOnScreen = this.obstacleController && 
                               this.obstacleController.obstacles && 
                               this.obstacleController.obstacles.length > 0;
      
      // Check if there are any phone/email obstacles specifically
      const anyPhoneEmailObstacles = this.obstacleController && 
                               this.obstacleController.obstacles && 
                               this.obstacleController.obstacles.some(obstacle => 
                                 obstacle.type === 'email' || obstacle.type === 'phone');
      
      // Set boss ready flag based on stricter conditions:
      // 1. No popups active
      // 2. No phone/email obstacles on screen at all
      // 3. Wait at least 2 seconds after last obstacle cleared (to prevent immediate boss spawn)
      if (!this.clearObstacleTime && !anyPhoneEmailObstacles && !popupsActive) {
        // Start the timer when all obstacles are cleared
        this.clearObstacleTime = Date.now();
      } else if (anyPhoneEmailObstacles || popupsActive) {
        // Reset the timer if obstacles appear again
        this.clearObstacleTime = null;
      }
      
      // Only set boss ready if all conditions are met including the time delay
      const timeDelaySatisfied = this.clearObstacleTime && (Date.now() - this.clearObstacleTime > 2000);
      this.bossReady = !popupsActive && !anyPhoneEmailObstacles && timeDelaySatisfied;
    }
    
    // Get current score from coin counter element
    const coinCountElement = document.getElementById("coinCount");
    const currentScore = coinCountElement ? parseInt(coinCountElement.textContent) : 0;
    
    // Check if we've reached a new 500-point threshold and boss is ready to appear
    const currentThreshold = Math.floor(currentScore / this.pointsThreshold) * this.pointsThreshold;
    
    // Handle caution animation and hacker boss appearance
    const popupActive = this.isAnyPopupActive();
    
    if (!this.hacker && !this.showingCaution && 
        currentThreshold > this.lastBossPoints && 
        this.bossReady && !popupActive) {
      // Start the boss sequence
      this.startBossSequence();
    } else if (popupActive && this.showingCaution && !this.hacker) {
      // Pause the boss timer if a popup appears during caution
      this.pauseBossTimer();
    }
    
    // DO NOT automatically spawn the boss here - this was causing the warning to be skipped
    // The boss will be spawned by the timer after the warning duration
    
    // Pause boss battle if popup is active during the battle
    if (popupActive && this.hacker) {
      // Store remaining time
      if (this.bossEndTimer && !this.bossPaused) {
        const elapsed = Date.now() - this.bossStartTime;
        this.remainingBossTime = Math.max(0, this.stayDuration - elapsed);
        clearTimeout(this.bossEndTimer);
        this.bossEndTimer = null;
        this.bossPaused = true;
        console.log('Paused boss battle due to popup');
      }
    } 
    // Resume boss battle if popup is closed
    else if (!popupActive && this.bossPaused && this.hacker) {
      this.bossStartTime = Date.now() - (this.stayDuration - this.remainingBossTime);
      this.startBossEndTimer();
      this.bossPaused = false;
      console.log('Resumed boss battle after popup');
    }
    
    // Update hacker if active and not paused
    if (this.hacker && !this.bossPaused) {
      // Store previous loading state to detect transitions
      const wasLoading = this.hacker.isLoading;
      
      // Update hacker
      this.hacker.update(frameTimeDelta, gameSpeed);
      
      // Debug loading state changes
      if (wasLoading !== this.hacker.isLoading) {
        console.log(`HACKER CONTROLLER: Loading state changed from ${wasLoading} to ${this.hacker.isLoading}`);
      }
      
      // Check if hacker just started loading
      if (!wasLoading && this.hacker.isLoading) {
        console.log('Hacker entered loading mode - clearing all viruses and obstacles');
        
        // Set global flag to indicate hacker is loading
        window.hackerIsLoading = true;
        console.log('Set window.hackerIsLoading = true');
        
        // Switch music: pause boss battle music and play Catsong
        if (this.bossBattleMusic) {
          this.bossBattleMusic.pause();
          this.bossBattleMusic.currentTime = 0;
        }
        
        // Play the Catsong during loading phase
        if (this.loadingSound) {
          this.loadingSound.currentTime = 0;
          this.loadingSound.play().catch(e => console.log("Error playing Catsong during loading:", e));
        }
        
        // Log the state of all controllers before clearing
        console.log('Current game state before clearing:');
        console.log('- Skull projectiles:', this.skullProjectiles.length);
        if (window.obstacleController) console.log('- Obstacles:', window.obstacleController.obstacles ? window.obstacleController.obstacles.length : 'N/A');
        if (window.skullController) console.log('- Skulls:', window.skullController.skulls ? window.skullController.skulls.length : 'N/A');
        if (window.coinController) console.log('- Coins:', window.coinController.coins ? window.coinController.coins.length : 'N/A');
        if (window.milkController) console.log('- Milk bottles:', window.milkController.milkBottles ? window.milkController.milkBottles.length : 'N/A');
        if (window.burgerController) console.log('- Burgers:', window.burgerController.burgers ? window.burgerController.burgers.length : 'N/A');
        
        // Loading sound is already playing from earlier code
        // No need to play it again
        
        // Clear all viruses (projectiles) from the screen
        if (this.skullProjectiles.length > 0) {
          console.log(`Clearing ${this.skullProjectiles.length} viruses from screen`);
          // Play erase sound if available
          if (this.eraseSound) {
            this.eraseSound.currentTime = 0;
            this.eraseSound.play().catch(e => console.log("Error playing erase sound:", e));
          }
          // Clear all projectiles
          this.skullProjectiles = [];
        }
        
        // Clear all other obstacles from the screen
        if (this.obstacleController && typeof this.obstacleController.reset === 'function') {
          console.log('Clearing all obstacles from screen during loading phase');
          this.obstacleController.reset();
        }
        
        // Access game controllers directly
        // First, make sure obstacleController is reset (we already have a reference)
        if (this.obstacleController && typeof this.obstacleController.reset === 'function') {
          console.log('Clearing obstacles from obstacleController during loading phase');
          this.obstacleController.reset();
        }
        
        // Access other controllers through the parent scope
        // These controllers are defined in game.js and should be accessible
        if (window.skullController && typeof window.skullController.reset === 'function') {
          console.log('Clearing skulls from skullController during loading phase');
          window.skullController.reset();
        }
        
        if (window.coinController && typeof window.coinController.reset === 'function') {
          console.log('Clearing coins from coinController during loading phase');
          window.coinController.reset();
        }
        
        if (window.milkController && typeof window.milkController.reset === 'function') {
          console.log('Clearing milk bottles from milkController during loading phase');
          window.milkController.reset();
        }
        
        if (window.burgerController && typeof window.burgerController.reset === 'function') {
          console.log('Clearing burgers from burgerController during loading phase');
          window.burgerController.reset();
        }
        
        // Create a visual effect for clearing obstacles
        this.createClearEffect();
        
        // Log the state of all controllers after clearing to verify they were cleared
        console.log('Game state after clearing all obstacles:');
        console.log('- Skull projectiles:', this.skullProjectiles.length);
        if (window.obstacleController) console.log('- Obstacles:', window.obstacleController.obstacles ? window.obstacleController.obstacles.length : 'N/A');
        if (window.skullController) console.log('- Skulls:', window.skullController.skulls ? window.skullController.skulls.length : 'N/A');
        if (window.coinController) console.log('- Coins:', window.coinController.coins ? window.coinController.coins.length : 'N/A');
        if (window.milkController) console.log('- Milk bottles:', window.milkController.milkBottles ? window.milkController.milkBottles.length : 'N/A');
        if (window.burgerController) console.log('- Burgers:', window.burgerController.burgers ? window.burgerController.burgers.length : 'N/A');
      }
      
      // Check if hacker just finished loading
      if (wasLoading && !this.hacker.isLoading) {
        console.log('HACKER CONTROLLER: Hacker finished loading mode!');
        console.log(`HACKER CONTROLLER: Before reset - window.hackerIsLoading = ${window.hackerIsLoading}`);
        
        // Reset global flag to indicate hacker is no longer loading
        window.hackerIsLoading = false;
        console.log(`HACKER CONTROLLER: After reset - window.hackerIsLoading = ${window.hackerIsLoading}`);
        console.log('HACKER CONTROLLER: Projectile collisions should now be enabled!');
        
        // Stop the loading sound
        if (this.loadingSound) {
          this.loadingSound.pause();
          this.loadingSound.currentTime = 0;
          console.log('Stopped loading sound');
        }
        
        // Resume boss battle music
        if (this.bossBattleMusic && this.bossBattleMusic.paused) {
          this.bossBattleMusic.play().catch(e => console.log("Error resuming boss music:", e));
          console.log('Resumed boss music after loading phase');
        }
      }
      
      // Check if hacker can shoot
      if (this.hacker.canShoot()) {
        // Reset shoot timer
        this.hacker.resetShootTimer();
        
        // Create new skull projectiles
        this.shootSkullProjectiles();
      }
    }
    
    // Update all skull projectiles
    if (this.skullProjectiles.length > 0) {
      console.log(`PROJECTILE UPDATE: Updating ${this.skullProjectiles.length} projectiles with gameSpeed=${gameSpeed}`);
    }
    this.skullProjectiles.forEach(projectile => {
      projectile.update(gameSpeed);
    });
    
    // Remove off-screen projectiles
    this.skullProjectiles = this.skullProjectiles.filter(projectile => !projectile.isOffScreen());
    
    // Update notification
    if (this.showNotification) {
      this.notificationTimer += frameTimeDelta;
      
      // Fade out after 3 seconds
      if (this.notificationTimer > 3000) {
        this.notificationOpacity -= 0.02;
        
        if (this.notificationOpacity <= 0) {
          this.showNotification = false;
          this.notificationOpacity = 0;
        }
      }
    }
  }
  
  shootSkullProjectiles() {
    console.log('SHOOT PROJECTILES: Starting to shoot skull projectiles');
    if (!this.hacker) {
      console.log('SHOOT PROJECTILES: No hacker available');
      return;
    }
    
    console.log(`SHOOT PROJECTILES: Current projectile count before shooting: ${this.skullProjectiles.length}`);
    
    // Play evil laugh sound when shooting
    this.evilLaughSound.currentTime = 0;
    this.evilLaughSound.play().catch(e => console.log("Error playing evil laugh sound:", e));
    
    // Calculate starting position (from hacker's position)
    const startX = this.hacker.fixedX;
    const startY = this.hacker.y + this.hacker.height / 2;
    
    // Get player position from the game
    // We need to find the player object to aim at it
    const player = window.gamePlayer; // This assumes the player is stored in a global variable
    
    // Base speed for projectiles - reduced for easier gameplay
    // Make it start slower and increase more gradually with each appearance
    const baseSpeed = 1.2 + (this.bossAppearanceCount * 0.5); // Starts at 1.2, increases by 0.5 each time
    
    // PART 1: PLAYER-TARGETING PROJECTILES
    // Always shoot 3 skulls that aim at the player's current position
    if (player) {
      // Calculate angle to player
      const playerCenterX = player.x + (player.width / 2);
      const playerCenterY = player.y + (player.height / 2);
      
      // Calculate angle in radians and convert to degrees
      const dx = playerCenterX - startX;
      const dy = playerCenterY - startY;
      const angleToPlayer = Math.atan2(dy, -dx) * 180 / Math.PI;
      
      console.log(`Aiming at player: angle ${angleToPlayer.toFixed(2)} degrees`);
      
      // Create 3 skulls aimed at player with slight spread
      const aimSpread = 15; // Degrees of spread for the aimed shots
      const aimAngles = [
        angleToPlayer - aimSpread,
        angleToPlayer,
        angleToPlayer + aimSpread
      ];
      
      // Create the player-targeting skulls
      for (let i = 0; i < aimAngles.length; i++) {
        const skull = new SkullProjectile(
          this.ctx,
          startX,
          startY,
          this.skullWidth * this.scaleRatio,
          this.skullHeight * this.scaleRatio,
          aimAngles[i],
          baseSpeed - 1 // Slightly slower than the pattern projectiles
        );
        
        console.log(`SHOOT PROJECTILES: Created player-targeting skull ${i} at (${startX}, ${startY}) with angle ${aimAngles[i]}`);
        this.skullProjectiles.push(skull);
        console.log(`SHOOT PROJECTILES: Total projectiles after adding: ${this.skullProjectiles.length}`);
      }
    }
    
    // PART 2: PATTERN-BASED PROJECTILES
    // Different projectile patterns based on boss appearance count
    // Higher appearance counts get more complex patterns
    const patternType = Math.min(this.bossAppearanceCount, 5); // Max of 6 different patterns (0-5)
    
    let angles = [];
    let speeds = [];
    
    // Pattern types remain similar but with adjusted angles and speeds
    switch(patternType) {
      case 0: // Basic horizontal line (first appearance)
        for (let i = 0; i < this.projectileCount; i++) {
          const spread = 40; // Total spread angle
          const step = spread / (this.projectileCount - 1 || 1);
          const angle = -spread/2 + i * step;
          angles.push(angle);
          speeds.push(baseSpeed);
        }
        break;
        
      case 1: // V-shaped pattern (second appearance)
        for (let i = 0; i < this.projectileCount; i++) {
          // Alternate between positive and negative angles
          const angle = (i % 2 === 0) ? 20 + (i * 5) : -20 - (i * 5);
          angles.push(angle);
          speeds.push(baseSpeed + (i * 0.2)); // Slightly varying speeds
        }
        break;
        
      case 2: // Sine wave pattern (third appearance)
        for (let i = 0; i < this.projectileCount; i++) {
          // Create a sine wave pattern
          const baseAngle = -30 + (i * (60 / (this.projectileCount - 1 || 1)));
          const sineOffset = Math.sin(i * 0.5) * 15;
          angles.push(baseAngle + sineOffset);
          speeds.push(baseSpeed + Math.cos(i * 0.5) * 2); // Varying speeds
        }
        break;
        
      case 3: // Spiral pattern (fourth appearance)
        for (let i = 0; i < this.projectileCount; i++) {
          // Create a spiral-like pattern
          const angle = (i * (360 / this.projectileCount)) % 90 - 45;
          angles.push(angle);
          speeds.push(baseSpeed + (i % 3)); // Three different speeds
        }
        break;
        
      case 4: // Random spread (fifth appearance)
        for (let i = 0; i < this.projectileCount; i++) {
          // Random angles but within a reasonable range
          const angle = Math.random() * 90 - 45;
          angles.push(angle);
          speeds.push(baseSpeed + Math.random() * 3); // Random speeds
        }
        break;
        
      case 5: // Combined patterns (sixth+ appearance)
        // Mix of previous patterns with higher intensity
        const subPattern = this.bossAppearanceCount % 3; // Cycle through sub-patterns
        
        if (subPattern === 0) {
          // Alternating V-shape and straight
          for (let i = 0; i < this.projectileCount; i++) {
            const isEven = i % 2 === 0;
            const angle = isEven ? (-30 + i * 10) : (i * 5);
            angles.push(angle);
            speeds.push(baseSpeed + (isEven ? 2 : 0)); // Alternating speeds
          }
        } else if (subPattern === 1) {
          // Double sine wave
          for (let i = 0; i < this.projectileCount; i++) {
            const wavePos = i / this.projectileCount;
            const angle = Math.sin(wavePos * Math.PI * 2) * 30;
            angles.push(angle);
            speeds.push(baseSpeed + Math.cos(wavePos * Math.PI * 4) * 2);
          }
        } else {
          // Cross pattern
          for (let i = 0; i < this.projectileCount; i++) {
            const angle = (i % 4 === 0) ? 0 : ((i % 4 === 1) ? 30 : ((i % 4 === 2) ? -30 : 15));
            angles.push(angle);
            speeds.push(baseSpeed + (i % 3));
          }
        }
        break;
    }
    
    // Add a small random offset to each angle to make patterns less predictable
    // but still maintain the overall pattern structure
    angles = angles.map(angle => angle + (Math.random() * 5 - 2.5));
    
    // Create skull projectiles with the pattern
    for (let i = 0; i < angles.length; i++) {
      const skull = new SkullProjectile(
        this.ctx,
        startX,
        startY,
        this.skullWidth * this.scaleRatio,
        this.skullHeight * this.scaleRatio,
        angles[i],
        speeds[i] // Pass speed to the projectile
      );
      
      this.skullProjectiles.push(skull);
    }
    
    // PART 3: FAST LINEAR HORIZONTAL SKULLS
    // Add fast horizontal skulls that move linearly from the hacker
    // The number of these increases with boss appearance count
    const fastSkullCount = Math.min(1 + Math.floor(this.bossAppearanceCount / 2), 4); // 1-4 fast skulls based on appearance
    const fastSkullSpeed = baseSpeed + 3; // Much faster than normal projectiles
    
    for (let i = 0; i < fastSkullCount; i++) {
      // Vertical position varies slightly for each fast skull
      const yOffset = (i - (fastSkullCount - 1) / 2) * 30; // Spread them vertically
      
      const skull = new SkullProjectile(
        this.ctx,
        startX,
        startY + yOffset,
        this.skullWidth * this.scaleRatio * 0.8, // Slightly smaller
        this.skullHeight * this.scaleRatio * 0.8,
        0, // Straight horizontal angle
        fastSkullSpeed // Fast speed
      );
      
      this.skullProjectiles.push(skull);
    }
  }
  
  checkProjectileCollisions(player) {
    // Debug: Check if player is valid
    if (!player) {
      console.error('Invalid player object passed to checkProjectileCollisions');
      return false;
    }
    
    // Skip collision detection if player is invincible
    if (player.isInvincible) {
      console.log('Player is invincible, skipping projectile collision check');
      return false;
    }
    
    console.log(`Checking projectile collisions. Player at (${player.x}, ${player.y}), ${this.skullProjectiles.length} projectiles active`);
  }
  
  drawCaution() {
    if (!this.showingCaution) return;
    
    this.ctx.save();
    
    // Semi-transparent red overlay across the entire screen for dramatic effect
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Calculate dimensions - make it bigger
    const boxWidth = this.canvas.width * 0.9;
    const boxHeight = this.canvas.height * 0.5; // Make taller
    const x = (this.canvas.width - boxWidth) / 2;
    const y = (this.canvas.height - boxHeight) / 2;
    
    // Update blink timer - faster blinking
    this.cautionBlinkTimer += 16; // Assuming ~60fps
    if (this.cautionBlinkTimer >= this.cautionBlinkInterval) {
      this.cautionBlinkTimer = 0;
      this.cautionBlinkState = !this.cautionBlinkState;
    }
    
    // Update glitch timer - more frequent glitches
    this.cautionGlitchTimer += 16;
    if (this.cautionGlitchTimer >= this.cautionGlitchInterval) {
      this.cautionGlitchTimer = 0;
      this.cautionGlitchState = Math.random() < 0.6; // 60% chance of glitch
      if (this.cautionGlitchState) {
        // More extreme glitch effect
        this.cautionGlitchOffset = (Math.random() * 25 - 12.5) * this.scaleRatio;
      } else {
        this.cautionGlitchOffset = 0;
      }
    }
    
    // Draw background with pulsing red - more intense
    const pulse = (Math.sin(Date.now() / 150) * 0.5 + 0.5) * 0.8 + 0.2;
    const gradientY = y + boxHeight * pulse * 0.2;
    
    // Create gradient for more dramatic effect
    const gradient = this.ctx.createLinearGradient(x, y, x, y + boxHeight);
    gradient.addColorStop(0, `rgba(180, 0, 0, ${0.95 * pulse})`);
    gradient.addColorStop(0.5, `rgba(120, 0, 0, ${0.9 * pulse})`);
    gradient.addColorStop(1, `rgba(80, 0, 0, ${0.95 * pulse})`);
    
    this.ctx.fillStyle = gradient;
    
    // Apply glitch effect to the background box
    if (this.cautionGlitchState && Math.random() < 0.3) {
      // Split the box into 3-5 horizontal slices with slight offsets
      const slices = Math.floor(Math.random() * 3) + 3;
      const sliceHeight = boxHeight / slices;
      
      for (let i = 0; i < slices; i++) {
        const sliceOffset = Math.random() * 10 - 5;
        this.ctx.fillRect(
          x + sliceOffset * this.scaleRatio, 
          y + i * sliceHeight, 
          boxWidth - sliceOffset * this.scaleRatio, 
          sliceHeight
        );
      }
    } else {
      this.ctx.fillRect(x, y, boxWidth, boxHeight);
    }
    
    // Draw warning triangle - larger and with glow
    const triangleSize = Math.min(boxWidth, boxHeight) * 0.45;
    const triangleX = this.canvas.width / 2 + (this.cautionGlitchState ? this.cautionGlitchOffset : 0);
    const triangleY = y + triangleSize * 0.7;
    
    // Add glow effect
    this.ctx.shadowColor = '#ffcc00';
    this.ctx.shadowBlur = 15 * this.scaleRatio;
    
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.beginPath();
    this.ctx.moveTo(triangleX, triangleY - triangleSize / 2);
    this.ctx.lineTo(triangleX + triangleSize / 2, triangleY + triangleSize / 2);
    this.ctx.lineTo(triangleX - triangleSize / 2, triangleY + triangleSize / 2);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Reset shadow for other elements
    this.ctx.shadowBlur = 0;
    
    // Draw exclamation mark in triangle
    this.ctx.fillStyle = 'black';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = `bold ${triangleSize * 0.6}px Arial`;
    this.ctx.fillText('!', triangleX, triangleY + triangleSize * 0.1);
    
    // Draw warning text with enhanced glitch effect
    const glitchOffset = this.cautionGlitchState ? this.cautionGlitchOffset : 0;
    
    // Main warning text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 8 * this.scaleRatio;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Apply text shadow for glow effect
    this.ctx.shadowColor = '#ff0000';
    this.ctx.shadowBlur = 10 * this.scaleRatio;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Draw text with outline for better visibility
    this.ctx.font = `bold ${38 * this.scaleRatio}px 'Press Start 2P', monospace`;
    
    // Apply random color shift for glitch effect
    if (this.cautionGlitchState && Math.random() < 0.3) {
      this.ctx.fillStyle = Math.random() < 0.5 ? '#ff00ff' : '#00ffff';
    } else {
      this.ctx.fillStyle = '#ff0000';
    }
    
    // Text with glitch effect - sometimes split into parts
    if (this.cautionGlitchState && Math.random() < 0.2) {
      // Split text effect
      const text = 'WARNING';
      const charWidth = 30 * this.scaleRatio;
      
      for (let i = 0; i < text.length; i++) {
        const charOffset = Math.random() * 10 - 5;
        const xPos = this.canvas.width / 2 - (text.length * charWidth / 2) + (i * charWidth) + glitchOffset;
        this.ctx.fillText(text[i], xPos, y + 80 * this.scaleRatio + charOffset);
      }
    } else {
      // Normal text with outline
      this.ctx.strokeText('WARNING', this.canvas.width / 2 + glitchOffset, y + 80 * this.scaleRatio);
      this.ctx.fillText('WARNING', this.canvas.width / 2 + glitchOffset, y + 80 * this.scaleRatio);
    }
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
    
    // Secondary text
    this.ctx.font = `bold ${28 * this.scaleRatio}px 'Press Start 2P', monospace`;
    
    // Apply shadow for secondary text
    this.ctx.shadowColor = '#ff0000';
    this.ctx.shadowBlur = 8 * this.scaleRatio;
    
    // Text outline for secondary text
    this.ctx.strokeText('HACKER DETECTED!', this.canvas.width / 2 + glitchOffset, y + 140 * this.scaleRatio);
    
    // Main text for secondary
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('HACKER DETECTED!', this.canvas.width / 2 + glitchOffset, y + 140 * this.scaleRatio);
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
    
    // Draw countdown timer with enhanced pulsing effect
    const timeLeft = Math.ceil((this.cautionDuration - (Date.now() - this.cautionStartTime)) / 1000);
    if (timeLeft > 0) {
      // More dramatic pulse
      const pulseSize = 1 + (Math.sin(Date.now() / 150) * 0.2);
      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2, y + 200 * this.scaleRatio);
      this.ctx.scale(pulseSize, pulseSize);
      this.ctx.translate(-this.canvas.width / 2, -(y + 200 * this.scaleRatio));
      
      // Apply shadow for countdown
      this.ctx.shadowColor = '#ffff00';
      this.ctx.shadowBlur = 10 * this.scaleRatio;
      
      this.ctx.font = `bold ${32 * this.scaleRatio}px 'Press Start 2P', monospace`;
      this.ctx.fillStyle = this.cautionBlinkState ? '#ffff00' : '#ff9900'; // Blinking color
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`PREPARE IN ${timeLeft}...`, this.canvas.width / 2, y + 200 * this.scaleRatio);
      this.ctx.restore();
    }
    
    // Add enhanced digital noise/static for effect
    const noisePoints = 300; // More noise points
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < noisePoints; i++) {
      const noiseX = x + Math.random() * boxWidth;
      const noiseY = y + Math.random() * boxHeight;
      const noiseSize = Math.random() * 4 * this.scaleRatio; // Larger noise particles
      this.ctx.fillRect(noiseX, noiseY, noiseSize, noiseSize);
    }
    
    // Add scan lines effect
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < boxHeight; i += 4) {
      this.ctx.fillRect(x, y + i, boxWidth, 1);
    }
    
    // Add pulsing border effect - thicker and more dramatic
    if (this.cautionBlinkState) {
      // Create gradient for border
      const borderGradient = this.ctx.createLinearGradient(x, y, x, y + boxHeight);
      borderGradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
      borderGradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.8)');
      borderGradient.addColorStop(1, 'rgba(255, 0, 0, 0.8)');
      
      this.ctx.strokeStyle = borderGradient;
      this.ctx.lineWidth = 25 * this.scaleRatio;
      this.ctx.strokeRect(
        x - 8 * this.scaleRatio, 
        y - 8 * this.scaleRatio, 
        boxWidth + 16 * this.scaleRatio, 
        boxHeight + 16 * this.scaleRatio
      );
    }
    
    this.ctx.restore();
  }
  
  drawNotification() {
    // Only draw if notification is active
    if (this.showNotification && this.notificationOpacity > 0) {
      // Draw notification text
      this.ctx.save();
      this.ctx.fillStyle = `rgba(255, 0, 0, ${this.notificationOpacity})`; // Red with opacity
      this.ctx.strokeStyle = `rgba(0, 0, 0, ${this.notificationOpacity})`; // Black outline with opacity
      this.ctx.lineWidth = 2;
      this.ctx.font = '14px "Press Start 2P"';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      const text = "ALERT! HACKER APPROACHING!";
      const x = this.canvas.width / 2;
      const y = 100;
      
      // Draw text with outline for better visibility
      this.ctx.strokeText(text, x, y);
      this.ctx.fillText(text, x, y);
      this.ctx.restore();
    }
  }
  
  checkCollision(player) {
    // Skip collision detection if player is invincible
    if (player.isInvincible) {
      console.log('Player is invincible, skipping hacker collision check');
      return null;
    }

    if (this.hacker && this.hacker.isActive && this.hacker.isActive()) {
      // Simple rectangle collision detection
      const playerHitbox = {
        x: player.x + player.width * 0.2,
        y: player.y + player.height * 0.2,
        width: player.width * 0.6,
        height: player.height * 0.6
      };
      
      const hackerHitbox = {
        x: this.hacker.fixedX + this.hacker.width * 0.2, // Use fixedX for correct position
        y: this.hacker.y + this.hacker.height * 0.2,
        width: this.hacker.width * 0.6,
        height: this.hacker.height * 0.6
      };
      
      const isColliding = (
        playerHitbox.x < hackerHitbox.x + hackerHitbox.width &&
        playerHitbox.x + playerHitbox.width > hackerHitbox.x &&
        playerHitbox.y < hackerHitbox.y + hackerHitbox.height &&
        playerHitbox.y + playerHitbox.height > hackerHitbox.y
      );
      
      if (isColliding) {
        console.log('Player collided with hacker boss!');
        
        // Different behavior based on loading state
        if (this.hacker.isLoading) {
          // During loading phase, player can attack the hacker
          console.log('Player attacked the hacker during loading phase!');
          
          // Play attack sound
          this.attackSound = this.attackSound || new Audio('/games/phish404/audio/attack.mp3');
          this.attackSound.currentTime = 0;
          this.attackSound.play().catch(e => console.log("Error playing attack sound:", e));
          
          // Damage the hacker
          const hackerDefeated = this.hacker.takeDamage();
          
          if (hackerDefeated) {
            console.log('Hacker defeated! Loading phase ended.');
            
            // Play victory sound
            this.victorySound = this.victorySound || new Audio('/games/phish404/audio/victory.mp3');
            this.victorySound.currentTime = 0;
            this.victorySound.play().catch(e => console.log("Error playing victory sound:", e));
            
            // End loading phase
            window.hackerIsLoading = false;
            
            // Stop the loading sound (Catsong)
            if (this.loadingSound) {
              this.loadingSound.pause();
              this.loadingSound.currentTime = 0;
            }
            
            // Resume normal background music
            if (this.normalBackgroundMusic) {
              this.normalBackgroundMusic.play().catch(e => console.log("Error resuming background music:", e));
            }
            
            // Resume obstacle spawning
            if (this.obstacleController) {
              this.obstacleController.pauseSpawning = false;
              this.obstacleController.pauseEmailPhone = false;
              console.log('Resumed obstacle spawning after boss defeat');
            }
            
            // Remove the hacker
            this.hacker.deactivate();
            this.hacker = null;
          }
          
          // Make player briefly invincible to prevent multiple rapid hits
          player.makeInvincible(1000);
          
          return null; // No damage to player during loading phase
        } else {
          // Normal phase - player gets damaged
          // Play hit sound
          this.catHitSound.currentTime = 0;
          this.catHitSound.play().catch(e => console.log("Error playing cat hit sound:", e));
          
          // Play evil laugh when player is hit
          this.evilLaughSound.currentTime = 0;
          this.evilLaughSound.play().catch(e => console.log("Error playing evil laugh sound:", e));
          
          return this.hacker; // Return the hacker that was hit
        }
      }
    }
    
    return null; // No collision
  }
  
  checkProjectileCollisions(player) {
    // Debug logging
    console.log(`PROJECTILE COLLISION CHECK: projectiles=${this.skullProjectiles?.length || 0}, window.hackerIsLoading=${window.hackerIsLoading}, hacker.isLoading=${this.hacker?.isLoading}`);
    
    // Check each condition individually for debugging
    if (!player) {
      console.log('PROJECTILE COLLISION: SKIPPED - No player object');
      return false;
    }
    if (!this.skullProjectiles) {
      console.log('PROJECTILE COLLISION: SKIPPED - No skullProjectiles array');
      return false;
    }
    if (this.skullProjectiles.length === 0) {
      console.log('PROJECTILE COLLISION: SKIPPED - No projectiles in array');
      return false;
    }
    if (window.hackerIsLoading) {
      console.log('PROJECTILE COLLISION: SKIPPED - window.hackerIsLoading is true');
      return false;
    }
    if (this.hacker?.isLoading) {
      console.log('PROJECTILE COLLISION: SKIPPED - hacker.isLoading is true');
      return false;
    }
    
    console.log('PROJECTILE COLLISION: All conditions passed, proceeding with collision detection');
    
    let hit = false;
    
    console.log(`PROJECTILE COLLISION: Checking ${this.skullProjectiles.length} projectiles for collision`);
    console.log(`PLAYER POSITION: x=${player.x?.toFixed(1)}, y=${player.y?.toFixed(1)}, w=${player.width}, h=${player.height}`);
    
    // Check each projectile for collision with player
    for (let i = this.skullProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.skullProjectiles[i];
      
      // Debug projectile properties
      console.log(`PROJECTILE ${i}: x=${projectile.x?.toFixed(1)}, y=${projectile.y?.toFixed(1)}, w=${projectile.width}, h=${projectile.height}`);
      
      // Simple rectangle collision detection
      const playerHitbox = {
        x: player.x + player.width * 0.2,
        y: player.y + player.height * 0.2,
        width: player.width * 0.6,
        height: player.height * 0.6
      };
      
      const projectileHitbox = {
        x: projectile.x + projectile.width * 0.2,
        y: projectile.y + projectile.height * 0.2,
        width: projectile.width * 0.6,
        height: projectile.height * 0.6
      };
      
      const isColliding = (
        playerHitbox.x < projectileHitbox.x + projectileHitbox.width &&
        playerHitbox.x + playerHitbox.width > projectileHitbox.x &&
        playerHitbox.y < projectileHitbox.y + projectileHitbox.height &&
        playerHitbox.y + playerHitbox.height > projectileHitbox.y
      );
      
      if (isColliding) {
        console.log(`PROJECTILE COLLISION: HIT DETECTED with projectile ${i}!`);
        // Collision detected with this projectile
        hit = true;
        
        // Remove the projectile
        this.skullProjectiles.splice(i, 1);
        console.log(`PROJECTILE COLLISION: Removed projectile, ${this.skullProjectiles.length} remaining`);
        
        // Play hit sound
        if (this.catHitSound) {
          this.catHitSound.currentTime = 0;
          this.catHitSound.play().catch(e => console.log("Error playing cat hit sound:", e));
        }
        
        // Trigger player hit effect (if available)
        if (player.takeDamage) {
          player.takeDamage(1); // 1 damage per hit
        }
      }
    }
    
    return hit;
  }
  
  // Draw the hacker and conditionally draw projectiles
  draw(frameTimeDelta, isLoading) {
    // Draw caution animation if showing
    if (this.showingCaution) {
      this.drawCaution();
    }
    
    // Draw hacker if active
    if (this.hacker) {
      this.hacker.draw();
    }
    
    // Draw projectiles when hacker is active and not in loading mode
    // (i.e., when hacker is attacking or ready to attack)
    if (this.hacker && !this.hacker.isLoading) {
      console.log(`HACKER CONTROLLER: Drawing ${this.skullProjectiles.length} projectiles`);
      // Draw all projectiles
      this.skullProjectiles.forEach(projectile => {
        projectile.draw();
      });
    } else if (this.skullProjectiles.length > 0) {
      console.log(`Skipping drawing of ${this.skullProjectiles.length} projectiles during loading phase`);
    }
    
    // Draw notification if active
    this.drawNotification();
  }
  
  // Create a visual effect when clearing obstacles
  createClearEffect() {
    console.log('Creating visual clear effect for virus removal');
    // Get canvas dimensions
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    
    // Create a dramatic multi-stage clearing effect
    this.createPulseWaveEffect(canvasWidth, canvasHeight);
    
    // Play a digital clearing sound if available
    if (this.clearSound) {
      this.clearSound.currentTime = 0;
      this.clearSound.play().catch(e => console.log("Error playing clear sound:", e));
    }
  }
  
  // Create a pulse wave effect that expands outward
  createPulseWaveEffect(canvasWidth, canvasHeight) {
    // Initial flash
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    this.ctx.restore();
    
    // Create expanding pulse waves
    let radius = 0;
    const maxRadius = Math.max(canvasWidth, canvasHeight);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Animation frames for the expanding wave
    const animateWave = () => {
      // Clear the canvas for this animation frame
      this.ctx.save();
      
      // Draw expanding circle
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(0, 183, 255, 0.8)';
      this.ctx.lineWidth = 15;
      this.ctx.stroke();
      
      // Draw second wave with offset
      if (radius > 50) {
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius - 50, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 10;
        this.ctx.stroke();
      }
      
      // Draw third wave with larger offset
      if (radius > 100) {
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius - 100, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(0, 255, 200, 0.5)';
        this.ctx.lineWidth = 5;
        this.ctx.stroke();
      }
      
      this.ctx.restore();
      
      // Increase radius for next frame
      radius += 15;
      
      // Continue animation until wave covers screen
      if (radius < maxRadius) {
        requestAnimationFrame(animateWave);
      } else {
        // Final flash when animation completes
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 183, 255, 0.3)';
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        this.ctx.restore();
      }
    };
    
    // Start the animation
    requestAnimationFrame(animateWave);
    
    // Create disappearing animation for the effect
    setTimeout(() => {
      // Clear the effect by redrawing the game
      // This relies on the game loop to clear and redraw everything
    }, 300);
  }
  
  // Handle hacker defeat - called by hacker when defeated
  onHackerDefeated() {
    console.log('HACKER CONTROLLER: Hacker has been defeated! Starting cleanup...');
    
    // Stop boss battle music immediately
    if (this.bossBattleMusic) {
      this.bossBattleMusic.pause();
      this.bossBattleMusic.currentTime = 0;
      console.log('HACKER CONTROLLER: Stopped boss battle music');
    }
    
    // Clear all projectiles
    this.skullProjectiles = [];
    console.log('HACKER CONTROLLER: Cleared all projectiles');
    
    // Resume obstacle spawning immediately (don't wait for cleanup)
    if (this.obstacleController) {
      this.obstacleController.pauseSpawning = false;
      this.obstacleController.pauseEmailPhone = false;
      console.log('HACKER CONTROLLER: Immediately resumed obstacle spawning (including email/phone) after boss defeat');
    }
    
    // Set up cleanup after explosion animation completes
    this.scheduleHackerCleanup();
  }
  
  scheduleHackerCleanup() {
    // Wait for explosion animation to complete (16 frames * 3 ticks per frame * ~16ms per tick)
    const explosionDuration = 16 * 3 * 16; // Approximately 768ms
    
    setTimeout(() => {
      console.log('HACKER CONTROLLER: Explosion complete, cleaning up hacker...');
      
      // Remove hacker
      if (this.hacker) {
        this.hacker.active = false;
        this.hacker = null;
      }
      
      // Reset loading flags
      window.hackerIsLoading = false;
      
      // Resume background music
      if (this.normalBackgroundMusic) {
        this.normalBackgroundMusic.currentTime = 0;
        this.normalBackgroundMusic.play().catch(e => console.log('Error resuming background music:', e));
        console.log('HACKER CONTROLLER: Resumed background music');
      }
      
      // Resume obstacle spawning after boss battle
      if (this.obstacleController) {
        this.obstacleController.pauseSpawning = false;
        this.obstacleController.pauseEmailPhone = false;
        console.log('HACKER CONTROLLER: Resumed obstacle spawning (including email/phone) after boss defeat');
      }
      
      // Update boss stats for next appearance
      this.bossAppearanceCount++;
      this.updateBossStats();
      
      console.log('HACKER CONTROLLER: Boss cleanup complete. Ready for next boss at next 500-point threshold.');
      
    }, explosionDuration);
  }
  
  updateBossStats() {
    // Increase difficulty for next boss
    this.projectileCount = Math.min(3 + this.bossAppearanceCount, 8); // Max 8 projectiles
    this.bossSpeed = Math.min(0.8 + (this.bossAppearanceCount * 0.2), 2.0); // Max 2.0 speed
    
    // Increase boss health (lives) every 2 defeats
    const bonusLives = Math.floor(this.bossAppearanceCount / 2);
    
    console.log(`HACKER CONTROLLER: Next boss will have ${3 + bonusLives} lives, ${this.projectileCount} projectiles, speed ${this.bossSpeed}`);
  }
}
