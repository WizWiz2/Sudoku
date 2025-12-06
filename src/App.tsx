import React, { useRef, useState, useEffect } from 'react';
import { useSudokuGame } from './hooks/useSudokuGame';
import { Controls } from './components/Controls';
import { Board } from './components/Board';
import { NumberPad } from './components/NumberPad';
import { GameOverlay } from './components/GameOverlay';

const App: React.FC = () => {
    const game = useSudokuGame();
    const boardRef = useRef<HTMLDivElement | null>(null);
    const [lang, setLang] = useState<string>('en');

    useEffect(() => {
        const initSDK = async () => {
            if ((window as any).YaGames) {
                try {
                    const ysdk = await (window as any).YaGames.init();
                    (window as any).ysdk = ysdk;
                    if (ysdk.environment && ysdk.environment.i18n) {
                        setLang(ysdk.environment.i18n.lang);
                    }
                } catch (e) {
                    console.error('SDK init failed', e);
                }
            }
        };
        initSDK();

        const handleContextMenu = (e: Event) => e.preventDefault();
        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, []);

    useEffect(() => {
        if (!game.loading && (window as any).ysdk) {
            (window as any).ysdk.features.LoadingAPI?.ready();
        }
    }, [game.loading]);

    const handleSelect = (row: number, col: number, event: React.MouseEvent<HTMLButtonElement>) => {
        game.setSelected({ row, col });
        const boardRect = boardRef.current?.getBoundingClientRect();
        const cellRect = event.currentTarget.getBoundingClientRect();
        if (boardRect) {
            game.setPadPos({
                x: cellRect.left - boardRect.left + cellRect.width / 2,
                y: cellRect.top - boardRect.top + cellRect.height / 2,
            });
        }
    };

    return (
        <div className="page">
            <div className="glass">
                <aside className="sidebar">
                    <Controls
                        difficulty={game.difficulty}
                        setDifficulty={game.setDifficulty}
                        size={game.size}
                        sizeIndex={game.sizeIndex}
                        setSizeIndex={game.setSizeIndex}
                        sizeOptions={game.sizeOptions}
                        mistakes={game.mistakes}
                        hintsUsed={game.hintsUsed}
                        status={game.status}
                        adStatus={game.adStatus}
                        loading={game.loading}
                        resetToPuzzle={game.resetToPuzzle}
                        setSelected={game.setSelected}
                        handleWatchAdForHint={game.handleWatchAdForHint}
                        startGame={game.startGame}
                        lang={lang}
                    />
                </aside>
                <main className="game-area">
                    <Board
                        board={game.board}
                        solution={game.solution}
                        givens={game.givens}
                        selected={game.selected}
                        handleSelect={handleSelect}
                        loading={game.loading}
                        size={game.size}
                        setBoardRef={(ref) => (boardRef.current = ref)}
                    />
                    <NumberPad
                        padPos={game.padPos}
                        gameOver={game.gameOver}
                        loading={game.loading}
                        handleNumberInput={game.handleNumberInput}
                        size={game.size}
                    />
                </main>
                <GameOverlay
                    gameOver={game.gameOver}
                    solved={game.solved}
                    size={game.size}
                    difficulty={game.difficulty}
                    startGame={game.startGame}
                />
            </div>
        </div>
    );
};

export default App;
