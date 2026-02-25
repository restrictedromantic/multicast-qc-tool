#!/bin/sh
set -e
cd /app
PORT="${PORT:-8000}"
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
