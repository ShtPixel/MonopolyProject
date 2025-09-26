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