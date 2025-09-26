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

    // Crea el tablero siguiendo el recorrido clásico de Monopoly
    initializeBoard() {
        const board = this.boardElement;
        board.innerHTML = '';
        let id = 0;

        // Fila inferior (GO a Jail)
        for (let col = 10; col >= 0; col--) {
            const cell = document.createElement('div');
            cell.className = 'space bottom-side';
            cell.id = `cell-${id}`;
            cell.style.gridRow = '11';
            cell.style.gridColumn = `${col + 1}`;
            if (col === 10) {
                cell.classList.add('corner');
                cell.dataset.corner = '10-10'; // GO
            }
            if (col === 0) {
                cell.classList.add('corner');
                cell.dataset.corner = '10-0'; // Jail
            }
            board.appendChild(cell);
            id++;
        }

        // Columna izquierda (Jail a Free Parking)
        for (let row = 9; row >= 1; row--) {
            const cell = document.createElement('div');
            cell.className = 'space left-side';
            cell.id = `cell-${id}`;
            cell.style.gridRow = `${row + 1}`;
            cell.style.gridColumn = '1';
            if (row === 1) {
                cell.classList.add('corner');
                cell.dataset.corner = '0-0'; // Free Parking
            }
            board.appendChild(cell);
            id++;
        }

        // Fila superior (Free Parking a Go to Jail)
        for (let col = 0; col <= 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'space top-side';
            cell.id = `cell-${id}`;
            cell.style.gridRow = '1';
            cell.style.gridColumn = `${col + 1}`;
            board.appendChild(cell);
            id++;
        }
        // Esquina superior derecha (Go to Jail)
        const goToJailCell = document.createElement('div');
        goToJailCell.className = 'space top-side corner';
        goToJailCell.id = `cell-${id}`;
        goToJailCell.style.gridRow = '1';
        goToJailCell.style.gridColumn = '11';
        goToJailCell.dataset.corner = '0-10';
        board.appendChild(goToJailCell);
        id++;

        // Columna derecha (Go to Jail a GO)
        for (let row = 1; row <= 9; row++) {
            const cell = document.createElement('div');
            cell.className = 'space right-side';
            cell.id = `cell-${id}`;
            cell.style.gridRow = `${row + 1}`;
            cell.style.gridColumn = '11';
            board.appendChild(cell);
            id++;
        }

        // Centro del tablero (no jugable)
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'board-center';
            board.appendChild(cell);
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

        // BOTTOM: de GO (10,10) a Jail (10,0) - posiciones 1 a 9 (excluyendo esquinas)
        this.populateRow(
            boardData.bottom.slice(1, 10), // [1..9] en orden
            'bottom-side'
        );
        // LEFT: de Jail (10,0) a Free Parking (0,0) - posiciones 1 a 9 (excluyendo esquinas), invertido para sentido clásico
        this.populateRow(
            boardData.left.slice(1, 10).reverse(), // [1..9] invertido
            'left-side'
        );
        // TOP: de Free Parking (0,0) a Go to Jail (0,10) - posiciones 0 a 8 (excluyendo esquinas)
        this.populateRow(
            boardData.top.slice(0, 9), // [0..8] en orden
            'top-side'
        );
        // RIGHT: de Go to Jail (0,10) a GO (10,10) - posiciones 0 a 8 (excluyendo esquinas), invertido para sentido clásico
        this.populateRow(
            boardData.right.slice(0, 9).reverse(), // [0..8] invertido
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