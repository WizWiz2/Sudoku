import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Board, boxSizeFor, createBlankBoard, formatCellKey, generatePuzzle, isSolved, pickHintCell } from './sudoku';
import { getYandexSdk, initAds, showRewardedAd } from './ads';

type Cell = { row: number; col: number };
type Lang = 'en' | 'ru';

const difficulties = Array.from({ length: 10 }, (_, idx) => idx + 1);
const sizeOptions = [4, 9, 16];

const translations = {
    en: {
        heroBadge: '{size}×{size} logic challenge',
        heroTitle: 'Sudoku Challenge',
        heroRuleRow: 'Fill every row with digits 1–{size} without repeats.',
        heroRuleColumn: 'Each column must also contain all digits exactly once.',
        heroRuleBox: 'Each {rows}×{cols} block needs the full set of digits.',
        heroRuleHint: 'Use hints wisely: rewarded ads can unlock an extra hint.',
        labelDifficulty: 'Difficulty: {value}/10',
        labelSize: 'Grid size: {value}×{value}',
        labelBox: 'Subgrid: {rows}×{cols}',
        buttonNewPuzzle: 'New puzzle',
        buttonGenerating: 'Generating...',
        statMistakes: 'Mistakes',
        statHints: 'Hints used',
        statStatus: 'Status',
        statIdle: 'Stable',
        actionReset: 'Reset board',
        actionClearSelection: 'Clear selection',
        actionWatchAd: 'Watch ad for hint',
        statusGenerating: 'Generating puzzle...',
        statusReset: 'Board reset to initial state.',
        statusLose: 'Game over!',
        statusSolved: 'Great! Puzzle solved.',
        statusInvalid: 'Board is full but contains mistakes.',
        statusNoHint: 'All cells are already filled.',
        statusOfflineHint: 'Hint granted in offline mode.',
        adWatching: 'Showing ad...',
        adReward: 'Hint unlocked!',
        adDismissed: 'Ad closed without reward.',
        adFailed: 'Ad unavailable, granting offline hint.',
        overlayLoseTitle: 'Out of attempts',
        overlayLoseText: 'You hit the limit of 3 mistakes. Try again!',
        overlayWinTitle: 'Victory!',
        overlayWinText: 'Solved a {size}×{size} puzzle on difficulty {difficulty}. Want another challenge?',
        floatingPadClear: 'Clear cell',
    },
    ru: {
        heroBadge: 'Премиальное судоку {size}×{size}',
        heroTitle: 'Судоку Мастер',
        heroRuleRow: 'Заполните каждую строку числами 1–{size} без повторов.',
        heroRuleColumn: 'Каждый столбец также должен содержать все числа по одному разу.',
        heroRuleBox: 'Каждый блок {rows}×{cols} должен содержать полный набор цифр.',
        heroRuleHint: 'Используйте подсказки с умом: просмотр рекламы открывает дополнительную подсказку.',
        labelDifficulty: 'Сложность: {value}/10',
        labelSize: 'Размер сетки: {value}×{value}',
        labelBox: 'Блок: {rows}×{cols}',
        buttonNewPuzzle: 'Новая головоломка',
        buttonGenerating: 'Генерация...',
        statMistakes: 'Ошибки',
        statHints: 'Подсказки',
        statStatus: 'Статус',
        statIdle: 'Стабильно',
        actionReset: 'Сбросить поле',
        actionClearSelection: 'Снять выделение',
        actionWatchAd: 'Подсказка за рекламу',
        statusGenerating: 'Генерируем головоломку...',
        statusReset: 'Поле возвращено к исходнику.',
        statusLose: 'Игра окончена!',
        statusSolved: 'Победа! Судоку решена.',
        statusInvalid: 'Поле заполнено, но есть ошибки.',
        statusNoHint: 'Все клетки уже заполнены.',
        statusOfflineHint: 'Подсказка выдана офлайн.',
        adWatching: 'Показываем рекламу...',
        adReward: 'Подсказка получена.',
        adDismissed: 'Реклама закрыта без награды.',
        adFailed: 'Нет рекламы, выдаём офлайн-подсказку.',
        overlayLoseTitle: 'Попытки исчерпаны',
        overlayLoseText: 'Лимит в 3 ошибки исчерпан. Попробуйте снова!',
        overlayWinTitle: 'Отличный результат!',
        overlayWinText: 'Вы решили сетку {size}×{size} на сложности {difficulty}. Хотите продолжить?',
        floatingPadClear: 'Очистить клетку',
    },
} as const;

type TranslationDict = typeof translations.en;
type TranslationKey = keyof TranslationDict;
type MessageDescriptor = { key: TranslationKey; params?: Record<string, string | number> } | null;

