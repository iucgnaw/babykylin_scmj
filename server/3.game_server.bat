color 01
mode con: cols=80 lines=9001s
set MAIN_JS=%~dp0\game_server\app.js
set CONFIG=%~dp0\configs_win.js
call node.exe %MAIN_JS% %CONFIG%
pause