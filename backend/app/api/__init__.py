from flask import Blueprint
from .v1 import v1_bp


def register_blueprints(app):
    api_bp = Blueprint("api", __name__, url_prefix="/api")
    api_bp.register_blueprint(v1_bp, url_prefix="/v1")

    app.register_blueprint(api_bp)

    from .v1.legacy import legacy_bp
    app.register_blueprint(legacy_bp, url_prefix="/api")
