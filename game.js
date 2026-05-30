"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const VIEW_W = 960;
const VIEW_H = 720;
const TILE = 24;
const HUD_H = 128;
const BOARD_X = 144;
const BOARD_Y = 138;
const MAP_W = 28;
const MAP_H = 23;
const MAX_PARTICLES = 2000;
const DPR_LIMIT = 2;

const DIRS = {
  none: { x: 0, y: 0, name: "none" },
  left: { x: -1, y: 0, name: "left" },
  right: { x: 1, y: 0, name: "right" },
  up: { x: 0, y: -1, name: "up" },
  down: { x: 0, y: 1, name: "down" },
};

const DIR_ORDER = [DIRS.up, DIRS.left, DIRS.down, DIRS.right];

const RAW_LEVEL = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#O####.#####.##.#####.####O#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.#####.##.#####.######",
  "____#..##..........##..#____",
  "######.##.###--###.##.######",
  "..........#HHHHHH#..........",
  "######.##.########.##.######",
  "____#..##..........##..#____",
  "######.##.########.##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#O..##................##..O#",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
];

const MENU_ITEMS = ["NUOVA PARTITA", "CONTINUA", "MODALITA", "OPZIONI", "GALLERIA", "ESCI"];
const MODES = ["STORIA", "ARCADE", "ENDLESS", "BOSS RUSH", "PUZZLE MAZE"];
const MODE_RULES = [
  {
    id: "story",
    label: "STORIA",
    world: "NEON CITY",
    description: "Regole complete, meteo vivo, obiettivi e progressione.",
    score: 1,
    pacSpeed: 1,
    ghostSpeed: 1,
    hunger: 1,
    startingLives: 3,
    startingShield: 1,
    dashCost: 18,
    dashDistance: 3,
    powerDuration: 1,
    clear: "pellets",
    tip: "Storia: raccogli tutti i pellet e sfrutta gli obiettivi vivi.",
  },
  {
    id: "arcade",
    label: "ARCADE",
    world: "CABINET 1980",
    description: "Piu punti, piu velocita, meno margine d'errore.",
    score: 1.22,
    pacSpeed: 1.04,
    ghostSpeed: 1.12,
    hunger: 1.08,
    startingLives: 3,
    startingShield: 0,
    dashCost: 22,
    dashDistance: 2,
    powerDuration: 0.82,
    clear: "pellets",
    tip: "Arcade: niente scudo iniziale, combo e power valgono di piu.",
  },
  {
    id: "endless",
    label: "ENDLESS",
    world: "GRID INFINITA",
    description: "Ogni ondata alza ritmo, punteggio e rischio.",
    score: 1.08,
    pacSpeed: 1,
    ghostSpeed: 1.03,
    hunger: 1.05,
    startingLives: 3,
    startingShield: 1,
    dashCost: 18,
    dashDistance: 3,
    powerDuration: 1,
    clear: "pellets",
    scaling: 0.075,
    tip: "Endless: ogni ondata aumenta velocita e moltiplicatore.",
  },
  {
    id: "boss",
    label: "BOSS RUSH",
    world: "ARENA CORE",
    description: "Mangia fantasmi in Power per abbattere il boss.",
    score: 1.35,
    pacSpeed: 1.02,
    ghostSpeed: 1.16,
    hunger: 1,
    startingLives: 4,
    startingShield: 1,
    dashCost: 18,
    dashDistance: 3,
    powerDuration: 1.25,
    clear: "boss",
    bossHp: 6,
    tip: "Boss Rush: ogni fantasma mangiato in Power danneggia il boss.",
  },
  {
    id: "puzzle",
    label: "PUZZLE MAZE",
    world: "LABIRINTO LOGICO",
    description: "Dash spento, fantasmi lenti, route planning puro.",
    score: 1.18,
    pacSpeed: 0.94,
    ghostSpeed: 0.78,
    hunger: 0.42,
    startingLives: 2,
    startingShield: 0,
    dashCost: 999,
    dashDistance: 0,
    powerDuration: 1.45,
    clear: "pellets",
    disableDash: true,
    tip: "Puzzle Maze: dash disattivato, pianifica ogni svolta.",
  },
];
const GALLERY_ITEMS = ["ARTWORK", "LOG DI AOYAMA", "BESTIARI", "MUSICA", "STATISTICHE", "CUTSCENE", "COSTUMI"];

const sounds = {
  enabled: false,
  audio: null,
  ensure() {
    if (this.audio) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.audio = new AudioContext();
  },
  beep(freq, duration = 0.045, type = "square", gain = 0.045) {
    if (!this.enabled) return;
    this.ensure();
    if (!this.audio) return;
    if (this.audio.state === "suspended") this.audio.resume();
    const now = this.audio.currentTime;
    const osc = this.audio.createOscillator();
    const amp = this.audio.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(gain, now + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp);
    amp.connect(this.audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  },
};

const palette = {
  ink: "#f7fbff",
  inkSoft: "#b8c4d9",
  bg: "#05070f",
  board: "#081324",
  wall: "#0a1334",
  wallCore: "#11194a",
  neon: "#41eaff",
  neon2: "#ff3f91",
  pac: "#ffd83d",
  gold: "#ffcc38",
  power: "#78f5ff",
  danger: "#ff4c65",
  ok: "#50f28f",
  purple: "#aa6dff",
};

var pallet = palette;

const WEATHER_TYPES = [
  { id: "clear", name: "SERENO", icon: "CLR", color: "#78f5ff", score: 1, pacSpeed: 1, ghostSpeed: 1, hunger: 1 },
  { id: "fog", name: "NEBBIA DI BIT", icon: "FOG", color: "#b8c4d9", score: 1, pacSpeed: 1, ghostSpeed: 0.94, hunger: 1 },
  { id: "rain", name: "PIOGGIA DI DATI", icon: "RAIN", color: "#50f28f", score: 1.08, pacSpeed: 1.03, ghostSpeed: 1.03, hunger: 1 },
  { id: "storm", name: "TEMPORALE", icon: "STM", color: "#ffeb66", score: 1.2, pacSpeed: 1, ghostSpeed: 1, hunger: 1 },
  { id: "aurora", name: "AURORA", icon: "AUR", color: "#aa6dff", score: 1.12, pacSpeed: 1, ghostSpeed: 1, hunger: 0.95 },
  { id: "wind", name: "VENTO DI DATI", icon: "WND", color: "#41eaff", score: 1.05, pacSpeed: 1.04, ghostSpeed: 1, hunger: 1 },
  { id: "heat", name: "CALDO DATI", icon: "HOT", color: "#ff7a38", score: 1.15, pacSpeed: 1.2, ghostSpeed: 1.08, hunger: 2 },
  { id: "blizzard", name: "PIXEL BLIZZARD", icon: "BLZ", color: "#f7fbff", score: 1.3, pacSpeed: 0.96, ghostSpeed: 0.9, hunger: 1 },
];

const GRID_PHASES = [
  { id: "morning", name: "MATTINA DIGITALE", start: 6, color: "#78f5ff", power: 1.1, score: 1.0, ghostSpeed: 0.96 },
  { id: "day", name: "POMERIGGIO DIGITALE", start: 12, color: "#ffd83d", power: 1.0, score: 1.0, ghostSpeed: 1.0 },
  { id: "evening", name: "SERA DIGITALE", start: 18, color: "#ff3f91", power: 1.0, score: 1.15, ghostSpeed: 1.05 },
  { id: "night", name: "NOTTE DIGITALE", start: 0, color: "#aa6dff", power: 1.0, score: 1.25, ghostSpeed: 0.95 },
];

const GRID_SEASONS = [
  { id: "expansion", name: "ESPANSIONE", color: "#50f28f" },
  { id: "density", name: "DENSITA", color: "#ffcc38" },
  { id: "corruption", name: "CORRUZIONE", color: "#ff3f91" },
  { id: "purification", name: "PURIFICAZIONE", color: "#78f5ff" },
];

const WEATHER_WEIGHTS = {
  clear: 35,
  fog: 20,
  rain: 15,
  wind: 15,
  aurora: 5,
  heat: 4,
  storm: 3,
  blizzard: 2,
};

const state = {
  screen: "title",
  lastScreen: "title",
  selected: 0,
  selectedMode: 0,
  selectedOption: 0,
  modeId: "story",
  runLevel: 1,
  elapsed: 0,
  levelTime: 0,
  highScore: Number(localStorage.getItem("ultraPacHighScore") || 0),
  score: 0,
  combo: 0,
  comboTimer: 0,
  ghostChain: 0,
  lives: 3,
  hp: 3,
  world: "NEON CITY",
  levelName: "1-1 FIRST STEPS",
  pelletTotal: 0,
  pelletsLeft: 0,
  powerTimer: 0,
  powerMax: 8,
  freezeTimer: 0,
  flash: 0,
  shake: 0,
  shakeDecay: 0,
  gridPhase: null,
  gridSeason: null,
  weather: null,
  weatherForecast: [],
  weatherPulse: 0,
  lightningTimer: 0,
  lightningWarn: 0,
  windDir: DIRS.right,
  gridReport: null,
  objective: null,
  objectiveCompleteTimer: 0,
  boss: null,
  tutorialMode: "smart",
  activeTip: null,
  tipTimer: 0,
  modeTipShown: false,
  stats: null,
  scoreBreakdown: null,
  styleChain: 0,
  ghostSignalTimer: 0,
  progressPulse: 0,
  titleBuilt: 0,
  levelCompleteTimer: 0,
  reducedMotion: false,
  scanlines: true,
  highContrast: false,
  mouse: { x: 0, y: 0, down: false },
};

const DIRECTION_KEYS = {
  ArrowLeft: DIRS.left,
  KeyA: DIRS.left,
  ArrowRight: DIRS.right,
  KeyD: DIRS.right,
  ArrowUp: DIRS.up,
  KeyW: DIRS.up,
  ArrowDown: DIRS.down,
  KeyS: DIRS.down,
};

const DIRECTION_KEY_CODES = new Set(Object.keys(DIRECTION_KEYS));
const CONTROL_KEY_CODES = new Set([...DIRECTION_KEY_CODES, "Space", "KeyZ", "Enter", "Escape", "KeyP"]);

const input = {
  keys: new Set(),
  wanted: DIRS.left,
  pressed: new Set(),
  directionStack: [],
};

const pac = {
  x: 13,
  y: 17,
  dir: DIRS.left,
  next: DIRS.left,
  speed: 6.2,
  dashCooldown: 0,
  dashGhosts: [],
  shield: 1,
  adrenaline: 66,
  hunger: 100,
  mouth: 0,
  aliveTimer: 0,
};

const ghosts = [
  { name: "BLINKY", x: 13, y: 11, homeX: 13, homeY: 11, dir: DIRS.left, color: "#ff4058", speed: 4.6, scatter: { x: 26, y: 1 }, eaten: 0, rank: 4, mood: "hunt", signal: null, signalLife: 0, territory: "NE" },
  { name: "PINKY", x: 14, y: 11, homeX: 14, homeY: 11, dir: DIRS.right, color: "#ff80df", speed: 4.35, scatter: { x: 1, y: 1 }, eaten: 0, rank: 3, mood: "ambush", signal: null, signalLife: 0, territory: "NW" },
  { name: "INKY", x: 12, y: 11, homeX: 12, homeY: 11, dir: DIRS.up, color: "#38dcff", speed: 4.2, scatter: { x: 26, y: 21 }, eaten: 0, rank: 2, mood: "chaos", signal: null, signalLife: 0, territory: "SE" },
  { name: "CLYDE", x: 15, y: 11, homeX: 15, homeY: 11, dir: DIRS.down, color: "#ff9e3d", speed: 4.0, scatter: { x: 1, y: 21 }, eaten: 0, rank: 1, mood: "guard", signal: null, signalLife: 0, territory: "SW" },
];

const floatingText = [];
const waves = [];
const particles = [];
const ghostTrails = [];
const dataRain = [];
const pixelStorm = [];
let map = [];
let pelletGrid = [];
let pelletMotion = [];
let memoryGrid = [];
let goldenPulse = 0;
let last = performance.now();
let scale = 1;
let offsetX = 0;
let offsetY = 0;

function boot() {
  validateLevel();
  initializeLivingGrid();
  resetGame();
  if (state.gridReport) state.screen = "report";
  resize();
  requestAnimationFrame(loop);
}

function validateLevel() {
  if (RAW_LEVEL.length !== MAP_H) {
    throw new Error(`Level height is ${RAW_LEVEL.length}, expected ${MAP_H}`);
  }
  RAW_LEVEL.forEach((row, index) => {
    if (row.length !== MAP_W) {
      throw new Error(`Level row ${index} is ${row.length}, expected ${MAP_W}`);
    }
  });
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function focusCanvas() {
  if (document.activeElement === canvas) return;
  try {
    canvas.focus({ preventScroll: true });
  } catch (error) {
    canvas.focus();
  }
}

function setWantedDirection(dir) {
  input.wanted = dir;
  pac.next = dir;
}

function rememberDirectionKey(code) {
  const dir = DIRECTION_KEYS[code];
  if (!dir) return;
  input.directionStack = input.directionStack.filter((heldCode) => heldCode !== code);
  input.directionStack.push(code);
  setWantedDirection(dir);
}

function releaseDirectionKey(code) {
  if (!DIRECTION_KEYS[code]) return;
  input.directionStack = input.directionStack.filter((heldCode) => heldCode !== code);
  const fallbackCode = input.directionStack[input.directionStack.length - 1];
  if (fallbackCode) setWantedDirection(DIRECTION_KEYS[fallbackCode]);
}

function syncHeldDirection() {
  for (let i = input.directionStack.length - 1; i >= 0; i--) {
    const code = input.directionStack[i];
    if (input.keys.has(code)) {
      setWantedDirection(DIRECTION_KEYS[code]);
      return;
    }
  }
  input.directionStack.length = 0;
}

function resetMovementInput(dir = DIRS.left) {
  DIRECTION_KEY_CODES.forEach((code) => input.keys.delete(code));
  input.directionStack.length = 0;
  setWantedDirection(dir);
}

function clearInput() {
  input.keys.clear();
  input.pressed.clear();
  input.directionStack.length = 0;
}

function modeRules() {
  return MODE_RULES[state.selectedMode] || MODE_RULES[0];
}

function modePressure() {
  const rules = modeRules();
  const growth = rules.scaling || 0.035;
  return 1 + Math.max(0, state.runLevel - 1) * growth;
}

function buildLevelName() {
  const rules = modeRules();
  if (rules.id === "story") return `1-${state.runLevel} FIRST STEPS`;
  if (rules.id === "endless") return `ENDLESS WAVE ${state.runLevel}`;
  if (rules.id === "boss") return `BOSS RUSH ${state.runLevel}`;
  if (rules.id === "puzzle") return `PUZZLE MAZE ${state.runLevel}`;
  return `${rules.label} ${state.runLevel}`;
}

function applyModeSetup() {
  const rules = modeRules();
  state.modeId = rules.id;
  state.levelName = buildLevelName();
  state.world = rules.world;
  state.boss = rules.clear === "boss"
    ? { name: "CORE BLINKY", maxHp: rules.bossHp + Math.max(0, state.runLevel - 1) * 2, hp: rules.bossHp + Math.max(0, state.runLevel - 1) * 2 }
    : null;
}

function refreshLevelEnvironment() {
  const now = new Date(Date.now() + state.runLevel * 21600000);
  state.gridPhase = getGridPhase(now);
  state.gridSeason = getGridSeason(now);
  state.weatherForecast = buildWeatherForecast(now);
  state.weather = state.weatherForecast[0];
  state.windDir = chooseWindDirection(now);
  state.lightningTimer = state.weather.id === "storm" ? rand(7, 12) : 0;
  seedWeatherSprites();
}

function initializeLivingGrid() {
  state.stats = loadStats();
  const now = new Date();
  state.gridPhase = getGridPhase(now);
  state.gridSeason = getGridSeason(now);
  state.weatherForecast = buildWeatherForecast(now);
  state.weather = state.weatherForecast[0];
  state.windDir = chooseWindDirection(now);
  state.lightningTimer = state.weather.id === "storm" ? rand(7, 12) : 0;
  state.gridReport = createGridReport(now);
  seedWeatherSprites();
}

function loadStats() {
  const defaults = {
    lastSeenAt: 0,
    gridVisits: 0,
    totalPellets: 0,
    totalDeaths: 0,
    totalDashes: 0,
    totalGhostsEaten: 0,
    totalPowerPellets: 0,
    totalLevels: 0,
    totalScore: 0,
    bestCombo: 0,
    corruption: 0,
    reputation: 0,
    dashlessPellets: 0,
    scoreHistory: [],
  };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem("ultraPacLivingStats") || "{}") };
  } catch (error) {
    return defaults;
  }
}

