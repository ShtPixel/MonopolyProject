// Controlador para lanzar dados Monopoly

const el = {
  rollBtn: document.getElementById("rollBtn"),
  die1: document.getElementById("die1"),
  die2: document.getElementById("die2"),
  sumLabel: document.getElementById("sumLabel"),
  debug: document.getElementById("debugDice"),
};

const rand = () => 1 + Math.floor(Math.random() * 6);

const parseDebug = (s) => {
  if (!s) return null;
  const v = s.split(",").map((t) => parseInt(t.trim(), 10));
  return v.length === 2 && v.every((n) => n >= 1 && n <= 6) ? v : null;
};

function renderSum([a, b]) {
  el.sumLabel.textContent = `Suma: ${a + b}`;
}

function updateDiceVisual([a, b]) {
  el.die1.textContent = a;
  el.die2.textContent = b;
}

function roll() {
  const dbg = parseDebug(el.debug.value);
  const d = dbg ?? [rand(), rand()];
  renderSum(d);
  updateDiceVisual(d);

  // Aquí puedes agregar lógica para mover la ficha del jugador según la suma
}

el.rollBtn?.addEventListener("click", roll);
el.debug?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") roll();
});
