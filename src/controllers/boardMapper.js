// BoardMapper: Mapea la posición lógica (0-39) a la celda visual del tablero
class BoardMapper {
    // Devuelve el elemento DOM correspondiente a la posición lógica
    static getCellElement(position) {
        // Validar posición
        if (position < 0 || position > 39) {
            console.warn(`Invalid position: ${position}. Must be between 0-39`);
            return null;
        }
        
        // Buscar el elemento por ID
        const element = document.getElementById(`cell-${position}`);
        if (!element) {
            console.warn(`Cell element not found for position ${position}`);
        }
        
        return element;
    }
    
    // Método para validar que todas las celdas estén correctamente creadas
    static validateBoard() {
        const missingCells = [];
        for (let i = 0; i < 40; i++) {
            if (!document.getElementById(`cell-${i}`)) {
                missingCells.push(i);
            }
        }
        
        if (missingCells.length > 0) {
            console.error(`Missing board cells:`, missingCells);
            return false;
        }
        
        console.log('Board validation: All 40 cells found correctly');
        return true;
    }
    
    // Método para obtener la posición lógica basada en las coordenadas de fila/columna
    static getLogicalPosition(row, col) {
        // GO (esquina inferior derecha)
        if (row === 10 && col === 10) return 0;
        
        // Bottom side (derecha a izquierda)
        if (row === 10 && col >= 1 && col <= 9) return 10 - col;
        
        // Jail (esquina inferior izquierda)
        if (row === 10 && col === 0) return 10;
        
        // Left side (abajo hacia arriba)
        if (col === 0 && row >= 1 && row <= 9) return 10 + (10 - row);
        
        // Free Parking (esquina superior izquierda)
        if (row === 0 && col === 0) return 20;
        
        // Top side (izquierda a derecha)
        if (row === 0 && col >= 1 && col <= 9) return 20 + col;
        
        // Go to Jail (esquina superior derecha)
        if (row === 0 && col === 10) return 30;
        
        // Right side (arriba hacia abajo)
        if (col === 10 && row >= 1 && row <= 9) return 30 + row;
        
        return -1; // Posición inválida
    }
}

window.BoardMapper = BoardMapper;
