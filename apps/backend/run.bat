@echo off
REM Script to run backend with virtual environment support (Windows)

if exist ".venv\Scripts\activate.bat" (
    REM Virtual environment exists, use it
    call .venv\Scripts\activate.bat
    python -m uvicorn src.main:app --reload --port 8000
) else if exist "venv\Scripts\activate.bat" (
    REM Alternative venv directory
    call venv\Scripts\activate.bat
    python -m uvicorn src.main:app --reload --port 8000
) else (
    REM No virtual environment, use system Python (not recommended)
    echo Warning: No virtual environment found. Using system Python.
    echo Create one with: python -m venv .venv
    python -m uvicorn src.main:app --reload --port 8000
)

