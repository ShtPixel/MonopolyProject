// Debug utilities for Monopoly game
class GameDebugger {
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
        
        const simulateButton = document.createElement('button');
        simulateButton.textContent = 'Simulate Game';
        simulateButton.className = 'btn btn-warning';
        simulateButton.style.position = 'fixed';
        simulateButton.style.bottom = '70px';
        simulateButton.style.left = '20px';
        simulateButton.style.zIndex = '1000';
        simulateButton.onclick = () => GameDebugger.simulateGame();
        
        document.body.appendChild(simulateButton);
    }, 2000);
});