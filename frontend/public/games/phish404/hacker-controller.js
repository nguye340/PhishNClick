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
    
    // Sound effects
    this.evilLaughSound = new Audio('/games/phish404/audio/evil_laugh_02.ogg');
    this.catHitSound = new Audio('/games/phish404/audio/cat-hit.mp3');
    this.eraseSound = new Audio('/games/phish404/audio/erase.wav');
    
    // Music
    this.bossBattleMusic = new Audio('/games/phish404/audio/boss-battle.WAV');
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
  }
  
  reset() {
    // Reset all properties for game restart
    this.skullProjectiles = [];
    this.lastBossPoints = 0;
    this.bossReady = false;
    this.bossAppearanceCount = 0;
    this.projectileCount = 1; // Start with only 1 projectile for first boss
    this.bossSpeed = 0.8; // Start with slower speed for first boss
    this.popupCheckTimer = 0;
    this.showingCaution = false;
    this.cautionStartTime = null;
    
    // Clear any existing timers
    if (this.bossAppearTimer) {
      clearTimeout(this.bossAppearTimer);
      this.bossAppearTimer = null;
    }
    
    // Deactivate hacker if exists
    if (this.hacker) {
      this.hacker.deactivate();
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
    
    // If any popup was closed, wait a moment before continuing
    if (anyPopupWasActive) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
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
    
    // Scale difficulty with each appearance
    if (this.bossAppearanceCount === 1) {
      // First boss: 1 slow projectile
      this.projectileCount = 1;
      this.bossSpeed = 0.8;
    } else if (this.bossAppearanceCount === 2) {
      // Second boss: 2 slightly faster projectiles
      this.projectileCount = 2;
      this.bossSpeed = 1.0;
    } else if (this.bossAppearanceCount === 3) {
      // Third boss: 3 projectiles at normal speed
      this.projectileCount = 3;
      this.bossSpeed = 1.2;
    } else {
      // Subsequent bosses: increase difficulty more slowly
      this.projectileCount = Math.min(3 + Math.floor(this.bossAppearanceCount / 2), 8); // Cap at 8 projectiles
      this.bossSpeed = 1.0 + (this.bossAppearanceCount * 0.15); // Increase speed by 15% each time
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
  
  startBossSequence() {
    if (this.showingCaution || this.hacker) return;
    
    console.log('Starting boss sequence...');
    
    // First, close any open popups and wait for them to clear
    this.closeAllPopups().then(hadPopups => {
      // If there were popups, wait a moment for them to animate out
      if (hadPopups) {
        setTimeout(() => {
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
        }, 300);
      } else {
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
      }
    });
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
    
    // Start the boss end timer
    this.bossStartTime = Date.now();
    this.bossEndTimer = setTimeout(() => {
      if (this.hacker) {
        console.log('Boss battle time is up!');
        this.hacker.deactivate();
        this.hacker = null;
        
        // Resume normal music
        if (this.normalBackgroundMusic) {
          this.normalBackgroundMusic.play().catch(e => console.log("Error resuming background music:", e));
        }
        this.bossBattleMusic.pause();
        
        // Resume obstacle spawning
        if (this.obstacleController) {
          this.obstacleController.pauseSpawning = false;
          this.obstacleController.pauseEmailPhone = false;
          console.log('Resumed obstacle spawning after boss battle');
        }
      }
    }, this.stayDuration);
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
    
    // Handle boss spawning if caution is showing and no popup is active
    if (this.showingCaution && !popupActive) {
      this.spawnBoss();
    }
    
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
      this.hacker.update(frameTimeDelta, gameSpeed);
      
      // Check if hacker can shoot
      if (this.hacker.canShoot()) {
        // Reset shoot timer
        this.hacker.resetShootTimer();
        
        // Create new skull projectiles
        this.shootSkullProjectiles();
      }
    }
    
    // Update all skull projectiles
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
    if (!this.hacker) return;
    
    // Play evil laugh sound when shooting
    this.evilLaughSound.currentTime = 0;
    this.evilLaughSound.play().catch(e => console.log("Error playing evil laugh sound:", e));
    
    // Calculate starting position (from hacker's position)
    const startX = this.hacker.fixedX;
    const startY = this.hacker.y + this.hacker.height / 2;
    
    // Get player position from the game
    // We need to find the player object to aim at it
    const player = window.gamePlayer; // This assumes the player is stored in a global variable
    
    // Base speed for projectiles - increases with boss appearance count
    // Make it start slower but increase more with each appearance
    const baseSpeed = 1.5 + (this.bossAppearanceCount * 0.8); // Starts at 1.5, increases by 0.8 each time
    
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
        
        this.skullProjectiles.push(skull);
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
    
    // Check if any projectile collides with the player
    for (let i = 0; i < this.skullProjectiles.length; i++) {
      const projectile = this.skullProjectiles[i];
      
      // Debug: Log projectile position
      console.log(`Projectile ${i} at (${projectile.x}, ${projectile.y})`);
      
      // Check for collision with player
      if (this.checkCollision(player, projectile)) {
        console.log(`COLLISION DETECTED with projectile ${i}!`);
        
        // Remove the projectile that hit the player
        this.skullProjectiles.splice(i, 1);
        
        // Play cat hit sound when player is hit
        this.catHitSound.currentTime = 0;
        this.catHitSound.play().catch(e => console.log("Error playing cat hit sound:", e));
        
        // Play evil laugh when player is hit
        this.evilLaughSound.currentTime = 0;
        this.evilLaughSound.play().catch(e => console.log("Error playing evil laugh sound:", e));
        
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }
  
  draw(frameTimeDelta) {
    // Draw caution animation if showing
    if (this.showingCaution) {
      this.drawCaution();
    }
    
    // Draw hacker if active
    if (this.hacker) {
      this.hacker.draw();
    }
    
    // Draw all projectiles
    this.skullProjectiles.forEach(projectile => {
      projectile.draw();
    });
    
    // Draw notification if active
    this.drawNotification();
  }
  
  drawCaution() {
    if (!this.showingCaution) return;
    
    this.ctx.save();
    
    // Calculate dimensions - make it bigger
    const boxWidth = this.canvas.width * 0.9;
    const boxHeight = this.canvas.height * 0.4;
    const x = (this.canvas.width - boxWidth) / 2;
    const y = (this.canvas.height - boxHeight) / 2;
    
    // Update blink timer
    this.cautionBlinkTimer += 16; // Assuming ~60fps
    if (this.cautionBlinkTimer >= this.cautionBlinkInterval) {
      this.cautionBlinkTimer = 0;
      this.cautionBlinkState = !this.cautionBlinkState;
    }
    
    // Update glitch timer
    this.cautionGlitchTimer += 16;
    if (this.cautionGlitchTimer >= this.cautionGlitchInterval) {
      this.cautionGlitchTimer = 0;
      this.cautionGlitchState = Math.random() < 0.4; // 40% chance of glitch
      if (this.cautionGlitchState) {
        this.cautionGlitchOffset = (Math.random() * 15 - 7.5) * this.scaleRatio;
      } else {
        this.cautionGlitchOffset = 0;
      }
    }
    
    // Draw background with pulsing red
    const pulse = (Math.sin(Date.now() / 200) * 0.5 + 0.5) * 0.7 + 0.3;
    this.ctx.fillStyle = `rgba(100, 0, 0, ${0.9 * pulse})`;
    this.ctx.fillRect(x, y, boxWidth, boxHeight);
    
    // Draw warning triangle
    const triangleSize = Math.min(boxWidth, boxHeight) * 0.4;
    const triangleX = this.canvas.width / 2 + (this.cautionGlitchState ? this.cautionGlitchOffset : 0);
    const triangleY = y + triangleSize * 0.8;
    
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.beginPath();
    this.ctx.moveTo(triangleX, triangleY - triangleSize / 2);
    this.ctx.lineTo(triangleX + triangleSize / 2, triangleY + triangleSize / 2);
    this.ctx.lineTo(triangleX - triangleSize / 2, triangleY + triangleSize / 2);
    this.ctx.closePath();
    this.ctx.fill();
    
    // Draw exclamation mark in triangle
    this.ctx.fillStyle = 'black';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = `bold ${triangleSize * 0.6}px Arial`;
    this.ctx.fillText('!', triangleX, triangleY + triangleSize * 0.1);
    
    // Draw warning text with glitch effect
    const glitchOffset = this.cautionGlitchState ? this.cautionGlitchOffset * 0.5 : 0;
    
    // Main warning text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 6 * this.scaleRatio;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Draw text with outline for better visibility
    this.ctx.font = `bold ${32 * this.scaleRatio}px 'Press Start 2P', monospace`;
    
    // Text outline
    this.ctx.strokeText('WARNING', this.canvas.width / 2 + glitchOffset, y + 80 * this.scaleRatio);
    
    // Main text
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillText('WARNING', this.canvas.width / 2 + glitchOffset, y + 80 * this.scaleRatio);
    
    // Secondary text
    this.ctx.font = `bold ${24 * this.scaleRatio}px 'Press Start 2P', monospace`;
    
    // Text outline for secondary text
    this.ctx.strokeText('HACKER DETECTED!', this.canvas.width / 2 + glitchOffset, y + 130 * this.scaleRatio);
    
    // Main text for secondary
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('HACKER DETECTED!', this.canvas.width / 2 + glitchOffset, y + 130 * this.scaleRatio);
    
    // Draw countdown timer with pulsing effect
    const timeLeft = Math.ceil((this.cautionDuration - (Date.now() - this.cautionStartTime)) / 1000);
    if (timeLeft > 0) {
      const pulseSize = 1 + (Math.sin(Date.now() / 200) * 0.1);
      this.ctx.save();
      this.ctx.translate(this.canvas.width / 2, y + 180 * this.scaleRatio);
      this.ctx.scale(pulseSize, pulseSize);
      this.ctx.translate(-this.canvas.width / 2, -(y + 180 * this.scaleRatio));
      
      this.ctx.font = `bold ${28 * this.scaleRatio}px 'Press Start 2P', monospace`;
      this.ctx.fillStyle = '#ffff00';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`PREPARE IN ${timeLeft}...`, this.canvas.width / 2, y + 180 * this.scaleRatio);
      this.ctx.restore();
    }
    
    // Add digital noise/static for effect
    const noisePoints = 200;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < noisePoints; i++) {
      const noiseX = x + Math.random() * boxWidth;
      const noiseY = y + Math.random() * boxHeight;
      const noiseSize = Math.random() * 3 * this.scaleRatio;
      this.ctx.fillRect(noiseX, noiseY, noiseSize, noiseSize);
    }
    
    // Add pulsing border effect
    if (this.cautionBlinkState) {
      this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      this.ctx.lineWidth = 20 * this.scaleRatio;
      this.ctx.strokeRect(
        x - 5 * this.scaleRatio, 
        y - 5 * this.scaleRatio, 
        boxWidth + 10 * this.scaleRatio, 
        boxHeight + 10 * this.scaleRatio
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
        x: this.hacker.x + this.hacker.width * 0.2,
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
        
        // Play hit sound
        this.catHitSound.currentTime = 0;
        this.catHitSound.play().catch(e => console.log("Error playing cat hit sound:", e));
        
        // Play evil laugh when player is hit
        this.evilLaughSound.currentTime = 0;
        this.evilLaughSound.play().catch(e => console.log("Error playing evil laugh sound:", e));
        
        return this.hacker; // Return the hacker that was hit
      }
    }
    
    return null; // No collision
  }
  
  checkProjectileCollisions(player) {
    if (!player || !this.skullProjectiles || this.skullProjectiles.length === 0) {
      return false;
    }
    
    let hit = false;
    
    // Check each projectile for collision with player
    for (let i = this.skullProjectiles.length - 1; i >= 0; i--) {
      const projectile = this.skullProjectiles[i];
      
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
        // Collision detected with this projectile
        hit = true;
        
        // Remove the projectile
        this.skullProjectiles.splice(i, 1);
        
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
}
