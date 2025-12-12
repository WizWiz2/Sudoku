import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Board, boxSizeFor, createBlankBoard, formatCellKey, generatePuzzle, isSolved, pickHintCell } from './sudoku';
import { getYandexSdk, initAds, showRewardedAd } from './ads';

type Cell = { row: number; col: number };
type Lang = 'en' | 'ru';


const sizeOptions = [4, 9, 16];

const translations = {
    en: {
        heroBadge: '{size}×{size} logic challenge',
        heroTitle: 'Sudoku Game',
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
        heroTitle: 'Головоломка Судоку',
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
    const [, setPuzzle] = useState<Board>(createBlankBoard(size));
    const [solution, setSolution] = useState<Board>(createBlankBoard(size));
    const [selected, setSelected] = useState<Cell | null>(null);
    const [givens, setGivens] = useState<Set<string>>(new Set());
    const [, setStatusMessage] = useState<MessageDescriptor>({ key: 'statusGenerating' });
    const [, setAdMessage] = useState<MessageDescriptor>(null);
    const [mistakes, setMistakes] = useState<number>(0);
    const [hintsUsed, setHintsUsed] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [padPos, setPadPos] = useState<{ x: number; y: number } | null>(null);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [sdkReady, setSdkReady] = useState<boolean>(false);

    const boardRef = useRef<HTMLDivElement | null>(null);

    const t = useCallback((key: TranslationKey, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);


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
                setSdkReady(true);
            }
            sdk?.features?.LoadingAPI?.ready?.();
        };

        void bootstrapSdk();

        return () => {
            cancelled = true;
            document.removeEventListener('contextmenu', blockContextMenu);
        };
    }, []);

    // Report Game Ready when loading finishes AND sdk is ready
    useEffect(() => {
        if (!loading && sdkReady) {
            window.ysdk?.features?.GameReadyAPI?.ready?.();
        }
    }, [loading, sdkReady]);

    useEffect(() => {
        if (sdkReady) {
            startGame(difficulty, size);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [size, sdkReady]);

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

        const cellRect = event.currentTarget.getBoundingClientRect();
        // Use board bounds as constraint
        const boardRect = boardRef.current?.getBoundingClientRect() ?? {
            left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight
        };

        const padWidth = 180;
        // Accurate height estimation
        // CSS: width 180, padding 12, gap 8. Col width ~46.6px. Button height ~47px.
        // Grid: ceil(size/3) rows of numbers.
        // Ghost button (Clear): 36px height.
        // Total Height = PaddingTop(12) + NumRows * (47 + 8) - 8 (last gap) + 8 (gap before clear) + Clear(36) + PaddingBot(12)?
        // Simplified: 24 (padding) + NumRows * 55 + 44 (Clear + gap).
        const numRows = Math.ceil(size / 3);
        const padHeight = 24 + numRows * 55 + 44;

        // 1. Horizontal Positioning (Center with Clamp)
        let x = cellRect.left + cellRect.width / 2;
        const minX = boardRect.left + padWidth / 2 + 4; // +4 margin
        const maxX = boardRect.right - padWidth / 2 - 4;
        x = Math.max(minX, Math.min(x, maxX));

        // 2. Vertical Positioning (Priority: Below > Above > Clamped)
        const gap = 8;
        let y = cellRect.bottom + gap;

        // Check fit below
        if (y + padHeight > boardRect.bottom) {
            // Check fit above
            const yAbove = cellRect.top - gap - padHeight;
            if (yAbove >= boardRect.top) {
                y = yAbove;
            } else {
                // Doesn't fit perfectly below OR above.
                // Clamp to bottom of board (safest "never leave board")
                y = boardRect.bottom - padHeight - gap;
                // Ensure it doesn't go off top
                y = Math.max(boardRect.top + gap, y);
            }
        }

        setPadPos({ x, y });
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
        // Keep selection active for easier typing? Or close? User request implies "pop up", maybe keep open?
        // Usually clicking a number closes the pad.
        setPadPos(null);
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
    // Dynamic sizing moved to CSS mostly, but we define grid connection here
    // We pass '--grid-size': size to CSS

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
        <div className="page" onContextMenu={(e) => e.preventDefault()}>
            <div className="glass">
                <section className="board-panel">
                    <div className="board-wrapper" ref={boardRef}>
                        <div
                            className="board blocks"
                            style={{
                                ['--cell-gap' as string]: `${cellGap}px`,
                                ['--block-gap' as string]: `${blockGap}px`,
                                ['--grid-size' as string]: size,
                                gridTemplateColumns: `repeat(${blockCols}, 1fr)`,
                                gridTemplateRows: `repeat(${blockRows}, 1fr)`,
                                gap: `${blockGap}px`,
                            }}
                        >
                            {Array.from({ length: blockRows }).map((_, br) =>
                                Array.from({ length: blockCols }).map((_, bc) => renderBlock(br, bc)),
                            )}
                        </div>
                        {padPos && !gameOver && createPortal(
                            <div className="floating-pad" style={{ left: padPos.x, top: padPos.y }}>
                                {Array.from({ length: size }, (_, i) => i + 1).map((num) => (
                                    <button key={num} type="button" onClick={() => handleNumberInput(num)} disabled={loading}>
                                        {num}
                                    </button>
                                ))}
                                <button type="button" onClick={() => handleNumberInput(0)} disabled={loading} className="ghost">
                                    {t('floatingPadClear')}
                                </button>
                            </div>,
                            document.body,
                        )}
                    </div>
                </section>

                <section className="panel controls">
                    <h2>{t('heroTitle')}</h2>
                    <div className="control-group">
                        <div className="label">{t('labelDifficulty', { value: difficulty })}</div>
                        <div className="label subtle">{difficultyDescription}</div>
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={difficulty}
                            onChange={(e) => setDifficulty(Number(e.target.value))}
                        />
                    </div>

                    <div className="control-group">
                        <div className="label">{t('labelSize', { value: size })}</div>
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

                    <div className="stats-row">
                        <div className="stat">
                            <span className="stat-label">{t('statMistakes')}</span>
                            <span className="stat-value">{mistakes}/3</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">{t('statHints')}</span>
                            <span className="stat-value">{hintsUsed}</span>
                        </div>
                    </div>

                    <div className="actions-col">
                        <button className="primary" type="button" onClick={() => startGame(difficulty, size)} disabled={loading}>
                            {loading ? t('buttonGenerating') : t('buttonNewPuzzle')}
                        </button>
                        <button className="accent-btn" type="button" onClick={handleWatchAdForHint} disabled={loading}>
                            {t('actionWatchAd')}
                        </button>
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
