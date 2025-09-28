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
    this.mortgagedProperties = new Map(); // Map de propiedades hipotecadas (propertyId -> mortgageValue)
    this.isInJail = false;
    this.jailTurns = 0;
    this.doublesCount = 0; // Contador de dobles consecutivos
    this.element = this.createElement();
  }

  createElement() {
    const playerElement = document.createElement("div");
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
      red: "#ff4444",
      blue: "#3498db",
      green: "#2ecc71",
      yellow: "#f1c40f",
    };
    return colors[this.color] || "#333";
  }

  moveTo(newPosition) {
    console.log(
      `Moving ${this.username} from position ${this.position} to ${newPosition}`
    );

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
    console.log(
      `Placing ${this.username} on position ${this.position}`,
      spaceElement
    );

    if (spaceElement) {
      // Verificar si es una esquina (posiciones 0, 10, 20, 30)
      const isCorner = [0, 10, 20, 30].includes(this.position);

      let playersContainer = spaceElement.querySelector(".players-container");
      if (!playersContainer) {
        playersContainer = document.createElement("div");
        playersContainer.className = "players-container";

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
      if (isCorner && spaceElement.style.position !== "relative") {
        spaceElement.style.position = "relative";
      }

      playersContainer.appendChild(this.element);
      console.log(
        `${this.username} placed successfully on position ${this.position} (corner: ${isCorner})`
      );
    } else {
      console.error(
        `Could not find space element for position ${this.position}`
      );
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
      // Actualizar score en window.jugadores
      if (window.jugadores) {
        const jugador = window.jugadores.find(
          (j) => j.nombre === this.username
        );
        if (jugador) {
          jugador.score = this.money;
        }
      }
      if (property.type === "property") {
        this.properties.push({
          ...property,
          houses: 0,
          hotel: false,
          owner: this.username,
        });
      } else if (property.type === "railroad") {
        this.railroads.push({ ...property, owner: this.username });
      } else if (property.type === "utility") {
        this.utilities.push({ ...property, owner: this.username });
      }
      console.log(
        `${this.username} bought ${property.name} for $${property.price}`
      );
      return true;
    }
    console.log(
      `${this.username} cannot afford ${property.name} ($${property.price})`
    );
    return false;
  }

  ownsProperty(propertyId) {
    const id = parseInt(propertyId);
    return (
      this.properties.some((p) => parseInt(p.id) === id) ||
      this.railroads.some((r) => parseInt(r.id) === id) ||
      this.utilities.some((u) => parseInt(u.id) === id)
    );
  }

  getProperty(propertyId) {
    const id = parseInt(propertyId);
    return (
      this.properties.find((p) => parseInt(p.id) === id) ||
      this.railroads.find((r) => parseInt(r.id) === id) ||
      this.utilities.find((u) => parseInt(u.id) === id)
    );
  }

  ownsAllOfColor(color, allProperties) {
    const colorProperties = allProperties.filter((p) => p.color === color);
    const ownedColorProperties = this.properties.filter(
      (p) => p.color === color
    );
    return colorProperties.length === ownedColorProperties.length;
  }

  canBuildHouse(propertyId, allProperties) {
    const id = parseInt(propertyId);
    const property = this.properties.find((p) => parseInt(p.id) === id);
    if (!property || property.type !== "property") return false;

    // Debe poseer todas las propiedades del mismo color
    if (!this.ownsAllOfColor(property.color, allProperties)) return false;

    // No puede tener hotel
    if (property.hotel) return false;

    // Máximo 4 casas por propiedad
    if (property.houses >= 4) return false;

    // Construcción uniforme: todas las propiedades del color deben tener el mismo número de casas o una menos
    const colorProperties = this.properties.filter(
      (p) => p.color === property.color
    );
    const minHouses = Math.min(...colorProperties.map((p) => p.houses));

    return property.houses === minHouses;
  }

  buildHouse(propertyId, allProperties) {
    if (!this.canBuildHouse(propertyId, allProperties)) return false;

    const id = parseInt(propertyId);
    const property = this.properties.find((p) => parseInt(p.id) === id);
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
    const id = parseInt(propertyId);
    const property = this.properties.find((p) => parseInt(p.id) === id);
    if (!property || property.type !== "property") return false;

    // Debe poseer todas las propiedades del mismo color
    if (!this.ownsAllOfColor(property.color, allProperties)) return false;

    // Debe tener exactamente 4 casas
    return property.houses === 4 && !property.hotel;
  }

  buildHotel(propertyId, allProperties) {
    if (!this.canBuildHotel(propertyId, allProperties)) return false;

    const id = parseInt(propertyId);
    const property = this.properties.find((p) => parseInt(p.id) === id);
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
    // Si la propiedad está hipotecada, no se cobra renta
    if (this.isPropertyMortgaged(property)) {
      return 0;
    }

    if (property.type === "property") {
      if (property.hotel) {
        return property.rent.withHotel;
      } else if (property.houses > 0) {
        return property.rent.withHouse[property.houses - 1];
      } else {
        // Si posee todas las propiedades del color, la renta se duplica
        const baseRent = property.rent.base;
        return this.ownsAllOfColor(property.color, allProperties)
          ? baseRent * 2
          : baseRent;
      }
    } else if (property.type === "railroad") {
      const railroadCount = this.railroads.length;
      return property.rent[railroadCount] || 0;
    } else if (property.type === "utility") {
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
      console.log(
        `${this.username} paid $${amount} rent to ${toPlayer.username}`
      );
    }

    if (this.money < 0) {
      console.log(`${this.username} is in debt!`);
    }
  }

  getLastDiceRoll() {
    // Esta función será implementada en el controlador del juego
    return window.gameInstance ? window.gameInstance.lastDiceRoll || 7 : 7;
  }

  // ===============================
  // SISTEMA DE HIPOTECAS Y PRÉSTAMOS
  // ===============================

  /**
   * Hipoteca una propiedad para obtener liquidez
   * @param {Object} property - La propiedad a hipotecar
   * @returns {boolean} - True si se hipotecó exitosamente
   */
  mortgageProperty(property) {
    const propertyId = parseInt(property.id);

    // Verificar que la propiedad no esté ya hipotecada
    if (this.mortgagedProperties.has(propertyId)) {
      console.log(`${property.name} ya está hipotecada`);
      return false;
    }

    // Verificar que el jugador posea la propiedad
    if (!this.ownsSpecificProperty(property)) {
      console.log(`${this.username} no posee ${property.name}`);
      return false;
    }

    // No se puede hipotecar si hay construcciones en el grupo de color
    if (
      property.type === "property" &&
      this.hasConstructionsInColorGroup(property.color)
    ) {
      console.log(
        `No se puede hipotecar ${property.name}. Primero vende las construcciones del grupo ${property.color}`
      );
      return false;
    }

    // Obtener el valor de hipoteca
    const mortgageValue = property.mortgage || Math.floor(property.price * 0.5);

    // Agregar dinero al jugador
    this.money += mortgageValue;

    // Marcar como hipotecada
    this.mortgagedProperties.set(propertyId, mortgageValue);

    console.log(
      `${this.username} hipotecó ${property.name} por $${mortgageValue}`
    );
    return true;
  }

  /**
   * Deshipoteca una propiedad pagando el valor + 10% de interés
   * @param {Object} property - La propiedad a deshipotecar
   * @returns {boolean} - True si se deshipotecó exitosamente
   */
  unmortgageProperty(property) {
    const propertyId = parseInt(property.id);

    // Verificar que la propiedad esté hipotecada
    if (!this.mortgagedProperties.has(propertyId)) {
      console.log(`${property.name} no está hipotecada`);
      return false;
    }

    const mortgageValue = this.mortgagedProperties.get(propertyId);
    const paymentRequired = Math.floor(mortgageValue * 1.1); // Valor + 10% de interés

    // Verificar que el jugador tenga suficiente dinero
    if (this.money < paymentRequired) {
      console.log(
        `${this.username} no tiene suficiente dinero para deshipotecar ${property.name}. Necesita $${paymentRequired}`
      );
      return false;
    }

    // Cobrar el pago
    this.money -= paymentRequired;

    // Quitar de hipotecadas
    this.mortgagedProperties.delete(propertyId);

    console.log(
      `${this.username} deshipotecó ${property.name} por $${paymentRequired}`
    );
    return true;
  }

  /**
   * Verifica si una propiedad está hipotecada
   * @param {Object} property - La propiedad a verificar
   * @returns {boolean} - True si está hipotecada
   */
  isPropertyMortgaged(property) {
    return this.mortgagedProperties.has(parseInt(property.id));
  }

  /**
   * Obtiene la lista de propiedades hipotecadas
   * @returns {Array} - Array de objetos con información de hipotecas
   */
  getMortgagedProperties() {
    const mortgaged = [];

    // Revisar propiedades normales
    this.properties.forEach((prop) => {
      const propId = parseInt(prop.id);
      if (this.mortgagedProperties.has(propId)) {
        mortgaged.push({
          ...prop,
          mortgageValue: this.mortgagedProperties.get(propId),
          unmortgageValue: Math.floor(
            this.mortgagedProperties.get(propId) * 1.1
          ),
        });
      }
    });

    // Revisar ferrocarriles
    this.railroads.forEach((railroad) => {
      const railroadId = parseInt(railroad.id);
      if (this.mortgagedProperties.has(railroadId)) {
        mortgaged.push({
          ...railroad,
          mortgageValue: this.mortgagedProperties.get(railroadId),
          unmortgageValue: Math.floor(
            this.mortgagedProperties.get(railroadId) * 1.1
          ),
        });
      }
    });

    // Revisar servicios públicos
    this.utilities.forEach((utility) => {
      const utilityId = parseInt(utility.id);
      if (this.mortgagedProperties.has(utilityId)) {
        mortgaged.push({
          ...utility,
          mortgageValue: this.mortgagedProperties.get(utilityId),
          unmortgageValue: Math.floor(
            this.mortgagedProperties.get(utilityId) * 1.1
          ),
        });
      }
    });

    return mortgaged;
  }

  /**
   * Verifica si el jugador posee una propiedad específica (para hipotecas)
   * @param {Object} property - La propiedad a verificar
   * @returns {boolean} - True si posee la propiedad
   */
  ownsSpecificProperty(property) {
    const id = parseInt(property.id);
    return (
      this.properties.some((p) => parseInt(p.id) === id) ||
      this.railroads.some((r) => parseInt(r.id) === id) ||
      this.utilities.some((u) => parseInt(u.id) === id)
    );
  }

  /**
   * Verifica si hay construcciones en un grupo de color
   * @param {string} color - El color del grupo a verificar
   * @returns {boolean} - True si hay construcciones
   */
  hasConstructionsInColorGroup(color) {
    return this.properties
      .filter((prop) => prop.color === color)
      .some((prop) => prop.houses > 0 || prop.hotel);
  }

  /**
   * Calcula la renta considerando hipotecas
   * @param {Object} property - La propiedad para calcular renta
   * @param {Array} allProperties - Todas las propiedades del juego
   * @returns {number} - El monto de renta (0 si está hipotecada)
   */
  calculateRentWithMortgage(property, allProperties = []) {
    // Si la propiedad está hipotecada, no se cobra renta
    if (this.isPropertyMortgaged(property)) {
      return 0;
    }

    // Usar el método original de cálculo de renta
    return this.calculateRent(property, allProperties);
  }

  /**
   * Obtiene el valor total de propiedades para el puntaje final (excluyendo hipotecadas no pagadas)
   * @returns {number} - Valor total para el puntaje final
   */
  getFinalScorePropertyValue() {
    let totalValue = 0;

    // Sumar propiedades no hipotecadas
    this.properties.forEach((prop) => {
      const propId = parseInt(prop.id);
      if (!this.mortgagedProperties.has(propId)) {
        totalValue +=
          prop.price +
          prop.houses * (prop.housePrice || 100) +
          (prop.hotel ? prop.housePrice || 100 : 0);
      }
    });

    this.railroads.forEach((railroad) => {
      const railroadId = parseInt(railroad.id);
      if (!this.mortgagedProperties.has(railroadId)) {
        totalValue += railroad.price;
      }
    });

    this.utilities.forEach((utility) => {
      const utilityId = parseInt(utility.id);
      if (!this.mortgagedProperties.has(utilityId)) {
        totalValue += utility.price;
      }
    });

    return totalValue;
  }

  getPlayerInfo() {
    return {
      username: this.username,
      country: this.country,
      color: this.color,
      position: this.position,
      money: this.money,
      properties:
        this.properties.length + this.railroads.length + this.utilities.length,
      houses: this.houses,
      hotels: this.hotels,
      isInJail: this.isInJail,
      jailTurns: this.jailTurns,
      doublesCount: this.doublesCount,
      mortgagedProperties: this.getMortgagedProperties(),
      totalMortgageDebt: Array.from(this.mortgagedProperties.values()).reduce(
        (sum, value) => sum + Math.floor(value * 1.1),
        0
      ),
    };
  }
}
