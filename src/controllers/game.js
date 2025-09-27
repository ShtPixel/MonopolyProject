class Game {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.boardController = null;
        this.boardData = null;
        this.isGameActive = false;
        this.lastDiceRoll = 0;
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

        // Cargar datos del tablero
        await this.loadBoardData();

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

    async loadBoardData() {
        try {
            const response = await fetch('http://localhost:5000/board');
            this.boardData = await response.json();
            console.log('Board data loaded:', this.boardData);
        } catch (error) {
            console.error('Error loading board data:', error);
            // Datos de fallback si no se puede cargar desde el servidor
            this.boardData = { bottom: [], left: [], top: [], right: [], chance: [], community_chest: [] };
        }
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
            playersList.innerHTML = this.players.map(player => {
                const mortgagedCount = player.mortgagedProperties.size;
                const mortgageDebt = Array.from(player.mortgagedProperties.values())
                    .reduce((sum, value) => sum + Math.floor(value * 1.1), 0);
                
                return `
                    <div class="player-info-card ${player === this.getCurrentPlayer() ? 'active' : ''}" 
                         style="border-left: 4px solid ${player.getColorCode()}"
                         onclick="window.gameInstance.showPlayerPropertiesModal('${player.username}')"
                         title="Click para ver propiedades">
                        <div class="player-name">
                            ${player.username}
                            ${mortgagedCount > 0 ? `<span class="mortgage-indicator" title="${mortgagedCount} propiedades hipotecadas">🏦${mortgagedCount}</span>` : ''}
                        </div>
                        <div class="player-details">
                            <div>País: ${player.country}</div>
                            <div class="${player.money < 100 ? 'text-danger' : ''}">💰 $${player.money.toLocaleString()}</div>
                            <div>🏠 Propiedades: ${player.properties.length + player.railroads.length + player.utilities.length}</div>
                            <div>🏗️ Casas: ${player.houses} | 🏨 Hoteles: ${player.hotels}</div>
                            ${mortgageDebt > 0 ? `<div class="text-warning">🔒 Deuda: $${mortgageDebt.toLocaleString()}</div>` : ''}
                            <div>📍 Posición: ${player.position}</div>
                        </div>
                    </div>
                `;
            }).join('');
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
        this.lastDiceRoll = diceSum; // Guardar el último lanzamiento
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
                case 'railroad':
                case 'utility':
                    this.handlePropertySpace(player, spaceInfo);
                    break;
                case 'tax':
                    this.handleTaxSpace(player, spaceInfo);
                    break;
                case 'special':
                    this.handleSpecialSpace(player, spaceInfo);
                    break;
                case 'chance':
                    this.handleChanceSpace(player);
                    break;
                case 'community_chest':
                    this.handleCommunityChestSpace(player);
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
        
        // Verificar si la propiedad ya tiene dueño
        const owner = this.getPropertyOwner(spaceInfo.id);
        
        if (!owner) {
            // Propiedad libre - mostrar opción de compra
            this.showPropertyPurchaseDialog(player, spaceInfo);
        } else if (owner !== player) {
            // Propiedad de otro jugador - pagar renta
            this.payRent(player, owner, spaceInfo);
        } else {
            // Es propiedad propia
            this.showGameMessage(`${player.username} está en su propia propiedad: ${spaceInfo.name}`);
            // Opcionalmente mostrar opciones de construcción
            this.showPropertyManagementDialog(player, spaceInfo);
        }
    }

    getPropertyOwner(propertyId) {
        for (let player of this.players) {
            if (player.ownsProperty(propertyId)) {
                return player;
            }
        }
        return null;
    }

    showPropertyPurchaseDialog(player, property) {
        const canAfford = player.money >= property.price;
        
        // Crear modal de compra
        const modal = this.createModal({
            title: `Comprar Propiedad`,
            body: `
                <div class="property-purchase-dialog">
                    <h5>${property.name}</h5>
                    <div class="property-details">
                        <p><strong>Precio:</strong> $${property.price}</p>
                        <p><strong>Renta base:</strong> $${property.rent ? property.rent.base || property.rent[1] : 'N/A'}</p>
                        <p><strong>Tu dinero:</strong> $${player.money}</p>
                        ${property.color ? `<p><strong>Color:</strong> ${property.color}</p>` : ''}
                    </div>
                    ${canAfford ? 
                        `<div class="alert alert-success">¡Puedes permitirte esta propiedad!</div>` :
                        `<div class="alert alert-danger">No tienes suficiente dinero para comprar esta propiedad.</div>`
                    }
                </div>
            `,
            buttons: canAfford ? [
                {
                    text: 'Comprar',
                    class: 'btn-success',
                    action: () => {
                        if (player.buyProperty(property)) {
                            this.showGameMessage(`${player.username} compró ${property.name} por $${property.price}`);
                            this.updatePlayerInfoPanel();
                        }
                    }
                },
                {
                    text: 'No comprar',
                    class: 'btn-secondary',
                    action: () => {
                        this.showGameMessage(`${player.username} decidió no comprar ${property.name}`);
                    }
                }
            ] : [
                {
                    text: 'Entendido',
                    class: 'btn-secondary',
                    action: () => {}
                }
            ]
        });
    }

    payRent(player, owner, property) {
        const rentAmount = owner.calculateRent(owner.getProperty(property.id), this.getAllProperties());
        
        if (rentAmount > 0) {
            player.payRent(rentAmount, owner);
            this.showGameMessage(`${player.username} pagó $${rentAmount} de renta a ${owner.username} por ${property.name}`);
            this.updatePlayerInfoPanel();
            
            // Verificar si el jugador quedó en bancarrota
            if (player.money < 0) {
                this.handleBankruptcy(player, owner);
            }
        }
    }

    showPropertyManagementDialog(player, property) {
        const ownedProperty = player.getProperty(property.id);
        if (!ownedProperty || ownedProperty.type !== 'property') return;
        
        const canBuildHouse = player.canBuildHouse(property.id, this.getAllProperties());
        const canBuildHotel = player.canBuildHotel(property.id, this.getAllProperties());
        
        const modal = this.createModal({
            title: `Administrar Propiedad`,
            body: `
                <div class="property-management-dialog">
                    <h5>${property.name}</h5>
                    <div class="property-details">
                        <p><strong>Casas:</strong> ${ownedProperty.houses}</p>
                        <p><strong>Hotel:</strong> ${ownedProperty.hotel ? 'Sí' : 'No'}</p>
                        <p><strong>Renta actual:</strong> $${player.calculateRent(ownedProperty, this.getAllProperties())}</p>
                        <p><strong>Tu dinero:</strong> $${player.money}</p>
                    </div>
                </div>
            `,
            buttons: [
                ...(canBuildHouse ? [{
                    text: 'Construir Casa ($100)',
                    class: 'btn-primary',
                    action: () => {
                        if (player.buildHouse(property.id, this.getAllProperties())) {
                            this.showGameMessage(`${player.username} construyó una casa en ${property.name}`);
                            this.updatePlayerInfoPanel();
                        }
                    }
                }] : []),
                ...(canBuildHotel ? [{
                    text: 'Construir Hotel ($250)',
                    class: 'btn-warning',
                    action: () => {
                        if (player.buildHotel(property.id, this.getAllProperties())) {
                            this.showGameMessage(`${player.username} construyó un hotel en ${property.name}`);
                            this.updatePlayerInfoPanel();
                        }
                    }
                }] : []),
                {
                    text: 'Cerrar',
                    class: 'btn-secondary',
                    action: () => {}
                }
            ]
        });
    }

    getAllProperties() {
        if (!this.boardData) return [];
        
        const allProperties = [
            ...this.boardData.bottom,
            ...this.boardData.left,
            ...this.boardData.top,
            ...this.boardData.right
        ];
        
        return allProperties.filter(space => 
            space.type === 'property' || space.type === 'railroad' || space.type === 'utility'
        );
    }

    handleTaxSpace(player, spaceInfo) {
        const taxAmount = Math.abs(spaceInfo.action?.money || 0);
        player.money -= taxAmount;
        
        this.showGameMessage(`${player.username} pagó $${taxAmount} en impuestos en ${spaceInfo.name}`);
        this.updatePlayerInfoPanel();
        
        if (player.money < 0) {
            this.handleBankruptcy(player);
        }
    }

    handleSpecialSpace(player, spaceInfo) {
        switch (spaceInfo.name) {
            case 'Salida':
                // Ya se maneja automáticamente al pasar por GO
                break;
            case 'Parqueo Gratis':
                this.showGameMessage(`${player.username} está descansando en el Parqueo Gratis`);
                break;
            case 'Cárcel / Solo de visita':
                if (!player.isInJail) {
                    this.showGameMessage(`${player.username} está de visita en la Cárcel`);
                }
                break;
            case 'Ve a la Cárcel':
                this.sendToJail(player);
                break;
        }
    }

    handleChanceSpace(player) {
        if (!this.boardData.chance) return;
        
        const randomCard = this.boardData.chance[Math.floor(Math.random() * this.boardData.chance.length)];
        this.executeCardAction(player, randomCard, 'Sorpresa');
    }

    handleCommunityChestSpace(player) {
        if (!this.boardData.community_chest) return;
        
        const randomCard = this.boardData.community_chest[Math.floor(Math.random() * this.boardData.community_chest.length)];
        this.executeCardAction(player, randomCard, 'Caja de Comunidad');
    }

    executeCardAction(player, card, cardType) {
        this.showCardModal(player, card, cardType);
        
        if (card.action) {
            if (card.action.money) {
                player.money += card.action.money;
                const action = card.action.money > 0 ? 'recibió' : 'pagó';
                this.showGameMessage(`${player.username} ${action} $${Math.abs(card.action.money)} - ${card.description}`);
            }
            
            if (card.action.goTo) {
                if (card.action.goTo === 'jail') {
                    this.sendToJail(player);
                }
            }
            
            this.updatePlayerInfoPanel();
        }
    }

    showCardModal(player, card, cardType) {
        const modal = this.createModal({
            title: `${cardType}`,
            body: `
                <div class="card-modal text-center">
                    <div class="card-icon mb-3">
                        ${cardType === 'Sorpresa' ? '❓' : '📦'}
                    </div>
                    <h5>${card.description}</h5>
                    ${card.action?.money ? `
                        <div class="amount ${card.action.money > 0 ? 'text-success' : 'text-danger'}">
                            ${card.action.money > 0 ? '+' : ''}$${card.action.money}
                        </div>
                    ` : ''}
                </div>
            `,
            buttons: [{
                text: 'Continuar',
                class: 'btn-primary',
                action: () => {}
            }]
        });
    }

    createModal({title, body, buttons}) {
        // Crear modal dinámico
        const modalId = `dynamic-modal-${Date.now()}`;
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                        </div>
                        <div class="modal-body">
                            ${body}
                        </div>
                        <div class="modal-footer">
                            ${buttons.map(btn => `
                                <button type="button" class="btn ${btn.class}" data-action="${btn.text}">
                                    ${btn.text}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalElement = document.getElementById(modalId);
        const modal = new bootstrap.Modal(modalElement);
        
        // Configurar acciones de botones
        buttons.forEach(btn => {
            const buttonElement = modalElement.querySelector(`[data-action="${btn.text}"]`);
            buttonElement.addEventListener('click', () => {
                btn.action();
                modal.hide();
            });
        });
        
        // Limpiar modal después de cerrarlo
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });
        
        modal.show();
        return modal;
    }

    handleBankruptcy(player, creditor = null) {
        this.showGameMessage(`💸 ${player.username} ha quebrado!`);
        
        if (creditor) {
            // Transferir propiedades al acreedor
            creditor.properties.push(...player.properties);
            creditor.railroads.push(...player.railroads);
            creditor.utilities.push(...player.utilities);
        }
        
        // Remover jugador del juego
        const playerIndex = this.players.indexOf(player);
        if (playerIndex > -1) {
            this.players.splice(playerIndex, 1);
            
            // Ajustar índice del jugador actual si es necesario
            if (this.currentPlayerIndex >= playerIndex && this.currentPlayerIndex > 0) {
                this.currentPlayerIndex--;
            }
            
            // Verificar si solo queda un jugador (ganador)
            if (this.players.length === 1) {
                this.declareWinner(this.players[0]);
            }
        }
    }

    showPlayerPropertiesModal(username) {
        const player = this.players.find(p => p.username === username);
        if (!player) {
            console.error('Player not found:', username);
            return;
        }

        const allProperties = [...player.properties, ...player.railroads, ...player.utilities];
        const totalValue = this.calculatePlayerNetWorth(player);
        
        // Agrupar propiedades por color
        const propertiesByColor = this.groupPropertiesByColor(player.properties);
        
        const modal = this.createModal({
            title: `🏠 Propiedades de ${player.username}`,
            body: `
                <div class="player-properties-modal">
                    <div class="player-summary mb-4">
                        <div class="row text-center">
                            <div class="col-3">
                                <div class="summary-item">
                                    <div class="summary-value">${allProperties.length}</div>
                                    <div class="summary-label">Propiedades</div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="summary-item">
                                    <div class="summary-value">${player.houses}</div>
                                    <div class="summary-label">Casas</div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="summary-item">
                                    <div class="summary-value">${player.hotels}</div>
                                    <div class="summary-label">Hoteles</div>
                                </div>
                            </div>
                            <div class="col-3">
                                <div class="summary-item">
                                    <div class="summary-value text-warning">${player.mortgagedProperties.size}</div>
                                    <div class="summary-label">Hipotecadas</div>
                                </div>
                            </div>
                        </div>
                        <div class="row text-center mt-3">
                            <div class="col-4">
                                <div class="summary-item">
                                    <div class="summary-value text-success">$${player.money.toLocaleString()}</div>
                                    <div class="summary-label">Dinero</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="summary-item">
                                    <div class="summary-value text-info">$${totalValue.toLocaleString()}</div>
                                    <div class="summary-label">Valor Total</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="summary-item">
                                    <div class="summary-value text-danger">$${Array.from(player.mortgagedProperties.values()).reduce((sum, value) => sum + Math.floor(value * 1.1), 0).toLocaleString()}</div>
                                    <div class="summary-label">Deuda Hipotecas</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    ${allProperties.length === 0 ? 
                        '<div class="alert alert-info text-center">Este jugador no posee propiedades</div>' :
                        `
                        <div class="properties-sections">
                            ${this.renderPropertiesByColor(propertiesByColor)}
                            ${this.renderRailroadsAndUtilities(player)}
                        </div>
                        `
                    }
                </div>
            `,
            buttons: [
                {
                    text: '🏦 Gestionar Hipotecas',
                    class: 'btn-warning',
                    action: () => {
                        modal.hide();
                        this.showMortgageManagementModal(player.username);
                    }
                },
                {
                    text: 'Cerrar',
                    class: 'btn-secondary',
                    action: () => {}
                }
            ]
        });

        // Hacer el modal más grande
        const modalDialog = modal._element.querySelector('.modal-dialog');
        modalDialog.classList.add('modal-lg');
    }

    calculatePlayerNetWorth(player) {
        let netWorth = player.money;
        
        // Valor de propiedades (precio de compra) - excluyendo hipotecadas no pagadas
        player.properties.forEach(property => {
            if (!player.isPropertyMortgaged(property)) {
                netWorth += property.price;
                netWorth += property.houses * 100; // Cada casa vale $100
                if (property.hotel) netWorth += 250; // Hotel vale $250
            }
        });
        
        // Valor de ferrocarriles - excluyendo hipotecadas no pagadas
        player.railroads.forEach(railroad => {
            if (!player.isPropertyMortgaged(railroad)) {
                netWorth += railroad.price;
            }
        });
        
        // Valor de servicios - excluyendo hipotecadas no pagadas
        player.utilities.forEach(utility => {
            if (!player.isPropertyMortgaged(utility)) {
                netWorth += utility.price || 150; // Valor estimado de servicios
            }
        });

        // Restar deudas de hipotecas pendientes
        const mortgageDebt = Array.from(player.mortgagedProperties.values())
            .reduce((sum, value) => sum + Math.floor(value * 1.1), 0);
        netWorth -= mortgageDebt;
        
        return Math.max(0, netWorth); // No puede ser negativo
    }

    groupPropertiesByColor(properties) {
        const grouped = {};
        properties.forEach(property => {
            if (!grouped[property.color]) {
                grouped[property.color] = [];
            }
            grouped[property.color].push(property);
        });
        return grouped;
    }

    renderPropertiesByColor(propertiesByColor) {
        if (Object.keys(propertiesByColor).length === 0) return '';

        const colorNames = {
            'brown': 'Marrón',
            'purple': 'Púrpura', 
            'pink': 'Rosa',
            'orange': 'Naranja',
            'red': 'Rojo',
            'yellow': 'Amarillo',
            'green': 'Verde',
            'blue': 'Azul'
        };

        const colorStyles = {
            'brown': '#8B4513',
            'purple': '#8A2BE2',
            'pink': '#FF69B4',
            'orange': '#FF8C00',
            'red': '#DC143C',
            'yellow': '#FFD700',
            'green': '#32CD32',
            'blue': '#1E90FF'
        };

        return `
            <h6 class="mb-3">🏘️ Propiedades por Color</h6>
            ${Object.entries(propertiesByColor).map(([color, properties]) => `
                <div class="color-group mb-3">
                    <div class="color-header d-flex align-items-center mb-2">
                        <div class="color-indicator me-2" style="background-color: ${colorStyles[color] || '#666'}"></div>
                        <strong>${colorNames[color] || color} (${properties.length})</strong>
                        ${this.hasColorMonopoly(color, properties) ? '<span class="badge bg-success ms-2">Monopolio</span>' : ''}
                    </div>
                    <div class="properties-list">
                        ${properties.map(property => `
                            <div class="property-item">
                                <div class="property-main">
                                    <span class="property-name">${property.name}</span>
                                    <span class="property-price">$${property.price}</span>
                                </div>
                                <div class="property-details">
                                    <span class="rent-info">Renta: $${this.calculateCurrentRent(property)}</span>
                                    ${property.houses > 0 ? `<span class="houses-info">${property.houses} casas</span>` : ''}
                                    ${property.hotel ? '<span class="hotel-info">🏨 Hotel</span>' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        `;
    }

    renderRailroadsAndUtilities(player) {
        let html = '';
        
        if (player.railroads.length > 0) {
            html += `
                <div class="railroads-section mb-3">
                    <h6 class="mb-2">🚂 Ferrocarriles (${player.railroads.length})</h6>
                    <div class="properties-list">
                        ${player.railroads.map(railroad => `
                            <div class="property-item">
                                <div class="property-main">
                                    <span class="property-name">${railroad.name}</span>
                                    <span class="property-price">$${railroad.price}</span>
                                </div>
                                <div class="property-details">
                                    <span class="rent-info">Renta: $${railroad.rent[player.railroads.length]}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        if (player.utilities.length > 0) {
            html += `
                <div class="utilities-section mb-3">
                    <h6 class="mb-2">⚡ Servicios Públicos (${player.utilities.length})</h6>
                    <div class="properties-list">
                        ${player.utilities.map(utility => `
                            <div class="property-item">
                                <div class="property-main">
                                    <span class="property-name">${utility.name}</span>
                                    <span class="property-price">$${utility.price || 150}</span>
                                </div>
                                <div class="property-details">
                                    <span class="rent-info">Renta: Dados × ${player.utilities.length === 1 ? '4' : '10'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        return html;
    }

    hasColorMonopoly(color, ownedProperties) {
        // Número de propiedades de cada color en el tablero completo
        const totalByColor = {
            'brown': 2, 'purple': 3, 'pink': 3, 'orange': 3,
            'red': 3, 'yellow': 3, 'green': 3, 'blue': 2
        };
        
        return ownedProperties.length === (totalByColor[color] || 0);
    }

    calculateCurrentRent(property) {
        if (property.hotel) {
            return property.rent.withHotel;
        } else if (property.houses > 0) {
            return property.rent.withHouse[property.houses - 1];
        } else {
            // Si tiene monopolio del color, renta base se duplica
            const hasMonopoly = this.hasColorMonopoly(property.color, 
                this.players.find(p => p.properties.some(pr => pr.id === property.id))?.properties.filter(p => p.color === property.color) || []
            );
            return hasMonopoly ? property.rent.base * 2 : property.rent.base;
        }
    }

    declareWinner(winner) {
        this.isGameActive = false;
        const modal = this.createModal({
            title: '🎉 ¡Tenemos un Ganador!',
            body: `
                <div class="winner-announcement text-center">
                    <h2>${winner.username}</h2>
                    <p class="lead">¡Ha ganado el juego de Monopoly!</p>
                    <div class="winner-stats">
                        <p><strong>País:</strong> ${winner.country}</p>
                        <p><strong>Dinero final:</strong> $${winner.money.toLocaleString()}</p>
                        <p><strong>Propiedades:</strong> ${winner.properties.length + winner.railroads.length + winner.utilities.length}</p>
                        <p><strong>Casas:</strong> ${winner.houses}</p>
                        <p><strong>Hoteles:</strong> ${winner.hotels}</p>
                    </div>
                </div>
            `,
            buttons: [{
                text: 'Finalizar Juego',
                class: 'btn-success',
                action: () => {
                    this.finalizeGame();
                }
            }]
        });
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

    // ===============================
    // GESTIÓN DE HIPOTECAS
    // ===============================

    /**
     * Muestra el modal de gestión de hipotecas para un jugador
     * @param {string} username - Nombre del jugador
     */
    showMortgageManagementModal(username) {
        const player = this.players.find(p => p.username === username);
        if (!player) {
            console.error('Player not found:', username);
            return;
        }

        // Solo el jugador actual puede gestionar hipotecas durante su turno
        const isCurrentPlayer = player === this.getCurrentPlayer();
        
        const allProperties = [...player.properties, ...player.railroads, ...player.utilities];
        const mortgagedProperties = player.getMortgagedProperties();
        const availableForMortgage = allProperties.filter(prop => !player.isPropertyMortgaged(prop));

        const modal = this.createModal({
            title: `🏦 Gestión de Hipotecas - ${player.username}`,
            body: `
                <div class="mortgage-management-modal">
                    <div class="alert alert-info mb-3">
                        <strong>💡 Información sobre Hipotecas:</strong><br>
                        • Al hipotecar recibes el 50% del valor de la propiedad<br>
                        • No se puede cobrar renta de propiedades hipotecadas<br>
                        • Para deshipotecar pagas el valor recibido + 10% de interés<br>
                        • Las propiedades hipotecadas no cuentan en el puntaje final
                    </div>

                    ${!isCurrentPlayer ? 
                        '<div class="alert alert-warning">Solo puedes gestionar hipotecas durante tu turno</div>' : 
                        ''
                    }

                    <div class="mortgage-sections">
                        <!-- Propiedades Disponibles para Hipotecar -->
                        <div class="available-section mb-4">
                            <h5 class="text-success">🏠 Propiedades Disponibles para Hipotecar</h5>
                            ${availableForMortgage.length === 0 ? 
                                '<p class="text-muted">No hay propiedades disponibles para hipotecar</p>' :
                                `<div class="properties-grid">
                                    ${availableForMortgage.map(prop => this.renderMortgageableProperty(prop, player, isCurrentPlayer)).join('')}
                                </div>`
                            }
                        </div>

                        <!-- Propiedades Hipotecadas -->
                        <div class="mortgaged-section">
                            <h5 class="text-warning">🔒 Propiedades Hipotecadas</h5>
                            ${mortgagedProperties.length === 0 ? 
                                '<p class="text-muted">No hay propiedades hipotecadas</p>' :
                                `<div class="properties-grid">
                                    ${mortgagedProperties.map(prop => this.renderMortgagedProperty(prop, player, isCurrentPlayer)).join('')}
                                </div>`
                            }
                        </div>
                    </div>

                    <div class="mortgage-summary mt-3">
                        <div class="row text-center">
                            <div class="col-4">
                                <div class="summary-item">
                                    <div class="summary-value text-success">$${player.money.toLocaleString()}</div>
                                    <div class="summary-label">Dinero Disponible</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="summary-item">
                                    <div class="summary-value text-warning">${mortgagedProperties.length}</div>
                                    <div class="summary-label">Hipotecadas</div>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="summary-item">
                                    <div class="summary-value text-danger">$${mortgagedProperties.reduce((sum, prop) => sum + prop.unmortgageValue, 0).toLocaleString()}</div>
                                    <div class="summary-label">Total Deuda</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: '🏠 Ver Propiedades',
                    class: 'btn-info',
                    action: () => {
                        modal.hide();
                        this.showPlayerPropertiesModal(player.username);
                    }
                },
                {
                    text: 'Cerrar',
                    class: 'btn-secondary',
                    action: () => {}
                }
            ]
        });

        // Hacer el modal más grande
        const modalDialog = modal._element.querySelector('.modal-dialog');
        modalDialog.classList.add('modal-lg');
    }

    /**
     * Renderiza una propiedad disponible para hipotecar
     */
    renderMortgageableProperty(property, player, canInteract) {
        const mortgageValue = property.mortgage || Math.floor(property.price * 0.5);
        const canMortgage = canInteract && !player.hasConstructionsInColorGroup(property.color);
        
        return `
            <div class="property-card available-property">
                <div class="property-header">
                    <div class="property-name">${property.name}</div>
                    <div class="property-type">${this.getPropertyTypeLabel(property)}</div>
                </div>
                <div class="property-details">
                    <div class="property-value">Valor: $${property.price.toLocaleString()}</div>
                    <div class="mortgage-value text-success">Hipoteca: $${mortgageValue.toLocaleString()}</div>
                    ${property.houses > 0 || property.hotel ? 
                        '<div class="text-warning">⚠️ Vende construcciones primero</div>' : ''
                    }
                </div>
                <div class="property-actions">
                    <button class="btn btn-success btn-sm" 
                            ${canMortgage ? '' : 'disabled'}
                            onclick="window.gameInstance.mortgageProperty('${player.username}', '${property.id}')">
                        🏦 Hipotecar ($${mortgageValue.toLocaleString()})
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza una propiedad hipotecada
     */
    renderMortgagedProperty(property, player, canInteract) {
        return `
            <div class="property-card mortgaged-property">
                <div class="property-header">
                    <div class="property-name">${property.name}</div>
                    <div class="property-type">${this.getPropertyTypeLabel(property)}</div>
                    <div class="mortgaged-badge">🔒 HIPOTECADA</div>
                </div>
                <div class="property-details">
                    <div class="property-value">Valor Original: $${property.price.toLocaleString()}</div>
                    <div class="mortgage-received text-info">Recibido: $${property.mortgageValue.toLocaleString()}</div>
                    <div class="unmortgage-cost text-warning">Deshipotecar: $${property.unmortgageValue.toLocaleString()}</div>
                </div>
                <div class="property-actions">
                    <button class="btn btn-warning btn-sm" 
                            ${canInteract && player.money >= property.unmortgageValue ? '' : 'disabled'}
                            onclick="window.gameInstance.unmortgageProperty('${player.username}', '${property.id}')">
                        💰 Deshipotecar ($${property.unmortgageValue.toLocaleString()})
                    </button>
                    ${player.money < property.unmortgageValue ? 
                        '<div class="text-danger">💸 Dinero insuficiente</div>' : ''
                    }
                </div>
            </div>
        `;
    }

    /**
     * Obtiene la etiqueta del tipo de propiedad
     */
    getPropertyTypeLabel(property) {
        switch(property.type) {
            case 'property': return `🏠 ${property.color.toUpperCase()}`;
            case 'railroad': return '🚂 Ferrocarril';
            case 'utility': return '⚡ Servicio';
            default: return property.type;
        }
    }

    /**
     * Hipoteca una propiedad específica
     */
    mortgageProperty(username, propertyId) {
        const player = this.players.find(p => p.username === username);
        if (!player) return;

        // Verificar que sea el turno del jugador
        if (player !== this.getCurrentPlayer()) {
            this.showGameMessage('Solo puedes hipotecar propiedades durante tu turno');
            return;
        }

        // Buscar la propiedad
        const allProperties = [...player.properties, ...player.railroads, ...player.utilities];
        const property = allProperties.find(prop => prop.id.toString() === propertyId.toString());
        
        if (!property) {
            this.showGameMessage('Propiedad no encontrada');
            return;
        }

        // Intentar hipotecar
        if (player.mortgageProperty(property)) {
            const mortgageValue = property.mortgage || Math.floor(property.price * 0.5);
            this.showGameMessage(`${player.username} hipotecó ${property.name} por $${mortgageValue}`);
            this.updatePlayerInfoPanel();
            // Refrescar el modal
            this.showMortgageManagementModal(username);
        } else {
            this.showGameMessage('No se pudo hipotecar la propiedad');
        }
    }

    /**
     * Deshipoteca una propiedad específica
     */
    unmortgageProperty(username, propertyId) {
        const player = this.players.find(p => p.username === username);
        if (!player) return;

        // Verificar que sea el turno del jugador
        if (player !== this.getCurrentPlayer()) {
            this.showGameMessage('Solo puedes deshipotecar propiedades durante tu turno');
            return;
        }

        // Buscar la propiedad
        const allProperties = [...player.properties, ...player.railroads, ...player.utilities];
        const property = allProperties.find(prop => prop.id.toString() === propertyId.toString());
        
        if (!property) {
            this.showGameMessage('Propiedad no encontrada');
            return;
        }

        // Intentar deshipotecar
        if (player.unmortgageProperty(property)) {
            const paymentAmount = Math.floor((property.mortgage || Math.floor(property.price * 0.5)) * 1.1);
            this.showGameMessage(`${player.username} deshipotecó ${property.name} por $${paymentAmount}`);
            this.updatePlayerInfoPanel();
            // Refrescar el modal
            this.showMortgageManagementModal(username);
        } else {
            this.showGameMessage('No se pudo deshipotecar la propiedad');
        }
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