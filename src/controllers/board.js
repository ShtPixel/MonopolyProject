class BoardController {
    constructor() {
        this.boardElement = document.querySelector('.board');
        this.boardData = null;
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
        for (let i = 0; i < 121; i++) {
            const cell = document.createElement('div');
            const row = Math.floor(i / 11);
            const col = i % 11;
            if (row === 0 || row === 10 || col === 0 || col === 10) {
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

    // Método para obtener información de una casilla por posición
    getSpaceByPosition(position) {
        if (!this.boardData) return null;
        
        // Mapear posición lineal a datos del tablero
        const allSpaces = [
            ...this.boardData.bottom,
            ...this.boardData.left.slice(1, 10),
            this.boardData.left[10], // Free parking
            ...this.boardData.top.slice(0, 9),
            this.boardData.top[9], // Go to jail
            ...this.boardData.right.slice(0, 9)
        ];
        
        return allSpaces[position] || null;
    }

    // Método para obtener elemento DOM de una casilla
    getSpaceElement(position) {
        const spaces = document.querySelectorAll('.space');
        
        const positionMap = [
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
            return spaces[spaceIndex];
        }
        return null;
    }
}


// Variable global para acceso desde otros controladores
let boardControllerInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    boardControllerInstance = new BoardController();
    // Exponer globalmente para acceso desde otros scripts
    window.boardControllerInstance = boardControllerInstance;
});