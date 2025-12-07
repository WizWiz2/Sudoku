
import { generatePuzzle, boxSizeFor } from './src/sudoku';

console.log('Starting 16x16 generation test...');
const start = Date.now();
try {
    const size = 16;
    const level = 5;
    const { puzzle, solution } = generatePuzzle(level, size);
    const end = Date.now();
    console.log(`Generation took ${end - start}ms`);

    const hasNumbers = puzzle.some(row => row.some(cell => cell !== 0));
    if (hasNumbers) {
        console.log('Puzzle generated successfully with numbers');
    } else {
        console.error('Puzzle is empty (all zeros)!');
    }
} catch (e) {
    console.error('Generation failed:', e);
}
