#!/bin/sh
cd /app
flask db upgrade 2>/dev/null || true
python run.py
