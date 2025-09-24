// controllers/board.js
// board.js - Controlador principal del tablero Monopoly (SRP)

// --- Configuración de elementos y estado ---
const el = {
  board: document.getElementById("board"),
  rollBtn: document.getElementById("rollBtn"),
  debug: document.getElementById("debugDice"),
  sumLabel: document.getElementById("sumLabel"),
  die1: document.getElementById("die1"),
  die2: document.getElementById("die2"),
};

const players = [
  { id: 1, name: "Jugador 1", position: 0 },
  { id: 2, name: "Jugador 2", position: 0 },
];

// --- Utilidades de dados ---
function rand() {
  return Math.floor(Math.random() * 6) + 1;
}

function parseDebug(val) {
  if (!val || !val.trim()) return null;
  const nums = val.split(",").map((x) => parseInt(x.trim()));
  return nums.length === 2 && nums.every((n) => n >= 1 && n <= 6) ? nums : null;
}

function renderSum(dice) {
  const diceSymbols = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  if (el.die1 && el.die2) {
    el.die1.classList.add("rolling");
    el.die2.classList.add("rolling");
    setTimeout(() => {
      el.die1.textContent = diceSymbols[dice[0] - 1];
      el.die2.textContent = diceSymbols[dice[1] - 1];
      el.die1.classList.remove("rolling");
      el.die2.classList.remove("rolling");
    }, 500);
  }
  if (el.sumLabel) {
    el.sumLabel.textContent = `Suma: ${dice[0] + dice[1]}`;
  }
}

// --- Layout del tablero (CSS Grid) ---
const boardLayout = {
  0: { row: 11, col: 11 },
  10: { row: 11, col: 1 },
  20: { row: 1, col: 1 },
  30: { row: 1, col: 11 },
  1: { row: 11, col: 10 },
  2: { row: 11, col: 9 },
  3: { row: 11, col: 8 },
  4: { row: 11, col: 7 },
  5: { row: 11, col: 6 },
  6: { row: 11, col: 5 },
  7: { row: 11, col: 4 },
  8: { row: 11, col: 3 },
  9: { row: 11, col: 2 },
  11: { row: 10, col: 1 },
  12: { row: 9, col: 1 },
  13: { row: 8, col: 1 },
  14: { row: 7, col: 1 },
  15: { row: 6, col: 1 },
  16: { row: 5, col: 1 },
  17: { row: 4, col: 1 },
  18: { row: 3, col: 1 },
  19: { row: 2, col: 1 },
  21: { row: 1, col: 2 },
  22: { row: 1, col: 3 },
  23: { row: 1, col: 4 },
  24: { row: 1, col: 5 },
  25: { row: 1, col: 6 },
  26: { row: 1, col: 7 },
  27: { row: 1, col: 8 },
  28: { row: 1, col: 9 },
  29: { row: 1, col: 10 },
  31: { row: 2, col: 11 },
  32: { row: 3, col: 11 },
  33: { row: 4, col: 11 },
  34: { row: 5, col: 11 },
  35: { row: 6, col: 11 },
  36: { row: 7, col: 11 },
  37: { row: 8, col: 11 },
  38: { row: 9, col: 11 },
  39: { row: 10, col: 11 },
};

function updatePlayerPosition(player) {
  const playerDiv = document.getElementById(`player-${player.id}`);
  const position = boardLayout[player.position];
  if (position && playerDiv) {
    playerDiv.style.gridRow = position.row;
    playerDiv.style.gridColumn = position.col;
    playerDiv.style.zIndex = 20;
  }
}

function movePlayer(steps) {
  // Suponiendo turno del primer jugador (puedes adaptar a turnos reales)
  const player = players[0];
  player.position = (player.position + steps) % 40;
  updatePlayerPosition(player);
}

// --- Lanzamiento de dados y eventos ---
function roll() {
  const dbg = parseDebug(el.debug.value);
  const d = dbg ?? [rand(), rand()];
  renderSum(d);
  // Emitir evento para mover jugador
  const event = new CustomEvent("dice:rolled", {
    detail: { dice: d, sum: d[0] + d[1] },
  });
  window.dispatchEvent(event);
}

if (el.rollBtn) el.rollBtn.addEventListener("click", roll);
if (el.debug)
  el.debug.addEventListener("keydown", (e) => {
    if (e.key === "Enter") roll();
  });

window.addEventListener("dice:rolled", (e) => {
  const { sum } = e.detail;
  movePlayer(sum);
});

// --- Inicialización de tablero y UI ---
document.addEventListener("DOMContentLoaded", function () {
  // Layout de celdas
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    const position = cell.getAttribute("data-position");
    if (position && boardLayout[position]) {
      const layout = boardLayout[position];
      cell.style.gridRow = layout.row;
      cell.style.gridColumn = layout.col;
    }
  });
  // Posicionar jugadores en GO
  const player1 = document.getElementById("player-1");
  const player2 = document.getElementById("player-2");
  if (player1) {
    player1.style.gridRow = "11";
    player1.style.gridColumn = "11";
    player1.style.margin = "2px 2px 2px 15px";
  }
  if (player2) {
    player2.style.gridRow = "11";
    player2.style.gridColumn = "11";
    player2.style.margin = "15px 2px 2px 2px";
  }
  // Navbar y menú móvil
  const hamburger = document.getElementById("hamburger");
  const navCenter = document.getElementById("nav-center");
  if (hamburger && navCenter) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navCenter.classList.toggle("active");
    });
    document.querySelectorAll(".nav-link-modern").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navCenter.classList.remove("active");
      });
    });
  }
  // Dropdown
  const dropdownToggle = document.getElementById("dropdown-toggle");
  const dropdownMenu = document.getElementById("dropdown-menu");
  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener("click", (e) => {
      e.preventDefault();
      dropdownMenu.style.display =
        dropdownMenu.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".dropdown")) {
        dropdownMenu.style.display = "none";
      }
    });
  }
  // Debug input toggle (Ctrl+Shift+D)
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && e.key === "D") {
      const debugInput = document.getElementById("debugDice");
      debugInput.style.display =
        debugInput.style.display === "none" ? "block" : "none";
      debugInput.style.position = "absolute";
      debugInput.style.top = "100px";
      debugInput.style.left = "10px";
      debugInput.style.zIndex = "9999";
      debugInput.style.padding = "5px";
      debugInput.style.border = "2px solid red";
      if (debugInput.style.display === "block") {
        debugInput.focus();
      }
    }
  });
});
