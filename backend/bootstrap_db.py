"""Apply schema and seed for development (PostgreSQL)."""
from app import create_app
from app.seed.runner import run_seed

app = create_app()

with app.app_context():
    run_seed(refresh=True)
    print("Bootstrap complete.")