function saveStats() {
  if (!state.stats) return;
  state.stats.lastSeenAt = Date.now();
  state.stats.totalScore = Math.max(state.stats.totalScore || 0, state.score);
  state.stats.bestCombo = Math.max(state.stats.bestCombo || 0, state.combo);
  try {
    localStorage.setItem("ultraPacLivingStats", JSON.stringify(state.stats));
  } catch (error) {
    // Storage can be unavailable in private contexts; the game keeps running.
  }
}

function getGridPhase(date) {
  const h = date.getHours();
  if (h >= 6 && h < 12) return GRID_PHASES[0];
  if (h >= 12 && h < 18) return GRID_PHASES[1];
  if (h >= 18 && h < 24) return GRID_PHASES[2];
  return GRID_PHASES[3];
}

function getGridSeason(date) {
  const day = Math.min(30, date.getDate());
  return GRID_SEASONS[Math.min(3, Math.floor((day - 1) / 7))];
}

function buildWeatherForecast(date) {
  const seedBase = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate() + Math.floor(date.getHours() / 6) * 37 + (state.stats?.totalLevels || 0) * 11;
  return [0, 1, 2].map((offset) => weatherById(chooseWeatherId(seedBase + offset * 97)));
}

function chooseWeatherId(seed) {
  const weights = { ...WEATHER_WEIGHTS };
  if (state.gridPhase?.id === "morning") {
    weights.clear += 15;
    weights.wind += 10;
    weights.fog -= 5;
    weights.storm -= 5;
  }
  if (state.gridPhase?.id === "evening") {
    weights.storm += 10;
    weights.heat += 8;
    weights.clear -= 10;
    weights.aurora -= 5;
  }
  if (state.gridPhase?.id === "night") {
    weights.aurora += 15;
    weights.fog += 10;
    weights.blizzard += 5;
    weights.clear -= 20;
  }
  if (state.gridSeason?.id === "expansion") {
    weights.rain += 10;
    weights.wind += 5;
  }
  if (state.gridSeason?.id === "density") {
    weights.fog += 10;
    weights.heat += 5;
  }
  if (state.gridSeason?.id === "corruption") {
    weights.blizzard += 10;
    weights.storm += 8;
  }
  if (state.gridSeason?.id === "purification") {
    weights.clear += 20;
    weights.aurora += 10;
  }

  const entries = Object.entries(weights).map(([id, weight]) => [id, Math.max(1, weight)]);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = seededRandom(seed) * total;
  for (const [id, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return id;
  }
  return "clear";
}

function weatherById(id) {
  return WEATHER_TYPES.find((weather) => weather.id === id) || WEATHER_TYPES[0];
}

function chooseWindDirection(date) {
  return [DIRS.left, DIRS.right, DIRS.up, DIRS.down][(date.getDate() + date.getHours()) % 4];
}

function createGridReport(now) {
  if (!state.stats?.lastSeenAt) {
    state.stats.gridVisits = (state.stats.gridVisits || 0) + 1;
    return null;
  }
  const hoursAway = Math.max(0, (now.getTime() - state.stats.lastSeenAt) / 3600000);
  if (hoursAway < 0.05) return null;
  const explored = Math.round(18 + hoursAway * 28 + seededRandom(Math.floor(hoursAway * 1000)) * 64);
  const regen = Math.round(clamp(hoursAway * 5, 1, 52));
  const corruptionGain = hoursAway * (state.gridSeason.id === "corruption" ? 0.22 : 0.07);
  state.stats.corruption = clamp((state.stats.corruption || 0) + corruptionGain, 0, 99.9);
  state.stats.gridVisits = (state.stats.gridVisits || 0) + 1;
  return {
    hoursAway,
    lines: [
      `Blinky ha esplorato ${explored} tile mentre eri via.`,
      `${regen} pellet sono stati ricreati dalla GRID.`,
      `Corruzione labirinto: ${state.stats.corruption.toFixed(1)}%.`,
      `Meteo attuale: ${state.weather.name}.`,
      `Ciclo: ${state.gridPhase.name} / ${state.gridSeason.name}.`,
    ],
  };
}

function seedWeatherSprites() {
  dataRain.length = 0;
  pixelStorm.length = 0;
  for (let i = 0; i < 72; i++) {
    dataRain.push({ x: rand(0, VIEW_W), y: rand(0, VIEW_H), speed: rand(35, 110), char: randomChoice(["0", "1", "+", "*", "#", "/"]) });
  }
  for (let i = 0; i < 120; i++) {
    pixelStorm.push({ x: rand(0, VIEW_W), y: rand(0, VIEW_H), vx: rand(-70, 40), vy: rand(35, 160), size: rand(1, 4) });
  }
}

function resetGame({ keepScreenEffects = false, keepScore = false, keepVitals = false } = {}) {
  const rules = modeRules();
  applyModeSetup();
  if (!keepScore) state.score = 0;
  state.combo = 0;
  state.comboTimer = 0;
  state.ghostChain = 0;
  state.styleChain = 0;
  if (!keepVitals) {
    state.lives = rules.startingLives;
    state.hp = Math.min(3, rules.startingLives);
  }
  state.levelTime = 0;
  state.powerTimer = 0;
  state.powerMax = 8 * (state.gridPhase?.power || 1) * rules.powerDuration;
  state.freezeTimer = 0;
  state.levelCompleteTimer = 0;
  state.objectiveCompleteTimer = 0;
  state.activeTip = null;
  state.tipTimer = 0;
  state.modeTipShown = false;
  state.scoreBreakdown = createScoreBreakdown();
  if (!keepScreenEffects) {
    state.flash = 0;
    state.shake = 0;
    state.shakeDecay = 0;
  }
  pac.x = 13;
  pac.y = 17;
  pac.dir = DIRS.left;
  resetMovementInput(DIRS.left);
  pac.dashCooldown = 0;
  pac.dashGhosts.length = 0;
  pac.shield = keepVitals ? pac.shield : rules.startingShield;
  pac.adrenaline = keepVitals ? Math.max(pac.adrenaline, 42) : 66;
  pac.hunger = 100;
  if (state.stats) state.stats.dashlessPellets = 0;
  ghosts.forEach((g, index) => {
    g.x = g.homeX;
    g.y = g.homeY;
    g.dir = DIR_ORDER[index % DIR_ORDER.length];
    g.eaten = 0;
    g.signal = null;
    g.signalLife = 0;
  });
  ghostTrails.length = 0;
  particles.length = 0;
  waves.length = 0;
  floatingText.length = 0;
  buildMap();
  startEmergentObjective();
}

function buildMap() {
  map = RAW_LEVEL.map((row) => row.split(""));
  pelletGrid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(null));
  pelletMotion = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => ({ ox: 0, oy: 0, phase: rand(0, Math.PI * 2) })));
  memoryGrid = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(0));
  state.pelletTotal = 0;
  state.pelletsLeft = 0;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const c = map[y][x];
      if (c === "." || c === "O") {
        pelletGrid[y][x] = c === "O" ? "power" : "normal";
        state.pelletTotal++;
        state.pelletsLeft++;
      }
      if (c === "H" || c === "-" || c === "_") {
        pelletGrid[y][x] = null;
      }
    }
  }

  const goldenSpots = [
    [6, 5], [21, 5], [10, 11], [17, 11], [5, 21], [22, 21],
  ];
  goldenSpots.forEach(([x, y]) => {
    if (pelletGrid[y] && pelletGrid[y][x] === "normal") {
      pelletGrid[y][x] = "gold";
    }
  });

  if (modeRules().clear === "boss") {
    placeSpecialPellets("power", 3);
  }
  if (state.gridPhase?.id === "night") {
    placeSpecialPellets("dream", 2);
  }
  if (state.gridSeason?.id === "corruption" || (state.stats?.corruption || 0) > 12) {
    placeSpecialPellets("corrupt", 5);
  }
}

function placeSpecialPellets(type, count) {
  const candidates = [];
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (pelletGrid[y][x] === "normal") candidates.push([x, y]);
    }
  }
  for (let i = 0; i < count && candidates.length > 0; i++) {
    const index = Math.floor(seededRandom(state.elapsed * 1000 + i * 71 + candidates.length) * candidates.length);
    const [x, y] = candidates.splice(index, 1)[0];
    pelletGrid[y][x] = type;
  }
}

function loop(now) {
  const rawDt = Math.min(0.035, (now - last) / 1000 || 0);
  last = now;
  state.elapsed += rawDt;
  update(rawDt);
  render();
  input.pressed.clear();
  requestAnimationFrame(loop);
}

function update(dt) {
  updateScreenEffects(dt);
  updateAmbientSystems(dt);
  if (state.screen === "playing") {
    updateGame(dt);
  } else if (state.screen === "title") {
    state.titleBuilt = Math.min(1, state.titleBuilt + dt / 1.5);
  } else if (state.screen === "complete") {
    state.levelCompleteTimer += dt;
    updateParticles(dt);
    updateFloatingText(dt);
  }
  updatePointerHover();
}

function updateScreenEffects(dt) {
  state.flash = Math.max(0, state.flash - dt * 2.8);
  if (state.shake <= 0) {
    state.shake = 0;
    state.shakeDecay = 0;
    return;
  }

  state.shake = Math.max(0, state.shake - dt * (state.shakeDecay || 18));
  if (state.shake === 0) state.shakeDecay = 0;
}

function triggerShake(amount, duration = amount / 18) {
  if (amount >= state.shake) {
    state.shake = amount;
    state.shakeDecay = amount / Math.max(duration, 0.001);
  }
}

function updateGame(dt) {
  state.levelTime += dt;
  updateWeatherGameplay(dt);
  state.comboTimer = Math.max(0, state.comboTimer - dt);
  if (state.comboTimer === 0) state.combo = 0;
  state.powerTimer = Math.max(0, state.powerTimer - dt);
  state.freezeTimer = Math.max(0, state.freezeTimer - dt);
  state.progressPulse = Math.max(0, state.progressPulse - dt);
  goldenPulse += dt;

  pac.dashCooldown = Math.max(0, pac.dashCooldown - dt);
  pac.adrenaline = clamp(pac.adrenaline + dt * 1.8, 0, 100);
  pac.hunger = clamp(pac.hunger - dt * 1.0 * weatherHungerMultiplier(), 0, 100);
  pac.mouth += dt * (state.powerTimer > 0 ? 15 : 11);
  pac.aliveTimer += dt;

  updatePac(dt);
  collectPellet();
  updateGhosts(dt);
  updateGhostLanguage(dt);
  checkGhostCollisions();
  updatePelletMotion(dt);
  updateLabyrinthMemory();
  updateEmergentObjective(dt);
  updateAdaptiveTutorial(dt);
  updateParticles(dt);
  updateWaves(dt);
  updateFloatingText(dt);

  if (shouldCompleteLevel()) {
    completeLevel();
  }
}

