import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

interface Player {
    name: string;
    totalWins: number;
}

interface Game {
    type: string;
    players: Player[];
    gameboard: Gameboard;
    turn: number;
    winCase: number;
    remainingEmptyCells: number;
}

interface Input {
    row: number;
    col: number;
}

type Cell = string;

type Row = Cell[];

// Use Map instead of two-dimensional Array for more efficient cell updating.
type Gameboard = string[][];

type Error = string;

const TIC_TAC_TOE = 'tic-tac-toe';
const GOMOKU = 'gomoku';

const playGame = (): void => {
    promptForGameType();
};

const promptForGameType = (): void => {
    rl.question(
        `Which type of board game would you like to create?
1) Tic-Tac-Toe
2) Gomoku (a.k.a. Gobang)
Your choice (type either 1 or 2): `,
        (type: string) => {
            // Invalid game type.
            if (type !== '1' && type !== '2') {
                promptForGameType();
                return;
            }

            let game = null;

            if (type === '1') {
                game = initGame(TIC_TAC_TOE);
            }

            if (type === '2') {
                game = initGame(GOMOKU);
            }

            if (game) {
                promptForInput(game);
            }
        }
    );
};

const promptForInput = (game: Game): void => {
    printGameboard(game.gameboard);

    const currentPlayer = game.players[game.turn];
    console.log(`Player ${currentPlayer.name}'s turn. Pick a cell.`);

    rl.question('(row, col): ', (rawInput: string) => {
        const [input, inputError] = validateInput(rawInput, game.gameboard);

        if (input && !inputError) {
            updateGame(input, game);
            const message = checkForWin(game);

            if (message) {
                // Show how the game is won.
                printGameboard(game.gameboard);
                // Report who wins.
                console.log(message);
                reportTotalWins(game);
                promptForReplay(game.type);
            } else {
                promptForInput(game);
            }
        } else {
            console.log(`${inputError}...Please try it again...`);
            promptForInput(game);
        }
    });
};

const initGame = (gameType: string): Game => {
    let gameboardSize = 0;
    let title = '';
    let winCase = 0;

    if (gameType === TIC_TAC_TOE) {
        gameboardSize = 3;
        winCase = 3;
        title = 'Happy Playing Tic-Tac-Toe!';
    } else {
        gameboardSize = 10;
        // Five piece in a row in either horizontal, vertical, or diagonal
        // is the win case.
        winCase = 5;
        title = 'Happy Playing Gomoku!';
    }

    console.log(title);

    const gameboard = initGameboard(gameboardSize);
    const players = initPlayers();

    const game: Game = {
        type: gameType,
        players: players,
        gameboard: gameboard,
        turn: 0,
        winCase: winCase,
        remainingEmptyCells: gameboardSize * gameboardSize
    };

    return game;
};

const initGameboard = (size: number): Gameboard => {
    const gameboard: string[][] = [];
    for (let i = 0; i < size; i++) {
        let row: string[] = [];
        for (let j = 0; j < size; j++) {
            row.push('');
        }
        gameboard.push(row);
    }
    return gameboard;
};

const initPlayers = (): Player[] => {
    const playerX: Player = {
        name: 'X',
        totalWins: 0
    };
    const playerO: Player = {
        name: 'O',
        totalWins: 0
    };
    const players: Player[] = [playerX, playerO];
    return players;
};

const printGameboard = (gameboard: Gameboard): void => {
    const emptyCell = getEmptySpaces(3);

    printHeader(gameboard.length, emptyCell);

    // Print each row.
    gameboard.forEach((row, i) => {
        printRow(row, i, emptyCell);
        if (i !== row.length - 1) {
            printHorizontalDivider(gameboard.length);
        }
    });
};

const printHorizontalDivider = (gameboardSize: number): void => {
    let horizontalDivider = '';
    for (let i = 0; i < gameboardSize - 1; i++) {
        horizontalDivider += '----';
    }
    horizontalDivider += '---';
    console.log(`${getEmptySpaces(2)}${horizontalDivider}`);
};

