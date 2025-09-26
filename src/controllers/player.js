class Player {
    constructor(playerData, startPosition = 0) {
        this.username = playerData.username;
        this.country = playerData.country;
        this.color = playerData.color;
        this.position = startPosition;
        this.money = 1500; // Dinero inicial del Monopoly
        this.properties = [];
        this.isInJail = false;
        this.jailTurns = 0;
        this.element = this.createElement();
    }

    createElement() {
        const playerElement = document.createElement('div');
        playerElement.className = `player-piece player-${this.color}`;
        playerElement.style.backgroundColor = this.getColorCode();
        playerElement.innerHTML = `
            <div class="player-icon">
                ${this.username.charAt(0).toUpperCase()}
            </div>
        `;
        playerElement.dataset.playerId = this.username;
        return playerElement;
    }

    getColorCode() {
        const colors = {
            'red': '#ff4444',
            'blue': '#3498db',
            'green': '#2ecc71',
            'yellow': '#f1c40f'
        };
        return colors[this.color] || '#333';
    }

    moveTo(newPosition) {
        console.log(`Moving ${this.username} from position ${this.position} to ${newPosition}`);
        
        // Remover ficha de la posición actual
        this.removeFromBoard();
        
        // Verificar si pasó por GO antes de actualizar la posición
        if (newPosition >= 40 && this.position < 40) {
            this.collectSalary();
        }
        
        // Actualizar posición (el tablero tiene 40 casillas: 0-39)
        this.position = newPosition % 40;
        
        console.log(`${this.username} new position: ${this.position}`);
        
        // Colocar ficha en la nueva posición
        this.placeOnBoard();
    }

    moveBy(steps) {
        const newPosition = this.position + steps;
        this.moveTo(newPosition);
    }

    removeFromBoard() {
        if (this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    placeOnBoard() {
        const spaceElement = this.getSpaceElement(this.position);
        console.log(`Placing ${this.username} on position ${this.position}`, spaceElement);
        
        if (spaceElement) {
            // Crear contenedor de jugadores si no existe
            let playersContainer = spaceElement.querySelector('.players-container');
            if (!playersContainer) {
                playersContainer = document.createElement('div');
                playersContainer.className = 'players-container';
                spaceElement.appendChild(playersContainer);
            }
            playersContainer.appendChild(this.element);
            console.log(`${this.username} placed successfully on position ${this.position}`);
        } else {
            console.error(`Could not find space element for position ${this.position}`);
        }
    }

    getSpaceElement(position) {
        console.log(`Getting space element for position: ${position}`);
        
        // Usar el método del boardController si está disponible
        if (window.boardControllerInstance && window.boardControllerInstance.getSpaceElement) {
            const element = window.boardControllerInstance.getSpaceElement(position);
            if (element) {
                console.log(`Found space element via boardController for position ${position}`);
                return element;
            }
        }
        
        // Fallback: mapeo manual
        const boardSpaces = document.querySelectorAll('.space');
        console.log(`Total spaces found: ${boardSpaces.length}`);
        
        // Mapeo de posiciones del tablero (empezando desde GO en sentido horario)
        const positionMap = [
            // Bottom row (GO to Jail) - positions 0-10
            { row: 10, col: 10 }, // 0 - GO
            { row: 10, col: 9 },  // 1
            { row: 10, col: 8 },  // 2
            { row: 10, col: 7 },  // 3
            { row: 10, col: 6 },  // 4
            { row: 10, col: 5 },  // 5
            { row: 10, col: 4 },  // 6
            { row: 10, col: 3 },  // 7
            { row: 10, col: 2 },  // 8
            { row: 10, col: 1 },  // 9
            { row: 10, col: 0 },  // 10 - Jail
            
            // Left column (Jail to Free Parking) - positions 11-19
            { row: 9, col: 0 },   // 11
            { row: 8, col: 0 },   // 12
            { row: 7, col: 0 },   // 13
            { row: 6, col: 0 },   // 14
            { row: 5, col: 0 },   // 15
            { row: 4, col: 0 },   // 16
            { row: 3, col: 0 },   // 17
            { row: 2, col: 0 },   // 18
            { row: 1, col: 0 },   // 19
            { row: 0, col: 0 },   // 20 - Free Parking
            
            // Top row (Free Parking to Go to Jail) - positions 21-29
            { row: 0, col: 1 },   // 21
            { row: 0, col: 2 },   // 22
            { row: 0, col: 3 },   // 23
            { row: 0, col: 4 },   // 24
            { row: 0, col: 5 },   // 25
            { row: 0, col: 6 },   // 26
            { row: 0, col: 7 },   // 27
            { row: 0, col: 8 },   // 28
            { row: 0, col: 9 },   // 29
            { row: 0, col: 10 },  // 30 - Go to Jail
            
            // Right column (Go to Jail to GO) - positions 31-39
            { row: 1, col: 10 },  // 31
            { row: 2, col: 10 },  // 32
            { row: 3, col: 10 },  // 33
            { row: 4, col: 10 },  // 34
            { row: 5, col: 10 },  // 35
            { row: 6, col: 10 },  // 36
            { row: 7, col: 10 },  // 37
            { row: 8, col: 10 },  // 38
            { row: 9, col: 10 }   // 39
        ];

        if (position >= 0 && position < positionMap.length) {
            const coords = positionMap[position];
            const spaceIndex = coords.row * 11 + coords.col;
            console.log(`Position ${position} maps to grid (${coords.row}, ${coords.col}), index ${spaceIndex}`);
            
            if (spaceIndex < boardSpaces.length) {
                return boardSpaces[spaceIndex];
            }
        }
        
        console.error(`Could not find space element for position ${position}`);
        return null;
    }

    collectSalary() {
        this.money += 200;
        console.log(`${this.username} collected $200 for passing GO!`);
    }

    payTax(amount) {
        this.money -= amount;
        if (this.money < 0) {
            console.log(`${this.username} is bankrupt!`);
        }
    }

    buyProperty(property) {
        if (this.money >= property.price) {
            this.money -= property.price;
            this.properties.push(property);
            return true;
        }
        return false;
    }

    getPlayerInfo() {
        return {
            username: this.username,
            country: this.country,
            color: this.color,
            position: this.position,
            money: this.money,
            properties: this.properties.length,
            isInJail: this.isInJail
        };
    }
}