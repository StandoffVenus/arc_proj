@ECHO ON
SET PORT=56500
SET chrome_install=C:\Program Files (x86)\Google\Chrome\Application\
START "" "%chrome_install%chrome.exe" "http://localhost:%PORT%/index"
node C:\arc_proj\app.js
