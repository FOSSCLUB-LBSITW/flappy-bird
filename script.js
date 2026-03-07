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
const confettiCanvas = document.getElementById("confettiCanvas");
const confettiCtx = confettiCanvas.getContext("2d");

confettiCanvas.width = window.innerWidth;
confettiCanvas.height = window.innerHeight;

let confettiParticles = [];
/* ===============================
   BIRD SELECTION SYSTEM
=================================*/

let selectedBird = "bird.png";

const birdOptions = document.querySelectorAll(".bird-option");

birdOptions.forEach(option => {

option.addEventListener("click", () => {

birdOptions.forEach(o => o.classList.remove("selected"));

option.classList.add("selected");

selectedBird = option.dataset.bird;

bird.image.src = selectedBird;

});

});


/* ===============================
   GAME CONSTANTS
=================================*/

const BASE_GRAVITY = 0.25;
let GRAVITY = BASE_GRAVITY;
const FLAP = -5.5;
const MAX_FALL_SPEED = 7;
const PIPE_WIDTH = 50;
const PIPE_GAP = 200;
const MIN_PIPE_DISTANCE = 300;
let currentPipeSpeed = 2;
const GRACE_PERIOD_MS = 2000;


/* ===============================
   HIT CANVAS
=================================*/

const hitCanvas = document.createElement("canvas");
hitCanvas.width = 50;
hitCanvas.height = 50;
const hitCtx = hitCanvas.getContext("2d", { willReadFrequently: true });


/* ===============================
   GAME VARIABLES
=================================*/

let bird = {
x: 50,
y: 300,
width: 50,
height: 50,
velocity: 0,
image: new Image(),
};

let pipes = [];
let score = 0;
let isGameOver = false;
let isPaused = false;
let animationId = null;
let gameStartTime = 0;
let isDebugMode = false;
let debugHitPixels = [];
let debugBirdPixels = [];


/* ===============================
   BEST SCORE STORAGE
=================================*/

let bestScore = parseInt(localStorage.getItem("bestScore")) || 0;
bestScoreDisplay.innerText = `Best: ${bestScore}`;


/* ===============================
   LOAD BIRD IMAGE
=================================*/

bird.image.src = selectedBird;

bird.image.onload = () => {
setTimeout(() => {
loadingScreen.style.display = "none";
canvas.style.display = "block";
}, 1000);
};


/* ===============================
   CREATE PIPE
=================================*/

function createPipe() {
const gapY = Math.random() * (canvas.height - PIPE_GAP - 200) + 200;
pipes.push({ x: canvas.width, y: gapY });
}


/* ===============================
   DRAW BIRD
=================================*/

function drawBird() {

ctx.save();

ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);

if (isGameOver) {
canvas.style.transform = "translateX(2px)";
setTimeout(() => (canvas.style.transform = "translateX(-2px)"), 50);
}

const rotation = Math.min(
Math.PI / 2,
Math.max(-Math.PI / 9, bird.velocity * 0.1)
);

ctx.rotate(rotation);

if (isGameOver) {
ctx.filter =
"grayscale(100%) brightness(60%) sepia(100%) hue-rotate(-50deg) saturate(500%)";
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


/* ===============================
   DRAW PIPES
=================================*/

function drawPipes() {

ctx.fillStyle = "green";

pipes.forEach((pipe) => {

ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.y - PIPE_GAP);

ctx.fillRect(pipe.x, pipe.y, PIPE_WIDTH, canvas.height - pipe.y);

});

}


/* ===============================
   UPDATE GAME
=================================*/

