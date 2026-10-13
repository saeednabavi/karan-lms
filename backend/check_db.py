"""Test PostgreSQL connection. Usage: python check_db.py"""
import os
import sys

from dotenv import load_dotenv 

load_dotenv()

url = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/lms")

try:
    import psycopg2
    from urllib.parse import urlparse, unquote

    parsed = urlparse(url)
    conn = psycopg2.connect(
        host=parsed.hostname or "localhost",
        port=parsed.port or 5432,
        user=parsed.username or "postgres",
        password=unquote(parsed.password or ""),
        dbname=(parsed.path or "/lms").lstrip("/"),
    )
    conn.close()
    print("OK: PostgreSQL connection successful.")
    sys.exit(0)
except Exception as e:
    print(f"ERROR: Cannot connect to PostgreSQL: {e}")
    print("")
    print("Checklist:")
    print("  1. PostgreSQL service is running")
    print("  2. backend/.env has correct DATABASE_URL password")
    print("  3. Create database: psql -U postgres -c \"CREATE DATABASE lms;\"")
    sys.exit(1)
