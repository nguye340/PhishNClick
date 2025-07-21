class ElectricAttack {
  constructor(player, hacker) {
    this.player = player;
    this.hacker = hacker;
    this.attacks = [];
    this.attackCooldown = 0;
    this.attacksRemaining = 0;
    this.shotInterval = 2000; // 2 seconds between shots
    this.lastShotTime = 0;
    this.impacts = [];
    this.animationTime = 0;
    
    // Load animations
    this.loadAnimations();
    
    // Load sounds
    this.shootSound = new Audio('/games/phish404/audio/dizzy-ellectric-bolt-spell.mp3');
    this.hitSound = new Audio('/games/phish404/audio/boss-hit.wav');
    this.gruntSound = new Audio('/games/phish404/audio/boss-grunt.mp3');
    
    // Set volumes
    this.shootSound.volume = 0.3;
    this.hitSound.volume = 0.4;
    this.gruntSound.volume = 0.5;
  }

  loadAnimations() {
    // Initialize empty arrays for animations
    this.startAnimation = [];
    this.boltAnimation = [];
    this.impactAnimation = [];
    
    // Load starting point animation (8 frames)
    for (let i = 0; i < 8; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/startingPointBlast/startingPointBlast_${i}.png`;
      this.startAnimation.push(img);
    }
    
    // Load lightning bolt animation (10 frames)
    for (let i = 0; i < 10; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/lightningBlast/lightningBlast_${i}.png`;
      this.boltAnimation.push(img);
    }
    
    // Load impact animation (16 frames)
    for (let i = 0; i < 16; i++) {
      const img = new Image();
      img.src = `/games/phish404/img/impact/impact_${i}.png`;
      this.impactAnimation.push(img);
    }
  }

  activate(shots = 3) {
    this.attacksRemaining = shots;
    this.lastShotTime = 0;
    this.attacks = []; // Clear any existing attacks
    this.impacts = []; // Clear any existing impacts
    
    // Play powerup sound
    if (!window.isMuted) {
      const powerupSound = new Audio('/games/phish404/audio/powerup2.mp3');
      powerupSound.volume = window.gameVolume * 0.6;
      powerupSound.play().catch(e => console.log("Powerup sound error:", e));
    }
  }

  update(deltaTime) {
    this.animationTime += deltaTime;
    
    // Handle attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    // Auto-fire attacks when active
    const currentTime = Date.now();
    if (this.attacksRemaining > 0 && 
        this.attackCooldown <= 0 && 
        this.player && 
        this.hacker) {
      this.shoot();
      this.attackCooldown = this.shotInterval;
      this.attacksRemaining--;
    }
    
    // Update active attacks
    for (let i = this.attacks.length - 1; i >= 0; i--) {
      const attack = this.attacks[i];
      
      // Move attack
      attack.x += attack.speed * (deltaTime / 16); // Normalize by frame time
      
      // Update animation frame
      attack.animationTime += deltaTime;
      attack.frame = Math.floor(attack.animationTime / attack.animationSpeed) % this.boltAnimation.length;
      
      // Check for collision with hacker
      if (this.checkHackerCollision(attack)) {
        // Create impact effect
        this.createImpact(attack.x, attack.y);
        
        // Play hit sounds
        if (!window.isMuted) {
          this.hitSound.currentTime = 0;
          this.hitSound.play().catch(e => console.log("Error playing hit sound:", e));
          
          this.gruntSound.currentTime = 0;
          this.gruntSound.play().catch(e => console.log("Error playing grunt sound:", e));
        }
        
        // Remove the attack
        this.attacks.splice(i, 1);
        continue;
      }
      
      // Remove if off screen
      if (attack.x > window.innerWidth) {
        this.attacks.splice(i, 1);
      }
    }
    
    // Update impacts
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const impact = this.impacts[i];
      impact.animationTime += deltaTime;
      impact.frame = Math.floor(impact.animationTime / impact.animationSpeed);
      
      // Remove finished impacts
      if (impact.frame >= this.impactAnimation.length) {
        this.impacts.splice(i, 1);
      }
    }
  }

  shoot() {
    if (!this.player || !this.hacker) return;
    
    // Create starting point blast effect
    this.createStartingBlast(this.player.x + this.player.width, this.player.y + (this.player.height / 2) - 30);
    
    const attack = {
      x: this.player.x + this.player.width,
      y: this.player.y + (this.player.height / 2) - 15,
      width: 60,
      height: 30,
      speed: 15,
      frame: 0,
      animationTime: 0,
      animationSpeed: 50, // ms per frame
      startTime: Date.now(),
      // Add slight vertical offset for visual variety
      yOffset: (Math.random() * 20) - 10
    };
    
    this.attacks.push(attack);
    
    // Play shoot sound with slight pitch variation for variety
    if (!window.isMuted) {
      this.shootSound.currentTime = 0;
      this.shootSound.volume = window.gameVolume * 0.3; // 30% of master volume
      this.shootSound.playbackRate = 0.9 + Math.random() * 0.2; // Random pitch between 0.9 and 1.1
      this.shootSound.play().catch(e => console.log("Shoot sound error:", e));
    }
  }

  checkHackerCollision(attack) {
    if (!this.hacker) return false;
    
    return attack.x >= this.hacker.x && 
           attack.x <= this.hacker.x + this.hacker.width &&
           attack.y >= this.hacker.y && 
           attack.y <= this.hacker.y + this.hacker.height;
  }

  createStartingBlast(x, y) {
    // Add starting point blast effect
    this.impacts.push({
      x: x - 20, // Adjust position to align with player
      y: y - 15,
      frame: 0,
      animationTime: 0,
      animationSpeed: 40, // Faster animation for starting blast
      width: 60,
      height: 60,
      isStartingBlast: true
    });
  }

  createImpact(x, y) {
    this.impacts.push({
      x: x - 30, // Center the impact on the collision point
      y: y - 50, // Adjust y to center on hacker
      frame: 0,
      animationTime: 0,
      animationSpeed: 30, // ms per frame
      width: 120,
      height: 120,
      isStartingBlast: false
    });
    
    // Shake screen effect on hit
    if (this.player && this.player.ctx) {
      this.shakeScreen(this.player.ctx, 5, 10);
    }
  }

  shakeScreen(ctx, intensity, duration) {
    const originalX = 0;
    const originalY = 0;
    let shakeCount = 0;
    
    const shake = () => {
      if (shakeCount >= duration) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        return;
      }
      
      const x = (Math.random() * 2 - 1) * intensity;
      const y = (Math.random() * 2 - 1) * intensity;
      
      ctx.setTransform(1, 0, 0, 1, x, y);
      
      shakeCount++;
      requestAnimationFrame(shake);
    };
    
    shake();
  }

  draw(ctx) {
    if (!ctx) return;
    
    // Draw starting point animation if active
    if (this.attacksRemaining > 0 && this.player) {
      const startX = this.player.x + this.player.width - 10;
      const startY = this.player.y + (this.player.height / 2) - 25;
      
      // Draw glow effect for starting point
      ctx.save();
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.globalCompositeOperation = 'lighter';
      
      // Draw starting animation frames
      const startFrame = Math.floor(this.animationTime / 40) % this.startAnimation.length;
      const startImg = this.startAnimation[startFrame];
      if (startImg && startImg.complete) {
        ctx.drawImage(startImg, startX, startY, 50, 50);
      }
      
      // Add particle effect
      this.drawParticles(ctx, startX + 25, startY + 25, 5);
      
      ctx.restore();
    }
    
    // Draw active attacks with trail effect
    this.attacks.forEach(attack => {
      // Add slight vertical movement
      const yOffset = Math.sin(attack.animationTime * 0.01) * 3;
      
      // Draw electricity trail
      this.drawElectricityTrail(
        ctx, 
        this.player.x + this.player.width,
        this.player.y + (this.player.height / 2),
        attack.x + 25,
        attack.y + 25 + yOffset
      );
      
      // Draw bolt with glow
      ctx.save();
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.globalCompositeOperation = 'lighter';
      
      const frame = Math.floor(attack.animationTime / attack.animationSpeed) % this.boltAnimation.length;
      const img = this.boltAnimation[frame];
      if (img && img.complete) {
        ctx.drawImage(img, attack.x, attack.y + yOffset, 50, 30);
      } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(attack.x, attack.y + yOffset, 30, 10);
      }
      
      ctx.restore();
    });
    
    // Draw impact effects
    this.impacts.forEach(impact => {
      const frame = Math.min(this.impactAnimation.length - 1, impact.frame);
      const img = this.impactAnimation[frame];
      if (img && img.complete) {
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.drawImage(img, impact.x - 50, impact.y - 50, 100, 100);
        
        // Add glow effect
        if (!impact.isStartingBlast) {
          ctx.shadowColor = '#00ffff';
          ctx.shadowBlur = 20;
          ctx.globalCompositeOperation = 'lighter';
          ctx.drawImage(img, impact.x - 50, impact.y - 50, 100, 100);
        }
        
        ctx.restore();
      }
    });
  }
