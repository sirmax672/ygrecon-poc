#!/bin/bash
# Script to run backend with virtual environment support

if [ -d ".venv" ]; then
    # Virtual environment exists, use it
    .venv/bin/python -m uvicorn src.main:app --reload --port 8000
elif [ -d "venv" ]; then
    # Alternative venv directory
    venv/bin/python -m uvicorn src.main:app --reload --port 8000
else
    # No virtual environment, use system Python (not recommended)
    echo "Warning: No virtual environment found. Using system Python."
    echo "Create one with: python -m venv .venv"
    python -m uvicorn src.main:app --reload --port 8000
fi

