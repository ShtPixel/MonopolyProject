// Esperar a que el DOM se cargue completamente
document.addEventListener("DOMContentLoaded", function () {
  const die1 = document.getElementById("die1");
  const die2 = document.getElementById("die2");
  const sumLabel = document.getElementById("sumLabel");
  const debugDice = document.getElementById("debugDice");

  // Función para lanzar los dados y mostrar el resultado
  function rollDice() {
    let val1, val2;
    const debug = debugDice.value.trim();

    if (debug) {
      // Modo de depuración
      const parts = debug.split(",").map((x) => parseInt(x, 10));
      if (
        parts.length === 2 &&
        parts.every((n) => Number.isInteger(n) && n >= 1 && n <= 6)
      ) {
        val1 = parts[0];
        val2 = parts[1];
      } else {
        alert("Ingrese dos números entre 1 y 6, separados por coma.");
        return;
      }
    } else {
      // Generar números aleatorios para los dados
      val1 = Math.floor(Math.random() * 6) + 1;
      val2 = Math.floor(Math.random() * 6) + 1;
    }

    // Actualizar los dados con los valores generados
    die1.textContent = val1;
    die2.textContent = val2;

    // Mostrar la suma de los dados
    sumLabel.textContent = "Suma: " + (val1 + val2);
  }

  // Asignar el evento de clic al botón "Lanzar Dados"
  const rollDiceButton = document.getElementById("rollDiceButton");
  rollDiceButton.addEventListener("click", rollDice);

  // También permitir el lanzamiento de los dados presionando Enter en el campo de depuración
  debugDice.addEventListener("keydown", function (e) {
    if (e.key === "Enter") rollDice();
  });
});