function shouldCompleteLevel() {
  const rules = modeRules();
  if (rules.clear === "boss") return Boolean(state.boss && state.boss.hp <= 0);
  return state.pelletsLeft <= 0;
}

function updateAmbientSystems(dt) {
  state.weatherPulse += dt;
  state.objectiveCompleteTimer = Math.max(0, state.objectiveCompleteTimer - dt);
  if (state.activeTip) {
    state.tipTimer -= dt;
    if (state.tipTimer <= 0) state.activeTip = null;
  }

  dataRain.forEach((drop) => {
    drop.y += drop.speed * dt;
    if (drop.y > VIEW_H + 12) {
      drop.y = -12;
      drop.x = rand(0, VIEW_W);
    }
  });
  pixelStorm.forEach((px) => {
    px.x += px.vx * dt;
    px.y += px.vy * dt;
    if (px.y > VIEW_H + 8 || px.x < -16) {
      px.x = rand(0, VIEW_W + 60);
      px.y = -8;
    }
  });
  ghostTrails.forEach((trail) => {
    trail.life -= dt;
  });
  for (let i = ghostTrails.length - 1; i >= 0; i--) {
    if (ghostTrails[i].life <= 0) ghostTrails.splice(i, 1);
  }
  ghosts.forEach((ghost) => {
    ghost.signalLife = Math.max(0, (ghost.signalLife || 0) - dt);
    if (ghost.stun) ghost.stun = Math.max(0, ghost.stun - dt);
  });
}

function updateWeatherGameplay(dt) {
  if (!state.weather) return;
  if (state.weather.id !== "storm") return;

  state.lightningTimer -= dt;
  state.lightningWarn = clamp(3 - state.lightningTimer, 0, 3);
  if (state.lightningTimer <= 0) {
    state.flash = 0.95;
    state.freezeTimer = Math.max(state.freezeTimer, 0.55);
    triggerShake(9, 0.7);
    const ghost = randomChoice(ghosts);
    ghost.stun = 3;
    ghost.signal = { color: palette.gold, glyph: "!", text: "stordito" };
    ghost.signalLife = 1.2;
    floatingText.push(makeText("STORM STUN", tileToPx(ghost.x), tileToPy(ghost.y) - 22, palette.gold));
    state.lightningTimer = rand(14, 28);
  }
}

function updatePelletMotion(dt) {
  if (!pelletMotion.length) return;
  const windActive = state.weather?.id === "wind";
  const heatActive = state.weather?.id === "heat";
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const motion = pelletMotion[y][x];
      motion.phase += dt;
      if (windActive && pelletGrid[y][x]) {
        motion.ox = lerp(motion.ox, state.windDir.x * 4 + Math.sin(motion.phase * 2) * 1.5, dt * 0.8);
        motion.oy = lerp(motion.oy, state.windDir.y * 4 + Math.cos(motion.phase * 2) * 1.5, dt * 0.8);
      } else if (heatActive && pelletGrid[y][x]) {
        motion.ox = Math.sin(motion.phase * 6 + x) * 1.6;
        motion.oy = Math.cos(motion.phase * 5 + y) * 1.2;
      } else if (pelletGrid[y][x] === "power") {
        motion.ox = lerp(motion.ox, 0, dt * 3);
        motion.oy = lerp(motion.oy, 0, dt * 3);
      }
    }
  }
}

function updateLabyrinthMemory() {
  const tx = wrapX(Math.round(pac.x));
  const ty = Math.round(pac.y);
  if (!memoryGrid[ty] || !isPassable(tx, ty, true)) return;
  memoryGrid[ty][tx] = Math.min(1, memoryGrid[ty][tx] + 0.018);
}

function updateGhostLanguage(dt) {
  state.ghostSignalTimer -= dt;
  if (state.ghostSignalTimer > 0) return;
  state.ghostSignalTimer = 0.45;
  ghosts.forEach((ghost) => {
    if (ghost.eaten > 0) return;
    const d = distance(ghost.x, ghost.y, pac.x, pac.y);
    if (state.powerTimer > 0) {
      ghost.signal = { color: "#ff4058", glyph: "!!", text: "vulnerabile" };
    } else if (d < 2.4) {
      ghost.signal = { color: "#ffffff", glyph: "PAC", text: "localizzato" };
    } else if (nearestPowerPelletDistance(ghost.x, ghost.y) < 5) {
      ghost.signal = { color: palette.power, glyph: "O", text: "controllo power" };
    } else if (ghost.stun > 0) {
      ghost.signal = { color: palette.gold, glyph: "!", text: "stordito" };
    } else {
      ghost.signal = { color: "#50f28f", glyph: ghost.territory, text: "territorio" };
    }
    ghost.signalLife = 0.5;
    ghostTrails.push({ x: tileToPx(ghost.x), y: tileToPy(ghost.y), color: ghost.signal.color, life: 1.2, maxLife: 1.2 });
    if (ghostTrails.length > 80) ghostTrails.shift();
  });
}

function updateEmergentObjective(dt) {
  if (!state.objective || state.objective.complete) return;
  if (state.objective.type === "storm_survive" && state.weather?.id === "storm") {
    state.objective.progress = Math.min(state.objective.target, state.objective.progress + dt);
  }
  if (state.objective.progress >= state.objective.target) {
    completeObjective();
  }
}

function updateAdaptiveTutorial() {
  if (state.tutorialMode !== "smart" || state.activeTip) return;
  if (!state.modeTipShown && state.levelTime > 0.8) {
    state.modeTipShown = true;
    showTip(modeRules().tip);
  } else if ((state.stats?.totalDashes || 0) === 0 && state.levelTime > 12 && pac.adrenaline > 20 && !modeRules().disableDash) {
    showTip("Dash pronto: premi SPAZIO o Z per scattare nei corridoi.");
  } else if (state.weather?.id === "storm" && state.lightningWarn > 2.1) {
    showTip("Il temporale blocca tutti: usa il lampo per respirare e cambiare rotta.");
  } else if (state.objective && state.levelTime > 5 && state.objective.progress === 0) {
    showTip(`Obiettivo vivo: ${state.objective.label}`);
  } else if (state.powerTimer > 3 && state.ghostChain === 0) {
    showTip("Power attivo: ora i fantasmi blu valgono punti e tempo prezioso.");
  }
}

function updatePac(dt) {
  syncHeldDirection();

  if (pressed("Space") || pressed("KeyZ")) {
    dashPac();
  }

  if (atCenter(pac)) {
    snapToCenter(pac);
    if (canMoveTile(Math.round(pac.x), Math.round(pac.y), input.wanted, true)) {
      pac.dir = input.wanted;
    }
    if (!canMoveTile(Math.round(pac.x), Math.round(pac.y), pac.dir, true)) {
      pac.dir = DIRS.none;
    }
  }

  const speedBonus = (state.powerTimer > 0 ? 1.1 : 1) * weatherPacSpeedMultiplier();
  moveActor(pac, pac.speed * speedBonus, dt, true);

  pac.dashGhosts.forEach((ghost) => {
    ghost.life -= dt;
  });
  for (let i = pac.dashGhosts.length - 1; i >= 0; i--) {
    if (pac.dashGhosts[i].life <= 0) pac.dashGhosts.splice(i, 1);
  }
}

function dashPac() {
  const rules = modeRules();
  if (rules.disableDash) {
    showTip("Dash disattivato in Puzzle Maze.");
    return;
  }
  if (pac.dashCooldown > 0 || pac.adrenaline < rules.dashCost || pac.dir === DIRS.none) return;
  const fromX = pac.x;
  const fromY = pac.y;
  let steps = 0;
  while (steps < rules.dashDistance) {
    const tx = wrapX(Math.round(pac.x) + pac.dir.x);
    const ty = Math.round(pac.y) + pac.dir.y;
    if (!isPassable(tx, ty, true)) break;
    pac.x = tx;
    pac.y = ty;
    steps++;
  }
  if (steps > 0) {
    pac.dashCooldown = 1.0;
    pac.adrenaline -= rules.dashCost;
    state.stats.totalDashes++;
    state.stats.dashlessPellets = 0;
    if (state.objective?.type === "dashless_pellets" && !state.objective.complete) {
      state.objective.progress = 0;
      showTip("Dash usato: la sfida senza dash riparte da zero.");
    }
    triggerShake(3);
    for (let i = 0; i < 3; i++) {
      pac.dashGhosts.push({ x: fromX + pac.dir.x * i, y: fromY + pac.dir.y * i, dir: pac.dir, life: 0.24 + i * 0.04 });
    }
    spawnDashParticles(tileToPx(pac.x), tileToPy(pac.y));
    sounds.beep(220, 0.05, "sawtooth", 0.035);
  }
}

function collectPellet() {
  const tx = wrapX(Math.round(pac.x));
  const ty = Math.round(pac.y);
  if (!inBounds(tx, ty)) return;
  const pellet = pelletGrid[ty][tx];
  if (!pellet || distance(pac.x, pac.y, tx, ty) > 0.42) return;

  pelletGrid[ty][tx] = null;
  state.pelletsLeft--;
  registerPelletCollected(pellet);
  if (pellet === "normal") {
    addScore(10 + weatherPelletBonus(), "base");
    spawnPelletParticles(tileToPx(tx), tileToPy(ty), palette.ink);
    sounds.beep(660 + (state.combo % 8) * 18, 0.035, "square", 0.035);
  } else if (pellet === "gold") {
    addScore(50 + weatherPelletBonus(), "base");
    pac.adrenaline = clamp(pac.adrenaline + 20, 0, 100);
    pac.shield = Math.min(3, pac.shield + 1);
    spawnGoldenParticles(tileToPx(tx), tileToPy(ty));
    floatingText.push(makeText("+SHIELD", tileToPx(tx), tileToPy(ty) - 14, palette.gold));
    sounds.beep(980, 0.09, "triangle", 0.055);
  } else if (pellet === "power") {
    addScore(50 + weatherPelletBonus(), "base");
    state.powerMax = 8 * (state.gridPhase?.power || 1) * modeRules().powerDuration;
    state.powerTimer = state.powerMax;
    state.ghostChain = 0;
    state.flash = 0.45;
    triggerShake(5);
    spawnPowerParticles(tileToPx(tx), tileToPy(ty));
    waves.push({ x: tileToPx(tx), y: tileToPy(ty), r: 0, max: 96, life: 0.8, color: palette.power });
    floatingText.push(makeText("POWER", tileToPx(tx), tileToPy(ty) - 18, palette.power));
    sounds.beep(1320, 0.13, "sawtooth", 0.06);
  } else if (pellet === "dream") {
    addScore(1000, "exploration");
    pac.adrenaline = clamp(pac.adrenaline + 35, 0, 100);
    spawnDreamParticles(tileToPx(tx), tileToPy(ty));
    floatingText.push(makeText("DREAM +1000", tileToPx(tx), tileToPy(ty) - 18, "#b8eaff"));
    sounds.beep(1480, 0.16, "triangle", 0.065);
  } else if (pellet === "corrupt") {
    const roll = seededRandom(state.elapsed * 1000 + tx * 17 + ty * 31);
    const value = roll > 0.86 ? 10000 : roll > 0.45 ? 250 : 1;
    addScore(value, "exploration");
    state.stats.corruption = clamp((state.stats.corruption || 0) - 0.08, 0, 100);
    spawnCorruptParticles(tileToPx(tx), tileToPy(ty));
    floatingText.push(makeText(`CORRUPT ${value}`, tileToPx(tx), tileToPy(ty) - 18, palette.neon2));
    sounds.beep(value > 1000 ? 1660 : 180, 0.12, "sawtooth", 0.06);
  }
  state.progressPulse = 0.32;
}

function addScore(points, category = "base") {
  state.combo++;
  state.comboTimer = 2.1;
  const multiplier = comboMultiplier();
  const raw = points * multiplier;
  const modified = Math.round(raw * scoreModifier());
  state.score += modified;
  if (state.scoreBreakdown) {
    state.scoreBreakdown[category] = (state.scoreBreakdown[category] || 0) + points;
    state.scoreBreakdown.combo += points * (multiplier - 1);
    state.scoreBreakdown.weather += modified - raw;
  }
  state.highScore = Math.max(state.highScore, state.score);
  localStorage.setItem("ultraPacHighScore", String(state.highScore));
}

function comboMultiplier() {
  if (state.combo >= 80) return 8;
  if (state.combo >= 50) return 6;
  if (state.combo >= 25) return 4;
  if (state.combo >= 10) return 2;
  return 1;
}

function createScoreBreakdown() {
  return {
    base: 0,
    ghost: 0,
    combo: 0,
    exploration: 0,
    style: 0,
    time: 0,
    perfection: 0,
    weather: 0,
    reputation: 0,
  };
}

function scoreModifier() {
  return (state.weather?.score || 1) * (state.gridPhase?.score || 1) * modeRules().score * Math.min(1.75, modePressure());
}

function weatherPelletBonus() {
  return state.weather?.id === "rain" ? 5 : 0;
}

function weatherPacSpeedMultiplier() {
  return (state.weather?.pacSpeed || 1) * modeRules().pacSpeed;
}

function weatherGhostSpeedMultiplier() {
  return (state.weather?.ghostSpeed || 1) * (state.gridPhase?.ghostSpeed || 1) * modeRules().ghostSpeed * Math.min(1.65, modePressure());
}

function weatherHungerMultiplier() {
  return (state.weather?.hunger || 1) * modeRules().hunger;
}

