from flask import Flask
from flask_cors import CORS
from pathlib import Path
from .config import Config
from .extensions import db, migrate, jwt, limiter
from .utils.errors import register_error_handlers
from .utils.response import error_response
from .api import register_blueprints


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app, supports_credentials=True)

    db.init_app(app)
    with app.app_context():
        from . import models  # noqa: F401 - register models
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)

    # Return 401 for any JWT error so frontend can clear token (avoids 422)
    @jwt.unauthorized_loader
    def unauthorized_callback(_reason):
        return error_response("UNAUTHORIZED", "Missing or invalid token"), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(_reason):
        return error_response("UNAUTHORIZED", "Invalid token"), 401

    @jwt.expired_token_loader
    def expired_token_callback(_jwt_header, _jwt_payload):
        return error_response("UNAUTHORIZED", "Token expired"), 401

    register_error_handlers(app)
    register_blueprints(app)

    upload_dir = Path(app.config.get("UPLOAD_FOLDER", "uploads"))
    if not upload_dir.is_absolute():
        upload_dir = Path(app.root_path).parent / upload_dir
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = str(upload_dir)

    return app
