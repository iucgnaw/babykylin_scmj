color 04
mode con: cols=80 lines=9001
set MAIN_JS=%~dp0\account_server\app.js
set CONFIG=%~dp0\configs_win.js
call node.exe %MAIN_JS% %CONFIG%
pause