function startEmergentObjective() {
  const rules = modeRules();
  if (rules.clear === "boss" && state.boss) {
    state.objective = { type: "boss_damage", label: `Riduci ${state.boss.name} a 0 HP`, target: state.boss.maxHp, progress: 0, reward: 2200 + state.runLevel * 300, complete: false };
    return;
  }

  const pool = [
    { type: "dashless_pellets", label: "Raccogli 25 pellet senza Dash", target: 25, reward: 900 },
    { type: "eat_ghost", label: "Mangia 2 fantasmi in un solo Power", target: 2, reward: 1200 },
    { type: "combo", label: "Mantieni combo 20", target: 20, reward: 800 },
  ];
  if (rules.id === "puzzle") pool.unshift({ type: "combo", label: "Risolvi una combo 15 senza Dash", target: 15, reward: 1200 });
  if (rules.id === "arcade") pool.unshift({ type: "combo", label: "Combo arcade 30", target: 30, reward: 1300 });
  if (state.weather?.id === "storm") pool.unshift({ type: "storm_survive", label: "Sopravvivi 30s al Temporale", target: 30, reward: 1600 });
  if (state.gridPhase?.id === "night") pool.unshift({ type: "dream_pellet", label: "Trova un Dream Pellet", target: 1, reward: 1800 });
  const objective = pool[Math.floor(seededRandom(Date.now() + (state.stats?.gridVisits || 0)) * pool.length)];
  state.objective = { ...objective, progress: 0, complete: false };
}

function registerPelletCollected(type) {
  state.stats.totalPellets++;
  state.stats.dashlessPellets = (state.stats.dashlessPellets || 0) + 1;
  if (type === "power") state.stats.totalPowerPellets++;
  if (!state.objective || state.objective.complete) return;
  if (state.objective.type === "dashless_pellets") state.objective.progress = state.stats.dashlessPellets;
  if (state.objective.type === "dream_pellet" && type === "dream") state.objective.progress = 1;
  if (state.objective.type === "combo") state.objective.progress = Math.max(state.objective.progress, state.combo);
  if (state.objective.progress >= state.objective.target) completeObjective();
}

function registerGhostEaten() {
  state.styleChain++;
  if (state.scoreBreakdown) state.scoreBreakdown.style += 120 * state.styleChain;
  damageBoss();
  if (state.objective?.type === "eat_ghost" && !state.objective.complete) {
    state.objective.progress++;
    if (state.objective.progress >= state.objective.target) completeObjective();
  }
}

function damageBoss() {
  if (modeRules().clear !== "boss" || !state.boss || state.boss.hp <= 0) return;
  const damage = state.ghostChain >= 3 ? 2 : 1;
  state.boss.hp = Math.max(0, state.boss.hp - damage);
  if (state.objective?.type === "boss_damage" && !state.objective.complete) {
    state.objective.progress = state.objective.target - state.boss.hp;
  }
  floatingText.push(makeText(`BOSS -${damage}`, VIEW_W / 2, 164, palette.danger, 1.25));
  if (state.boss.hp <= 0) {
    completeObjective();
    state.flash = 0.85;
    triggerShake(10, 0.8);
  }
}

function completeObjective() {
  if (!state.objective || state.objective.complete) return;
  state.objective.complete = true;
  state.objective.progress = state.objective.target;
  state.objectiveCompleteTimer = 2.2;
  state.score += state.objective.reward;
  state.highScore = Math.max(state.highScore, state.score);
  localStorage.setItem("ultraPacHighScore", String(state.highScore));
  if (state.scoreBreakdown) state.scoreBreakdown.exploration += state.objective.reward;
  floatingText.push(makeText(`OBIETTIVO +${state.objective.reward}`, VIEW_W / 2, 184, palette.gold, 1.4));
  triggerShake(4, 0.4);
}

function showTip(text) {
  state.activeTip = text;
  state.tipTimer = 5;
}

function nearestPowerPelletDistance(x, y) {
  let best = Infinity;
  for (let yy = 0; yy < MAP_H; yy++) {
    for (let xx = 0; xx < MAP_W; xx++) {
      if (pelletGrid[yy][xx] === "power") {
        best = Math.min(best, distance(x, y, xx, yy));
      }
    }
  }
  return best;
}

function updateGhosts(dt) {
  ghosts.forEach((ghost, index) => {
    if (ghost.eaten > 0) {
      ghost.eaten -= dt;
      if (ghost.eaten <= 0) {
        ghost.x = ghost.homeX;
        ghost.y = ghost.homeY;
      }
      return;
    }

    if (ghost.stun > 0) return;
    if (state.freezeTimer > 0) return;
    if (atCenter(ghost)) {
      snapToCenter(ghost);
      ghost.dir = chooseGhostDirection(ghost, index);
    }
    const frightened = state.powerTimer > 0;
    const speed = ghost.speed * (frightened ? 0.68 : 1) * weatherGhostSpeedMultiplier();
    moveActor(ghost, speed, dt, false);
  });
}

function chooseGhostDirection(ghost, index) {
  const gx = Math.round(ghost.x);
  const gy = Math.round(ghost.y);
  let target = targetForGhost(index);
  if (state.powerTimer > 0) {
    target = ghosts[index].scatter;
  }
  const dominant = ghosts.find((other) => other !== ghost && other.rank > ghost.rank && distance(other.x, other.y, ghost.x, ghost.y) < 2.2);
  if (dominant) {
    target = ghost.scatter;
    ghost.signal = { color: "#ff9e3d", glyph: "RET", text: "ritirata" };
    ghost.signalLife = 0.5;
  }

  const dirs = DIR_ORDER.filter((dir) => canMoveTile(gx, gy, dir, false));
  if (dirs.length === 0) return DIRS.none;
  const reverse = { x: -ghost.dir.x, y: -ghost.dir.y };
  const candidates = dirs.length > 1 ? dirs.filter((dir) => dir.x !== reverse.x || dir.y !== reverse.y) : dirs;
  const pathDir = shortestDirection(gx, gy, target.x, target.y, candidates);
  if (pathDir) return pathDir;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function targetForGhost(index) {
  const px = Math.round(pac.x);
  const py = Math.round(pac.y);
  if (index === 0) return { x: px, y: py };
  if (index === 1) return { x: wrapX(px + pac.dir.x * 4), y: clamp(py + pac.dir.y * 4, 1, MAP_H - 2) };
  if (index === 2) return { x: wrapX(px + (px - Math.round(ghosts[0].x))), y: clamp(py + (py - Math.round(ghosts[0].y)), 1, MAP_H - 2) };
  if (distance(ghosts[index].x, ghosts[index].y, pac.x, pac.y) < 7) return ghosts[index].scatter;
  return { x: px, y: py };
}

function shortestDirection(sx, sy, tx, ty, firstDirs) {
  tx = wrapX(Math.round(tx));
  ty = clamp(Math.round(ty), 0, MAP_H - 1);
  if (!isPassable(tx, ty, false)) {
    const open = nearestOpenTile(tx, ty);
    tx = open.x;
    ty = open.y;
  }

  let best = null;
  let bestCost = Infinity;
  for (const dir of firstDirs) {
    const nx = wrapX(sx + dir.x);
    const ny = sy + dir.y;
    if (!isPassable(nx, ny, false)) continue;
    const cost = bfsCost(nx, ny, tx, ty);
    if (cost < bestCost) {
      bestCost = cost;
      best = dir;
    }
  }
  return best;
}

function bfsCost(sx, sy, tx, ty) {
  const queue = [[sx, sy, 0]];
  const seen = new Set([`${sx},${sy}`]);
  for (let q = 0; q < queue.length; q++) {
    const [x, y, d] = queue[q];
    if (x === tx && y === ty) return d;
    for (const dir of DIR_ORDER) {
      const nx = wrapX(x + dir.x);
      const ny = y + dir.y;
      const key = `${nx},${ny}`;
      if (seen.has(key) || !isPassable(nx, ny, false)) continue;
      seen.add(key);
      queue.push([nx, ny, d + 1]);
    }
  }
  return 9999;
}

function nearestOpenTile(x, y) {
  for (let radius = 1; radius < 8; radius++) {
    for (let yy = y - radius; yy <= y + radius; yy++) {
      for (let xx = x - radius; xx <= x + radius; xx++) {
        const wx = wrapX(xx);
        if (isPassable(wx, yy, false)) return { x: wx, y: yy };
      }
    }
  }
  return { x: 13, y: 17 };
}

function checkGhostCollisions() {
  ghosts.forEach((ghost) => {
    if (ghost.eaten > 0) return;
    if (distance(pac.x, pac.y, ghost.x, ghost.y) > 0.62) return;
    if (state.powerTimer > 0) {
      state.ghostChain++;
      const points = 100 * Math.pow(2, Math.min(state.ghostChain, 4));
      addScore(points, "ghost");
      state.stats.totalGhostsEaten++;
      registerGhostEaten();
      ghost.eaten = 2.3;
      triggerShake(7);
      spawnGhostBurst(tileToPx(ghost.x), tileToPy(ghost.y), ghost.color);
      waves.push({ x: tileToPx(ghost.x), y: tileToPy(ghost.y), r: 0, max: 70, life: 0.42, color: ghost.color });
      floatingText.push(makeText(String(points), tileToPx(ghost.x), tileToPy(ghost.y) - 18, ghost.color));
      sounds.beep(360 + state.ghostChain * 90, 0.12, "triangle", 0.055);
    } else if (pac.shield > 0) {
      pac.shield--;
      state.freezeTimer = 1.2;
      state.flash = 0.35;
      triggerShake(8);
      spawnShieldBreak(tileToPx(pac.x), tileToPy(pac.y));
      floatingText.push(makeText("SHIELD", tileToPx(pac.x), tileToPy(pac.y) - 24, palette.power));
      sounds.beep(160, 0.12, "sawtooth", 0.06);
    } else {
      loseLife();
    }
  });
}

function loseLife() {
  state.lives--;
  state.hp = Math.max(0, state.hp - 1);
  state.stats.totalDeaths++;
  state.stats.reputation = clamp((state.stats.reputation || 0) - 1, -20, 50);
  state.flash = 0.75;
  triggerShake(12, 2);
  spawnDeathParticles(tileToPx(pac.x), tileToPy(pac.y));
  sounds.beep(90, 0.24, "sawtooth", 0.07);
  if (state.lives <= 0) {
    floatingText.push(makeText("GAME OVER", VIEW_W / 2, VIEW_H / 2, palette.danger, 1.8));
    resetGame({ keepScreenEffects: true });
    state.screen = "menu";
    saveStats();
    return;
  }
  pac.x = 13;
  pac.y = 17;
  pac.dir = DIRS.left;
  resetMovementInput(DIRS.left);
  ghosts.forEach((g, i) => {
    g.x = g.homeX;
    g.y = g.homeY;
    g.dir = DIR_ORDER[i % DIR_ORDER.length];
    g.eaten = 0;
  });
}

function completeLevel() {
  state.screen = "complete";
  state.levelCompleteTimer = 0;
  state.flash = 0.55;
  triggerShake(5);
  const timeBonus = Math.max(0, 3000 - Math.floor(state.levelTime * 20));
  const perfection = state.lives >= 3 ? 2000 : 0;
  if (state.scoreBreakdown) {
    state.scoreBreakdown.time += timeBonus;
    state.scoreBreakdown.perfection += perfection;
    state.scoreBreakdown.reputation += Math.round((state.stats?.reputation || 0) * 15);
  }
  state.score += timeBonus + perfection + Math.max(0, state.scoreBreakdown?.reputation || 0);
  state.highScore = Math.max(state.highScore, state.score);
  localStorage.setItem("ultraPacHighScore", String(state.highScore));
  state.stats.totalLevels++;
  state.stats.reputation = clamp((state.stats.reputation || 0) + (state.lives >= 3 ? 3 : 1), -20, 50);
  state.stats.scoreHistory = [...(state.stats.scoreHistory || []).slice(-11), state.score];
  saveStats();
  for (let i = 0; i < 70; i++) {
    spawnParticle({
      x: VIEW_W / 2,
      y: VIEW_H / 2,
      vx: rand(-260, 260),
      vy: rand(-330, 80),
      life: rand(1.0, 2.1),
      size: rand(3, 8),
      color: randomChoice([palette.neon, palette.neon2, palette.gold, palette.ok, palette.purple]),
      shape: "confetti",
      gravity: 280,
      spin: rand(-10, 10),
    });
  }
  sounds.beep(1040, 0.18, "triangle", 0.07);
}

function advanceAfterComplete() {
  state.runLevel++;
  refreshLevelEnvironment();
  resetGame({ keepScore: true, keepVitals: true });
  state.screen = "playing";
  state.flash = 0.28;
  showTip(modeRules().tip);
  focusCanvas();
}

function moveActor(actor, speed, dt, pacRules) {
  if (actor.dir === DIRS.none) return;
  let remaining = speed * dt;
  while (remaining > 0.0001 && actor.dir !== DIRS.none) {
    if (atCenter(actor)) {
      snapToCenter(actor);
      if (!canMoveTile(Math.round(actor.x), Math.round(actor.y), actor.dir, pacRules)) {
        actor.dir = DIRS.none;
        break;
      }
    }

    const targetX = actor.dir.x > 0 ? Math.floor(actor.x + 0.0001) + 1 : actor.dir.x < 0 ? Math.ceil(actor.x - 0.0001) - 1 : actor.x;
    const targetY = actor.dir.y > 0 ? Math.floor(actor.y + 0.0001) + 1 : actor.dir.y < 0 ? Math.ceil(actor.y - 0.0001) - 1 : actor.y;
    const distanceToCenter = actor.dir.x !== 0 ? Math.abs(targetX - actor.x) : Math.abs(targetY - actor.y);
    const step = Math.min(remaining, Math.max(0.0001, distanceToCenter));

    actor.x += actor.dir.x * step;
    actor.y += actor.dir.y * step;
    actor.y = clamp(actor.y, 0, MAP_H - 1);
    remaining -= step;

    if (step >= distanceToCenter - 0.0001) {
      snapToCenter(actor);
      if (!canMoveTile(Math.round(actor.x), Math.round(actor.y), actor.dir, pacRules)) {
        actor.dir = DIRS.none;
      }
    }
  }

  if (atCenter(actor)) {
    snapToCenter(actor);
    if (actor.dir !== DIRS.none && !canMoveTile(Math.round(actor.x), Math.round(actor.y), actor.dir, pacRules)) {
      actor.dir = DIRS.none;
    }
  }
}

function canMoveTile(x, y, dir, pacRules) {
  if (dir === DIRS.none) return false;
  const nx = wrapX(x + dir.x);
  const ny = y + dir.y;
  return isPassable(nx, ny, pacRules);
}

function isPassable(x, y, pacRules) {
  if (y < 0 || y >= MAP_H) return false;
  const c = map[y][wrapX(x)];
  if (c === "#") return false;
  if (pacRules && c === "-") return false;
  return true;
}

function inBounds(x, y) {
  return y >= 0 && y < MAP_H && x >= 0 && x < MAP_W;
}

function atCenter(actor) {
  return Math.abs(actor.x - Math.round(actor.x)) < 0.08 && Math.abs(actor.y - Math.round(actor.y)) < 0.08;
}

function snapToCenter(actor) {
  actor.x = wrapX(Math.round(actor.x));
  actor.y = Math.round(actor.y);
}

function wrapX(x) {
  return ((x % MAP_W) + MAP_W) % MAP_W;
}

function wrapFloatX(x) {
  if (x < -0.5) return MAP_W - 0.5;
  if (x > MAP_W - 0.5) return -0.5;
  return x;
}

function tileToPx(x) {
  return BOARD_X + wrapFloatX(x) * TILE + TILE / 2;
}

function tileToPy(y) {
  return BOARD_Y + y * TILE + TILE / 2;
}

function render() {
  ctx.save();
  const dpr = canvas.width / canvas.clientWidth;
  ctx.scale(dpr, dpr);
  const cw = canvas.clientWidth;
  const ch = canvas.clientHeight;
  scale = Math.min(cw / VIEW_W, ch / VIEW_H);
  offsetX = (cw - VIEW_W * scale) / 2;
  offsetY = (ch - VIEW_H * scale) / 2;
  ctx.clearRect(0, 0, cw, ch);
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = false;

  const sx = state.reducedMotion ? 0 : rand(-state.shake, state.shake) * 0.5;
  const sy = state.reducedMotion ? 0 : rand(-state.shake, state.shake) * 0.5;
  ctx.translate(sx, sy);

  drawBackground();
  if (state.screen === "title") drawTitle();
  if (state.screen === "report") drawGridReport();
  if (state.screen === "menu") drawMenu();
  if (state.screen === "modes") drawModeMenu();
  if (state.screen === "options") drawOptions();
  if (state.screen === "gallery") drawGallery();
  if (state.screen === "playing" || state.screen === "pause" || state.screen === "complete") {
    drawHud();
    drawBoard();
    drawPellets();
    drawParticles();
    drawWaves();
    drawDashGhosts();
    drawGhostTrails();
    drawGhosts();
    drawPac();
    drawFloatingText();
    drawBottomProgress();
    drawObjectiveToast();
    drawAdaptiveTip();
  }
  if (state.screen === "pause") drawPause();
  if (state.screen === "complete") drawComplete();
  drawWeatherOverlay();
  drawFlash();
  if (state.scanlines) drawScanlines();
  ctx.restore();
}

function drawBackground() {
  const grd = ctx.createLinearGradient(0, 0, VIEW_W, VIEW_H);
  grd.addColorStop(0, "#05070f");
  grd.addColorStop(0.46, state.highContrast ? "#07101f" : phaseBackgroundColor());
  grd.addColorStop(1, "#05070f");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (state.weather?.id === "aurora") {
    drawAuroraBackground();
  }

  ctx.save();
  ctx.globalAlpha = 0.38;
  ctx.strokeStyle = "#17345c";
  ctx.lineWidth = 1;
  const drift = state.reducedMotion ? 0 : (state.elapsed * 18) % 48;
  for (let y = -48 + drift; y < VIEW_H; y += 48) {
    line(0, y, VIEW_W, y);
  }
  for (let x = -48 + drift * 0.4; x < VIEW_W; x += 48) {
    line(x, 0, x, VIEW_H);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 38; i++) {
    const x = (i * 97 + state.elapsed * 16) % VIEW_W;
    const y = (i * 53 + state.elapsed * 42) % VIEW_H;
    ctx.fillStyle = i % 3 === 0 ? palette.gold : i % 3 === 1 ? palette.neon : palette.neon2;
    ctx.fillRect(x, y, 2, 8);
  }
  ctx.restore();
}

function drawTitle() {
  drawLogo(VIEW_W / 2, 214, 1.38, state.titleBuilt);
  ctx.textAlign = "center";
  ctx.fillStyle = pulseColor(palette.ink, palette.gold, 0.5 + 0.5 * Math.sin(state.elapsed * 3));
  ctx.font = "22px 'Courier New', monospace";
  ctx.fillText("PREMI START / ENTER", VIEW_W / 2, 400);
  drawTinyMaze(VIEW_W / 2 - 218, 470, 436, 122, 0.34);
  ctx.fillStyle = "rgba(255,255,255,0.64)";
  ctx.font = "13px 'Courier New', monospace";
  ctx.textAlign = "right";
  ctx.fillText("v0.1 prototype", VIEW_W - 34, VIEW_H - 26);
}

function drawGridReport() {
  drawLogo(VIEW_W / 2, 116, 0.72, 1);
  drawPanel(176, 184, 608, 394, "RAPPORTO DALLA GRID");
  ctx.save();
  ctx.textAlign = "left";
  ctx.font = "18px 'Courier New', monospace";
  ctx.fillStyle = palette.ink;
  const report = state.gridReport || { lines: ["La GRID e stabile. Nessun evento registrato."] };
  report.lines.forEach((lineText, index) => {
    ctx.fillText(lineText, 226, 264 + index * 38);
  });
  drawMiniForecast(226, 480);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(247,251,255,0.72)";
  ctx.font = "15px 'Courier New', monospace";
  ctx.fillText("ENTER", VIEW_W / 2, 536);
  ctx.restore();
}

function drawLogo(cx, cy, size, built = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size, size);
  const letters = "ULTRA PAC";
  const sub = "REBORN";
  ctx.textAlign = "center";
  ctx.shadowColor = palette.neon;
  ctx.shadowBlur = 18;
  ctx.font = "bold 62px 'Courier New', monospace";
  const chars = Math.ceil(letters.length * built);
  ctx.fillStyle = palette.gold;
  ctx.fillText(letters.slice(0, chars), 0, 0);
  ctx.shadowColor = palette.neon2;
  ctx.font = "bold 38px 'Courier New', monospace";
  ctx.fillStyle = palette.neon;
  ctx.fillText(sub.slice(0, Math.ceil(sub.length * built)), 0, 48);
  ctx.restore();
}

