const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playButton = document.getElementById("playButton");
const replayButton = document.getElementById("replayButton");
const pauseButton = document.getElementById("pauseButton");
const scoreDisplay = document.getElementById("score");
const instructions = document.getElementById("instructions");
const leaderboardList = document.getElementById("leaderboardList");

const GRAVITY = 0.5;
const FLAP = -10;
const PIPE_WIDTH = 50;
const PIPE_GAP = 200;
const PIPE_SPEED = 2;

const LEADERBOARD_KEY = "flappyLeaderboard";
let leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];

let bird, pipes, score, isGameOver, isPaused;

// ---------------- LEADERBOARD ----------------

function saveScore(newScore) {
  leaderboard.push(newScore);
  leaderboard.sort((a, b) => b - a);
  leaderboard = leaderboard.slice(0, 5);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  renderLeaderboard();
}

function renderLeaderboard() {
  leaderboardList.innerHTML = "";
  leaderboard.forEach(score => {
    const li = document.createElement("li");
    li.textContent = score;
    leaderboardList.appendChild(li);
  });
}

renderLeaderboard();

// ---------------- GAME LOGIC ----------------

function resetGame() {
  bird = { x: 50, y: 300, width: 40, height: 40, velocity: 0, image: new Image() };
  bird.image.src = "bird.png";
  pipes = [];
  score = 0;
  isGameOver = false;
  isPaused = false;

  scoreDisplay.textContent = "Score: 0";
  canvas.style.display = "block";
  replayButton.style.display = "none";
  pauseButton.style.display = "inline-block";
  pauseButton.textContent = "PAUSE";

  createPipe();
  gameLoop();
}

function createPipe() {
  const gapY = Math.random() * (canvas.height - PIPE_GAP - 200) + 200;
  pipes.push({ x: canvas.width, y: gapY });
}

function update() {
  if (isGameOver || isPaused) return;

  bird.velocity += GRAVITY;
  bird.y += bird.velocity;

  pipes.forEach(pipe => pipe.x -= PIPE_SPEED);

  if (pipes.length && pipes[0].x + PIPE_WIDTH < 0) {
    pipes.shift();
    score++;
  }

  if (!pipes.length || pipes[pipes.length - 1].x < canvas.width - 200) {
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

  if (bird.y <= 0 || bird.y + bird.height >= canvas.height) {
    isGameOver = true;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bird.image, bird.x, bird.y, bird.width, bird.height);

  ctx.fillStyle = "green";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y - PIPE_GAP);
    ctx.fillRect(pipe.x, pipe.y, PIPE_WIDTH, canvas.height - pipe.y);
  });

  scoreDisplay.textContent = `Score: ${score}`;
}

function gameLoop() {
  update();
  draw();

  if (!isGameOver) {
    requestAnimationFrame(gameLoop);
  } else {
    saveScore(score);
    setTimeout(() => {
      alert("Game Over! Your score: " + score);
      replayButton.style.display = "block";
      pauseButton.style.display = "none";
    }, 300);
  }
}

// ---------------- EVENTS ----------------

playButton.addEventListener("click", () => {
  playButton.style.display = "none";
  instructions.style.display = "none";
  resetGame();
});

replayButton.addEventListener("click", resetGame);

pauseButton.addEventListener("click", () => {
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? "RESUME" : "PAUSE";
});

window.addEventListener("keydown", e => {
  if (e.code === "Space" && !isPaused && !isGameOver) {
    bird.velocity = FLAP;
  }
});