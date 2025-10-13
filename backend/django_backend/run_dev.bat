@echo off
REM CMD helper to activate venv and run Django dev server without autoreload
IF EXIST ".\.venv\Scripts\activate.bat" (
  call ".\.venv\Scripts\activate.bat"
) ELSE (
  echo Virtualenv activate.bat not found. Ensure .venv exists.
)
python manage.py runserver 0.0.0.0:8000 --noreload
