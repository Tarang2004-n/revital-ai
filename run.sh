#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=========================================================="
echo "  RE:VITAL AI — Adaptive Care & Recovery Intelligence"
echo "=========================================================="

# 1. Kill any stale processes on 8000 and 3000
kill $(lsof -ti:8000) 2>/dev/null || true
kill $(lsof -ti:3000) 2>/dev/null || true

# 2. Launch Backend (FastAPI + Continuous-Time GRU-D Kernel)
echo "[1/2] Launching Neural ODE Trajectory Kernel on :8000..."
cd "$DIR/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend readiness
until curl -s http://localhost:8000/api/cohort > /dev/null; do
  sleep 1
done
echo "      Backend Kernel Online (PID: $BACKEND_PID)"

# 3. Launch Frontend (Next.js Command Workspace)
echo "[2/2] Launching Clinical Command Center on :3000..."
cd "$DIR/frontend"
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null || true" EXIT
