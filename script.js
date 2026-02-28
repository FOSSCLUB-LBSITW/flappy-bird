const canvas = document.getElementById("gameCanvas");
const loadingScreen = document.getElementById("loadingScreen");
const ctx = canvas.getContext("2d");
const playButton = document.getElementById("playButton");
const replayButton = document.getElementById("replayButton");
const pauseButton = document.getElementById("pauseButton");
const countdownDisplay = document.getElementById("countdown");
const scoreDisplay = document.getElementById("score");
const instructions = document.getElementById("instructions");
const bestScoreDisplay = document.getElementById("bestScore");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");
const finalBestScore = document.getElementById("finalBestScore");
const gameOverReplay = document.getElementById("gameOverReplay");

// Game constants
const BASE_GRAVITY = 0.25;
let GRAVITY = BASE_GRAVITY;
const FLAP = -5.5;
const MAX_FALL_SPEED = 7;
const PIPE_WIDTH = 50;
const PIPE_GAP = 200;
const MIN_PIPE_DISTANCE = 300;
let currentPipeSpeed = 2;
const GRACE_PERIOD_MS = 2000;
const HITBOX_PADDING = 6;

// Game variables
let bird = { x: 50, y: 300, width: 50, height: 50, velocity: 0, image: new Image() };
let pipes = [];
let score = 0;
let isGameOver = false;
let isPaused = false;
let animationId = null;
let gameStartTime = 0;


let bestScore = parseInt(localStorage.getItem("bestScore")) || 0;
bestScoreDisplay.innerText = `Best: ${bestScore}`;

bird.image.src = "bird.png";

bird.image.onload = () => {
  setTimeout(() => {
    loadingScreen.style.display = "none";
    canvas.style.display = "block";
  }, 1000); 
};
// Create pipe
function createPipe() {
  const gapY = Math.random() * (canvas.height - PIPE_GAP - 200) + 200;
  pipes.push({ x: canvas.width, y: gapY });
}

// Draw bird
function drawBird() {
  ctx.save();
   
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);

  if (isGameOver) {
  canvas.style.transform = "translateX(2px)";
  setTimeout(() => canvas.style.transform = "translateX(-2px)", 50);
}
  // Rotate based on velocity
  const rotation = Math.min(
    Math.PI / 2,
    Math.max(-Math.PI / 9, bird.velocity * 0.1)
  );
  ctx.rotate(rotation);

  // 🔴 Apply red tint if game over
  if (isGameOver) {
    ctx.filter = "grayscale(100%) brightness(60%) sepia(100%) hue-rotate(-50deg) saturate(500%)";
  }

  ctx.drawImage(
    bird.image,
    -bird.width / 2,
    -bird.height / 2,
    bird.width,
    bird.height
  );

  ctx.restore();
}

// Draw pipes
function drawPipes() {
  ctx.fillStyle = "green";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y - PIPE_GAP);
    ctx.fillRect(pipe.x, pipe.y, PIPE_WIDTH, canvas.height - pipe.y);
  });
}

// Update logic
function update() {
  if (isGameOver || isPaused) return;

  // Apply grace period gravity reduction
  if (Date.now() - gameStartTime < GRACE_PERIOD_MS) {
    GRAVITY = BASE_GRAVITY * 0.5;
  } else {
    GRAVITY = BASE_GRAVITY;
  }

  bird.velocity += GRAVITY;
  
  // Terminal velocity
  if (bird.velocity > MAX_FALL_SPEED) {
    bird.velocity = MAX_FALL_SPEED;
  }
  
  bird.y += bird.velocity;

  // Move pipes and scale speed with score
  currentPipeSpeed = 2 + Math.floor(score / 10) * 0.2;
  pipes.forEach(pipe => pipe.x -= currentPipeSpeed);

  if (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < 0) {
    pipes.shift();
    score++;
  }

  // Create pipe with better spacing
  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - MIN_PIPE_DISTANCE) {
    createPipe();
  }

  pipes.forEach(pipe => {
    // Hitbox with padding for better "feel"
    const bx = bird.x + HITBOX_PADDING;
    const by = bird.y + HITBOX_PADDING;
    const bw = bird.width - HITBOX_PADDING * 2;
    const bh = bird.height - HITBOX_PADDING * 2;

    if (
      bx < pipe.x + PIPE_WIDTH &&
      bx + bw > pipe.x &&
      (by < pipe.y - PIPE_GAP || by + bh > pipe.y)
    ) {
      isGameOver = true;
    }
  });

  if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
    isGameOver = true;
  }
}

// Draw frame
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBird();
  drawPipes();

  // PAUSED OVERLAY
  if (isPaused) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
  }

  scoreDisplay.innerText = `Score: ${score}`;
  bestScoreDisplay.innerText = `Best: ${bestScore}`;
}

// Game loop
function gameLoop() {
  update();
  draw();

  if (!isGameOver) {
    animationId = requestAnimationFrame(gameLoop);
  } else {
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("bestScore", bestScore);
      bestScoreDisplay.innerText = `Best: ${bestScore}`;
    }
    setTimeout(() => {
  showGameOverScreen();
  pauseButton.style.display = "none";
}, 300);
  }
}

// Prepare game
function prepareGame() {
  bird = { x: 50, y: 300, width: 50, height: 50, velocity: 0, image: new Image() };
  bird.image.src = "bird.png";

bird.image.onload = () => {
  loadingScreen.style.display = "none";
};
  pipes = [];
  score = 0;
  isGameOver = false;
  isPaused = false;

  canvas.style.display = "block";
  replayButton.style.display = "none";
  playButton.style.display = "none";
  instructions.style.display = "none";

  pauseButton.style.display = "inline-block";
  pauseButton.innerText = "PAUSE";

  scoreDisplay.innerText = `Score: ${score}`;
  bestScoreDisplay.innerText = `Best: ${bestScore}`;
  gameOverScreen.style.display = "none";
  createPipe();
}

function resetGame() {
  prepareGame();
  gameLoop();
}

function startCountdown() {
  prepareGame();

  let countdown = 3;
  countdownDisplay.style.display = "block";
  countdownDisplay.innerText = countdown;

  const countdownInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      countdownDisplay.innerText = countdown;
    } else {
      clearInterval(countdownInterval);
      countdownDisplay.style.display = "none";
      gameStartTime = Date.now();
      gameLoop();
    }
  }, 1000);
}

function showReplayOption() {
  replayButton.style.display = "block";
}
function showGameOverScreen() {
  finalScore.innerText = "Score: " + score;
  finalBestScore.innerText = "Best: " + bestScore;
  gameOverScreen.style.display = "flex";
}

// Buttons
playButton.addEventListener("click", () => {
  startCountdown();
});

replayButton.addEventListener("click", () => {
  resetGame();
});

gameOverReplay.addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  resetGame();
});

pauseButton.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseButton.innerText = isPaused ? "RESUME" : "PAUSE";
});

// Keyboard controls
window.addEventListener("keydown", event => {

  // Space to flap
  if (event.code === "Space" && !isGameOver && !isPaused) {
    bird.velocity = FLAP; // Predictable static impulse
  }

  // P to pause/resume
  if (event.code === "KeyP" && !isGameOver) {
    isPaused = !isPaused;
    pauseButton.innerText = isPaused ? "RESUME" : "PAUSE";
  }
});