function update() {

if (isGameOver || isPaused) return;

debugHitPixels = [];
debugBirdPixels = [];

if (Date.now() - gameStartTime < GRACE_PERIOD_MS) {
GRAVITY = BASE_GRAVITY * 0.5;
} else {
GRAVITY = BASE_GRAVITY;
}

bird.velocity += GRAVITY;

if (bird.velocity > MAX_FALL_SPEED) {
bird.velocity = MAX_FALL_SPEED;
}

bird.y += bird.velocity;

currentPipeSpeed = 2 + Math.floor(score / 10) * 0.2;

pipes.forEach((pipe) => (pipe.x -= currentPipeSpeed));


pipes.forEach((pipe, index) => {

if (!pipe.scored && bird.x > pipe.x + PIPE_WIDTH) {
score++;
pipe.scored = true;
}

if (pipe.x + PIPE_WIDTH < 0) {
pipes.splice(index, 1);
}

});


if (
pipes.length === 0 ||
pipes[pipes.length - 1].x < canvas.width - MIN_PIPE_DISTANCE
) {
createPipe();
}


/* ===============================
   HIT MASK
=================================*/

hitCtx.clearRect(0, 0, 50, 50);

hitCtx.save();

hitCtx.translate(25, 25);

const rotation = Math.min(
Math.PI / 2,
Math.max(-Math.PI / 9, bird.velocity * 0.1)
);

hitCtx.rotate(rotation);

hitCtx.drawImage(bird.image, -25, -25, 50, 50);

hitCtx.restore();

const imgData = hitCtx.getImageData(0, 0, 50, 50).data;

let birdMinY = 50;
let birdMaxY = 0;

for (let i = 0; i < 50; i++) {

for (let j = 0; j < 50; j++) {

const alpha = imgData[(j * 50 + i) * 4 + 3];

if (alpha > 50) {

if (j < birdMinY) birdMinY = j;

if (j > birdMaxY) birdMaxY = j;

}

}

}


pipes.forEach(pipe => {

const hitTop = (
bird.x < pipe.x + PIPE_WIDTH &&
bird.x + bird.width > pipe.x &&
bird.y < pipe.y - PIPE_GAP
);

const hitBottom = (
bird.x < pipe.x + PIPE_WIDTH &&
bird.x + bird.width > pipe.x &&
bird.y + bird.height > pipe.y
);

if (hitTop || hitBottom) {

let collision = false;

checkPixels: for (let i = 0; i < 50; i++) {

for (let j = 0; j < 50; j++) {

const worldX = bird.x + i;
const worldY = bird.y + j;

const inTopPipe = (
worldX >= pipe.x &&
worldX <= pipe.x + PIPE_WIDTH &&
worldY <= pipe.y - PIPE_GAP
);

const inBottomPipe = (
worldX >= pipe.x &&
worldX <= pipe.x + PIPE_WIDTH &&
worldY >= pipe.y
);

if (inTopPipe || inBottomPipe) {

const alpha = imgData[(j * 50 + i) * 4 + 3];

if (alpha > 50) {

collision = true;

break checkPixels;

}

}

}

}

if (collision) {

isGameOver = true;

}

}

});


if (bird.y + birdMaxY >= canvas.height || bird.y + birdMinY <= 0) {

isGameOver = true;

}

}


/* ===============================
   DRAW FRAME
=================================*/

function draw() {

ctx.clearRect(0, 0, canvas.width, canvas.height);

drawBird();

drawPipes();

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


/* ===============================
   GAME LOOP
=================================*/

function gameLoop() {

update();

draw();

if (!isGameOver) {

animationId = requestAnimationFrame(gameLoop);

} else {

if (score > bestScore) {

bestScore = score;

localStorage.setItem("bestScore", bestScore);

}

setTimeout(() => {

showGameOverScreen();

pauseButton.style.display = "none";

}, 300);

}

}


/* ===============================
   PREPARE GAME
=================================*/

function prepareGame() {

bird = {

x: 50,
y: 300,
width: 50,
height: 50,
velocity: 0,
image: new Image()

};

bird.image.src = selectedBird;

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


/* ===============================
   COUNTDOWN START
=================================*/

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


/* ===============================
   GAME OVER SCREEN
=================================*/

function showGameOverScreen() {

finalScore.innerText = "Score: " + score;

finalBestScore.innerText = "Best: " + bestScore;

gameOverScreen.style.display = "flex";

}


/* ===============================
   FLAP
=================================*/

function flap() {

if (!isGameOver && !isPaused) {

bird.velocity = FLAP;

}

}


/* ===============================
   BUTTON EVENTS
=================================*/

playButton.addEventListener("click", startCountdown);

replayButton.addEventListener("click", () => {

prepareGame();

gameLoop();

});

gameOverReplay.addEventListener("click", () => {

gameOverScreen.style.display = "none";

prepareGame();

gameLoop();

});

pauseButton.addEventListener("click", () => {

isPaused = !isPaused;

pauseButton.innerText = isPaused ? "RESUME" : "PAUSE";

});


/* ===============================
   INPUT CONTROLS
=================================*/

window.addEventListener("keydown", (event) => {

if (event.code === "Space") flap();

if (event.code === "KeyP" && !isGameOver) {

isPaused = !isPaused;

pauseButton.innerText = isPaused ? "RESUME" : "PAUSE";

}

if (event.code === "KeyD") {

isDebugMode = !isDebugMode;

}

});


window.addEventListener("mousedown", (event) => {

if (event.target.tagName !== "BUTTON") {

flap();

}

});


window.addEventListener("touchstart",

(event) => {

if (event.target.tagName !== "BUTTON") {

event.preventDefault();

flap();

}

},

{ passive: false }

);
