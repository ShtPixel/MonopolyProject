// Debug utilities for Monopoly game
class GameDebugger {
    static testPropertyMechanics() {
        console.log('=== TESTING PROPERTY MECHANICS ===');
        
        if (!window.gameInstance) {
            console.log('Game instance not available');
            return;
        }
        
        const game = window.gameInstance;
        const player = game.players[0];
        
        if (!player) {
            console.log('No players available');
            return;
        }
        
        console.log('Testing with player:', player.username);
        console.log('Player money:', player.money);
        
        // Simular datos de propiedad para prueba
        const testProperty = {
            id: 1,
            name: "Avenida Mediterráneo",
            type: "property",
            color: "brown",
            price: 60,
            mortgage: 30,
            rent: {
                base: 2,
                withHouse: [10, 30, 90, 160],
                withHotel: 250
            }
        };
        
        // Probar compra de propiedad
        console.log('--- Testing Property Purchase ---');
        if (player.buyProperty(testProperty)) {
            console.log('✓ Property purchased successfully');
            console.log('Player money after purchase:', player.money);
            console.log('Player properties:', player.properties.length);
        } else {
            console.log('✗ Failed to purchase property');
        }
        
        // Probar construcción de casas
        console.log('--- Testing House Construction ---');
        if (game.getAllProperties && game.getAllProperties().length > 0) {
            const allProperties = [testProperty]; // Usar propiedad de prueba
            
            if (player.canBuildHouse(testProperty.id, allProperties)) {
                console.log('✓ Can build house');
                if (player.buildHouse(testProperty.id, allProperties)) {
                    console.log('✓ House built successfully');
                    console.log('Houses on property:', player.properties[0]?.houses || 0);
                }
            } else {
                console.log('Cannot build house - need all properties of same color');
            }
        }
        
        // Probar cálculo de renta
        console.log('--- Testing Rent Calculation ---');
        if (player.properties.length > 0) {
            const rent = player.calculateRent(player.properties[0], [testProperty]);
            console.log('Calculated rent:', rent);
        }
        
        console.log('=== PROPERTY MECHANICS TEST COMPLETE ===');
    }

    static testCardActions() {
        console.log('=== TESTING CARD ACTIONS ===');
        
        if (!window.gameInstance) {
            console.log('Game instance not available');
            return;
        }
        
        const game = window.gameInstance;
        const player = game.players[0];
        
        if (!player) {
            console.log('No players available');
            return;
        }
        
        const initialMoney = player.money;
        console.log('Player initial money:', initialMoney);
        
        // Simular carta de Sorpresa
        console.log('--- Testing Chance Card ---');
        game.handleChanceSpace(player);
        
        setTimeout(() => {
            console.log('Player money after chance card:', player.money);
            
            // Simular carta de Caja de Comunidad
            console.log('--- Testing Community Chest Card ---');
            game.handleCommunityChestSpace(player);
            
            setTimeout(() => {
                console.log('Player money after community chest card:', player.money);
                console.log('=== CARD ACTIONS TEST COMPLETE ===');
            }, 1000);
        }, 1000);
    }

    static testAllGameMechanics() {
        console.log('=== TESTING ALL GAME MECHANICS ===');
        
        // Ejecutar todas las pruebas en secuencia
        this.testPropertyMechanics();
        
        setTimeout(() => {
            this.testCardActions();
        }, 2000);
        
        setTimeout(() => {
            console.log('=== ALL TESTS COMPLETE ===');
        }, 5000);
    }
    
    static testEndGame() {
        console.log('=== TESTING END GAME ===');
        
        if (window.gameInstance) {
            // Modificar estadísticas de jugadores para hacer la prueba más interesante
            window.gameInstance.players.forEach((player, index) => {
                player.money = 1500 - (index * 300); // Diferentes cantidades de dinero
                player.properties = Math.floor(Math.random() * 10); // Propiedades aleatorias
                if (index === window.gameInstance.players.length - 1) {
                    player.money = -200; // Último jugador en bancarrota
                }
            });
            
            console.log('Modified player stats for testing');
            console.log('Players:', window.gameInstance.players.map(p => ({
                name: p.username,
                money: p.money,
                properties: p.properties.length
            })));
            
            // Simular finalización del juego
            window.gameInstance.finalizeGame();
        } else {
            console.log('Game instance not available');
        }
    }
    
