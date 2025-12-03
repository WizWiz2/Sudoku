export type Board = number[][];

export type BoxSize = { rows: number; cols: number };

export const boxSizeFor = (size: number): BoxSize => {
    switch (size) {
        case 4:
            return { rows: 2, cols: 2 };
        case 6:
            return { rows: 3, cols: 3 };
        case 9:
            return { rows: 3, cols: 3 };
        case 12:
            return { rows: 4, cols: 4 };
        case 16:
            return { rows: 4, cols: 4 };
        default:
            return { rows: Math.floor(Math.sqrt(size)), cols: Math.ceil(size / Math.floor(Math.sqrt(size))) };
    }
};

export const createBlankBoard = (size = 9): Board =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => 0));

const shuffle = <T,>(items: T[]): T[] => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const isValid = (board: Board, row: number, col: number, num: number, size: number, box: BoxSize): boolean => {
    for (let i = 0; i < size; i += 1) {
        if (board[row][i] === num || board[i][col] === num) {
            return false;
        }
    }

    const boxRow = Math.floor(row / box.rows) * box.rows;
    const boxCol = Math.floor(col / box.cols) * box.cols;
    for (let r = 0; r < box.rows; r += 1) {
        for (let c = 0; c < box.cols; c += 1) {
            if (board[boxRow + r][boxCol + c] === num) {
                return false;
            }
        }
    }

    return true;
};

const findEmpty = (board: Board, size: number): [number, number] | null => {
    for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
            if (board[row][col] === 0) {
                return [row, col];
            }
        }
    }
    return null;
};

const solveBoard = (board: Board, size: number, box: BoxSize): boolean => {
    const emptyCell = findEmpty(board, size);
    if (!emptyCell) {
        return true;
    }

    const [row, col] = emptyCell;
    const numbers = shuffle(Array.from({ length: size }, (_, idx) => idx + 1));
    for (const num of numbers) {
        if (isValid(board, row, col, num, size, box)) {
            board[row][col] = num;
            if (solveBoard(board, size, box)) {
                return true;
            }
            board[row][col] = 0;
        }
    }
    return false;
};

const countSolutions = (board: Board, size: number, box: BoxSize, limit = 2): number => {
    const emptyCell = findEmpty(board, size);
    if (!emptyCell) {
        return 1;
    }

    const [row, col] = emptyCell;
    let solutions = 0;
    for (let num = 1; num <= size; num += 1) {
        if (isValid(board, row, col, num, size, box)) {
            board[row][col] = num;
            solutions += countSolutions(board, size, box, limit);
            board[row][col] = 0;

            if (solutions >= limit) {
                return solutions;
            }
        }
    }
    return solutions;
};

const cloneBoard = (board: Board): Board => board.map((row) => [...row]);

const generateFullBoard = (size: number, box: BoxSize): Board => {
    const board = createBlankBoard(size);
    solveBoard(board, size, box);
    return board;
};

const targetRemovalsByLevel = (level: number, size: number): number => {
    const cells = size * size;
    const density = 0.35 + (level - 1) * 0.03; // grows with уровнем
    const remove = Math.min(Math.floor(cells * density), cells - size);
    return Math.max(remove, Math.floor(cells * 0.25));
};

export const generatePuzzle = (level: number, size: number): { puzzle: Board; solution: Board } => {
    const box = boxSizeFor(size);
    const solved = generateFullBoard(size, box);
    const puzzle = cloneBoard(solved);

    const targetEmpty = targetRemovalsByLevel(level, size);
    let removed = 0;

    const positions = shuffle(Array.from({ length: size * size }, (_, idx) => idx));
    const requireUniqueness = size <= 9; // для больших досок пропускаем дорогую проверку

    for (const idx of positions) {
        if (removed >= targetEmpty) {
            break;
        }
        const row = Math.floor(idx / size);
        const col = idx % size;

        const backup = puzzle[row][col];
        puzzle[row][col] = 0;

        if (requireUniqueness) {
            const clone = cloneBoard(puzzle);
            const solutions = countSolutions(clone, size, box, 2);
            if (solutions !== 1) {
                puzzle[row][col] = backup;
                continue;
            }
        }

        removed += 1;
    }

    return { puzzle, solution: solved };
};

export const isSolved = (board: Board, solution: Board): boolean =>
    board.length === solution.length &&
    board.every((row, rIdx) => row.every((cell, cIdx) => cell === solution[rIdx][cIdx]));

export const pickHintCell = (board: Board, solution: Board): [number, number] | null => {
    const size = board.length;
    for (let row = 0; row < size; row += 1) {
        for (let col = 0; col < size; col += 1) {
            if (board[row][col] !== solution[row][col]) {
                return [row, col];
            }
        }
    }
    return null;
};

export const formatCellKey = (row: number, col: number): string => `${row}-${col}`;
