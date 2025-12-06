import React from 'react';

interface GameOverlayProps {
    gameOver: boolean;
    solved: boolean;
    size: number;
    difficulty: string;
    startGame: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ gameOver, solved, startGame }) => {
    if (!gameOver && !solved) return null;

    return (
        <div className="overlay" style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
            <h2>{solved ? 'You Won!' : 'Game Over'}</h2>
            <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '20px' }}>Play Again</button>
        </div>
    );
};
