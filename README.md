# Sudoku (Yandex Games / Google Play WebView)

Минимальный гайд по проекту судоку с генератором и подсказками за рекламу.

## Возможности
- Генерация судоку на лету: размеры 4×4, 9×9, 16×16 с корректными блоками.
- 10 уровней сложности.
- Подсказки через вознаграждаемую рекламу (Yandex Games / AdMob); есть офлайн‑фолбек.
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
