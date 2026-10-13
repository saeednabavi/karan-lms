import click

from app import create_app
from app.seed.runner import run_seed

app = create_app()


@app.cli.command("seed")
@click.option("--refresh", is_flag=True, help="Refresh image URLs on existing records")
@click.option("--reset", is_flag=True, help="Clear demo data and re-seed from scratch")
def seed(refresh, reset):
    """Seed database with rich demo data. Run: flask seed [--refresh] [--reset]"""
    with app.app_context():
        run_seed(refresh=refresh, reset=reset)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
