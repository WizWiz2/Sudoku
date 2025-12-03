import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Board, boxSizeFor, createBlankBoard, formatCellKey, generatePuzzle, isSolved, pickHintCell } from './sudoku';
import { initAds, showRewardedAd } from './ads';

type Cell = { row: number; col: number };

const difficulties = Array.from({ length: 10 }, (_, idx) => idx + 1);
const sizeOptions = [4, 9, 16];

const difficultyLabels: Record<number, string> = {
    1: 'Очень легко',
    2: 'Легко',
    3: 'Неспешно',
    4: 'Средне',
    5: 'Обычно',
    6: 'Продвинуто',
    7: 'Трудно',
    8: 'Эксперт',
    9: 'Без ошибок',
    10: 'Хардкор',
};

const App: React.FC = () => {
    const [difficulty, setDifficulty] = useState<number>(5);
    const [sizeIndex, setSizeIndex] = useState<number>(1); // 9x9 по умолчанию
    const size = sizeOptions[sizeIndex];
    const box = boxSizeFor(size);
    const blockRows = size / box.rows;
    const blockCols = size / box.cols;

    const [board, setBoard] = useState<Board>(createBlankBoard(size));
    const [puzzle, setPuzzle] = useState<Board>(createBlankBoard(size));
    const [solution, setSolution] = useState<Board>(createBlankBoard(size));
    const [selected, setSelected] = useState<Cell | null>(null);
    const [givens, setGivens] = useState<Set<string>>(new Set());
    const [status, setStatus] = useState<string>('Генерируем новую головоломку...');
    const [adStatus, setAdStatus] = useState<string>('');
    const [mistakes, setMistakes] = useState<number>(0);
    const [hintsUsed, setHintsUsed] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [padPos, setPadPos] = useState<{ x: number; y: number } | null>(null);
    const [gameOver, setGameOver] = useState<boolean>(false);

    const boardRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        void initAds();
    }, []);

    useEffect(() => {
        startGame(difficulty, size);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size]);

    const startGame = (level: number, gridSize: number) => {
        setLoading(true);
        setStatus('Генерируем новую сетку...');
        setPadPos(null);
        setPadPos(null);
        setSelected(null);
        setGameOver(false);
        // Immediate reset to prevent out-of-bounds access during render
        const blank = createBlankBoard(gridSize);
        setBoard(blank);
        setPuzzle(blank);
        setSolution(blank);
        setGivens(new Set());
        setTimeout(() => {
            const { puzzle: newPuzzle, solution: newSolution } = generatePuzzle(level, gridSize);
            setPuzzle(newPuzzle);
            setBoard(newPuzzle.map((row) => [...row]));
            setSolution(newSolution);
            setGivens(
                new Set(
                    newPuzzle
                        .flatMap((row, rIdx) =>
                            row.map((cell, cIdx) => ({ key: formatCellKey(rIdx, cIdx), value: cell })),
                        )
                        .filter(({ value }) => value !== 0)
                        .map(({ key }) => key),
                ),
            );
            setStatus('');
            setMistakes(0);
            setHintsUsed(0);
            setLoading(false);
        }, 30);
    };

    const handleSelect = (row: number, col: number, event: React.MouseEvent<HTMLButtonElement>) => {
        setSelected({ row, col });
        const boardRect = boardRef.current?.getBoundingClientRect();
        const cellRect = event.currentTarget.getBoundingClientRect();
        if (boardRect) {
            setPadPos({
                x: cellRect.left - boardRect.left + cellRect.width / 2,
                y: cellRect.top - boardRect.top + cellRect.height / 2,
            });
        }
    };

    const handleNumberInput = (value: number) => {
        if (!selected || loading || gameOver) return;

        const { row, col } = selected;
        const key = formatCellKey(row, col);
        if (givens.has(key)) return;

        setBoard((prev) => {
            const next = prev.map((r) => [...r]);
            next[row][col] = value;
            return next;
        });

        if (value !== 0 && value !== solution[row][col]) {
            setMistakes((m) => {
                const newMistakes = m + 1;
                if (newMistakes >= 3) {
                    setGameOver(true);
                    setStatus('Игра окончена!');
                    setSelected(null);
                }
                return newMistakes;
            });
        }

        setPadPos(null);
    };

    const resetToPuzzle = () => {
        setBoard(puzzle.map((row) => [...row]));
        setSelected(null);
        setPadPos(null);
        setMistakes(0);
        setStatus('Поле сброшено к исходнику');
        setTimeout(() => setStatus(''), 1200);
    };

    const hasNumbers = useMemo(() => board.some((row) => row.some((cell) => cell !== 0)), [board]);
    const isFull = useMemo(() => board.every((row) => row.every((cell) => cell !== 0)), [board]);
    const solved = useMemo(() => hasNumbers && isSolved(board, solution), [board, solution, hasNumbers]);

    useEffect(() => {
        if (solved && !loading) {
            setStatus('Победа! Судоку решена.');
        } else if (isFull && !solved && !loading) {
            setStatus('Поле заполнено, но есть ошибки!');
        }
    }, [solved, isFull, loading]);

    const handleWatchAdForHint = async () => {
        if (loading) return;
        setAdStatus('Показываем рекламу...');
        try {
            const result = await showRewardedAd();
            if (result === 'reward') {
                applyHint();
                setHintsUsed((h) => h + 1);
                setAdStatus('Подсказка получена за просмотр рекламы');
            } else {
                setAdStatus('Реклама закрыта без награды');
            }
        } catch (err) {
            console.error('Rewarded ad failed', err);
            setAdStatus('Реклама недоступна, даём подсказку офлайн');
            applyHint(true);
        } finally {
            setTimeout(() => setAdStatus(''), 1800);
        }
    };

    const applyHint = (fallback = false) => {
        const cell = pickHintCell(board, solution);
        if (!cell) {
            setStatus('Все клетки уже заполнены.');
            return;
        }
        const [row, col] = cell;
        const key = formatCellKey(row, col);
        if (givens.has(key)) {
            return;
        }
        setBoard((prev) => {
            const next = prev.map((r) => [...r]);
            next[row][col] = solution[row][col];
            return next;
        });
        if (fallback) {
            setStatus('Подсказка включена в офлайн-режиме.');
        }
    };

    const cellGap = 4;
    const blockGap = 12;
    const boardWidth = Math.min(900, Math.max(360, size * 48));
    const cellFont = Math.max(14, Math.min(28, Math.floor(boardWidth / size) - 6));

    const renderBlock = (blockRow: number, blockCol: number) => (
        <div
            key={`block-${blockRow}-${blockCol}`}
            className="block"
            style={{
                gridTemplateColumns: `repeat(${box.cols}, 1fr)`,
                gridTemplateRows: `repeat(${box.rows}, 1fr)`,
                gap: `${cellGap}px`,
            }}
        >
            {Array.from({ length: box.rows }).flatMap((_, rOffset) =>
                Array.from({ length: box.cols }).map((_, cOffset) => {
                    const r = blockRow * box.rows + rOffset;
                    const c = blockCol * box.cols + cOffset;
                    const rowData = board[r];
                    const solRowData = solution[r];
                    if (!rowData || !solRowData) return null;

                    const value = rowData[c];
                    const key = formatCellKey(r, c);
                    const isGiven = givens.has(key);
                    const isSelected = selected?.row === r && selected?.col === c;
                    const isConflict = value !== 0 && value !== solRowData[c];

                    return (
                        <button
                            key={key}
                            type="button"
                            className={`cell ${isGiven ? 'given' : ''} ${isSelected ? 'selected' : ''} ${isConflict ? 'conflict' : ''
                                }`}
                            onClick={(e) => handleSelect(r, c, e)}
                            disabled={loading}
                        >
                            {value !== 0 ? value : ''}
                            <span className="cell-shadow" />
                        </button>
                    );
                }),
            )}
        </div>
    );

    return (
        <div className="page">
            <div className="glass">
                <header className="top simple">
                    <div>
                        <p className="eyebrow">Судоку · {size}×{size} · 10 уровней</p>
                        <h1>Судоку</h1>
                        <ul className="rules">
                            <li>Заполните каждую строку числами 1–{size} без повторов.</li>
                            <li>В каждом столбце — те же числа без повторов.</li>
                            <li>В каждом блоке {box.rows}×{box.cols} — тоже без повторов.</li>
                            <li>Подсказку можно получить за просмотр рекламы; если рекламы нет, даём офлайн.</li>
                        </ul>
                    </div>
                </header>

                <section className="panel controls">
                    <div className="control-row">
                        <div>
                            <div className="label">Сложность: {difficulty}/10</div>
                            <div className="label subtle">{difficultyLabels[difficulty] ?? 'Обычно'}</div>
                        </div>
                        <div className="range-wrap">
                            <input
                                type="range"
                                min={1}
                                max={10}
                                value={difficulty}
                                onChange={(e) => setDifficulty(Number(e.target.value))}
                            />
                            <div className="ticks">
                                {difficulties.map((d) => (
                                    <span key={d} className={`tick ${d === difficulty ? 'active' : ''}`} />
                                ))}
                            </div>
                        </div>
                        <div className="range-wrap">
                            <div className="label">Размер поля: {size}×{size}</div>
                            <div className="label subtle">Блоки {box.rows}×{box.cols}</div>
                            <input
                                type="range"
                                min={0}
                                max={sizeOptions.length - 1}
                                step={1}
                                value={sizeIndex}
                                onChange={(e) => setSizeIndex(Number(e.target.value))}
                            />
                            <div className="ticks sizes">
                                {sizeOptions.map((s, idx) => (
                                    <span key={s} className={`tick ${idx === sizeIndex ? 'active' : ''}`}>
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button className="primary" type="button" onClick={() => startGame(difficulty, size)} disabled={loading}>
                            {loading ? 'Генерация...' : 'Новая партия'}
                        </button>
                    </div>

                    <div className="control-row wrap">
                        <div className="stat">
                            <span className="stat-label">Ошибки</span>
                            <span className="stat-value">{mistakes}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Подсказки</span>
                            <span className="stat-value">{hintsUsed}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Статус</span>
                            <span className="stat-value">{status || adStatus || 'Играем'}</span>
                        </div>
                        <div className="actions">
                            <button type="button" onClick={resetToPuzzle} disabled={loading}>
                                Сбросить
                            </button>
                            <button className="ghost" type="button" onClick={() => setSelected(null)} disabled={loading}>
                                Снять выделение
                            </button>
                            <button className="accent-btn" type="button" onClick={handleWatchAdForHint} disabled={loading}>
                                Подсказка за рекламу
                            </button>
                        </div>
                    </div>
                </section>

                <section className="board-panel">
                    <div className="board-wrapper" ref={boardRef}>
                        <div
                            className="board blocks"
                            style={{
                                width: 'min(92vw, ' + `${boardWidth}px)`,
                                ['--cell-font' as string]: `${cellFont}px`,
                                ['--cell-gap' as string]: `${cellGap}px`,
                                ['--block-gap' as string]: `${blockGap}px`,
                                gridTemplateColumns: `repeat(${blockCols}, 1fr)`,
                                gridTemplateRows: `repeat(${blockRows}, 1fr)`,
                                gap: `${blockGap}px`,
                            }}
                        >
                            {Array.from({ length: blockRows }).map((_, br) =>
                                Array.from({ length: blockCols }).map((_, bc) => renderBlock(br, bc)),
                            )}
                        </div>
                        {padPos && !gameOver && (
                            <div className="floating-pad" style={{ left: padPos.x, top: padPos.y }}>
                                {Array.from({ length: size }, (_, i) => i + 1).map((num) => (
                                    <button key={num} type="button" onClick={() => handleNumberInput(num)} disabled={loading}>
                                        {num}
                                    </button>
                                ))}
                                <button type="button" onClick={() => handleNumberInput(0)} disabled={loading} className="ghost">
                                    Очистить
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {gameOver && (
                    <div className="overlay-container">
                        <section className="panel success" style={{ borderColor: 'rgba(255, 99, 132, 0.5)', background: 'rgba(255, 99, 132, 0.1)' }}>
                            <h2>Игра окончена</h2>
                            <p>Вы допустили 3 ошибки. Попробуйте снова!</p>
                            <button className="primary" type="button" onClick={() => startGame(difficulty, size)}>
                                Новая партия
                            </button>
                        </section>
                    </div>
                )}

                {solved && (
                    <div className="overlay-container">
                        <section className="panel success">
                            <h2>Готово!</h2>
                            <p>Вы закрыли судоку {size}×{size} на уровне {difficulty}. Новая партия?</p>
                            <button className="primary" type="button" onClick={() => startGame(difficulty, size)}>
                                Новая партия
                            </button>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