// Remove the attack
this.attacks.splice(i, 1);
continue;
}

// Remove if off screen
if (attack.x > window.innerWidth) {
  this.attacks.splice(i, 1);
}
}

// Update impacts
for (let i = this.impacts.length - 1; i >= 0; i--) {
  const impact = this.impacts[i];
  impact.animationTime += deltaTime;
  impact.frame = Math.floor(impact.animationTime / impact.animationSpeed);
  
  // Remove finished impacts
  if (impact.frame >= this.impactAnimation.length) {
    this.impacts.splice(i, 1);
  }
}
}

shoot() {
if (!this.player || !this.hacker) return;
// Create starting point blast effect
this.createStartingBlast(this.player.x + this.player.width, this.player.y + (this.player.height / 2) - 30);

const attack = {
  x: this.player.x + this.player.width,
  y: this.player.y + (this.player.height / 2) - 15,
  width: 60,
  height: 30,
  speed: 15,
  frame: 0,
  animationTime: 0,
  animationSpeed: 50, // ms per frame
  startTime: Date.now(),
  // Add slight vertical offset for visual variety
  yOffset: (Math.random() * 20) - 10
};

this.attacks.push(attack);

// Play shoot sound with slight pitch variation for variety
if (!window.isMuted) {
  this.shootSound.currentTime = 0;
  this.shootSound.volume = window.gameVolume * 0.3; // 30% of master volume
  this.shootSound.playbackRate = 0.9 + Math.random() * 0.2; // Random pitch between 0.9 and 1.1
  this.shootSound.play().catch(e => console.log("Shoot sound error:", e));
}
}