function drawMenu() {
  drawLogo(VIEW_W / 2, 132, 0.86, 1);
  drawPanel(290, 230, 380, 370, "MENU");
  MENU_ITEMS.forEach((item, index) => {
    const y = 292 + index * 45;
    const selected = index === state.selected;
    drawMenuLine(item, 374, y, selected, index === 1 && state.score === 0);
  });
  drawMiniPac(346, 292 + state.selected * 45 - 7, 8, DIRS.right, palette.gold);
}

function drawModeMenu() {
  drawPanel(246, 188, 468, 390, "MODALITA");
  MODES.forEach((item, index) => {
    drawMenuLine(item, 370, 278 + index * 48, index === state.selectedMode, false);
  });
  drawMiniPac(342, 278 + state.selectedMode * 48 - 7, 8, DIRS.right, palette.gold);
  const rules = modeRules();
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = palette.inkSoft;
  ctx.font = "13px 'Courier New', monospace";
  ctx.fillText(rules.description, VIEW_W / 2, 542);
  ctx.restore();
}

function drawOptions() {
  drawPanel(250, 168, 460, 410, "OPZIONI");
  const opts = [
    ["SCANLINES", state.scanlines],
    ["RIDUCI MOVIMENTO", state.reducedMotion],
    ["CONTRASTO ALTO", state.highContrast],
    ["AUDIO", sounds.enabled],
    ["TUTORIAL SMART", state.tutorialMode === "smart"],
  ];
  opts.forEach((opt, index) => {
    const y = 248 + index * 58;
    const selected = index === state.selectedOption;
    drawMenuLine(opt[0], 346, y, selected, false);
    drawToggle(594, y - 20, opt[1], selected);
  });
}

function drawGallery() {
  drawPanel(132, 106, 696, 510, "GALLERIA");
  const cols = 2;
  GALLERY_ITEMS.forEach((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 190 + col * 306;
    const y = 194 + row * 92;
    const unlocked = index < 3 || state.score > 0;
    drawCard(x, y, 260, 64, item, unlocked);
  });
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(247,251,255,0.7)";
  ctx.font = "15px 'Courier New', monospace";
  ctx.fillText("ESC", VIEW_W / 2, 572);
}

function drawPause() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawPanel(280, 160, 400, 420, "PAUSA");
  ctx.textAlign = "left";
  ctx.font = "18px 'Courier New', monospace";
  ctx.fillStyle = palette.ink;
  const lines = [
    `TEMPO        ${formatTime(state.levelTime)}`,
    `PELLET       ${state.pelletTotal - state.pelletsLeft}/${state.pelletTotal}`,
    `PUNTEGGIO    ${state.score}`,
    `COMBO        x${comboMultiplier()}  ${state.combo}`,
  ];
  lines.forEach((line, i) => ctx.fillText(line, 344, 252 + i * 34));
  ["RIPRENDI", "OPZIONI", "RIAVVIA LIVELLO", "TORNA AL MENU"].forEach((line, i) => {
    drawMenuLine(line, 380, 418 + i * 34, i === state.selected, false);
  });
  drawMiniPac(352, 411 + state.selected * 34, 8, DIRS.right, palette.gold);
  ctx.restore();
}

function drawComplete() {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.48)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawPanel(204, 112, 552, 500, completeTitle());
  ctx.textAlign = "center";
  ctx.fillStyle = palette.gold;
  ctx.shadowColor = palette.gold;
  ctx.shadowBlur = 20;
  ctx.font = "bold 38px 'Courier New', monospace";
  ctx.fillText(`RANK ${scoreRank()}`, VIEW_W / 2, 216);
  ctx.shadowBlur = 0;
  ctx.fillStyle = palette.inkSoft;
  ctx.font = "15px 'Courier New', monospace";
  ctx.fillText(`${state.weather?.name || "SERENO"}  /  ${state.gridPhase?.name || "GRID"}`, VIEW_W / 2, 246);
  drawScoreBreakdown(256, 282, 448);
  ctx.fillStyle = palette.ink;
  ctx.font = "bold 20px 'Courier New', monospace";
  ctx.fillText(`TOTALE ${padScore(state.score)}`, VIEW_W / 2, 530);
  ctx.fillStyle = "rgba(247,251,255,0.72)";
  ctx.font = "16px 'Courier New', monospace";
  ctx.fillText("ENTER  PROSSIMO LIVELLO", VIEW_W / 2, 572);
  ctx.restore();
}

function completeTitle() {
  const rules = modeRules();
  if (rules.clear === "boss") return "BOSS SCONFITTO";
  if (rules.id === "endless") return "ONDATA COMPLETATA";
  if (rules.id === "puzzle") return "PUZZLE RISOLTO";
  return "LIVELLO COMPLETATO";
}

function drawHud() {
  ctx.save();
  ctx.fillStyle = "rgba(5,8,20,0.78)";
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.strokeStyle = "rgba(65,234,255,0.35)";
  ctx.lineWidth = 2;
  line(0, HUD_H - 2, VIEW_W, HUD_H - 2);

  ctx.textAlign = "left";
  ctx.fillStyle = palette.inkSoft;
  ctx.font = "14px 'Courier New', monospace";
  ctx.fillText(state.levelName, 26, 30);
  ctx.fillText(state.world, 26, 52);
  drawLives(28, 78);
  drawHp(28, 103);
  drawModeBadge(28, 122);

  ctx.textAlign = "center";
  ctx.font = "bold 42px 'Courier New', monospace";
  ctx.fillStyle = palette.ink;
  ctx.shadowColor = palette.neon;
  ctx.shadowBlur = 14;
  ctx.fillText(padScore(state.score), VIEW_W / 2, 44);
  ctx.shadowBlur = 0;
  const mult = comboMultiplier();
  ctx.fillStyle = comboColor(mult);
  ctx.font = "bold 30px 'Courier New', monospace";
  const comboScale = state.progressPulse > 0 ? 1 + state.progressPulse * 0.18 : 1;
  ctx.save();
  ctx.translate(VIEW_W / 2, 87);
  ctx.scale(comboScale, comboScale);
  ctx.fillText(`x${mult}  COMBO ${state.combo}`, 0, 0);
  ctx.restore();

  drawPowerSlots(722, 24);
  drawMeter(730, 78, 160, 12, pac.adrenaline / 100, "#ff344b", "#ffb23d");
  drawMeter(730, 103, 160, 12, pac.hunger / 100, "#ffd83d", "#ff7a38");
  drawIconBolt(706, 84);
  drawMiniPac(706, 109, 7, DIRS.right, pac.hunger < 25 ? "#888" : palette.gold);

  ctx.textAlign = "right";
  ctx.fillStyle = palette.inkSoft;
  ctx.font = "14px 'Courier New', monospace";
  ctx.fillText(formatTime(state.levelTime), 932, 30);
  ctx.fillText(`HI ${padScore(state.highScore)}`, 932, 52);
  drawGridStatus(730, 122);
  ctx.restore();
}

