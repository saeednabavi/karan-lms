from flask import jsonify


def success_response(data=None, meta=None):
    return jsonify({
        "data": data,
        "meta": meta or {},
        "error": None,
    })


def error_response(code: str, message: str, details=None):
    return jsonify({
        "data": None,
        "meta": None,
        "error": {
            "code": code,
            "message": message,
            "details": details,
        },
    })
