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
        return document.getElementById(`cell-${position}`);
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