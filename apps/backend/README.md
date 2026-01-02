# YgrEcon Backend

Python FastAPI backend for graph validation and simulation.

## Setup

### 1. Create virtual environment

```bash
cd apps/backend
python -m venv .venv
```

### 2. Activate virtual environment

**Windows:**
```bash
.venv\Scripts\activate
```

**Linux/Mac:**
```bash
source .venv/bin/activate
```

### 3. Install dependencies

First, upgrade pip and install build tools:
```bash
pip install --upgrade pip setuptools wheel
```

Then install the package in editable mode:
```bash
pip install -e .
```

Or with dev dependencies:
```bash
pip install -e ".[dev]"
```

**Troubleshooting:** If `pip install -e` still doesn't work, try:
1. Make sure you're in the `apps/backend` directory
2. Make sure virtual environment is activated
3. Try: `pip install --upgrade pip setuptools wheel` first
4. If still failing, you can install dependencies directly:
   ```bash
   pip install fastapi uvicorn[standard] websockets pydantic pydantic-settings
   ```

## Running

### Development mode

**Important:** Make sure virtual environment is activated before running!

From project root (virtual environment must be activated):
```bash
pnpm dev:backend
```

Or manually:
```bash
cd apps/backend
# Activate virtual environment first!
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate

uvicorn src.main:app --reload --port 8000
```

Or use the helper scripts (they auto-detect virtual environment):
```bash
# Windows
cd apps/backend
run.bat

# Linux/Mac
cd apps/backend
./run.sh
```

### Production mode

```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## Virtual Environment

The virtual environment (`.venv/`) is **local to this directory** and is git-ignored. This ensures:
- Dependencies are isolated from system Python
- Dependencies are isolated from other projects
- Each developer can have their own environment

**Important:** Always activate the virtual environment before running the backend or installing packages.

