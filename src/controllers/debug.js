// Debug utilities for Monopoly game
class GameDebugger {
  static testPropertyMechanics() {
    console.log("=== TESTING PROPERTY MECHANICS ===");
    // ...rest of property mechanics test code...
  }

  static testAllGameMechanics() {
    console.log("=== TESTING ALL GAME MECHANICS ===");

    // Ejecutar todas las pruebas en secuencia
    this.testPropertyMechanics();

    setTimeout(() => {
      this.testCardActions();
    }, 2000);

    setTimeout(() => {
      console.log("=== ALL TESTS COMPLETE ===");
    }, 5000);
  }

  static testEndGame() {
    console.log("=== TESTING END GAME ===");

    if (window.gameInstance) {
      // Modificar estadísticas de jugadores para hacer la prueba más interesante
      window.gameInstance.players.forEach((player, index) => {
        player.money = 1500 - index * 300; // Diferentes cantidades de dinero
        player.properties = Math.floor(Math.random() * 10); // Propiedades aleatorias
        if (index === window.gameInstance.players.length - 1) {
          player.money = -200; // Último jugador en bancarrota
        }
      });

      console.log("Modified player stats for testing");
      console.log(
        "Players:",
        window.gameInstance.players.map((p) => ({
          name: p.username,
          money: p.money,
          properties: p.properties.length,
        }))
      );

      // Simular finalización del juego
      window.gameInstance.finalizeGame();
    } else {
      console.log("Game instance not available");
    }
  }

  static testCornerElements() {
    console.log("=== CORNER ELEMENTS DEBUG ===");

    const cornerPositions = [0, 10, 20, 30]; // GO, Jail, Parking, Go to Jail
    const cornerNames = ["GO", "Jail", "Free Parking", "Go to Jail"];

    cornerPositions.forEach((pos, index) => {
      console.log(
        `\n--- Testing Corner ${cornerNames[index]} (Position ${pos}) ---`
      );

      const element = document.getElementById(`cell-${pos}`);
      if (element) {
        console.log(`✓ Element found: ${element.id}`);
        console.log(`  Classes: ${element.className}`);
        console.log(
          `  Has corner-space: ${
            element.querySelector(".corner-space") ? "Yes" : "No"
          }`
        );
        console.log(
          `  Has players-container: ${
            element.querySelector(".players-container") ? "Yes" : "No"
          }`
        );
        console.log(`  Position style: ${element.style.position || "default"}`);

        // Test if we can place a player here
        const testPlayer = document.createElement("div");
        testPlayer.className = "player-piece test-player";
        testPlayer.style.backgroundColor = "#ff0000";
        testPlayer.innerHTML = '<div class="player-icon">T</div>';

        let playersContainer = element.querySelector(".players-container");
        if (!playersContainer) {
          playersContainer = document.createElement("div");
          playersContainer.className = "players-container";
          element.appendChild(playersContainer);
          console.log("  Created new players-container");
        }

        playersContainer.appendChild(testPlayer);
        console.log("  ✓ Test player placed successfully");

        // Remove test player after 3 seconds
        setTimeout(() => {
          if (testPlayer.parentNode) {
            testPlayer.parentNode.removeChild(testPlayer);
            console.log(`  Test player removed from position ${pos}`);
          }
        }, 3000);
      } else {
        console.log(`✗ Element NOT found for position ${pos}`);
      }
    });
  }

  static logBoardState() {
    console.log("=== BOARD DEBUG INFO ===");

    const spaces = document.querySelectorAll(".space");
    console.log(`Total spaces found: ${spaces.length}`);

    // Log first few spaces for verification
    for (let i = 0; i < Math.min(5, spaces.length); i++) {
      console.log(`Space ${i}:`, spaces[i]);
    }

    if (window.boardControllerInstance) {
      console.log(
        "BoardController instance available:",
        window.boardControllerInstance
      );
    } else {
      console.log("BoardController instance NOT available");
    }

    if (window.gameInstance) {
      console.log("Game instance available:", window.gameInstance);
      console.log("Players:", window.gameInstance.players);
    } else {
      console.log("Game instance NOT available");
    }
  }

  static testPlayerMovement(playerIndex = 0, steps = 5) {
    if (window.gameInstance && window.gameInstance.players[playerIndex]) {
      const player = window.gameInstance.players[playerIndex];
      console.log(`Testing movement for player ${player.username}`);
      console.log(`Current position: ${player.position}`);

      player.moveBy(steps);

      console.log(`New position: ${player.position}`);
    } else {
      console.log("No players available for testing");
    }
  }

  static logGameState() {
    console.log("=== GAME STATE ===");
    if (window.gameInstance) {
      console.log("Game active:", window.gameInstance.isGameActive);
      console.log(
        "Current player index:",
        window.gameInstance.currentPlayerIndex
      );
      console.log(
        "Current player:",
        window.gameInstance.getCurrentPlayer().username
      );
      window.gameInstance.players.forEach((player, index) => {
        console.log(
          `Player ${index}: ${player.username} at position ${player.position}`
        );
      });
    }
  }

  static simulateGame() {
    console.log("Starting game simulation...");

    // Wait for game to be ready
    setTimeout(() => {
      if (window.gameInstance) {
        // Simulate dice rolls for testing
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const diceValue =
              Math.floor(Math.random() * 6) +
              1 +
              Math.floor(Math.random() * 6) +
              1;
            document.getElementById(
              "sumLabel"
            ).textContent = `Suma: ${diceValue}`;
            console.log(`Simulated dice roll: ${diceValue}`);

            // Trigger game dice roll
            window.gameInstance.handleDiceRoll();
          }, i * 3000);
        }
      }
    }, 1000);
  }
}

// Expose to window for console access
window.GameDebugger = GameDebugger;

// Add debug buttons using only CSS classes for styling
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const buttons = [
      {
        text: "Debug Board",
        class: "debug-btn debug-btn-secondary",
        bottom: "20px",
        handler: GameDebugger.logBoardState,
      },
      {
        text: "Debug Corners",
        class: "debug-btn debug-btn-info",
        bottom: "70px",
        handler: GameDebugger.testCornerElements,
      },
      {
        text: "Simulate Game",
        class: "debug-btn debug-btn-warning",
        bottom: "120px",
        handler: GameDebugger.simulateGame,
      },
      {
        text: "Test End Game",
        class: "debug-btn debug-btn-danger",
        bottom: "170px",
        handler: GameDebugger.testEndGame,
      },
      {
        text: "Test Mechanics",
        class: "debug-btn debug-btn-info",
        bottom: "220px",
        handler: GameDebugger.testAllGameMechanics,
      },
    ];
    buttons.forEach((btn) => {
      const button = document.createElement("button");
      button.textContent = btn.text;
      button.className = btn.class;
      button.style.position = "fixed";
      button.style.left = "20px";
      button.style.bottom = btn.bottom;
      button.style.zIndex = "1000";
      button.onclick = btn.handler;
      document.body.appendChild(button);
    });
  }, 2000);
});
