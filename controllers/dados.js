// controllers/dados.js
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
  // Actualizar los valores de los dados en las etiquetas
  el.die1.setAttribute("data-value", a);
  el.die2.setAttribute("data-value", b);

  // Añadir la animación de "sacudida" a los dados
  el.die1.classList.add("shake");
  el.die2.classList.add("shake");

  // Eliminar la animación después de 0.8 segundos
  setTimeout(() => {
    el.die1.classList.remove("shake");
    el.die2.classList.remove("shake");
  }, 800);
}

function roll() {
  const dbg = parseDebug(el.debug.value);
  const d = dbg ?? [rand(), rand()];
  renderSum(d);
  updateDiceVisual(d);

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
