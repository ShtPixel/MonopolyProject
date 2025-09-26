// Esperar a que el DOM se cargue completamente
document.addEventListener("DOMContentLoaded", function () {
  const die1 = document.getElementById("die1");
  const die2 = document.getElementById("die2");
  const sumLabel = document.getElementById("sumLabel");
  const debugDice = document.getElementById("debugDice");
  const rollDiceButton = document.getElementById("rollDiceButton");

  // Estructura mínima de jugadores y tablero
  window.jugadores = window.jugadores || [
    { nombre: "Jugador 1", position: 0, fichaId: "ficha-jugador-1" },
    // ...otros jugadores
  ];
  window.jugadorActual = window.jugadorActual || 0; // Índice del jugador actual
  const totalCasillas = 40; // Cambia según tu tablero

  function animateDice() {
    die1.classList.add("animate");
    die2.classList.add("animate");
    setTimeout(() => {
      die1.classList.remove("animate");
      die2.classList.remove("animate");
    }, 500);
  }

  function animateInput() {
    debugDice.classList.add("animate");
    setTimeout(() => {
      debugDice.classList.remove("animate");
    }, 500);
  }

  function moverFichaJugadorActual(suma) {
    // Esta función ahora es manejada por el sistema Game
    // Solo mantenemos el log para compatibilidad
    console.log(`Dice rolled: ${suma} - Movement handled by Game controller`);
  }

  // Función para lanzar los dados y mostrar el resultado
  function rollDice() {
    let suma;
    const debug = debugDice.value.trim();

    if (debug) {
      suma = parseInt(debug, 10);
      if (isNaN(suma) || suma < 1 || suma > 40) {
        alert("Ingrese un número entre 1 y 40.");
        animateInput();
        return;
      }
      // Distribuye la suma en dos dados válidos solo visualmente
      let val1 = Math.max(1, Math.min(6, suma - 1));
      let val2 = suma - val1;
      if (val2 < 1 || val2 > 6) val2 = Math.max(1, Math.min(6, suma - val1));
      die1.textContent = val1;
      die2.textContent = val2;
      renderDieSVG(document.getElementById("die1"), val1);
      renderDieSVG(document.getElementById("die2"), val2);
    } else {
      const val1 = Math.floor(Math.random() * 6) + 1;
      const val2 = Math.floor(Math.random() * 6) + 1;
      suma = val1 + val2;
      die1.textContent = val1;
      die2.textContent = val2;
      renderDieSVG(document.getElementById("die1"), val1);
      renderDieSVG(document.getElementById("die2"), val2);
    }

    animateDice();
    sumLabel.textContent = "Suma: " + suma;
    moverFichaJugadorActual(suma);
    
    // Llamar al sistema de juego después de un breve delay para la animación
    setTimeout(() => {
      if (window.gameHandleDiceRoll && typeof window.gameHandleDiceRoll === 'function') {
        window.gameHandleDiceRoll();
      }
    }, 600);
  }

  // Asignar el evento de clic al botón "Lanzar Dados"
  rollDiceButton.addEventListener("click", rollDice);

  // También permitir el lanzamiento de los dados presionando Enter en el campo de depuración
  debugDice.addEventListener("keydown", function (e) {
    if (e.key === "Enter") rollDice();
  });

  function renderDieSVG(container, value) {
    const dots = [
      [],
      [[24, 24]],
      [
        [12, 12],
        [36, 36],
      ],
      [
        [12, 12],
        [24, 24],
        [36, 36],
      ],
      [
        [12, 12],
        [12, 36],
        [36, 12],
        [36, 36],
      ],
      [
        [12, 12],
        [12, 36],
        [24, 24],
        [36, 12],
        [36, 36],
      ],
      [
        [12, 12],
        [12, 24],
        [12, 36],
        [36, 12],
        [36, 24],
        [36, 36],
      ],
    ];
    let svg = `<svg width="48" height="48" viewBox="0 0 48 48">`;
    svg += `<rect x="2" y="2" width="44" height="44" rx="10" fill="#fff" stroke="#43cea2" stroke-width="3"/>`;
    dots[value].forEach(([cx, cy]) => {
      svg += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="#222"/>`;
    });
    svg += `</svg>`;
    container.innerHTML = svg;
  }
});
