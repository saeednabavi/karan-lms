from flask import Blueprint, request
from ...models import Teacher
from ...utils.response import success_response

teachers_bp = Blueprint("teachers", __name__)


@teachers_bp.route("", methods=["GET"])
def list_teachers():
    limit = min(int(request.args.get("limit", 20)), 100)
    offset = int(request.args.get("offset", 0))
    items = Teacher.query.offset(offset).limit(limit).all()
    data = [
        {
            "id": t.id,
            "full_name": t.full_name,
            "title": t.title,
            "bio": t.bio,
            "avatar_url": t.avatar_url,
        }
        for t in items
    ]
    return success_response(data)
