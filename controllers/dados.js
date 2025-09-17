// Función para lanzar los dados y mostrar el resultado
function rollDice() {
  // Generar un número aleatorio entre 1 y 6 para cada dado
  let die1Value = Math.floor(Math.random() * 6) + 1;
  let die2Value = Math.floor(Math.random() * 6) + 1;

  // Mostrar el valor en los elementos correspondientes
  document.getElementById("die1").textContent = getDiceEmoji(die1Value);
  document.getElementById("die2").textContent = getDiceEmoji(die2Value);
}

// Función para convertir el número en un emoji de dado
function getDiceEmoji(number) {
  const diceEmojis = {
    1: "⚀",
    2: "⚁",
    3: "⚂",
    4: "⚃",
    5: "⚄",
    6: "⚅",
  };
  return diceEmojis[number];
}

// Asignar la función rollDice al botón de lanzar dados
document.getElementById("rollDiceButton").addEventListener("click", rollDice);