checkHackerCollision(attack) {
if (!this.hacker) return false;
// Check if attack hits hacker
return attack.x >= this.hacker.x && 
       attack.x <= this.hacker.x + this.hacker.width &&
       attack.y >= this.hacker.y && 
       attack.y <= this.hacker.y + this.hacker.height;
}

createStartingBlast(x, y) {
// Add starting point blast effect
this.impacts.push({
  x: x - 20, // Adjust position to align with player
  y: y - 15,
  frame: 0,
  animationTime: 0,
  animationSpeed: 40, // Faster animation for starting blast
  width: 60,
  height: 60,
  isStartingBlast: true
});
}

createImpact(x, y) {
this.impacts.push({
  x: x - 30, // Center the impact on the collision point
  y: y - 50, // Adjust y to center on hacker
  frame: 0,
  animationTime: 0,
  animationSpeed: 30, // ms per frame
  width: 120,
  height: 120,
  isStartingBlast: false
});

// Shake screen effect on hit
if (this.player && this.player.ctx) {
  this.shakeScreen(this.player.ctx, 5, 10);
}
}

shakeScreen(ctx, intensity, duration) {
const originalX = 0;
const originalY = 0;
let shakeCount = 0;

const shake = () => {
  if (shakeCount >= duration) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return;
  }

  const x = (Math.random() * 2 - 1) * intensity;
  const y = (Math.random() * 2 - 1) * intensity;

  ctx.setTransform(1, 0, 0, 1, x, y);

  shakeCount++;
  requestAnimationFrame(shake);
};

shake();
}

draw(ctx) {
if (!ctx) return;

// Draw starting point animation if active
if (this.attacksRemaining > 0 && this.player) {
  const startX = this.player.x + this.player.width - 10;
  const startY = this.player.y + (this.player.height / 2) - 25;

  // Draw glow effect for starting point
  ctx.save();
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 15;
  ctx.globalCompositeOperation = 'lighter';

  // Draw starting animation frames
  const startFrame = Math.floor(this.animationTime / 40) % this.startAnimation.length;
  const startImg = this.startAnimation[startFrame];
  if (startImg && startImg.complete) {
    ctx.drawImage(startImg, startX, startY, 50, 50);
  }

  // Add particle effect
  this.drawParticles(ctx, startX + 25, startY + 25, 5);

  ctx.restore();
}

// Draw active attacks with trail effect
this.attacks.forEach(attack => {
  // Add slight vertical movement
  const yOffset = Math.sin(attack.animationTime * 0.01) * 3;

  // Draw electricity trail
  this.drawElectricityTrail(
    ctx, 
    this.player.x + this.player.width,
    this.player.y + (this.player.height / 2),
    attack.x + 25,
    attack.y + 25 + yOffset
  );

  // Draw bolt with glow
  ctx.save();
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 15;
  ctx.globalCompositeOperation = 'lighter';

  const frame = Math.floor(attack.animationTime / attack.animationSpeed) % this.boltAnimation.length;
  const img = this.boltAnimation[frame];
  if (img && img.complete) {
    ctx.drawImage(img, attack.x, attack.y + yOffset, 50, 30);
  } else {
    // Fallback if image not loaded
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(attack.x, attack.y + yOffset, 30, 10);
  }

  ctx.restore();
});

// Draw impact effects
this.impacts.forEach(impact => {
  const frame = Math.min(this.impactAnimation.length - 1, impact.frame);
  const img = this.impactAnimation[frame];
  if (img && img.complete) {
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.drawImage(img, impact.x - 50, impact.y - 50, 100, 100);
    
    // Add glow effect
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(img, impact.x - 50, impact.y - 50, 100, 100);
    
    ctx.restore();
  }
});
}

