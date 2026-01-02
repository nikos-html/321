#!/bin/bash
set -e

echo "🔍 Checking backend directory..."
ls -la /app/backend/

echo "🔍 Checking if venv exists..."
if [ -d "/app/backend/venv" ]; then
    echo "✅ venv directory found"
    ls -la /app/backend/venv/bin/ | head -10
else
    echo "❌ venv directory NOT found - creating now..."
    cd /app/backend
    python -m venv venv
fi

echo "🚀 Activating venv and starting server..."
cd /app/backend
. venv/bin/activate

echo "🔍 Python location:"
which python

echo "🔍 Installed packages:"
pip list | grep -E "(fastapi|uvicorn|motor|aiosmtplib)"

echo "🔍 Checking if server.py exists..."
ls -la server.py

echo "🚀 Starting uvicorn..."
exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8001}