const difficultyDescriptions: Record<number, { en: string; ru: string }> = {
    1: { en: 'Very relaxed', ru: 'Очень легко' },
    2: { en: 'Easy ride', ru: 'Легко' },
    3: { en: 'No rush', ru: 'Неспешно' },
    4: { en: 'Balanced', ru: 'Средне' },
    5: { en: 'Classic', ru: 'Обычно' },
    6: { en: 'Advanced', ru: 'Продвинуто' },
    7: { en: 'Challenging', ru: 'Трудно' },
    8: { en: 'Expert', ru: 'Эксперт' },
    9: { en: 'Flawless', ru: 'Без ошибок' },
    10: { en: 'Hardcore', ru: 'Хардкор' },
};

const resolveLang = (code?: string): Lang => (code?.toLowerCase().startsWith('ru') ? 'ru' : 'en');

const interpolate = (template: string, params?: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, token) => String(params?.[token] ?? ''));

const translate = (lang: Lang, key: TranslationKey, params?: Record<string, string | number>) => {
    const dict = translations[lang] ?? translations.en;
    const template = dict[key] ?? translations.en[key];
    return template ? interpolate(template, params) : key;
};

const App: React.FC = () => {
    const [lang, setLang] = useState<Lang>(resolveLang(typeof navigator !== 'undefined' ? navigator.language : 'en'));
    const [difficulty, setDifficulty] = useState<number>(5);
    const [sizeIndex, setSizeIndex] = useState<number>(1);
    const size = sizeOptions[sizeIndex];
    const box = boxSizeFor(size);
    const blockRows = size / box.rows;
    const blockCols = size / box.cols;

    const [board, setBoard] = useState<Board>(createBlankBoard(size));
    const [puzzle, setPuzzle] = useState<Board>(createBlankBoard(size));
    const [solution, setSolution] = useState<Board>(createBlankBoard(size));
    const [selected, setSelected] = useState<Cell | null>(null);
    const [givens, setGivens] = useState<Set<string>>(new Set());
    const [statusMessage, setStatusMessage] = useState<MessageDescriptor>({ key: 'statusGenerating' });
    const [adMessage, setAdMessage] = useState<MessageDescriptor>(null);
    const [mistakes, setMistakes] = useState<number>(0);
    const [hintsUsed, setHintsUsed] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [padPos, setPadPos] = useState<{ x: number; y: number } | null>(null);
    const [gameOver, setGameOver] = useState<boolean>(false);

    const boardRef = useRef<HTMLDivElement | null>(null);

    const t = useCallback((key: TranslationKey, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);
    const statusText = statusMessage ? t(statusMessage.key, statusMessage.params) : '';
    const adStatusText = adMessage ? t(adMessage.key, adMessage.params) : '';

    useEffect(() => {
        let cancelled = false;
        const blockContextMenu = (event: Event) => event.preventDefault();
        document.addEventListener('contextmenu', blockContextMenu);

        const bootstrapSdk = async () => {
            try {
                await initAds();
            } catch (err) {
                console.warn('Ads init failed', err);
            }
            let sdk = window.ysdk ?? getYandexSdk();
            if (!sdk && window.YaGames) {
                try {
                    sdk = await window.YaGames.init();
                    window.ysdk = sdk;
                } catch (err) {
                    console.warn('YaGames init error', err);
                }
            }
            const langCode = sdk?.environment?.i18n?.lang ?? (typeof navigator !== 'undefined' ? navigator.language : 'en');
            if (!cancelled) {
                setLang(resolveLang(langCode));
            }
            sdk?.features?.LoadingAPI?.ready?.();
            sdk?.features?.GameReadyAPI?.ready?.();
        };

        void bootstrapSdk();

        return () => {
            cancelled = true;
            document.removeEventListener('contextmenu', blockContextMenu);
        };
    }, []);

    useEffect(() => {
        startGame(difficulty, size);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size]);

    const startGame = (level: number, gridSize: number) => {
        setLoading(true);
        setStatusMessage({ key: 'statusGenerating' });
        setPadPos(null);
        setSelected(null);
        setGameOver(false);
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
            setStatusMessage(null);
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
                    setStatusMessage({ key: 'statusLose' });
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
        setStatusMessage({ key: 'statusReset' });
        setTimeout(() => setStatusMessage(null), 1200);
    };

    const hasNumbers = useMemo(() => board.some((row) => row.some((cell) => cell !== 0)), [board]);
    const isFull = useMemo(() => board.every((row) => row.every((cell) => cell !== 0)), [board]);
    const solved = useMemo(() => hasNumbers && isSolved(board, solution), [board, solution, hasNumbers]);

    useEffect(() => {
        if (solved && !loading) {
            setStatusMessage({ key: 'statusSolved' });
        } else if (isFull && !solved && !loading) {
            setStatusMessage({ key: 'statusInvalid' });
        }
    }, [solved, isFull, loading]);

    const handleWatchAdForHint = async () => {
        if (loading) return;
        setAdMessage({ key: 'adWatching' });
        try {
            const result = await showRewardedAd();
            if (result === 'reward') {
                applyHint();
                setHintsUsed((h) => h + 1);
                setAdMessage({ key: 'adReward' });
            } else {
                setAdMessage({ key: 'adDismissed' });
            }
        } catch (err) {
            console.error('Rewarded ad failed', err);
            setAdMessage({ key: 'adFailed' });
            applyHint(true);
        } finally {
            setTimeout(() => setAdMessage(null), 2000);
        }
    };

    const applyHint = (fallback = false) => {
        const cell = pickHintCell(board, solution);
        if (!cell) {
            setStatusMessage({ key: 'statusNoHint' });
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
            setStatusMessage({ key: 'statusOfflineHint' });
        }
    };

    const cellGap = 4;
    const blockGap = 12;
    const boardWidth = Math.min(900, Math.max(360, size * 48));
    const boardWidthStyle = `min(92vw, calc(100vh - 260px), ${boardWidth}px)`;
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
                            className={`cell ${isGiven ? 'given' : ''} ${isSelected ? 'selected' : ''} ${isConflict ? 'conflict' : ''}`}
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

    const difficultyDescription = difficultyDescriptions[difficulty]?.[lang] ?? difficultyDescriptions[difficulty]?.en ?? '';

    return (
        <div className="page">
            <div className="glass">
                <header className="top simple">
                    <div>
                        <p className="eyebrow">{t('heroBadge', { size })}</p>
                        <h1>{t('heroTitle')}</h1>
                        <ul className="rules">
                            <li>{t('heroRuleRow', { size })}</li>
                            <li>{t('heroRuleColumn')}</li>
                            <li>{t('heroRuleBox', { rows: box.rows, cols: box.cols })}</li>
                            <li>{t('heroRuleHint')}</li>
                        </ul>
                    </div>
                </header>

                <section className="panel controls">
                    <div className="control-row">
                        <div>
                            <div className="label">{t('labelDifficulty', { value: difficulty })}</div>
                            <div className="label subtle">{difficultyDescription}</div>
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
                            <div className="label">{t('labelSize', { value: size })}</div>
                            <div className="label subtle">{t('labelBox', { rows: box.rows, cols: box.cols })}</div>
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
                            {loading ? t('buttonGenerating') : t('buttonNewPuzzle')}
                        </button>
                    </div>

                    <div className="control-row wrap">
                        <div className="stat">
                            <span className="stat-label">{t('statMistakes')}</span>
                            <span className="stat-value">{mistakes}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">{t('statHints')}</span>
                            <span className="stat-value">{hintsUsed}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">{t('statStatus')}</span>
                            <span className="stat-value">{statusText || adStatusText || t('statIdle')}</span>
                        </div>
                        <div className="actions">
                            <button type="button" onClick={resetToPuzzle} disabled={loading}>
                                {t('actionReset')}
                            </button>
                            <button className="ghost" type="button" onClick={() => setSelected(null)} disabled={loading}>
                                {t('actionClearSelection')}
                            </button>
                            <button className="accent-btn" type="button" onClick={handleWatchAdForHint} disabled={loading}>
                                {t('actionWatchAd')}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="board-panel">
                    <div className="board-wrapper" ref={boardRef}>
                        <div
                            className="board blocks"
                            style={{
                                width: boardWidthStyle,
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
                                    {t('floatingPadClear')}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {gameOver && (
                    <div className="overlay-container">
                        <section className="panel success" style={{ borderColor: 'rgba(255, 99, 132, 0.5)', background: 'rgba(255, 99, 132, 0.1)' }}>
                            <h2>{t('overlayLoseTitle')}</h2>
                            <p>{t('overlayLoseText')}</p>
                            <button className="primary" type="button" onClick={() => startGame(difficulty, size)}>
                                {t('buttonNewPuzzle')}
                            </button>
                        </section>
                    </div>
                )}

                {solved && (
                    <div className="overlay-container">
                        <section className="panel success">
                            <h2>{t('overlayWinTitle')}</h2>
                            <p>{t('overlayWinText', { size, difficulty })}</p>
                            <button className="primary" type="button" onClick={() => startGame(difficulty, size)}>
                                {t('buttonNewPuzzle')}
                            </button>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;
