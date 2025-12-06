import React, { useEffect } from 'react';

interface BoardProps {
    board: any[][];
    solution: any[][];
    givens: any[][];
    selected: { row: number; col: number } | null;
    handleSelect: (row: number, col: number, event: React.MouseEvent<HTMLButtonElement>) => void;
    loading: boolean;
    size: number;
    setBoardRef: (ref: HTMLDivElement | null) => void;
}

export const Board: React.FC<BoardProps> = ({ board, selected, handleSelect, setBoardRef }) => {
    return (
        <div className="sudoku-board" ref={setBoardRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '1px', background: '#555', padding: '2px', border: '2px solid #888' }}>
            {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                    <button
                        key={`${rowIndex}-${colIndex}`}
                        onClick={(e) => handleSelect(rowIndex, colIndex, e)}
                        style={{
                            width: '40px',
                            height: '40px',
                            background: selected?.row === rowIndex && selected?.col === colIndex ? '#aaf' : cell.isGiven ? '#ddd' : '#fff',
                            color: cell.isGiven ? '#000' : '#00f',
                            fontSize: '20px',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {cell.value || ''}
                    </button>
                ))
            )}
        </div>
    );
};
