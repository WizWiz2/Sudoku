import React from 'react';

interface NumberPadProps {
    padPos: { x: number; y: number };
    gameOver: boolean;
    loading: boolean;
    handleNumberInput: (num: number) => void;
    size: number;
}

export const NumberPad: React.FC<NumberPadProps> = ({ handleNumberInput }) => {
    return (
        <div className="number-pad" style={{ marginTop: '20px', display: 'flex', gap: '5px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button key={num} onClick={() => handleNumberInput(num)} style={{ padding: '10px', fontSize: '18px' }}>
                    {num}
                </button>
            ))}
        </div>
    );
};