    static testCornerElements() {
        console.log('=== CORNER ELEMENTS DEBUG ===');
        
        const cornerPositions = [0, 10, 20, 30]; // GO, Jail, Parking, Go to Jail
        const cornerNames = ['GO', 'Jail', 'Free Parking', 'Go to Jail'];
        
        cornerPositions.forEach((pos, index) => {
            console.log(`\n--- Testing Corner ${cornerNames[index]} (Position ${pos}) ---`);
            
            const element = document.getElementById(`cell-${pos}`);
            if (element) {
                console.log(`✓ Element found: ${element.id}`);
                console.log(`  Classes: ${element.className}`);
                console.log(`  Has corner-space: ${element.querySelector('.corner-space') ? 'Yes' : 'No'}`);
                console.log(`  Has players-container: ${element.querySelector('.players-container') ? 'Yes' : 'No'}`);
                console.log(`  Position style: ${element.style.position || 'default'}`);
                
                // Test if we can place a player here
                const testPlayer = document.createElement('div');
                testPlayer.className = 'player-piece test-player';
                testPlayer.style.backgroundColor = '#ff0000';
                testPlayer.innerHTML = '<div class="player-icon">T</div>';
                
                let playersContainer = element.querySelector('.players-container');
                if (!playersContainer) {
                    playersContainer = document.createElement('div');
                    playersContainer.className = 'players-container';
                    element.appendChild(playersContainer);
                    console.log('  Created new players-container');
                }
                
                playersContainer.appendChild(testPlayer);
                console.log('  ✓ Test player placed successfully');
                
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
        console.log('=== BOARD DEBUG INFO ===');
        
        const spaces = document.querySelectorAll('.space');
        console.log(`Total spaces found: ${spaces.length}`);
        
        // Log first few spaces for verification
        for (let i = 0; i < Math.min(5, spaces.length); i++) {
            console.log(`Space ${i}:`, spaces[i]);
        }
        
        if (window.boardControllerInstance) {
            console.log('BoardController instance available:', window.boardControllerInstance);
        } else {
            console.log('BoardController instance NOT available');
        }
        
        if (window.gameInstance) {
            console.log('Game instance available:', window.gameInstance);
            console.log('Players:', window.gameInstance.players);
        } else {
            console.log('Game instance NOT available');
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
            console.log('No players available for testing');
        }
    }
    
    static logGameState() {
        console.log('=== GAME STATE ===');
        if (window.gameInstance) {
            console.log('Game active:', window.gameInstance.isGameActive);
            console.log('Current player index:', window.gameInstance.currentPlayerIndex);
            console.log('Current player:', window.gameInstance.getCurrentPlayer().username);
            window.gameInstance.players.forEach((player, index) => {
                console.log(`Player ${index}: ${player.username} at position ${player.position}`);
            });
        }
    }
    
    static simulateGame() {
        console.log('Starting game simulation...');
        
        // Wait for game to be ready
        setTimeout(() => {
            if (window.gameInstance) {
                // Simulate dice rolls for testing
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        const diceValue = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
                        document.getElementById('sumLabel').textContent = `Suma: ${diceValue}`;
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

// Add debug button to board
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Debug Board';
        debugButton.className = 'btn btn-secondary';
        debugButton.style.position = 'fixed';
        debugButton.style.bottom = '20px';
        debugButton.style.left = '20px';
        debugButton.style.zIndex = '1000';
        debugButton.onclick = () => GameDebugger.logBoardState();
        
        document.body.appendChild(debugButton);
        
        const cornerButton = document.createElement('button');
        cornerButton.textContent = 'Debug Corners';
        cornerButton.className = 'btn btn-info';
        cornerButton.style.position = 'fixed';
        cornerButton.style.bottom = '70px';
        cornerButton.style.left = '20px';
        cornerButton.style.zIndex = '1000';
        cornerButton.onclick = () => GameDebugger.testCornerElements();
        
        document.body.appendChild(cornerButton);
        
        const simulateButton = document.createElement('button');
        simulateButton.textContent = 'Simulate Game';
        simulateButton.className = 'btn btn-warning';
        simulateButton.style.position = 'fixed';
        simulateButton.style.bottom = '120px';
        simulateButton.style.left = '20px';
        simulateButton.style.zIndex = '1000';
        simulateButton.onclick = () => GameDebugger.simulateGame();
        
        document.body.appendChild(simulateButton);
        
        const endGameButton = document.createElement('button');
        endGameButton.textContent = 'Test End Game';
        endGameButton.className = 'btn btn-danger';
        endGameButton.style.position = 'fixed';
        endGameButton.style.bottom = '170px';
        endGameButton.style.left = '20px';
        endGameButton.style.zIndex = '1000';
        endGameButton.onclick = () => GameDebugger.testEndGame();
        
        document.body.appendChild(endGameButton);
        
        const mechanicsButton = document.createElement('button');
        mechanicsButton.textContent = 'Test Mechanics';
        mechanicsButton.className = 'btn btn-info';
        mechanicsButton.style.position = 'fixed';
        mechanicsButton.style.bottom = '220px';
        mechanicsButton.style.left = '20px';
        mechanicsButton.style.zIndex = '1000';
        mechanicsButton.onclick = () => GameDebugger.testAllGameMechanics();
        
        document.body.appendChild(mechanicsButton);
    }, 2000);
});