function drawModeBadge(x, y) {
  const rules = modeRules();
  ctx.save();
  ctx.textAlign = "left";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillStyle = rules.id === "boss" ? palette.danger : rules.id === "puzzle" ? palette.purple : palette.gold;
  ctx.fillText(`${rules.label} L${state.runLevel}`, x, y);
  if (state.boss) drawBossMeter(VIEW_W / 2 - 130, 108, 260, 9);
  ctx.restore();
}

function drawBossMeter(x, y, w, h) {
  const pct = state.boss ? state.boss.hp / state.boss.maxHp : 0;
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 11px 'Courier New', monospace";
  ctx.fillStyle = palette.danger;
  ctx.fillText(`${state.boss.name} ${state.boss.hp}/${state.boss.maxHp}`, x + w / 2, y - 5);
  drawMeter(x, y, w, h, pct, palette.danger, palette.gold);
  ctx.restore();
}

function drawGridStatus(x, y) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.font = "11px 'Courier New', monospace";
  ctx.fillStyle = state.weather?.color || palette.neon;
  ctx.shadowColor = state.weather?.color || palette.neon;
  ctx.shadowBlur = 6;
  ctx.fillText(`${state.weather?.icon || "CLR"} ${state.gridPhase?.id?.toUpperCase() || "GRID"}`, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = state.gridSeason?.color || palette.inkSoft;
  ctx.fillText(state.gridSeason?.name || "STABILE", x + 112, y);
  ctx.restore();
}

function drawMiniForecast(x, y) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.font = "14px 'Courier New', monospace";
  ctx.fillStyle = palette.inkSoft;
  ctx.fillText("PROSSIMI LIVELLI", x, y);
  state.weatherForecast.forEach((weather, index) => {
    const px = x + index * 132;
    ctx.fillStyle = "rgba(10,19,52,0.76)";
    ctx.strokeStyle = weather.color;
    roundRect(px, y + 20, 112, 42, 7, true, true);
    ctx.fillStyle = weather.color;
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillText(weather.icon, px + 12, y + 46);
    ctx.fillStyle = palette.ink;
    ctx.font = "11px 'Courier New', monospace";
    ctx.fillText(weather.name.slice(0, 10), px + 45, y + 46);
  });
  ctx.restore();
}

function drawLabyrinthMemory() {
  if (!memoryGrid.length) return;
  ctx.save();
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const value = memoryGrid[y][x];
      if (value <= 0.02) continue;
      ctx.globalAlpha = clamp(value * 0.28, 0, 0.28);
      ctx.fillStyle = state.gridSeason?.color || palette.neon;
      ctx.fillRect(BOARD_X + x * TILE + 4, BOARD_Y + y * TILE + 4, TILE - 8, TILE - 8);
    }
  }
  ctx.restore();
}

function drawGhostTrails() {
  ghostTrails.forEach((trail) => {
    ctx.save();
    ctx.globalAlpha = clamp(trail.life / trail.maxLife, 0, 1) * 0.34;
    ctx.fillStyle = trail.color;
    ctx.shadowColor = trail.color;
    ctx.shadowBlur = 12;
    circle(trail.x, trail.y, 7 + (1 - trail.life / trail.maxLife) * 10, true);
    ctx.restore();
  });
}

function drawGhostSignal(ghost, x, y) {
  if (!ghost.signal || ghost.signalLife <= 0) return;
  ctx.save();
  const alpha = clamp(ghost.signalLife / 0.5, 0, 1);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = ghost.signal.color;
  ctx.fillStyle = ghost.signal.color;
  ctx.shadowColor = ghost.signal.color;
  ctx.shadowBlur = 10;
  circle(x, y, 19 + Math.sin(state.elapsed * 18) * 2, false);
  ctx.textAlign = "center";
  ctx.font = "bold 10px 'Courier New', monospace";
  ctx.fillText(ghost.signal.glyph, x, y - 24);
  ctx.restore();
}

function drawObjectiveToast() {
  if (!state.objective) return;
  ctx.save();
  const x = 24;
  const y = 608;
  const w = 286;
  const h = 58;
  ctx.fillStyle = "rgba(5,8,20,0.84)";
  ctx.strokeStyle = state.objective.complete ? palette.gold : "rgba(65,234,255,0.48)";
  roundRect(x, y, w, h, 8, true, true);
  ctx.textAlign = "left";
  ctx.font = "bold 13px 'Courier New', monospace";
  ctx.fillStyle = state.objective.complete ? palette.gold : palette.neon;
  ctx.fillText(state.objective.complete ? "OBIETTIVO COMPLETATO" : "OBIETTIVO VIVO", x + 14, y + 21);
  ctx.fillStyle = palette.ink;
  ctx.font = "12px 'Courier New', monospace";
  ctx.fillText(state.objective.label, x + 14, y + 39);
  drawMeter(x + 14, y + 46, w - 28, 5, state.objective.progress / state.objective.target, palette.neon, palette.gold);
  ctx.restore();
}

function drawAdaptiveTip() {
  if (!state.activeTip) return;
  ctx.save();
  ctx.globalAlpha = clamp(state.tipTimer, 0, 1);
  const w = 520;
  const x = (VIEW_W - w) / 2;
  const y = 594;
  ctx.fillStyle = "rgba(5,8,20,0.9)";
  ctx.strokeStyle = "rgba(255,204,56,0.64)";
  roundRect(x, y, w, 48, 8, true, true);
  ctx.textAlign = "center";
  ctx.fillStyle = palette.gold;
  ctx.font = "14px 'Courier New', monospace";
  ctx.fillText(state.activeTip, VIEW_W / 2, y + 30);
  ctx.restore();
}

function drawScoreBreakdown(x, y, w) {
  const b = state.scoreBreakdown || createScoreBreakdown();
  const rows = [
    ["BASE", b.base, palette.ink],
    ["GHOST", b.ghost, palette.neon2],
    ["COMBO", b.combo, palette.gold],
    ["EXPLOR", b.exploration, palette.purple],
    ["STYLE", b.style, palette.ok],
    ["TIME", b.time, palette.neon],
    ["PERFECT", b.perfection, palette.danger],
    ["METEO", b.weather, state.weather?.color || palette.inkSoft],
  ];
  const max = Math.max(1, ...rows.map(([, value]) => Math.abs(value)));
  rows.forEach(([label, value, color], index) => {
    const yy = y + index * 27;
    ctx.textAlign = "left";
    ctx.font = "13px 'Courier New', monospace";
    ctx.fillStyle = palette.inkSoft;
    ctx.fillText(label, x, yy);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    roundRect(x + 86, yy - 12, w - 170, 10, 4, true, false);
    ctx.fillStyle = color;
    roundRect(x + 86, yy - 12, (w - 170) * clamp(Math.abs(value) / max, 0, 1), 10, 4, true, false);
    ctx.textAlign = "right";
    ctx.fillStyle = value < 0 ? palette.danger : palette.ink;
    ctx.fillText(String(Math.round(value)), x + w, yy);
  });
}

function drawBoard() {
  ctx.save();
  ctx.fillStyle = "rgba(8,19,36,0.92)";
  roundRect(BOARD_X - 10, BOARD_Y - 10, MAP_W * TILE + 20, MAP_H * TILE + 20, 8, true, false);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      drawFloorTile(x, y);
    }
  }
  drawLabyrinthMemory();
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map[y][x] === "#") drawWallTile(x, y);
      if (map[y][x] === "-") drawDoorTile(x, y);
      if (map[y][x] === "H") drawGhostHouseTile(x, y);
    }
  }
  drawTunnelArrows();
  ctx.restore();
}

function drawFloorTile(x, y) {
  const px = BOARD_X + x * TILE;
  const py = BOARD_Y + y * TILE;
  const c = map[y][x];
  if (c === "#") return;
  const dark = c === "H" ? "#0a0c1f" : c === "_" ? "#05070f" : "#071527";
  ctx.fillStyle = dark;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = (x + y) % 2 ? "#0f2540" : "#0a1b33";
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  ctx.globalAlpha = 1;
}

function drawWallTile(x, y) {
  const px = BOARD_X + x * TILE;
  const py = BOARD_Y + y * TILE;
  const n = isWall(x, y - 1);
  const e = isWall(x + 1, y);
  const s = isWall(x, y + 1);
  const w = isWall(x - 1, y);

  ctx.fillStyle = state.highContrast ? "#16236a" : palette.wallCore;
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(px + 5, py + 5, TILE - 10, TILE - 10);

  ctx.strokeStyle = palette.neon;
  ctx.lineWidth = 2;
  if (!n) line(px + 2, py + 2, px + TILE - 2, py + 2);
  if (!s) line(px + 2, py + TILE - 2, px + TILE - 2, py + TILE - 2);
  if (!w) line(px + 2, py + 2, px + 2, py + TILE - 2);
  if (!e) line(px + TILE - 2, py + 2, px + TILE - 2, py + TILE - 2);

  ctx.strokeStyle = "rgba(255,63,145,0.7)";
  if (!n && !w) arc(px + 4, py + 4, 4, Math.PI, Math.PI * 1.5);
  if (!n && !e) arc(px + TILE - 4, py + 4, 4, Math.PI * 1.5, Math.PI * 2);
  if (!s && !w) arc(px + 4, py + TILE - 4, 4, Math.PI * 0.5, Math.PI);
  if (!s && !e) arc(px + TILE - 4, py + TILE - 4, 4, 0, Math.PI * 0.5);
  ctx.shadowBlur = 0;
}

function isWall(x, y) {
  if (y < 0 || y >= MAP_H) return false;
  return map[y][wrapX(x)] === "#";
}

function drawDoorTile(x, y) {
  const px = BOARD_X + x * TILE;
  const py = BOARD_Y + y * TILE;
  ctx.fillStyle = "#11081c";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.strokeStyle = palette.neon2;
  ctx.shadowColor = palette.neon2;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 3;
  line(px + 2, py + TILE / 2, px + TILE - 2, py + TILE / 2);
  ctx.shadowBlur = 0;
}

function drawGhostHouseTile(x, y) {
  const px = BOARD_X + x * TILE;
  const py = BOARD_Y + y * TILE;
  ctx.fillStyle = "#0b0922";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.fillStyle = "rgba(170,109,255,0.12)";
  ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
}

function drawTunnelArrows() {
  ctx.save();
  ctx.fillStyle = "rgba(65,234,255,0.7)";
  triangle(BOARD_X - 22, BOARD_Y + 11.5 * TILE, BOARD_X - 8, BOARD_Y + 11.5 * TILE - 8, BOARD_X - 8, BOARD_Y + 11.5 * TILE + 8);
  triangle(BOARD_X + MAP_W * TILE + 22, BOARD_Y + 11.5 * TILE, BOARD_X + MAP_W * TILE + 8, BOARD_Y + 11.5 * TILE - 8, BOARD_X + MAP_W * TILE + 8, BOARD_Y + 11.5 * TILE + 8);
  ctx.restore();
}

function drawPellets() {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const pellet = pelletGrid[y][x];
      if (!pellet) continue;
      const motion = pelletMotion[y]?.[x] || { ox: 0, oy: 0 };
      const px = tileToPx(x) + motion.ox;
      const py = tileToPy(y) + motion.oy;
      if (pellet === "normal") {
        ctx.fillStyle = "rgba(247,251,255,0.95)";
        circle(px, py, 3.2, true);
      } else if (pellet === "gold") {
        const r = 4.6 + Math.sin(goldenPulse * 7 + x) * 1.1;
        ctx.fillStyle = palette.gold;
        ctx.shadowColor = palette.gold;
        ctx.shadowBlur = 12;
        star(px, py, r, r * 0.45, 4);
        ctx.shadowBlur = 0;
      } else if (pellet === "power") {
        const r = 8 + Math.sin(state.elapsed * 5 + x) * 1.8;
        ctx.fillStyle = palette.power;
        ctx.shadowColor = palette.power;
        ctx.shadowBlur = 18;
        circle(px, py, r, true);
        ctx.shadowBlur = 0;
      } else if (pellet === "dream") {
        const r = 5.8 + Math.sin(state.elapsed * 4 + x) * 1.4;
        ctx.fillStyle = "#b8eaff";
        ctx.shadowColor = "#b8eaff";
        ctx.shadowBlur = 18;
        star(px, py, r, r * 0.42, 5);
        ctx.shadowBlur = 0;
      } else if (pellet === "corrupt") {
        const r = 3.5 + Math.sin(state.elapsed * 13 + y) * 1.8;
        ctx.fillStyle = Math.floor(state.elapsed * 8 + x + y) % 2 ? palette.neon2 : "#1b0b28";
        ctx.shadowColor = palette.neon2;
        ctx.shadowBlur = 13;
        ctx.fillRect(px - r, py - r, r * 2, r * 2);
        ctx.shadowBlur = 0;
      }
    }
  }
}

