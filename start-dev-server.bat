@echo off
setlocal

echo == Sudoku: локальный просмотр ==

if not exist node_modules (
    echo Устанавливаю зависимости...
    call npm install || goto :error
)

echo Запускаю npm run dev (Ctrl+C для остановки)...
call npm run dev
goto :EOF

:error
echo Скрипт завершился с ошибкой %errorlevel%.
exit /b %errorlevel%
