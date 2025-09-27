class Player {
    constructor(playerData, startPosition = 0) {
        this.username = playerData.username;
        this.country = playerData.country;
        this.color = playerData.color;
        this.position = startPosition;
        this.money = 1500; // Dinero inicial del Monopoly
        this.properties = []; // Array de propiedades que posee
        this.railroads = []; // Array de ferrocarriles que posee
        this.utilities = []; // Array de servicios públicos que posee
        this.houses = 0; // Número total de casas construidas
        this.hotels = 0; // Número total de hoteles construidos
        this.isInJail = false;
        this.jailTurns = 0;
        this.doublesCount = 0; // Contador de dobles consecutivos
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
            // Verificar si es una esquina (posiciones 0, 10, 20, 30)
            const isCorner = [0, 10, 20, 30].includes(this.position);
            
            let playersContainer = spaceElement.querySelector('.players-container');
            if (!playersContainer) {
                playersContainer = document.createElement('div');
                playersContainer.className = 'players-container';
                
                if (isCorner) {
                    // Para esquinas, añadir el contenedor con estilos especiales
                    playersContainer.style.cssText = `
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        display: flex;
                        flex-wrap: wrap;
                        gap: 2px;
                        z-index: 20;
                        max-width: 40px;
                    `;
                }
                
                spaceElement.appendChild(playersContainer);
            }
            
            // Asegurar que el elemento padre tenga position relative para las esquinas
            if (isCorner && spaceElement.style.position !== 'relative') {
                spaceElement.style.position = 'relative';
            }
            
            playersContainer.appendChild(this.element);
            console.log(`${this.username} placed successfully on position ${this.position} (corner: ${isCorner})`);
        } else {
            console.error(`Could not find space element for position ${this.position}`);
        }
    }

    getSpaceElement(position) {
        // Usar BoardMapper para obtener la celda visual
        if (window.BoardMapper) {
            return window.BoardMapper.getCellElement(position);
        }
        // Fallback por compatibilidad
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
            
            if (property.type === 'property') {
                this.properties.push({...property, houses: 0, hotel: false, owner: this.username});
            } else if (property.type === 'railroad') {
                this.railroads.push({...property, owner: this.username});
            } else if (property.type === 'utility') {
                this.utilities.push({...property, owner: this.username});
            }
            
            console.log(`${this.username} bought ${property.name} for $${property.price}`);
            return true;
        }
        console.log(`${this.username} cannot afford ${property.name} ($${property.price})`);
        return false;
    }

    ownsProperty(propertyId) {
        return this.properties.some(p => p.id === propertyId) ||
               this.railroads.some(r => r.id === propertyId) ||
               this.utilities.some(u => u.id === propertyId);
    }

    getProperty(propertyId) {
        return this.properties.find(p => p.id === propertyId) ||
               this.railroads.find(r => r.id === propertyId) ||
               this.utilities.find(u => u.id === propertyId);
    }

    ownsAllOfColor(color, allProperties) {
        const colorProperties = allProperties.filter(p => p.color === color);
        const ownedColorProperties = this.properties.filter(p => p.color === color);
        return colorProperties.length === ownedColorProperties.length;
    }

    canBuildHouse(propertyId, allProperties) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property || property.type !== 'property') return false;
        
        // Debe poseer todas las propiedades del mismo color
        if (!this.ownsAllOfColor(property.color, allProperties)) return false;
        
        // No puede tener hotel
        if (property.hotel) return false;
        
        // Máximo 4 casas por propiedad
        if (property.houses >= 4) return false;
        
        // Construcción uniforme: todas las propiedades del color deben tener el mismo número de casas o una menos
        const colorProperties = this.properties.filter(p => p.color === property.color);
        const minHouses = Math.min(...colorProperties.map(p => p.houses));
        
        return property.houses === minHouses;
    }

    buildHouse(propertyId, allProperties) {
        if (!this.canBuildHouse(propertyId, allProperties)) return false;
        
        const property = this.properties.find(p => p.id === propertyId);
        const housePrice = 100; // Precio base de una casa
        
        if (this.money >= housePrice) {
            this.money -= housePrice;
            property.houses++;
            this.houses++;
            console.log(`${this.username} built a house on ${property.name}`);
            return true;
        }
        return false;
    }

    canBuildHotel(propertyId, allProperties) {
        const property = this.properties.find(p => p.id === propertyId);
        if (!property || property.type !== 'property') return false;
        
        // Debe poseer todas las propiedades del mismo color
        if (!this.ownsAllOfColor(property.color, allProperties)) return false;
        
        // Debe tener exactamente 4 casas
        return property.houses === 4 && !property.hotel;
    }

    buildHotel(propertyId, allProperties) {
        if (!this.canBuildHotel(propertyId, allProperties)) return false;
        
        const property = this.properties.find(p => p.id === propertyId);
        const hotelPrice = 250; // Precio base de un hotel
        
        if (this.money >= hotelPrice) {
            this.money -= hotelPrice;
            property.houses = 0; // El hotel reemplaza las 4 casas
            property.hotel = true;
            this.houses -= 4;
            this.hotels++;
            console.log(`${this.username} built a hotel on ${property.name}`);
            return true;
        }
        return false;
    }

    calculateRent(property, allProperties) {
        if (property.type === 'property') {
            if (property.hotel) {
                return property.rent.withHotel;
            } else if (property.houses > 0) {
                return property.rent.withHouse[property.houses - 1];
            } else {
                // Si posee todas las propiedades del color, la renta se duplica
                const baseRent = property.rent.base;
                return this.ownsAllOfColor(property.color, allProperties) ? baseRent * 2 : baseRent;
            }
        } else if (property.type === 'railroad') {
            const railroadCount = this.railroads.length;
            return property.rent[railroadCount] || 0;
        } else if (property.type === 'utility') {
            // La renta de servicios públicos depende de los dados y cuántos servicios posee
            const utilityCount = this.utilities.length;
            const diceRoll = this.getLastDiceRoll(); // Necesitaremos implementar esto
            return utilityCount === 1 ? diceRoll * 4 : diceRoll * 10;
        }
        return 0;
    }

    payRent(amount, toPlayer) {
        this.money -= amount;
        if (toPlayer) {
            toPlayer.money += amount;
            console.log(`${this.username} paid $${amount} rent to ${toPlayer.username}`);
        }
        
        if (this.money < 0) {
            console.log(`${this.username} is in debt!`);
        }
    }

    getLastDiceRoll() {
        // Esta función será implementada en el controlador del juego
        return window.gameInstance ? window.gameInstance.lastDiceRoll || 7 : 7;
    }

    getPlayerInfo() {
        return {
            username: this.username,
            country: this.country,
            color: this.color,
            position: this.position,
            money: this.money,
            properties: this.properties.length + this.railroads.length + this.utilities.length,
            houses: this.houses,
            hotels: this.hotels,
            isInJail: this.isInJail,
            jailTurns: this.jailTurns,
            doublesCount: this.doublesCount
        };
    }
}