drawAnimation(ctx, frames, x, y, width, height) {
if (!frames || frames.length === 0) return;

const frame = Math.min(frames.length - 1, Math.floor(this.animationTime / 100) % frames.length);
const img = frames[frame];

if (img && img.complete) {
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.drawImage(img, x, y, width, height);
  
  // Add glow effect
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 15;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(img, x, y, width, height);
  
  ctx.restore();
}
}

drawElectricityTrail(ctx, fromX, fromY, toX, toY) {
// Draw jagged electricity line with glow
ctx.save();

// Create gradient for the trail
const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
gradient.addColorStop(0, 'rgba(0, 200, 255, 0.8)');
gradient.addColorStop(1, 'rgba(0, 100, 255, 0.8)');

// Draw main lightning bolt
ctx.beginPath();
ctx.strokeStyle = gradient;
ctx.lineWidth = 2;
ctx.lineCap = 'round';
ctx.shadowColor = '#00ffff';
ctx.shadowBlur = 5;

// Start from player
ctx.moveTo(fromX, fromY);

// Create jagged line to target
const segments = 8;
const points = [{x: fromX, y: fromY}];

// Generate control points
for (let i = 1; i <= segments; i++) {
  const t = i / segments;
  // Add some randomness to the line
  const offsetX = (Math.random() * 20) - 10;
  const offsetY = (Math.random() * 20) - 10;

  // Calculate point along the line with some noise
  const x = fromX + (toX - fromX) * t + offsetX;
  const y = fromY + (toY - fromY) * t + offsetY;

  points.push({x, y});
}

// Ensure the last point is exactly the target
points.push({x: toX, y: toY});

// Draw the jagged line
for (let i = 0; i < points.length - 1; i++) {
  const midX = (points[i].x + points[i + 1].x) / 2;
  const midY = (points[i].y + points[i + 1].y) / 2;

  if (i === 0) {
    ctx.moveTo(points[i].x, points[i].y);
  }

  // Create a slight curve for more natural look
  ctx.quadraticCurveTo(
    points[i].x, points[i].y,
    midX, midY
  );
}

ctx.stroke();

// Add some small branching lines for more electricity effect
for (let i = 0; i < points.length - 1; i++) {
  if (Math.random() > 0.7) { // 30% chance for a branch
    const branchLength = 5 + Math.random() * 10;
    const angle = Math.atan2(
      points[i + 1].y - points[i].y,
      points[i + 1].x - points[i].x
    ) + (Math.random() - 0.5) * Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(points[i].x, points[i].y);
    ctx.lineTo(
      points[i].x + Math.cos(angle) * branchLength,
      points[i].y + Math.sin(angle) * branchLength
    );
    ctx.stroke();
  }
}

// Add some particle effects along the line
for (let i = 0; i < 3; i++) {
  const t = Math.random();
  const x = fromX + (toX - fromX) * t + (Math.random() * 10 - 5);
  const y = fromY + (toY - fromY) * t + (Math.random() * 10 - 5);
  this.drawParticles(ctx, x, y, 2);
}

ctx.restore();
}

drawParticles(ctx, x, y, count) {
ctx.save();

for (let i = 0; i < count; i++) {
  const size = 1 + Math.random() * 2;
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.random() * 5;
  const px = x + Math.cos(angle) * radius;
  const py = y + Math.sin(angle) * radius;

  ctx.fillStyle = `rgba(100, 200, 255, ${0.5 + Math.random() * 0.5})`;
  ctx.beginPath();
  ctx.arc(px, py, size, 0, Math.PI * 2);
  ctx.fill();
}

ctx.restore();
}
