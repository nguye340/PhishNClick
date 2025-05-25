class Player {
  constructor(ctx, width, height, minJumpHeight, maxJumpHeight, scaleRatio) {
    this.ctx = ctx;
    this.canvas = ctx.canvas;
    this.width = width;
    this.height = height;
    this.minJumpHeight = minJumpHeight;
    this.maxJumpHeight = maxJumpHeight;
    this.scaleRatio = scaleRatio;

    // Player position
    this.x = 40 * scaleRatio; // Moved further right from 10 to 40
    this.y = this.canvas.height - this.height - 1.5 * scaleRatio;
    this.groundY = this.y;

    // Jump properties
    this.jumpPressed = false;
    this.jumpInProgress = false;
    this.falling = false;
    this.jumpSpeed = 3.0; // Increased for snappier jumping
    this.fallSpeed = 2.5; // Increased for snappier falling
    this.jumpStartTime = 0; // Track when jump started
    this.jumpHoldDuration = 0; // Track how long jump was held
    this.maxJumpHoldTime = 300; // Max time in ms to hold for highest jump

    // Player states
    this.STANDING = 0;
    this.RUNNING = 1;
    this.JUMPING = 2;
    this.FALLING = 3;

    this.state = this.RUNNING;
    this.frameX = 0;
    this.maxFrame = 8;
    this.fps = 20;
    this.frameTimer = 0;
    this.frameInterval = 1000/this.fps;

    // Load sprites for animation
    this.images = [];
    this.currentImage = 0;
    this.animationTimer = 0;
    this.animationInterval = 200; // Switch images every 200ms
    
    // Load both cat images
    const cat1 = new Image();
    cat1.src = "/games/phish404/img/cat.png";
    this.images.push(cat1);
    
    const cat2 = new Image();
    cat2.src = "/games/phish404/img/cat2.png";
    this.images.push(cat2);

    // Sound effects
    this.jumpSound = new Audio("/games/phish404/audio/jump.mp3");

    // Set up event listeners
    window.addEventListener("keydown", this.keydown.bind(this));
    window.addEventListener("keyup", this.keyup.bind(this));
    window.addEventListener("touchstart", this.touchstart.bind(this));
    window.addEventListener("touchend", this.touchend.bind(this));
  }

  keydown(event) {
    // Ignore keyboard input if any popup is visible
    if (typeof popupVisible !== 'undefined' && popupVisible) {
      return;
    }
    
    if (event.code === "Space") {
      this.jumpPressed = true;
      if (!this.jumpInProgress) {
        // Start tracking jump hold time
        this.jumpStartTime = Date.now();
      }
    }
  }

  keyup(event) {
    // Ignore keyboard input if any popup is visible
    if (typeof popupVisible !== 'undefined' && popupVisible) {
      return;
    }
    
    if (event.code === "Space") {
      this.jumpPressed = false;
      if (this.jumpInProgress && !this.falling) {
        // Force start falling when key is released
        this.falling = true;
      }
    }
  }

  touchstart() {
    // Ignore touch input if any popup is visible
    if (typeof popupVisible !== 'undefined' && popupVisible) {
      return;
    }
    this.jumpPressed = true;
  }

  touchend() {
    // Ignore touch input if any popup is visible
    if (typeof popupVisible !== 'undefined' && popupVisible) {
      return;
    }
    this.jumpPressed = false;
  }

  update(gameSpeed, frameTimeDelta) {
    this.handleJump();
    this.handlePlayerFrame(frameTimeDelta);
  }

  handleJump() {
    // Start jump if jump pressed and not already jumping
    if (this.jumpPressed && !this.jumpInProgress) {
      this.jumpInProgress = true;
      this.jumpSound.play().catch(error => console.log("Error playing jump sound:", error));
      this.state = this.JUMPING;
      this.frameX = 0;
    }

    if (this.jumpInProgress && !this.falling) {
      // Calculate current jump height based on how long space is held
      const currentTime = Date.now();
      this.jumpHoldDuration = Math.min(currentTime - this.jumpStartTime, this.maxJumpHoldTime);
      const jumpHeightFactor = this.jumpHoldDuration / this.maxJumpHoldTime;
      
      // Calculate current target height (between min and max)
      const currentTargetHeight = this.minJumpHeight + 
        (this.maxJumpHeight - this.minJumpHeight) * jumpHeightFactor;
      
      // Jump up
      this.y -= this.jumpSpeed * this.scaleRatio;

      // Check if reached current target jump height or max height
      if (this.y <= this.groundY - currentTargetHeight || 
          this.y <= this.groundY - this.maxJumpHeight || 
          !this.jumpPressed) {
        this.falling = true;
      }
    } else if (this.jumpInProgress && this.falling) {
      // Fall down
      this.y += this.fallSpeed * this.scaleRatio;
      this.state = this.FALLING;

      // Check if landed
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.jumpInProgress = false;
        this.falling = false;
        this.state = this.RUNNING;
        this.jumpHoldDuration = 0;
      }
    }
  }

  handlePlayerFrame(frameTimeDelta) {
    // Handle sprite frame animation
    if (this.frameTimer > this.frameInterval) {
      this.frameTimer = 0;
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
    } else {
      this.frameTimer += frameTimeDelta;
    }
    
    // Handle cat image animation
    this.animationTimer += frameTimeDelta;
    if (this.animationTimer > this.animationInterval) {
      this.animationTimer = 0;
      this.currentImage = (this.currentImage + 1) % this.images.length;
    }
  }
  
  // Add endJump method to handle space key release
  endJump() {
    if (this.jumpInProgress && !this.falling) {
      // Force start falling when key is released
      this.falling = true;
    }
  }

  draw() {
    // Use the current cat image from the animation sequence
    const currentCatImage = this.images[this.currentImage];
    
    this.ctx.drawImage(
      currentCatImage,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}