function drawPac() {
  const x = tileToPx(pac.x);
  const y = tileToPy(pac.y);
  if (pac.shield > 0) {
    ctx.save();
    ctx.strokeStyle = `rgba(120,245,255,${0.3 + Math.sin(state.elapsed * 5) * 0.12})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = palette.power;
    ctx.shadowBlur = 12;
    circle(x, y, 18 + pac.shield * 2, false);
    ctx.restore();
  }
  const color = state.powerTimer > 0 ? pulseColor(palette.gold, "#fff8a8", 0.5 + 0.5 * Math.sin(state.elapsed * 9)) : palette.pac;
  drawMiniPac(x, y, 15, pac.dir === DIRS.none ? input.wanted : pac.dir, color);
}

function drawMiniPac(x, y, r, dir, color) {
  const angle = Math.atan2(dir.y, dir.x || 0.0001);
  const mouth = 0.22 + Math.abs(Math.sin(pac.mouth)) * 0.42;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = r > 10 ? 14 : 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, mouth, Math.PI * 2 - mouth);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#1a1400";
  circle(r * 0.2, -r * 0.5, Math.max(1.4, r * 0.13), true);
  ctx.restore();
}

function drawDashGhosts() {
  pac.dashGhosts.forEach((g, i) => {
    ctx.save();
    ctx.globalAlpha = clamp(g.life / 0.35, 0, 0.42);
    drawMiniPac(tileToPx(g.x), tileToPy(g.y), 15, g.dir, palette.gold);
    ctx.restore();
  });
}

function drawGhosts() {
  ghosts.forEach((ghost) => {
    if (ghost.eaten > 0) {
      drawEyes(tileToPx(ghost.x), tileToPy(ghost.y), ghost.dir);
      return;
    }
    const vulnerable = state.powerTimer > 0;
    const flashing = vulnerable && state.powerTimer < 2 && Math.floor(state.elapsed * 8) % 2 === 0;
    const color = vulnerable ? (flashing ? "#f7fbff" : "#3458ff") : ghost.color;
    const x = tileToPx(ghost.x);
    const y = tileToPy(ghost.y);
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x, y - 2, 14, Math.PI, 0);
    ctx.lineTo(x + 14, y + 13);
    for (let i = 0; i < 4; i++) {
      const wx = x + 14 - i * 7;
      ctx.lineTo(wx - 3.5, y + 8 + Math.sin(state.elapsed * 8 + i) * 2);
      ctx.lineTo(wx - 7, y + 13);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    drawEyes(x, y - 2, ghost.dir);
    drawGhostSignal(ghost, x, y);
    ctx.restore();
  });
}

function drawEyes(x, y, dir) {
  ctx.save();
  ctx.fillStyle = "#fff";
  circle(x - 5, y - 2, 4.2, true);
  circle(x + 5, y - 2, 4.2, true);
  ctx.fillStyle = "#0b1450";
  circle(x - 5 + dir.x * 1.8, y - 2 + dir.y * 1.8, 2, true);
  circle(x + 5 + dir.x * 1.8, y - 2 + dir.y * 1.8, 2, true);
  ctx.restore();
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot || 0);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.glow || 0;
    if (p.shape === "star") {
      star(0, 0, p.size, p.size * 0.45, 4);
    } else if (p.shape === "confetti") {
      ctx.fillRect(-p.size * 0.8, -p.size * 0.35, p.size * 1.6, p.size * 0.7);
    } else {
      circle(0, 0, p.size, true);
    }
    ctx.restore();
  });
}

function updateParticles(dt) {
  particles.forEach((p) => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.gravity || 0) * dt;
    p.vx *= p.drag || 0.992;
    p.vy *= p.drag || 0.992;
    p.size = Math.max(0, p.size - (p.shrink || 0) * dt);
    p.rot = (p.rot || 0) + (p.spin || 0) * dt;
  });
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0 || particles[i].size <= 0) particles.splice(i, 1);
  }
}

function spawnParticle(p) {
  if (particles.length >= MAX_PARTICLES) particles.shift();
  particles.push({
    x: p.x,
    y: p.y,
    vx: p.vx || 0,
    vy: p.vy || 0,
    life: p.life || 0.5,
    maxLife: p.life || 0.5,
    size: p.size || 3,
    color: p.color || palette.ink,
    shape: p.shape || "circle",
    gravity: p.gravity || 0,
    drag: p.drag || 0.992,
    shrink: p.shrink || 0,
    glow: p.glow || 0,
    spin: p.spin || 0,
    rot: rand(0, Math.PI * 2),
  });
}

function spawnPelletParticles(x, y, color) {
  for (let i = 0; i < 3; i++) {
    spawnParticle({ x, y, vx: rand(-80, 80), vy: rand(-80, 80), life: 0.3, size: rand(1.5, 3), color, shrink: 6 });
  }
}

function spawnGoldenParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    spawnParticle({ x, y, vx: Math.cos(a) * rand(80, 150), vy: Math.sin(a) * rand(80, 150), life: 0.6, size: 4, color: palette.gold, shape: "star", glow: 10, shrink: 5 });
  }
}

function spawnPowerParticles(x, y) {
  for (let i = 0; i < 20; i++) {
    const a = (Math.PI * 2 * i) / 20;
    spawnParticle({ x, y, vx: Math.cos(a) * rand(100, 210), vy: Math.sin(a) * rand(100, 210), life: 0.8, size: rand(3, 6), color: palette.power, glow: 12, shrink: 6 });
  }
}

function spawnDreamParticles(x, y) {
  for (let i = 0; i < 26; i++) {
    const a = (Math.PI * 2 * i) / 26;
    spawnParticle({ x, y, vx: Math.cos(a) * rand(45, 150), vy: Math.sin(a) * rand(45, 150), life: 1.0, size: rand(3, 6), color: randomChoice(["#b8eaff", palette.purple, palette.neon]), shape: "star", glow: 14, shrink: 4 });
  }
}

function spawnCorruptParticles(x, y) {
  for (let i = 0; i < 18; i++) {
    spawnParticle({ x, y, vx: rand(-190, 190), vy: rand(-190, 190), life: rand(0.35, 0.75), size: rand(2, 5), color: randomChoice([palette.neon2, "#1b0b28", palette.purple]), shape: i % 3 === 0 ? "confetti" : "circle", glow: 10, shrink: 7, spin: rand(-14, 14) });
  }
}

function spawnGhostBurst(x, y, color) {
  for (let i = 0; i < 30; i++) {
    const a = rand(0, Math.PI * 2);
    spawnParticle({ x, y, vx: Math.cos(a) * rand(120, 350), vy: Math.sin(a) * rand(120, 350), life: 0.5, size: rand(3, 6), color, glow: 8, shrink: 8 });
  }
}

function spawnDashParticles(x, y) {
  for (let i = 0; i < 5; i++) {
    spawnParticle({ x, y, vx: -pac.dir.x * rand(70, 150) + rand(-30, 30), vy: -pac.dir.y * rand(70, 150) + rand(-30, 30), life: 0.3, size: 3, color: palette.gold, glow: 7, shrink: 6 });
  }
}

function spawnShieldBreak(x, y) {
  for (let i = 0; i < 18; i++) {
    const a = rand(0, Math.PI * 2);
    spawnParticle({ x, y, vx: Math.cos(a) * rand(120, 220), vy: Math.sin(a) * rand(120, 220), life: 0.45, size: 3.4, color: palette.power, glow: 9, shrink: 7 });
  }
  waves.push({ x, y, r: 0, max: 74, life: 0.3, color: palette.power });
}

function spawnDeathParticles(x, y) {
  for (let i = 0; i < 40; i++) {
    const a = rand(0, Math.PI * 2);
    spawnParticle({ x, y, vx: Math.cos(a) * rand(100, 400), vy: Math.sin(a) * rand(100, 400), life: rand(0.8, 1.2), size: rand(3, 5), color: palette.gold, gravity: rand(-60, 80), glow: 10, shrink: 5 });
  }
}

function updateWaves(dt) {
  waves.forEach((w) => {
    w.life -= dt;
    w.r += (w.max - w.r) * Math.min(1, dt * 8);
  });
  for (let i = waves.length - 1; i >= 0; i--) {
    if (waves[i].life <= 0) waves.splice(i, 1);
  }
}

function drawWaves() {
  waves.forEach((w) => {
    ctx.save();
    ctx.globalAlpha = clamp(w.life * 2.6, 0, 0.72);
    ctx.strokeStyle = w.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = w.color;
    ctx.shadowBlur = 16;
    circle(w.x, w.y, w.r, false);
    ctx.restore();
  });
}

function makeText(text, x, y, color, life = 0.9) {
  return { text, x, y, vy: -28, color, life, maxLife: life };
}

function updateFloatingText(dt) {
  floatingText.forEach((t) => {
    t.life -= dt;
    t.y += t.vy * dt;
  });
  for (let i = floatingText.length - 1; i >= 0; i--) {
    if (floatingText[i].life <= 0) floatingText.splice(i, 1);
  }
}

function drawFloatingText() {
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 16px 'Courier New', monospace";
  floatingText.forEach((t) => {
    ctx.globalAlpha = clamp(t.life / t.maxLife, 0, 1);
    ctx.fillStyle = t.color;
    ctx.shadowColor = t.color;
    ctx.shadowBlur = 9;
    ctx.fillText(t.text, t.x, t.y);
  });
  ctx.restore();
}

function drawBottomProgress() {
  const pct = state.pelletTotal ? (state.pelletTotal - state.pelletsLeft) / state.pelletTotal : 0;
  ctx.save();
  ctx.fillStyle = "rgba(5,8,20,0.82)";
  ctx.fillRect(0, VIEW_H - 18, VIEW_W, 18);
  ctx.fillStyle = "rgba(65,234,255,0.18)";
  ctx.fillRect(0, VIEW_H - 13, VIEW_W, 8);
  const grad = ctx.createLinearGradient(0, 0, VIEW_W, 0);
  grad.addColorStop(0, palette.neon);
  grad.addColorStop(0.55, palette.gold);
  grad.addColorStop(1, palette.neon2);
  ctx.fillStyle = grad;
  ctx.shadowColor = palette.neon;
  ctx.shadowBlur = 12;
  ctx.fillRect(0, VIEW_H - 13, VIEW_W * pct, 8);
  ctx.restore();
}

function drawPowerSlots(x, y) {
  for (let i = 0; i < 4; i++) {
    const active = i < Math.max(1, pac.shield);
    const size = active ? 40 : 32;
    const px = x + i * 46;
    const py = y + (active ? 0 : 4);
    ctx.save();
    ctx.strokeStyle = active ? palette.gold : "#8790a4";
    ctx.lineWidth = active ? 3 : 2;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    roundRect(px, py, size, size, 6, true, true);
    if (i === 0) {
      drawMiniPac(px + size / 2, py + size / 2, 9, DIRS.right, state.powerTimer > 0 ? palette.power : palette.gold);
      if (state.powerTimer > 0) drawRadialTimer(px + size / 2, py + size / 2, size / 2 + 4, state.powerTimer / Math.max(0.1, state.powerMax || 8), palette.power);
    } else if (i <= pac.shield) {
      ctx.strokeStyle = palette.power;
      ctx.shadowColor = palette.power;
      ctx.shadowBlur = 8;
      circle(px + size / 2, py + size / 2, 10, false);
    }
    ctx.restore();
  }
}

function drawRadialTimer(x, y, r, pct, color) {
  pct = clamp(pct, 0, 1);
  ctx.save();
  ctx.strokeStyle = pct < 0.35 ? palette.danger : color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  ctx.stroke();
  ctx.restore();
}

function drawLives(x, y) {
  for (let i = 0; i < state.lives; i++) {
    drawMiniPac(x + i * 24, y, 8, DIRS.right, palette.gold);
  }
}

function drawHp(x, y) {
  for (let i = 0; i < 3; i++) {
    drawHeart(x + i * 24, y, i < state.hp ? palette.danger : "#333946");
  }
}

function drawHeart(x, y, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = color === palette.danger ? 7 : 0;
  ctx.beginPath();
  ctx.moveTo(x, y + 5);
  ctx.bezierCurveTo(x - 10, y - 4, x - 13, y + 8, x, y + 15);
  ctx.bezierCurveTo(x + 13, y + 8, x + 10, y - 4, x, y + 5);
  ctx.fill();
  ctx.restore();
}

function drawMeter(x, y, w, h, pct, a, b) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  roundRect(x, y, w, h, 3, true, false);
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, a);
  grad.addColorStop(1, b);
  ctx.fillStyle = grad;
  roundRect(x, y, w * clamp(pct, 0, 1), h, 3, true, false);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  roundRect(x, y, w, h, 3, false, true);
  ctx.restore();
}

function drawIconBolt(x, y) {
  ctx.save();
  ctx.fillStyle = "#ffeb66";
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 10);
  ctx.lineTo(x - 4, y + 1);
  ctx.lineTo(x + 2, y + 1);
  ctx.lineTo(x - 3, y + 12);
  ctx.lineTo(x + 8, y - 2);
  ctx.lineTo(x + 2, y - 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPanel(x, y, w, h, title) {
  ctx.save();
  ctx.fillStyle = "rgba(5,8,20,0.9)";
  ctx.strokeStyle = "rgba(65,234,255,0.62)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(65,234,255,0.42)";
  ctx.shadowBlur = 22;
  roundRect(x, y, w, h, 8, true, true);
  ctx.shadowBlur = 0;
  ctx.textAlign = "center";
  ctx.font = "bold 24px 'Courier New', monospace";
  ctx.fillStyle = palette.gold;
  ctx.fillText(title, x + w / 2, y + 48);
  ctx.restore();
}

function drawMenuLine(text, x, y, selected, disabled) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.font = selected ? "bold 24px 'Courier New', monospace" : "22px 'Courier New', monospace";
  ctx.fillStyle = disabled ? "rgba(184,196,217,0.35)" : selected ? palette.gold : palette.ink;
  ctx.shadowColor = selected ? palette.gold : "transparent";
  ctx.shadowBlur = selected ? 12 : 0;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawToggle(x, y, on, selected) {
  ctx.save();
  ctx.fillStyle = on ? "rgba(80,242,143,0.25)" : "rgba(255,255,255,0.12)";
  ctx.strokeStyle = selected ? palette.gold : "rgba(255,255,255,0.24)";
  roundRect(x, y, 58, 26, 13, true, true);
  ctx.fillStyle = on ? palette.ok : "#8c96a8";
  circle(x + (on ? 43 : 15), y + 13, 9, true);
  ctx.restore();
}

function drawCard(x, y, w, h, title, unlocked) {
  ctx.save();
  ctx.fillStyle = unlocked ? "rgba(15,30,55,0.82)" : "rgba(15,18,28,0.82)";
  ctx.strokeStyle = unlocked ? "rgba(65,234,255,0.42)" : "rgba(255,255,255,0.14)";
  roundRect(x, y, w, h, 7, true, true);
  ctx.fillStyle = unlocked ? palette.ink : "rgba(184,196,217,0.42)";
  ctx.textAlign = "left";
  ctx.font = "bold 18px 'Courier New', monospace";
  ctx.fillText(title, x + 20, y + 39);
  if (!unlocked) {
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.strokeRect(x + w - 42, y + 21, 18, 18);
    line(x + w - 38, y + 21, x + w - 38, y + 13);
    line(x + w - 38, y + 13, x + w - 28, y + 13);
    line(x + w - 28, y + 13, x + w - 28, y + 21);
  }
  ctx.restore();
}

function drawTinyMaze(x, y, w, h, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(5,8,20,0.82)";
  roundRect(x, y, w, h, 8, true, false);
  ctx.strokeStyle = palette.neon;
  ctx.lineWidth = 3;
  const step = 22;
  for (let yy = y + 18; yy < y + h - 8; yy += step) line(x + 18, yy, x + w - 18, yy);
  for (let xx = x + 30; xx < x + w - 8; xx += step * 2) line(xx, y + 18, xx, y + h - 18);
  drawMiniPac(x + 72 + Math.sin(state.elapsed * 2) * 24, y + h / 2, 10, DIRS.right, palette.gold);
  drawGhostShape(x + w - 82, y + h / 2, palette.neon2);
  ctx.restore();
}

function drawGhostShape(x, y, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 2, 10, Math.PI, 0);
  ctx.lineTo(x + 10, y + 10);
  ctx.lineTo(x + 4, y + 7);
  ctx.lineTo(x, y + 10);
  ctx.lineTo(x - 4, y + 7);
  ctx.lineTo(x - 10, y + 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFlash() {
  if (state.flash <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(state.flash, 0, 0.62);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}

function drawWeatherOverlay() {
  if (!state.weather) return;
  if (state.weather.id === "rain") drawDataRain();
  if (state.weather.id === "fog") drawBitFog();
  if (state.weather.id === "heat") drawHeatwave();
  if (state.weather.id === "blizzard") drawPixelBlizzard();
  if (state.weather.id === "storm" && state.lightningWarn > 0) drawStormWarning();
}

function drawDataRain() {
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = palette.ok;
  ctx.font = "14px 'Courier New', monospace";
  dataRain.forEach((drop) => ctx.fillText(drop.char, drop.x, drop.y));
  ctx.restore();
}

function drawBitFog() {
  ctx.save();
  const grd = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 120, VIEW_W / 2, VIEW_H / 2, 540);
  grd.addColorStop(0, "rgba(184,196,217,0.02)");
  grd.addColorStop(1, "rgba(184,196,217,0.24)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}

function drawHeatwave() {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#ff7a38";
  for (let y = 0; y < VIEW_H; y += 22) {
    ctx.beginPath();
    for (let x = 0; x <= VIEW_W; x += 18) {
      const yy = y + Math.sin(state.elapsed * 7 + x * 0.04) * 4;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawPixelBlizzard() {
  ctx.save();
  ctx.globalAlpha = 0.46;
  ctx.fillStyle = "#ffffff";
  pixelStorm.forEach((px) => ctx.fillRect(px.x, px.y, px.size, px.size));
  ctx.fillStyle = "rgba(240,248,255,0.14)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}

function drawStormWarning() {
  ctx.save();
  const alpha = clamp(state.lightningWarn / 3, 0, 1) * (0.12 + Math.sin(state.elapsed * 18) * 0.08);
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.fillStyle = palette.gold;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
}

function drawAuroraBackground() {
  ctx.save();
  ctx.globalAlpha = 0.24;
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = [palette.ok, palette.purple, palette.neon, palette.neon2][i];
    ctx.lineWidth = 18;
    ctx.beginPath();
    for (let x = -40; x <= VIEW_W + 40; x += 32) {
      const y = 110 + i * 38 + Math.sin(state.elapsed * 0.8 + x * 0.012 + i) * 28;
      if (x === -40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function phaseBackgroundColor() {
  if (state.gridPhase?.id === "morning") return "#0b1c2d";
  if (state.gridPhase?.id === "evening") return "#160d24";
  if (state.gridPhase?.id === "night") return "#08081d";
  return "#0d1024";
}

function drawScanlines() {
  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#000";
  for (let y = 0; y < VIEW_H; y += 4) {
    ctx.fillRect(0, y, VIEW_W, 1);
  }
  ctx.restore();
}

function updatePointerHover() {
  if (!state.mouse.down) return;
  state.mouse.down = false;
  if (state.screen === "title") {
    openMenu();
  } else if (state.screen === "menu") {
    const index = Math.floor((state.mouse.y - 268) / 45);
    if (index >= 0 && index < MENU_ITEMS.length) {
      state.selected = index;
      activateMenu();
    }
  } else if (state.screen === "modes") {
    const index = Math.floor((state.mouse.y - 254) / 48);
    if (index >= 0 && index < MODES.length) {
      state.selectedMode = index;
      activateMode();
    }
  } else if (state.screen === "options") {
    const index = Math.floor((state.mouse.y - 220) / 58);
    if (index >= 0 && index < 5) {
      state.selectedOption = index;
      toggleOption();
    }
  } else if (state.screen === "pause") {
    const index = Math.floor((state.mouse.y - 394) / 34);
    if (index >= 0 && index < 4) {
      state.selected = index;
      activatePause();
    }
  }
}

function pressed(code) {
  return input.pressed.has(code);
}

function onKeyDown(event) {
  if (CONTROL_KEY_CODES.has(event.code)) {
    event.preventDefault();
    focusCanvas();
  }

  if (!input.keys.has(event.code)) input.pressed.add(event.code);
  input.keys.add(event.code);

  const dir = keyToDir(event.code);
  if (dir) {
    rememberDirectionKey(event.code);
  }

  if (event.code === "Enter") {
    sounds.ensure();
    if (state.screen === "title") openMenu();
    else if (state.screen === "report") openMenu();
    else if (state.screen === "menu") activateMenu();
    else if (state.screen === "modes") activateMode();
    else if (state.screen === "options") toggleOption();
    else if (state.screen === "complete") {
      advanceAfterComplete();
    } else if (state.screen === "pause") activatePause();
  }

  if (event.code === "Escape") {
    if (state.screen === "playing") {
      state.screen = "pause";
      state.selected = 0;
    } else if (state.screen === "report") {
      state.screen = "title";
    } else if (state.screen === "pause") {
      state.screen = "playing";
    } else if (["options", "gallery", "modes"].includes(state.screen)) {
      state.screen = state.lastScreen || "menu";
      state.selected = 0;
    }
  }

  if (event.code === "KeyP" && state.screen === "playing") {
    state.screen = "pause";
    state.selected = 0;
  }

  if (state.screen === "menu") navigateVertical(event, MENU_ITEMS.length, "selected");
  if (state.screen === "modes") navigateVertical(event, MODES.length, "selectedMode");
  if (state.screen === "options") navigateVertical(event, 5, "selectedOption");
  if (state.screen === "pause") navigateVertical(event, 4, "selected");
}

function onKeyUp(event) {
  input.keys.delete(event.code);
  releaseDirectionKey(event.code);
}

function navigateVertical(event, count, key) {
  if (event.code === "ArrowUp" || event.code === "KeyW") {
    state[key] = (state[key] - 1 + count) % count;
    sounds.beep(420, 0.035, "square", 0.025);
  }
  if (event.code === "ArrowDown" || event.code === "KeyS") {
    state[key] = (state[key] + 1) % count;
    sounds.beep(460, 0.035, "square", 0.025);
  }
}

function keyToDir(code) {
  return DIRECTION_KEYS[code] || null;
}

function openMenu() {
  state.screen = "menu";
  state.selected = 0;
  sounds.beep(760, 0.08, "triangle", 0.04);
}

function activateMenu() {
  sounds.beep(720, 0.055, "triangle", 0.035);
  const item = MENU_ITEMS[state.selected];
  if (item === "NUOVA PARTITA" || item === "CONTINUA") {
    state.selectedMode = 0;
    state.runLevel = 1;
    resetGame();
    state.screen = "playing";
    focusCanvas();
  } else if (item === "MODALITA") {
    state.lastScreen = "menu";
    state.screen = "modes";
  } else if (item === "OPZIONI") {
    state.lastScreen = "menu";
    state.screen = "options";
  } else if (item === "GALLERIA") {
    state.lastScreen = "menu";
    state.screen = "gallery";
  } else if (item === "ESCI") {
    state.screen = "title";
    state.titleBuilt = 0;
  }
}

function activateMode() {
  state.runLevel = 1;
  resetGame();
  state.screen = "playing";
  focusCanvas();
}

function toggleOption() {
  sounds.beep(640, 0.04, "triangle", 0.035);
  if (state.selectedOption === 0) state.scanlines = !state.scanlines;
  if (state.selectedOption === 1) state.reducedMotion = !state.reducedMotion;
  if (state.selectedOption === 2) state.highContrast = !state.highContrast;
  if (state.selectedOption === 3) sounds.enabled = !sounds.enabled;
  if (state.selectedOption === 4) state.tutorialMode = state.tutorialMode === "smart" ? "off" : "smart";
}

function activatePause() {
  if (state.selected === 0) state.screen = "playing";
  if (state.selected === 1) {
    state.lastScreen = "pause";
    state.screen = "options";
  }
  if (state.selected === 2) {
    resetGame();
    state.screen = "playing";
  }
  if (state.selected === 3) state.screen = "menu";
}

function pointerToView(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left - offsetX) / scale;
  const y = (event.clientY - rect.top - offsetY) / scale;
  return { x, y };
}

function onPointerDown(event) {
  focusCanvas();
  const pos = pointerToView(event);
  state.mouse.x = pos.x;
  state.mouse.y = pos.y;
  state.mouse.down = true;
}

function onTouchStart(event) {
  if (event.touches.length !== 1) return;
  const touch = event.touches[0];
  onPointerDown(touch);
  event.preventDefault();
}

function onTouchMove(event) {
  if (state.screen !== "playing" || event.touches.length !== 1) return;
  const touch = event.touches[0];
  const pos = pointerToView(touch);
  const dx = pos.x - tileToPx(pac.x);
  const dy = pos.y - tileToPy(pac.y);
  if (Math.abs(dx) > Math.abs(dy)) setWantedDirection(dx < 0 ? DIRS.left : DIRS.right);
  else setWantedDirection(dy < 0 ? DIRS.up : DIRS.down);
  event.preventDefault();
}

function formatTime(value) {
  const m = Math.floor(value / 60);
  const s = Math.floor(value % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function padScore(value) {
  return String(Math.floor(value)).padStart(8, "0");
}

function scoreRank() {
  const score = state.score;
  if (score >= 18000) return "S";
  if (score >= 12000) return "A";
  if (score >= 8000) return "B";
  if (score >= 4500) return "C";
  return "D";
}

function comboColor(mult) {
  if (mult >= 8) return pulseColor("#ff4c65", palette.gold, 0.5 + 0.5 * Math.sin(state.elapsed * 8));
  if (mult >= 6) return palette.gold;
  if (mult >= 4) return palette.purple;
  if (mult >= 2) return palette.ok;
  return palette.ink;
}

function pulseColor(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return `rgb(${Math.round(lerp(ca.r, cb.r, t))},${Math.round(lerp(ca.g, cb.g, t))},${Math.round(lerp(ca.b, cb.b, t))})`;
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function roundRect(x, y, w, h, r, fill, stroke) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function circle(x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) ctx.fill();
  else ctx.stroke();
}

function star(x, y, outer, inner, points) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function triangle(x1, y1, x2, y2, x3, y3) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function arc(x, y, r, a, b) {
  ctx.beginPath();
  ctx.arc(x, y, r, a, b);
  ctx.stroke();
}

function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function distance(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function randomChoice(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function installDebugApi() {
  const api = {
    palette,
    modes: MODES,
    modeRules: MODE_RULES,
    state,
    pac,
    ghosts,
    input,
    reset: () => resetGame(),
    startMode(mode) {
      const index = typeof mode === "number" ? mode : MODES.findIndex((name) => name.toLowerCase() === String(mode).toLowerCase());
      if (index < 0 || index >= MODES.length) return false;
      state.selectedMode = index;
      activateMode();
      return true;
    },
  };

  pallet = palette;
  window.UltraPac = api;
  window.palette = palette;
  window.pallet = palette;
}

window.addEventListener("resize", resize);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.addEventListener("blur", clearInput);
window.addEventListener("beforeunload", saveStats);
canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("touchstart", onTouchStart, { passive: false });
canvas.addEventListener("touchmove", onTouchMove, { passive: false });

installDebugApi();
focusCanvas();
boot();
