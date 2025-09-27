class Game {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.boardController = null;
        this.isGameActive = false;
        this.initializeGame();
    }

    async initializeGame() {
        // Cargar datos de jugadores del localStorage
        const playersData = JSON.parse(localStorage.getItem('playersData') || '[]');
        
        if (playersData.length < 2) {
            alert('Se necesitan al menos 2 jugadores para jugar');
            window.location.href = 'login.html';
            return;
        }

        // Crear objetos Player
        playersData.forEach(playerData => {
            const player = new Player(playerData);
            this.players.push(player);
        });

        // Esperar a que el tablero esté listo
        await this.waitForBoard();
        
        // Colocar fichas en el tablero
        this.placePiecesOnBoard();
        
        // Crear panel de información de jugadores
        this.createPlayerInfoPanel();
        
        // Iniciar el juego
        this.startGame();
    }

    async waitForBoard() {
        return new Promise((resolve) => {
            const checkBoard = () => {
                const boardSpaces = document.querySelectorAll('.space');
                if (boardSpaces.length > 0) {
                    resolve();
                } else {
                    setTimeout(checkBoard, 100);
                }
            };
            checkBoard();
        });
    }

    placePiecesOnBoard() {
        this.players.forEach(player => {
            player.placeOnBoard();
        });
    }

    createPlayerInfoPanel() {
        const existingPanel = document.getElementById('player-info-panel');
        if (existingPanel) {
            existingPanel.remove();
        }

        const panel = document.createElement('div');
        panel.id = 'player-info-panel';
        panel.className = 'player-info-panel';
        panel.innerHTML = `
            <h3>Información de Jugadores</h3>
            <div id="players-list"></div>
            <div class="current-player-indicator">
                Turno de: <span id="current-player-name"></span>
            </div>
        `;

        document.body.appendChild(panel);
        this.updatePlayerInfoPanel();
    }

    updatePlayerInfoPanel() {
        const playersList = document.getElementById('players-list');
        const currentPlayerName = document.getElementById('current-player-name');
        
        if (playersList) {
            playersList.innerHTML = this.players.map(player => `
                <div class="player-info-card ${player === this.getCurrentPlayer() ? 'active' : ''}" 
                     style="border-left: 4px solid ${player.getColorCode()}">
                    <div class="player-name">${player.username}</div>
                    <div class="player-details">
                        <div>País: ${player.country}</div>
                        <div>Dinero: $${player.money}</div>
                        <div>Propiedades: ${player.properties.length}</div>
                        <div>Posición: ${player.position}</div>
                    </div>
                </div>
            `).join('');
        }

        if (currentPlayerName) {
            currentPlayerName.textContent = this.getCurrentPlayer().username;
        }
    }

    startGame() {
        this.isGameActive = true;
        this.updatePlayerInfoPanel();
        
        // Configurar botón de finalizar juego
        this.setupEndGameButton();
        
        console.log('Game started! Current player:', this.getCurrentPlayer().username);
        
        // Mostrar mensaje inicial
        this.showGameMessage(`¡Juego iniciado! Es el turno de ${this.getCurrentPlayer().username}`);
        
        // Exponer el método handleDiceRoll globalmente para que dados.js pueda usarlo
        window.gameHandleDiceRoll = () => this.handleDiceRoll();
    }

    handleDiceRoll() {
        if (!this.isGameActive) {
            console.log('Game is not active');
            return;
        }

        const currentPlayer = this.getCurrentPlayer();
        console.log(`${currentPlayer.username} is about to move...`);
        
        // Obtener la suma de los dados inmediatamente
        const diceSum = this.getDiceSum();
        console.log(`Dice sum: ${diceSum}`);
        
        if (diceSum > 0) {
            console.log(`Moving ${currentPlayer.username} by ${diceSum} spaces`);
            
            // Mover al jugador
            currentPlayer.moveBy(diceSum);
            
            // Mostrar mensaje del movimiento
            this.showGameMessage(`${currentPlayer.username} se movió ${diceSum} espacios a la posición ${currentPlayer.position}`);
            
            // Procesar la acción de la casilla
            this.processSpaceAction(currentPlayer);
            
            // Actualizar información
            this.updatePlayerInfoPanel();
            
            // Pasar al siguiente turno después de un breve delay
            setTimeout(() => {
                this.nextTurn();
            }, 2000);
        } else {
            console.log('Invalid dice sum:', diceSum);
            this.showGameMessage('Error: Primero debes lanzar los dados');
        }
    }

    getDiceSum() {
        // Primero intentar obtener la suma desde el sumLabel (más confiable)
        const sumLabel = document.getElementById('sumLabel');
        if (sumLabel && sumLabel.textContent) {
            const sumText = sumLabel.textContent;
            const match = sumText.match(/Suma: (\d+)/);
            if (match) {
                const sum = parseInt(match[1]);
                if (sum > 0 && sum <= 12) {  // Validar rango válido para dados
                    console.log(`Found dice sum in label: ${sum}`);
                    return sum;
                }
            }
        }
        
        // Si no hay suma válida en el label, verificar los dados individuales
        const die1 = document.getElementById('die1');
        const die2 = document.getElementById('die2');
        
        if (die1 && die2 && die1.textContent && die2.textContent) {
            const die1Value = parseInt(die1.textContent) || 0;
            const die2Value = parseInt(die2.textContent) || 0;
            const sum = die1Value + die2Value;
            
            if (sum >= 2 && sum <= 12) {  // Rango válido para suma de dos dados
                console.log(`Calculated dice sum: ${die1Value} + ${die2Value} = ${sum}`);
                return sum;
            }
        }
        
        // Verificar input manual de debug como último recurso
        const debugInput = document.getElementById('debugDice');
        if (debugInput && debugInput.value) {
            const debugValue = parseInt(debugInput.value);
            if (debugValue > 0 && debugValue <= 40) {
                console.log(`Using debug dice value: ${debugValue}`);
                // No limpiar aquí, dejar que el usuario lo haga manualmente
                return debugValue;
            }
        }
        
        console.log('No valid dice sum found');
        return 0;
    }

    processSpaceAction(player) {
        // Obtener información de la casilla actual
        const spaceInfo = this.getSpaceInfo(player.position);
        
        if (spaceInfo) {
            switch (spaceInfo.type) {
                case 'property':
                    this.handlePropertySpace(player, spaceInfo);
                    break;
                case 'tax':
                    this.handleTaxSpace(player, spaceInfo);
                    break;
                case 'go_to_jail':
                    this.sendToJail(player);
                    break;
                case 'chance':
                case 'community_chest':
                    this.handleCardSpace(player, spaceInfo.type);
                    break;
                default:
                    console.log(`${player.username} landed on ${spaceInfo.name}`);
            }
        }
    }

    getSpaceInfo(position) {
        // Obtener información de la casilla desde el boardController
        if (boardControllerInstance && boardControllerInstance.getSpaceByPosition) {
            return boardControllerInstance.getSpaceByPosition(position);
        }
        
        // Fallback con información básica
        return {
            position: position,
            name: `Casilla ${position}`,
            type: 'basic'
        };
    }

    showGameMessage(message) {
        console.log('Game Message:', message);
        
        // Crear o actualizar el mensaje del juego
        let messageElement = document.getElementById('game-message');
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'game-message';
            messageElement.className = 'game-message';
            document.body.appendChild(messageElement);
        }
        
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        // Ocultar el mensaje después de 3 segundos
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }

    handlePropertySpace(player, spaceInfo) {
        console.log(`${player.username} landed on property: ${spaceInfo.name}`);
        // Implementar lógica de compra/pago de renta
    }

    handleTaxSpace(player, spaceInfo) {
        const taxAmount = spaceInfo.tax || 100;
        player.payTax(taxAmount);
        console.log(`${player.username} paid $${taxAmount} in taxes`);
    }

    sendToJail(player) {
        player.position = 10; // Posición de la cárcel
        player.isInJail = true;
        player.jailTurns = 0;
        player.removeFromBoard();
        player.placeOnBoard();
        console.log(`${player.username} was sent to jail!`);
    }

    handleCardSpace(player, cardType) {
        console.log(`${player.username} drew a ${cardType} card`);
        // Implementar lógica de cartas de Suerte y Cofre Comunidad
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    nextTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.updatePlayerInfoPanel();
        console.log('Next turn:', this.getCurrentPlayer().username);
    }

    endGame() {
        this.isGameActive = false;
        console.log('Game ended');
    }

    setupEndGameButton() {
        const endGameButton = document.getElementById('endGameButton');
        if (endGameButton) {
            endGameButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.showEndGameConfirmation();
            });
        }
    }

    showEndGameConfirmation() {
        const modal = new bootstrap.Modal(document.getElementById('endGameConfirmModal'));
        modal.show();
        
        // Configurar el botón de confirmación
        const confirmButton = document.getElementById('confirmEndGame');
        confirmButton.onclick = () => {
            modal.hide();
            this.finalizeGame();
        };
    }

    finalizeGame() {
        // Marcar el juego como finalizado
        this.isGameActive = false;
        
        // Calcular estadísticas finales
        const gameStats = this.calculateGameStats();
        
        // Guardar estadísticas en localStorage para posibles usos futuros
        this.saveGameHistory(gameStats);
        
        // Mostrar modal de estadísticas
        this.showGameStats(gameStats);
        
        console.log('Game finalized:', gameStats);
    }

    saveGameHistory(stats) {
        try {
            let gameHistory = JSON.parse(localStorage.getItem('monopolyGameHistory') || '[]');
            
            const gameRecord = {
                id: Date.now(),
                date: new Date().toISOString(),
                players: stats.players,
                totalTurns: stats.totalTurns,
                winner: stats.players[0].username
            };
            
            gameHistory.unshift(gameRecord); // Añadir al principio
            
            // Mantener solo los últimos 10 juegos
            if (gameHistory.length > 10) {
                gameHistory = gameHistory.slice(0, 10);
            }
            
            localStorage.setItem('monopolyGameHistory', JSON.stringify(gameHistory));
            console.log('Game history saved');
        } catch (error) {
            console.error('Error saving game history:', error);
        }
    }

    calculateGameStats() {
        const totalTurns = this.currentPlayerIndex * this.players.length + this.players.indexOf(this.getCurrentPlayer());
        
        const stats = {
            gameEndTime: new Date().toLocaleString('es-ES'),
            totalTurns: totalTurns,
            players: this.players.map(player => ({
                ...player.getPlayerInfo(),
                netWorth: player.money + (player.properties.length * 100), // Estimación simple
                turnCount: Math.floor(totalTurns / this.players.length) || 0
            })).sort((a, b) => b.netWorth - a.netWorth) // Ordenar por valor neto descendente
        };

        // Añadir posiciones finales
        stats.players.forEach((player, index) => {
            player.finalPosition = index + 1;
        });

        return stats;
    }

    showGameStats(stats) {
        const statsContent = document.getElementById('gameStatsContent');
        
        const html = `
            <div class="game-summary mb-4">
                <div class="row text-center">
                    <div class="col-md-4">
                        <h6 class="text-muted mb-1">Fecha de Finalización</h6>
                        <p class="fw-bold">${stats.gameEndTime}</p>
                    </div>
                    <div class="col-md-4">
                        <h6 class="text-muted mb-1">Total de Turnos</h6>
                        <p class="fw-bold">${stats.totalTurns}</p>
                    </div>
                    <div class="col-md-4">
                        <h6 class="text-muted mb-1">Jugadores</h6>
                        <p class="fw-bold">${stats.players.length}</p>
                    </div>
                </div>
            </div>

            <h6 class="mb-3">🏆 Clasificación Final</h6>
            <div class="table-responsive">
                <table class="table table-hover table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th>Posición</th>
                            <th>Jugador</th>
                            <th>País</th>
                            <th>Dinero</th>
                            <th>Propiedades</th>
                            <th>Valor Neto</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.players.map(player => `
                            <tr ${player.finalPosition === 1 ? 'class="table-warning"' : ''}>
                                <td>
                                    ${player.finalPosition === 1 ? '🥇' : player.finalPosition === 2 ? '🥈' : player.finalPosition === 3 ? '🥉' : player.finalPosition}
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="player-color-indicator me-2" 
                                             style="width: 15px; height: 15px; border-radius: 50%; background-color: ${this.getPlayerColorCode(player.color)}"></div>
                                        <strong>${player.username}</strong>
                                    </div>
                                </td>
                                <td>${player.country}</td>
                                <td class="${player.money < 0 ? 'text-danger' : 'text-success'}">$${player.money.toLocaleString()}</td>
                                <td><span class="badge bg-info">${player.properties}</span></td>
                                <td class="fw-bold">$${player.netWorth.toLocaleString()}</td>
                                <td>
                                    ${player.money < 0 ? '<span class="badge bg-danger">Bancarrota</span>' : 
                                      player.isInJail ? '<span class="badge bg-warning">En Cárcel</span>' : 
                                      '<span class="badge bg-success">Activo</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="mt-4">
                <h6>📈 Datos del Juego</h6>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Ganador:</strong> ${stats.players[0].username} (${stats.players[0].country})</p>
                        <p><strong>Dinero del Ganador:</strong> $${stats.players[0].money.toLocaleString()}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Propiedades del Ganador:</strong> ${stats.players[0].properties}</p>
                        <p><strong>Valor Neto del Ganador:</strong> $${stats.players[0].netWorth.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        `;

        statsContent.innerHTML = html;
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('gameStatsModal'));
        modal.show();
    }

    getPlayerColorCode(color) {
        const colors = {
            'red': '#ff4444',
            'blue': '#3498db',
            'green': '#2ecc71',
            'yellow': '#f1c40f'
        };
        return colors[color] || '#333';
    }

    getGameState() {
        return {
            players: this.players.map(player => player.getPlayerInfo()),
            currentPlayer: this.currentPlayerIndex,
            isActive: this.isGameActive
        };
    }
}

// Variable global para acceder al juego
let gameInstance = null;

// Inicializar el juego cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un poco para que el board se inicialice
    setTimeout(() => {
        console.log('Initializing game...');
        gameInstance = new Game();
        // Exponer globalmente para debugging
        window.gameInstance = gameInstance;
        console.log('Game instance created and exposed globally');
    }, 500);
});