from flask import jsonify
from .response import error_response


def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(e):
        return error_response("BAD_REQUEST", str(e) or "Bad request"), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return error_response("UNAUTHORIZED", "Authentication required"), 401

    @app.errorhandler(403)
    def forbidden(e):
        return error_response("FORBIDDEN", "Access denied"), 403

    @app.errorhandler(404)
    def not_found(e):
        return error_response("NOT_FOUND", "Resource not found"), 404

    @app.errorhandler(429)
    def rate_limit(e):
        return error_response("RATE_LIMIT", "Too many requests"), 429

    @app.errorhandler(500)
    def internal_error(e):
        return error_response("INTERNAL_ERROR", "Internal server error"), 500
