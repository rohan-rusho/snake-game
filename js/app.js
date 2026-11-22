/* Snake Game — canvas snake, speed grows with every food. */
"use strict";

/* ---------- Pure logic (testable in node) ---------- */
const GRID = 22;            // cells per side
const CELL = 20;            // px per cell (canvas is 440x440)
const BASE_INTERVAL = 150;  // ms per step at speed level 1
const MIN_INTERVAL = 60;    // fastest allowed step
const SPEED_STEP = 8;       // ms faster per food eaten
const POINTS_PER_FOOD = 10;

function intervalForFoods(eaten) {
  return Math.max(MIN_INTERVAL, BASE_INTERVAL - eaten * SPEED_STEP);
}
function speedLevelForFoods(eaten) {
  return 1 + Math.floor(eaten / 3);
}
function nextHead(head, dir) {
  return { x: head.x + dir.x, y: head.y + dir.y };
}
function hitsWall(pos) {
  return pos.x < 0 || pos.y < 0 || pos.x >= GRID || pos.y >= GRID;
}
function hitsSelf(pos, body) {
  return body.some((s) => s.x === pos.x && s.y === pos.y);
}
function randomFood(snake) {
  let p;
  do {
    p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some((s) => s.x === p.x && s.y === p.y));
  return p;
}

/* DOM BOOTSTRAP */
if (typeof document !== "undefined") {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const $ = (id) => document.getElementById(id);
  const scoreEl = $("score");
  const highScoreEl = $("high-score");
  const speedEl = $("speed-level");
  const startOverlay = $("start-overlay");
  const gameoverOverlay = $("gameover-overlay");
  const gameoverText = $("gameover-text");
  const pauseBtn = $("pause-btn");

  const HIGH_KEY = "snake-game-high-score";
  let highScore = 0;
  try { highScore = parseInt(localStorage.getItem(HIGH_KEY), 10) || 0; } catch (e) { highScore = 0; }

  let snake, dir, pendingDir, food, score, foodsEaten, timer, state;
  // state: "ready" | "running" | "paused" | "over"

  function resetGame() {
    snake = [{ x: 11, y: 11 }, { x: 10, y: 11 }, { x: 9, y: 11 }];
    dir = { x: 1, y: 0 };
    pendingDir = dir;
    food = randomFood(snake);
    score = 0;
    foodsEaten = 0;
    state = "ready";
    updateHud();
    draw();
  }

  function updateHud() {
    scoreEl.textContent = score;
    highScoreEl.textContent = highScore;
    speedEl.textContent = speedLevelForFoods(foodsEaten);
  }

  function saveHighScore() {
    if (score > highScore) {
      highScore = score;
      try { localStorage.setItem(HIGH_KEY, String(highScore)); } catch (e) { /* storage unavailable */ }
    }
  }

  function step() {
    dir = pendingDir;
    const head = nextHead(snake[0], dir);
    if (hitsWall(head) || hitsSelf(head, snake.slice(0, -1))) return gameOver();
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += POINTS_PER_FOOD;
      foodsEaten += 1;
      food = randomFood(snake);
      if (foodsEaten % 3 === 0) showToast("⚡ Speed up! Level " + speedLevelForFoods(foodsEaten));
    } else {
      snake.pop();
    }
    updateHud();
    draw();
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(step, intervalForFoods(foodsEaten));
  }

  function startGame() {
    if (state === "running") return;
    if (state === "over" || state === "ready") resetGame();
    state = "running";
    startOverlay.classList.add("hidden");
    gameoverOverlay.classList.add("hidden");
    pauseBtn.disabled = false;
    pauseBtn.textContent = "⏸ Pause";
    schedule();
  }

  function pauseGame() {
    if (state !== "running") return;
    state = "paused";
    clearTimeout(timer);
    pauseBtn.textContent = "▶ Resume";
    showToast("Paused — press Space or Resume to continue");
  }

  function resumeGame() {
    if (state !== "paused") return;
    state = "running";
    pauseBtn.textContent = "⏸ Pause";
    schedule();
  }

  function gameOver() {
    state = "over";
    clearTimeout(timer);
    saveHighScore();
    updateHud();
    const isRecord = score >= highScore && score > 0;
    gameoverText.textContent = "You scored " + score + " points." +
      (isRecord ? " 🎉 New high score!" : " High score: " + highScore + ".");
    gameoverOverlay.classList.remove("hidden");
    pauseBtn.disabled = true;
    pauseBtn.textContent = "⏸ Pause";
    draw();
  }

  function draw() {
    ctx.fillStyle = "#171208";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // subtle grid
    ctx.strokeStyle = "rgba(255,246,233,0.05)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }
    // food
    ctx.fillStyle = "#ff6b35";
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.38, 0, Math.PI * 2);
    ctx.fill();
    // snake
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#ffb03a" : (i % 2 ? "#7ee081" : "#5cc46a");
      const r = 4;
      const x = s.x * CELL + 1, y = s.y * CELL + 1, w = CELL - 2, h = CELL - 2;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
    });
  }

  function setDirection(x, y) {
    // never reverse straight into yourself
    if (dir.x === -x && dir.y === -y) return;
    pendingDir = { x, y };
    if (state === "ready") startGame();
  }

  const KEYS = {
    ArrowUp: [0, -1], KeyW: [0, -1],
    ArrowDown: [0, 1], KeyS: [0, 1],
    ArrowLeft: [-1, 0], KeyA: [-1, 0],
    ArrowRight: [1, 0], KeyD: [1, 0]
  };
  document.addEventListener("keydown", (e) => {
    if (KEYS[e.code]) {
      e.preventDefault();
      setDirection(KEYS[e.code][0], KEYS[e.code][1]);
    } else if (e.code === "Space") {
      e.preventDefault();
      if (state === "running") pauseGame();
      else if (state === "paused") resumeGame();
      else if (state === "ready") startGame();
    } else if (e.code === "Enter" && state === "over") {
      startGame();
    }
  });
  document.querySelectorAll(".dpad-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = btn.dataset.dir;
      if (d === "up") setDirection(0, -1);
      else if (d === "down") setDirection(0, 1);
      else if (d === "left") setDirection(-1, 0);
      else if (d === "right") setDirection(1, 0);
    });
  });

  $("start-btn").addEventListener("click", startGame);
  $("restart-btn").addEventListener("click", startGame);
  $("restart-btn-2").addEventListener("click", () => { resetGame(); startGame(); });
  pauseBtn.addEventListener("click", () => {
    if (state === "running") pauseGame();
    else if (state === "paused") resumeGame();
  });

  resetGame();
  initChrome();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
}

function initChrome() {
  const header = document.getElementById("site-header");
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("mobile-menu");
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 8);
  }, { passive: true });
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => menu.classList.remove("open")));
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}
