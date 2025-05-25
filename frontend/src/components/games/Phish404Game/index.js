import Player from '/Player.js';
import Ground from './Groud.js';
import OstacleController from './ObstacleController.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const GAME_SPEED_S = 1;
const GAME_SPEED_ICR = 0.00001;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 200;
const PLAYER_WIDTH = 2048 / 32;
const PLAYER_HEIGHT = 2048 / 32;
const MAX_JUMP_HEIGHT = GAME_HEIGHT;
const MIN_JUMP_HEIGHT = 150;
const GROUND_WIDTH = 2048;
const GROUND_HEIGHT = 2048;
const GROUND_AND_OBSTACLE_SPEED = 0.5;

const OBSTACLE_CONFIG = [
  { width: 2048 / 32, height: 2048 / 32, image: "img/email.PNG" },
  { width: 2048 / 32, height: 2048 / 32, image: "img/phone.PNG" }
];

const correctSound = new Audio('audio/correct.mp3');
const wrongSound = new Audio('audio/wrong.mp3');

let player = null;
let ground = null;
let obstacleController = null;

let scaleRatio = null;
let previousTime = null;
let gameSpeed = GAME_SPEED_S;
let gameOver = false;
let waitingToStart = true;

function createSprite() {
  const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
  const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;
  const minJumpHeightInGame = MIN_JUMP_HEIGHT * scaleRatio;
  const maxJumpHeightInGame = MAX_JUMP_HEIGHT * scaleRatio;

  const groundWidthInGame = GROUND_WIDTH * scaleRatio;
  const groundHeightInGame = GROUND_HEIGHT * scaleRatio;

  player = new Player(ctx, playerWidthInGame, playerHeightInGame, minJumpHeightInGame, maxJumpHeightInGame, scaleRatio);
  ground = new Ground(ctx, groundWidthInGame, groundHeightInGame, GROUND_AND_OBSTACLE_SPEED, scaleRatio);

  const obstacleImages = OBSTACLE_CONFIG.map(obstacle => {
    const image = new Image();
    image.src = obstacle.image;
    return {
      image: image,
      width: obstacle.width * scaleRatio,
      height: obstacle.height * scaleRatio
    };
  });

  obstacleController = new OstacleController(ctx, obstacleImages, GROUND_AND_OBSTACLE_SPEED, scaleRatio);
}

function setScreen() {
  scaleRatio = getScaleRatio();
  canvas.width = GAME_WIDTH * scaleRatio;
  canvas.height = GAME_HEIGHT * scaleRatio;
  createSprite();
}

setScreen();
window.addEventListener('resize', setScreen);

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

function gameLoop(currentTime) {
  if (previousTime === null) {
    previousTime = currentTime;
    requestAnimationFrame(gameLoop);
    return;
  }
  const frametimeDelta = currentTime - previousTime;
  previousTime = currentTime;
  clearScreen();

  if (!gameOver && !waitingToStart) {
    player.update(gameSpeed, frametimeDelta);
    obstacleController.update(gameSpeed, frametimeDelta);
    ground.update(gameSpeed, frametimeDelta);
    updateGameSpeed(frametimeDelta);

    obstacleController.obstacle.forEach(obstacle => {
      if (obstacle.collideWith(player)) {
        gameOver = true;
        if (obstacle.image.src.includes("email.PNG")) {
          showEmailPhishingPopup();
        } else if (obstacle.image.src.includes("phone.PNG")) {
          showPhoneVishingPopup();
        }
      }
    });
  }

  ground.draw();
  obstacleController.draw();
  player.draw();

  if (waitingToStart) {
    showStartGameText();
  }

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && waitingToStart) {
    waitingToStart = false;
  }
});

// Popup result functions
function showResultPopup(isPhished) {
  const resultTitle = document.getElementById('resultTitle');
  const resultMessage = document.getElementById('resultMessage');
  const closeBtn = document.getElementById('resultCloseBtn');

  if (isPhished) {
    resultTitle.innerText = "You have been PHISHED!";
    resultMessage.innerText = "This was a phishing attempt. Stay cautious next time!";
  } else {
    resultTitle.innerText = "Congratulations!";
    resultMessage.innerText = "You correctly identified the phishing attempt.";
  }

  closeBtn.disabled = true;
  document.getElementById('resultPopup').style.display = 'block';

  setTimeout(() => {
    closeBtn.disabled = false;
  }, 20000);
}

function closeResultPopup() {
  document.getElementById('resultPopup').style.display = 'none';
}

function showVishingResultPopup(isPhished) {
  const titleEl = document.getElementById('vishingResultTitle');
  const messageEl = document.getElementById('vishingResultMessage');
  const closeBtn = document.getElementById('vishingCloseBtn');

  if (isPhished) {
    titleEl.innerText = "You have been PHISHED!";
    messageEl.innerText = "This was a vishing attempt. Stay cautious next time!";
  } else {
    titleEl.innerText = "Congratulations!";
    messageEl.innerText = "You correctly identified the vishing attempt.";
  }

  closeBtn.disabled = true;
  document.getElementById('vishingResultPopup').style.display = 'block';

  setTimeout(() => {
    closeBtn.disabled = false;
  }, 20000);
}

function closeVishingResultPopup() {
  document.getElementById('vishingResultPopup').style.display = 'none';
}

// Email phishing popup
function showEmailPhishingPopup() {
  document.getElementById('emailPopup').style.display = 'block';
}

document.getElementById('emailClean').onclick = () => {
  document.getElementById('emailPopup').style.display = 'none';
  wrongSound.currentTime = 0;
  wrongSound.play();
  showResultPopup(true);
};

document.getElementById('emailMalicious').onclick = () => {
  document.getElementById('emailPopup').style.display = 'none';
  correctSound.currentTime = 0;
  correctSound.play();
  showResultPopup(false);
};

// Phone phishing popup
function showPhoneVishingPopup() {
  document.getElementById('phonePopup').style.display = 'block';
  const audio = new Audio('audio/vishing.mp3');
  audio.play();
}

document.getElementById('phoneDoIt').onclick = () => {
  document.getElementById('phonePopup').style.display = 'none';
  wrongSound.currentTime = 0;
  wrongSound.play();
  showVishingResultPopup(true);
};

document.getElementById('phoneSkip').onclick = () => {
  document.getElementById('phonePopup').style.display = 'none';
  correctSound.currentTime = 0;
  correctSound.play();
  showVishingResultPopup(false);
};
