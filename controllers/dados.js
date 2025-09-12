// controllers/dados.js
let jugadorActual = 1; // ejemplo de jugador en turno

function lanzarDados() {
  const dado1El = document.getElementById("dado1");
  const dado2El = document.getElementById("dado2");

  // Entradas del usuario
  let dado1 =
    parseInt(document.getElementById("dado1Input").value) ||
    Math.floor(Math.random() * 6) + 1;
  let dado2 =
    parseInt(document.getElementById("dado2Input").value) ||
    Math.floor(Math.random() * 6) + 1;

  // Asegurar valores entre 1 y 6
  dado1 = Math.min(6, Math.max(1, dado1));
  dado2 = Math.min(6, Math.max(1, dado2));

  // Animación inicial
  dado1El.classList.add("rolling");
  dado2El.classList.add("rolling");

  // Retraso para mostrar resultado después de animar
  setTimeout(() => {
    dado1El.classList.remove("rolling");
    dado2El.classList.remove("rolling");

    dado1El.textContent = getEmoji(dado1);
    dado2El.textContent = getEmoji(dado2);

    const suma = dado1 + dado2;
    document.getElementById(
      "resultadoDados"
    ).innerText = `Jugador ${jugadorActual} sacó ${dado1} y ${dado2} → Total: ${suma}`;

    moverFicha(jugadorActual, suma);
  }, 600);
}

// Función auxiliar: devuelve un emoji representando la cara del dado
function getEmoji(valor) {
  const caras = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  return caras[valor];
}

// Ejemplo de función para mover fichas (puedes personalizar con tu lógica)
function moverFicha(jugador, pasos) {
  console.log(`Mover la ficha del jugador ${jugador} ${pasos} pasos.`);
}
