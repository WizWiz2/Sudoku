# Sudoku (Yandex Games / Google Play WebView)

Минимальный гайд по проекту судоку с генератором и подсказками за рекламу.

## Возможности
- Генерация судоку на лету: размеры 4×4, 9×9, 16×16 с корректными блоками.
- 10 уровней сложности.

- Поддержка подсветки конфликтов, фиксированных «дано», сброса поля.

## Запуск/сборка
- Требуется Node.js + npm.
- Установка: `npm install`
- Дев‑сервер: `npm run dev`
- Сборка: `npm run build`
- Preview сборки: `npm run preview`

## Деплой на Yandex Games
- Соберите `npm run build`, загрузите содержимое `dist` в консоль Яндекс Игр.
- Иконка: PNG 512×512, obложка: PNG 800×470.
- Настройте рекламный SDK: `window.YaGames.init()` и передайте в игру.

## Google Play (WebView/Capacitor)
- Соберите `dist`, разместите в WebView/Capacitor.
- Передайте `window.admob.rewardVideo` для показа вознаграждаемой рекламы.

## Стек
- React + Vite + TypeScript.
- Чистый CSS для UI.

---

## Описание для Яндекс Игр (RU)

### Описание для SEO (160 символов)
Классическое Судоку с современным дизайном! 3 размера поля (4x4, 9x9, 16x16), 10 уровней сложности и подсказки. Играй бесплатно онлайн!

### Об игре (1000 символов)
Погрузитесь в мир логики с нашим современным Судоку!
Мы переосмыслили классическую головоломку, добавив стильный темный дизайн и плавные анимации.

**Особенности:**
*   **3 размера поля:** 4x4 для новичков, классическое 9x9 и сложное 16x16 для профи.
*   **10 уровней сложности:** от элементарного до экспертного.
*   **Умные подсказки:** застряли? Воспользуйтесь подсказкой за просмотр рекламы.
*   **Удобное управление:** подсветка ошибок, выделение цифр и заметок.
*   **Адаптивный дизайн:** удобно играть как на ПК, так и на мобильных устройствах.

Тренируйте мозг и наслаждайтесь игрой в любое время!

### Как играть (1000 символов)
Цель игры — заполнить свободные клетки цифрами.

**Правила:**
1.  В каждой строке, каждом столбце и каждом малом квадрате (блоке) цифры не должны повторяться.
2.  Для поля 9x9 используются цифры от 1 до 9.
3.  Для поля 4x4 — от 1 до 4.
4.  Для поля 16x16 — от 1 до 16.

**Управление:**
*   Нажмите на клетку, чтобы выбрать её.
*   Выберите цифру из панели внизу или используйте клавиатуру.
*   Если ошиблись — игра подсветит неверную цифру.
*   Нажмите "Подсказка", если не знаете, какой ход сделать следующим.

---

## Description for Yandex Games (EN)

### SEO Description (160 chars)
Classic Sudoku with modern design! 3 board sizes (4x4, 9x9, 16x16), 10 difficulty levels, and hints. Play free online now!

### About the game (1000 chars)
Immerse yourself in the world of logic with our modern Sudoku!
We have reimagined the classic puzzle with a stylish dark design and smooth animations.

**Features:**
*   **3 board sizes:** 4x4 for beginners, classic 9x9, and challenging 16x16 for pros.
*   **10 difficulty levels:** from elementary to expert.
*   **Smart hints:** Stuck? Use a hint by watching a short ad.
*   **User-friendly controls:** Error highlighting, number highlighting, and notes.
*   **Responsive design:** Play comfortably on both PC and mobile devices.

Train your brain and enjoy the game anytime!

### How to play (1000 chars)
The goal is to fill the empty cells with numbers.

**Rules:**
1.  Each row, column, and small square (block) must contain unique numbers.
2.  For 9x9 board, use numbers 1 to 9.
3.  For 4x4 board, use numbers 1 to 4.
4.  For 16x16 board, use numbers 1 to 16.

**Controls:**
*   Tap a cell to select it.
*   Choose a number from the bottom panel or use your keyboard.
*   If you make a mistake, the game will highlight the incorrect number.
*   Click "Hint" if you don't know the next move.
