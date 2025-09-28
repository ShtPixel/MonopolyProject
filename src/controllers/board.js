class BoardController {
    constructor() {
        this.boardElement = document.querySelector('.board');
        this.initializeBoard();
        this.loadBoard();
        this.players = JSON.parse(localStorage.getItem('playersData') || '[]');
    }

    // Asigna la casilla de esquina según posición
    getCornerSpace(row, col) {
        if (row === 10 && col === 10) return this.boardData.bottom[0];    // GO (Salida)
        if (row === 10 && col === 0) return this.boardData.left[0];       // Jail
        if (row === 0 && col === 0) return this.boardData.left[10];         // Free Parking
        if (row === 0 && col === 10) return this.boardData.top[9];      // Go to Jail
        return null;
    }

    createCornerContent(space) {
        const cornerClasses = {
            'Salida': 'corner-go',
            'Cárcel / Solo de visita': 'corner-jail',
            'Parqueo Gratis': 'corner-parking',
            'Ve a la Cárcel': 'corner-go-to-jail'
        };
        return `
            <div class="corner-space ${cornerClasses[space.name] || ''}">
                <div class="corner-name">${space.name}</div>
                ${space.action?.money ? `<div class="corner-action">$${Math.abs(space.action.money)}</div>` : ''}
            </div>
        `;
    }

    async loadBoard() {
        try {
            const response = await fetch('http://localhost:5000/board');
            const boardData = await response.json();
            this.boardData = boardData;
            this.populateSpaces(boardData);
        } catch (error) {
            console.error('Error loading board:', error);
        }
    }

    initializeBoard() {
        // Crear la cuadrícula 11x11 primero
        for (let i = 0; i < 121; i++) {
            const cell = document.createElement('div');
            const row = Math.floor(i / 11);
            const col = i % 11;
            let isBorde = (row === 0 || row === 10 || col === 0 || col === 10);
            if (isBorde) {
                cell.className = 'space';
                if (this.isCorner(row, col)) {
                    cell.classList.add('corner');
                    cell.dataset.corner = `${row}-${col}`;
                } else {
                    if (row === 10) cell.classList.add('bottom-side');
                    if (col === 0) cell.classList.add('left-side');
                    if (row === 0) cell.classList.add('top-side');
                    if (col === 10) cell.classList.add('right-side');
                }
            } else {
                cell.className = 'board-center';
            }
            this.boardElement.appendChild(cell);
        }
        
        // Asignar IDs en el orden correcto del Monopoly (sentido horario desde GO)
        this.assignLogicalIds();
    }
    
    assignLogicalIds() {
        // Orden correcto del Monopoly: GO (esquina inferior derecha) -> sentido horario
        const boardOrder = [
            // Esquina GO (bottom-right)
            { row: 10, col: 10, id: 0 },
            // Bottom side (derecha a izquierda)
            ...Array.from({ length: 9 }, (_, i) => ({ row: 10, col: 9 - i, id: i + 1 })),
            // Esquina Jail (bottom-left)
            { row: 10, col: 0, id: 10 },
            // Left side (abajo hacia arriba)
            ...Array.from({ length: 9 }, (_, i) => ({ row: 9 - i, col: 0, id: i + 11 })),
            // Esquina Free Parking (top-left)
            { row: 0, col: 0, id: 20 },
            // Top side (izquierda a derecha)
            ...Array.from({ length: 9 }, (_, i) => ({ row: 0, col: i + 1, id: i + 21 })),
            // Esquina Go to Jail (top-right)
            { row: 0, col: 10, id: 30 },
            // Right side (arriba hacia abajo)
            ...Array.from({ length: 9 }, (_, i) => ({ row: i + 1, col: 10, id: i + 31 }))
        ];
        
        // Asignar IDs según el orden lógico
        boardOrder.forEach(({ row, col, id }) => {
            const cellIndex = row * 11 + col;
            const cell = this.boardElement.children[cellIndex];
            if (cell && cell.classList.contains('space')) {
                cell.id = `cell-${id}`;
            }
        });
    }

    isCorner(row, col) {
        return (row === 0 && col === 0) ||
               (row === 0 && col === 10) ||
               (row === 10 && col === 0) ||
               (row === 10 && col === 10);
    }

    // SRP: Poblar todas las casillas del borde
    populateSpaces(boardData) {
        // Esquinas
        document.querySelectorAll('.corner').forEach(corner => {
            const [row, col] = corner.dataset.corner.split('-').map(Number);
            const cornerSpace = this.getCornerSpace(row, col);
            if (cornerSpace) {
                corner.innerHTML = this.createCornerContent(cornerSpace);
            }
        });

        // Lados (sentido clásico del tablero)
        // BOTTOM: de derecha a izquierda (excluyendo esquinas)
        this.populateRow(
            boardData.bottom.slice(1).reverse(), // [1..9] invertido
            'bottom-side'
        );
        // LEFT: de abajo a arriba (excluyendo esquinas)
        this.populateRow(
            boardData.left.slice(1, 10).reverse(), // [1..9] invertido
            'left-side'
        );
        // TOP: de izquierda a derecha (excluyendo esquinas)
        this.populateRow(
            boardData.top.slice(0, 9), // [0..8]
            'top-side'
        );
        // RIGHT: de arriba a abajo (excluyendo esquinas)
        this.populateRow(
            boardData.right.slice(0, 9), // [0..8]
            'right-side'
        );
    }

    // SRP: Poblar una fila/lado
    populateRow(spaces, className) {
        const elements = document.querySelectorAll(`.${className}`);
        spaces.forEach((space, index) => {
            if (elements[index]) {
                elements[index].innerHTML = this.createSpaceContent(space);
            }
        });
    }

    // SRP: Renderizar contenido de una casilla
    createSpaceContent(space) {
        if (!space) return '';
        let content = '';
        if (space.type === 'property') {
            content = `
                <div class="color-band ${space.color}"></div>
                <div class="space-name">${space.name}</div>
                <div class="space-price">$${space.price}</div>
            `;
        } else if (space.type === 'railroad') {
            content = `
                <div class="space-name">${space.name}</div>
                <div class="space-price">$${space.price}</div>
            `;
        } else if (space.type === 'tax') {
            content = `
                <div class="space-name">${space.name}</div>
                <div class="space-price">-$${Math.abs(space.action?.money || 0)}</div>
            `;
        } else if (space.type === 'chance') {
            content = `
                <div class="space-name">Sorpresa</div>
                <div>?</div>
            `;
        } else if (space.type === 'community_chest') {
            content = `
                <div class="space-name">Caja de Comunidad</div>
            `;
        } else {
            content = `
                <div class="space-name">${space.name || space.type}</div>
            `;
        }
        return content;
    }
    
    // Método para obtener información de una casilla por posición lógica
    getSpaceByPosition(position) {
        if (!this.boardData) return null;
        
        // Mapear posición lógica (0-39) a la data del tablero
        if (position === 0) {
            return this.boardData.bottom[0]; // GO
        } else if (position >= 1 && position <= 9) {
            return this.boardData.bottom[position]; // Bottom side
        } else if (position === 10) {
            return this.boardData.left[0]; // Jail
        } else if (position >= 11 && position <= 19) {
            return this.boardData.left[position - 10]; // Left side
        } else if (position === 20) {
            return this.boardData.top[9]; // Free Parking (last in top array)
        } else if (position >= 21 && position <= 29) {
            return this.boardData.top[29 - position]; // Top side (reversed)
        } else if (position === 30) {
            return this.boardData.right[9]; // Go to Jail (last in right array)
        } else if (position >= 31 && position <= 39) {
            return this.boardData.right[39 - position]; // Right side (reversed)
        }
        
        return null;
    }
}

let boardControllerInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    boardControllerInstance = new BoardController();
    window.boardControllerInstance = boardControllerInstance;
});