const printHeader = (gameboardSize: number, emptyCell: string): void => {
    let header = '';
    for (let i = 0; i < gameboardSize; i++) {
        header += emptyCell + i;
    }
    console.log(header);
};

const printRow = (row: Row, rowNum: number, emptyCell: string): void => {
    const VERTICAL_DIVIDER = '|';

    let outputRow = '';
    row.forEach((cell, i) => {
        cell = cell ? ` ${cell} ` : emptyCell;
        i === row.length - 1
            ? (outputRow += cell)
            : (outputRow += cell + VERTICAL_DIVIDER);
    });

    console.log(`${rowNum} ${outputRow}`);
};

const getEmptySpaces = (total: number): string => {
    let getEmptySpaces = '';
    for (let i = 0; i < total; i++) {
        getEmptySpaces += ' ';
    }
    return getEmptySpaces;
};

const reportTotalWins = (game: Game): void => {
    console.log('<----------------------------->');
    console.log('Report for Players Total Wins');
    game.players.forEach(player => {
        console.log(`Player ${player.name}: ${player.totalWins}`);
    });
    console.log('<----------------------------->');
};

const updateGame = (input: Input, game: Game): void => {
    // Place cell.
    game.gameboard[input.row][input.col] = game.players[game.turn].name;
    // Update remaining cells.
    game.remainingEmptyCells--;
    // Change turn.
    game.turn = game.turn === 0 ? 1 : 0;
};

const promptForReplay = (gameType: string): void => {
    rl.question(
        'Would you like to play again? (yes/no): ',
        (answer: string) => {
            switch (answer) {
                case 'yes':
                    const game = initGame(gameType);
                    promptForInput(game);
                    break;

                case 'no':
                    console.log('Thanks for playing the game!');
                    rl.close();
                    break;

                default:
                    promptForReplay(gameType);
                    break;
            }
        }
    );
};

// If the player's input is valid, it must meet 3 conditions:
// 1) input is not malformed.
// 2) input is not out of bound.
// 3) the cell has not been taken yet.
const validateInput = (
    rawInput: string,
    gameboard: Gameboard
): [Input | null, Error] => {
    const [input, convertingError] = convertRawInputToInput(rawInput);
    if (!input || convertingError) {
        return [null, convertingError];
    }

    const inputOutOfBounderror = validateInputOutOfBound(input, gameboard);
    return inputOutOfBounderror.length
        ? [input, inputOutOfBounderror]
        : [input, validateEmptyCell(input, gameboard)];
};

// Since the given rawInput from player is a string,
// we need to convert it to number for input validation and gameboard update.
const convertRawInputToInput = (rawInput: string): [Input | null, Error] => {
    const regexp = /^\s*\d+,\s*\d+\s*$/;
    if (!regexp.test(rawInput)) {
        return [
            null,
            'Invalid input. A valid input should look like this x,y.'
        ];
    }

    const [rowStr, colStr] = rawInput.trim().split(',');
    const rowIndex = parseInt(rowStr.trim());
    const colIndex = parseInt(colStr.trim());
    const input: Input = {
        row: rowIndex,
        col: colIndex
    };

    return [input, ''];
};

// We need to check if this rawInput is out of bound,
// because our gameboard has a limited size.
// Return an error if not valid, otherwise, return an empty string.
const validateInputOutOfBound = (input: Input, gameboard: Gameboard): Error => {
    const bound = gameboard.length - 1;
    return input.row > bound ||
        input.col > bound ||
        input.row < 0 ||
        input.col < 0
        ? 'Input out of bound'
        : '';
};

// Check if the cell that the player wants to place is empty or has already been placed?
const validateEmptyCell = (input: Input, gameboard: Gameboard): Error => {
    const cell: Cell = gameboard[input.row][input.col];
    return !cell ? '' : 'This cell has already been placed';
};

