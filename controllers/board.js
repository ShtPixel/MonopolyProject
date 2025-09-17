// controllers/board.js
const API = "http://127.0.0.1:5000";
const el = {
  board: document.getElementById("board"),
  rollBtn: document.getElementById("rollBtn"),
  debug: document.getElementById("debugDice"),
  sumLabel: document.getElementById("sumLabel"),
};

const players = [
  { id: 1, name: "Jugador 1", position: 0, color: "red" },
  { id: 2, name: "Jugador 2", position: 0, color: "blue" },
];

// --- Mapeo 0..39 → (row, col) en grid 11x11 (bordes)
function idxToRC(i) {
  const N = 11,
    L = N - 1;
  if (i <= L) return { r: L, c: L - i }; // abajo (der→izq)
  if (i <= 2 * L) {
    const k = i - L;
    return { r: L - k, c: 0 };
  } // izq (abajo→arriba)
  if (i <= 3 * L) {
    const k = i - 2 * L;
    return { r: 0, c: k };
  } // arriba (izq→der)
  const k = i - 3 * L;
  return { r: k, c: L }; // derecha (arriba→abajo)
}

// --- Mover jugador en el tablero
function movePlayer(steps) {
  const player = players[0]; // Suponiendo que es el turno del primer jugador (cámbialo según el turno)
  player.position = (player.position + steps) % 40; // Las casillas están numeradas de 0 a 39
  updatePlayerPosition(player);
}

// --- Actualizar la posición de la ficha en el tablero
function updatePlayerPosition(player) {
  const playerDiv = document.getElementById(`player-${player.id}`);
  const targetCell = document.querySelectorAll(".cell")[player.position];
  const { r, c } = idxToRC(player.position);

  // Posicionar la ficha en la nueva casilla
  playerDiv.style.gridRowStart = r + 1;
  playerDiv.style.gridColumnStart = c + 1;
}

// --- Dados: random o debug
function roll() {
  const dbg = parseDebug(el.debug.value);
  const d = dbg ?? [rand(), rand()];
  renderSum(d);

  // Emitir un evento con la suma de los dados
  const event = new CustomEvent("dice:rolled", {
    detail: { dice: d, sum: d[0] + d[1] },
  });
  window.dispatchEvent(event);
}

el.rollBtn?.addEventListener("click", roll);
el.debug?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") roll();
});

// Escuchar el evento dice:rolled
window.addEventListener("dice:rolled", (e) => {
  const { sum } = e.detail;
  movePlayer(sum);
});
