document.addEventListener("DOMContentLoaded", function () {
  // Contenedor del ranking
  const rankingContainer = document.getElementById("rankingContainer");

  // Función para cargar y renderizar el ranking
  function cargarRanking() {
    // 1️⃣ Obtener ranking de jugadores desde el backend
    fetch("http://127.0.0.1:5000/ranking")
      .then((response) => response.json())
      .then(async (players) => {
        // 2️⃣ Obtener nombres de países desde el backend
        const resCountries = await fetch("http://127.0.0.1:5000/countries");
        const paisesArray = await resCountries.json();

        // Convertir array de países a un objeto para búsqueda rápida
        const paisesMap = {};
        paisesArray.forEach((p) => {
          const key = Object.keys(p)[0];
          paisesMap[key] = p[key];
        });

        // Limpiar ranking previo
        rankingContainer.innerHTML = "";

        // Ordenar jugadores por puntaje descendente
        players.sort((a, b) => b.score - a.score);

        // Renderizar cada jugador
        players.forEach((player, index) => {
          const countryName =
            paisesMap[player.country_code] || player.country_code;

          const row = document.createElement("div");
          row.className = "ranking-row";
          row.innerHTML = `
            <span class="rank">${index + 1}</span>
            <span class="nickname">${player.nick_name}</span>
            <span class="score">${player.score}</span>
            <span class="country">
              <img src="https://flagsapi.com/${player.country_code.toUpperCase()}/shiny/64.png" alt="${countryName}">
            </span>
            <span class="country-name">${countryName}</span>
          `;
          rankingContainer.appendChild(row);
        });
      })
      .catch((error) => console.error("Error al cargar el ranking:", error));
  }

  // Cargar ranking al inicio
  cargarRanking();

  // Opcional: Exponer función global si quieres recargar desde un botón
  window.cargarRanking = cargarRanking;
});