// Returns a message string to indicate which player wins.
// If no player wins, the message will be empty.
const checkForWin = (game: Game): string => {
    const lastMove = game.turn === 0 ? 1 : 0;

    const horizontallyConcatenatedGameboard = concatGameboard(game.gameboard);
    if (hasWinner(horizontallyConcatenatedGameboard, game)) {
        game.players[lastMove].totalWins++;
        return `Player ${game.players[lastMove].name} wins!`;
    }

    const transposedGameboard = transposeGameboard(game.gameboard);
    const verticallyConcatenatedGameboard = concatGameboard(
        transposedGameboard
    );
    if (hasWinner(verticallyConcatenatedGameboard, game)) {
        game.players[lastMove].totalWins++;
        return `Player ${game.players[lastMove].name} wins!`;
    }

    const diagonalizedGameboard = diagonalizeGameboard(game.gameboard);
    const diagonallyConcatenatedGameboard = concatGameboard(
        diagonalizedGameboard
    );
    if (hasWinner(diagonallyConcatenatedGameboard, game)) {
        game.players[lastMove].totalWins++;
        return `Player ${game.players[lastMove].name} wins!`;
    }

    const antiDiagonalizedGameboard = antiDiagonalizeGameboard(game.gameboard);
    const antiDiagonallyConcatenatedGameboard = concatGameboard(
        antiDiagonalizedGameboard
    );
    if (hasWinner(antiDiagonallyConcatenatedGameboard, game)) {
        game.players[lastMove].totalWins++;
        return `Player ${game.players[lastMove].name} wins!`;
    }

    if (game.remainingEmptyCells === 0) {
        return 'The game is tied!';
    }

    return '';
};

const concatGameboard = (gameboard: Gameboard): string => {
    const ROW_BREAK = 'B';
    const EMPTY_CELL_MARK = 'E';
    let concatenatedGameboard = '';
    gameboard.forEach(row => {
        // Convert each row to string.
        let rowStr = '';
        row.forEach(cell => {
            const cellMark = cell ? cell : EMPTY_CELL_MARK;
            rowStr += cellMark;
        });
        concatenatedGameboard += rowStr + ROW_BREAK;
    });

    return concatenatedGameboard;
};

const hasWinner = (concatenatedGameboard: string, game: Game): boolean => {
    const playerOneRegexp = new RegExp(
        `${game.players[0].name}{${game.winCase}}`
    );
    const playerTwoRegexp = new RegExp(
        `${game.players[1].name}{${game.winCase}}`
    );
    return (
        playerOneRegexp.test(concatenatedGameboard) ||
        playerTwoRegexp.test(concatenatedGameboard)
    );
};

// Rotate gameboard 90.
const transposeGameboard = (gameboard: Gameboard): Gameboard => {
    const transposedGameboard = gameboard[0].map((col, i) => {
        return gameboard.map(row => {
            return row[i];
        });
    });
    return transposedGameboard;
};

// Diagonal: top-left to bottom-right.
// Rotate gameboard for 45 degree.
const diagonalizeGameboard = (gameboard: Gameboard): Gameboard => {
    const size = gameboard.length;
    const diagonalizedGameboard: Gameboard = [];
    // Populate rows in our diagonalized gameboard.
    for (let i = 0; i <= 2 * (size - 1); i++) {
        const diagonalRow = [];
        // Determine which cell in original gameboard should go to diagonalized gameboard.
        for (let j = 0; j <= i; j++) {
            const k = i - j;
            // Only add cells that are not out of gameboard bound.
            if (j < size && k < size) {
                const cell = gameboard[j][k];
                diagonalRow.push(cell);
            }
        }
        diagonalizedGameboard.push(diagonalRow);
    }
    return diagonalizedGameboard;
};

// Anti-diagonal: top-right to bottom-left.
// Rotate gameboard for -45 degree.
const antiDiagonalizeGameboard = (gameboard: Gameboard): Gameboard => {
    const size = gameboard.length;
    const antiDiagonalizedGameboard = [];
    for (let i = 0; i <= 2 * (gameboard.length - 1); i++) {
        const antiDiagonalRow = [];
        for (let j = 0; j <= i; j++) {
            const k = size - 1 - i + j;
            if (j < size && k >= 0) {
                const cell = gameboard[j][k];
                antiDiagonalRow.push(cell);
            }
        }
        antiDiagonalizedGameboard.push(antiDiagonalRow);
    }
    return antiDiagonalizedGameboard;
};

playGame();
