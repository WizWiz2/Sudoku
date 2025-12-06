import React from 'react';

interface ControlsProps {
    difficulty: string;
    setDifficulty: (diff: string) => void;
    size: number;
    sizeIndex: number;
    setSizeIndex: (index: number) => void;
    sizeOptions: number[];
    mistakes: number;
    hintsUsed: number;
    status: string;
    adStatus: string;
    loading: boolean;
    resetToPuzzle: () => void;
    setSelected: (sel: any) => void;
    handleWatchAdForHint: () => void;
    startGame: () => void;
    lang?: string;
}

export const Controls: React.FC<ControlsProps> = ({ difficulty, mistakes, hintsUsed, startGame, handleWatchAdForHint, lang }) => {
    const t = (key: string) => {
        const dict: any = {
            'New Game': { en: 'New Game', ru: 'Новая игра' },
            'Mistakes': { en: 'Mistakes', ru: 'Ошибки' },
            'Hints': { en: 'Hints', ru: 'Подсказки' },
            'Get Hint': { en: 'Get Hint', ru: 'Подсказка' }
        };
        return dict[key]?.[lang || 'en'] || key;
    };

    return (
        <div className="controls" style={{ padding: '20px', color: 'white' }}>
            <button onClick={startGame} style={{ padding: '10px', marginBottom: '10px', width: '100%' }}>{t('New Game')}</button>
            <div>{t('Mistakes')}: {mistakes}/3</div>
            <div>{t('Hints')}: {hintsUsed}</div>
            <button onClick={handleWatchAdForHint} style={{ marginTop: '10px' }}>{t('Get Hint')}</button>
            <div style={{ marginTop: '20px' }}>Difficulty: {difficulty}</div>
        </div>
    );
};
