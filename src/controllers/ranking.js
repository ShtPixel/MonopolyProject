document.addEventListener("DOMContentLoaded", function () {
  // Selecciona el tbody de la tabla
  const rankingBody = document.getElementById("rankingBody");

  function cargarRanking() {
    fetch("http://127.0.0.1:5000/ranking")
      .then((response) => response.json())
      .then(async (players) => {
        const resCountries = await fetch("http://127.0.0.1:5000/countries");
        const paisesArray = await resCountries.json();

        // Mapea los países para búsqueda rápida
        const paisesMap = {};
        paisesArray.forEach((p) => {
          const key = Object.keys(p)[0];
          paisesMap[key] = p[key];
        });

        // Limpia el ranking previo
        rankingBody.innerHTML = "";

        // Ordena jugadores por puntaje descendente
        players.sort((a, b) => b.score - a.score);

        // Renderiza cada jugador como fila de tabla
        players.forEach((player, index) => {
          const countryName =
            paisesMap[player.country_code] || player.country_code;
          let rankClass = "";
          if (index === 0) rankClass = "rank-1";
          else if (index === 1) rankClass = "rank-2";
          else if (index === 2) rankClass = "rank-3";

          const tr = document.createElement("tr");
          tr.innerHTML = `
            <th class="rank ${rankClass}" scope="row">${index + 1}</th>
            <td class="nickname">${player.nick_name}</td>
            <td class="score">${player.score}</td>
            <td class="country-name">${countryName}</td>
            <td>
              <img src="https://flagsapi.com/${player.country_code.toUpperCase()}/shiny/64.png" alt="${countryName}" class="img-fluid">
            </td>
          `;
          rankingBody.appendChild(tr);
        });
      })
      .catch((error) => console.error("Error al cargar el ranking:", error));
  }

  cargarRanking();
  window.cargarRanking = cargarRanking;
});
