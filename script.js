const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const playButton = document.getElementById("playButton");
const replayButton = document.getElementById("replayButton");
const pauseButton = document.getElementById("pauseButton");
const countdownDisplay = document.getElementById("countdown");
const scoreDisplay = document.getElementById("score");
const instructions = document.getElementById("instructions");
// Added best score element
const bestScoreDisplay = document.getElementById("bestScore");

// Game constants
const GRAVITY = 0.5;
const FLAP = -10;
const PIPE_WIDTH = 50;
const PIPE_GAP = 200;
const PIPE_SPEED = 2;

// Game variables
let bird = { x: 50, y: 300, width: 50, height: 50, velocity: 0, image: new Image() };
let pipes = [];
let score = 0;
let isGameOver = false;
let isPaused = false;
let animationId = null;

// Load persistent best score
let bestScore = parseInt(localStorage.getItem("bestScore")) || 0;
bestScoreDisplay.innerText = `Best: ${bestScore}`;

bird.image.src = "bird.png";

// Create pipe
function createPipe() {
  const gapY = Math.random() * (canvas.height - PIPE_GAP - 200) + 200;
  pipes.push({ x: canvas.width, y: gapY });
}

// Draw bird
function drawBird() {
  ctx.drawImage(bird.image, bird.x, bird.y, bird.width, bird.height);
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

  bird.velocity += GRAVITY;
  bird.y += bird.velocity;

  pipes.forEach(pipe => pipe.x -= PIPE_SPEED);

  if (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < 0) {
    pipes.shift();
    score++;
  }

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
    createPipe();
  }

  pipes.forEach(pipe => {
    if (
      bird.x < pipe.x + PIPE_WIDTH &&
      bird.x + bird.width > pipe.x &&
      (bird.y < pipe.y - PIPE_GAP || bird.y + bird.height > pipe.y)
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
    // Persist best score if beaten, then show results
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("bestScore", bestScore);
      bestScoreDisplay.innerText = `Best: ${bestScore}`;
    }
    setTimeout(() => {
      alert("Game Over! Your score: " + score + "
Best: " + bestScore);
      showReplayOption();
      pauseButton.style.display = "none";
    }, 500);
  }
}

// Prepare game state without starting loop (used for countdown)
function prepareGame() {
  bird = { x: 50, y: 300, width: 50, height: 50, velocity: 0, image: new Image(), color: "red" };
  bird.image.src = "bird.png";
  pipes = [];
  score = 0;
  isGameOver = false;
  isPaused = false;

  canvas.style.display = "block";
  replayButton.style.display = "none";
  playButton.style.display = "none";
  instructions.style.display = "none";

  // Show pause button when preparing a new game
  pauseButton.style.display = "inline-block"; 
  pauseButton.innerText = "PAUSE"; // reset button text

  scoreDisplay.innerText = `Score: ${score}`;
  bestScoreDisplay.innerText = `Best: ${bestScore}`;

  createPipe();
}

// Reset game (immediate start, used by Replay)
function resetGame() {
  prepareGame();
  gameLoop();
}

function startCountdown() {
  // Prepare game but do not start the loop until countdown finishes
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
      gameLoop();
    }
  }, 1000);
}

function showReplayOption() {
  replayButton.style.display = "block";
}

// Buttons
playButton.addEventListener("click", () => {
  startCountdown();
});

replayButton.addEventListener("click", () => {
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
    bird.velocity = FLAP;
  }

  // P to pause/resume
  if (event.code === "KeyP" && !isGameOver) {
    isPaused = !isPaused;
    pauseButton.innerText = isPaused ? "RESUME" : "PAUSE";
  }
});

// --- Added: universal input support (mouse & touch) ---
function flap() {
  if (!isGameOver && !isPaused) {
    bird.velocity = FLAP;
  }
}

// Mouse: allow click / mousedown anywhere to flap
window.addEventListener("mousedown", event => {
  // ignore clicks on UI controls (buttons)
  if (event.target.tagName !== "BUTTON") {
    flap();
  }
});

// Touch: allow tap anywhere to flap (prevent default to avoid scrolling)
window.addEventListener("touchstart", event => {
  // ignore taps on UI controls (buttons)
  if (event.target.tagName !== "BUTTON") {
    event.preventDefault();
    flap();
  }
}, { passive: false });