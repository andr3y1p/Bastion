@ECHO off
IF NOT DEFINED IS_CHILD_PROCESS (CMD /K SET IS_CHILD_PROCESS=1 ^& %0 %*) & EXIT )
TITLE Bastion Bot
CLS
COLOR 0F
ECHO.

SET cwd=%~dp0

ECHO [Bastion]: Updating Bastion Bot...
git pull origin master 1>nul || (
  ECHO [Bastion]: Unable to update the bot.
  GOTO :EXIT
)
ECHO [Bastion]: Done.
ECHO.

ECHO [Bastion]: Deleting old files...
RD /S /Q node_modules
DEL /Q data/Bastion.sqlite
ECHO [Bastion]: Done.
ECHO [Bastion]: Installing new files...
choco upgrade chocolatey -y
choco upgrade ffmpeg -y
CALL npm install --production >nul 2>update.log
ECHO [Bastion]: Done.
ECHO [Bastion]: If you get any errors please check the update.log file for errors while updating.
ECHO [Bastion]: Ready to boot up and start running.
ECHO.

EXIT /B 0

:EXIT
ECHO.
ECHO [Bastion]: Press any key to exit.
PAUSE >nul 2>&1
CD /D "%cwd%"
TITLE Windows Command Prompt (CMD)
COLOR
