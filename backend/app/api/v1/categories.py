from flask import Blueprint
from ...models import Category
from ...utils.response import success_response

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("", methods=["GET"])
def list_categories():
    items = Category.query.filter(Category.deleted_at.is_(None)).order_by(Category.name_fa).all()
    data = [{"id": c.id, "name_fa": c.name_fa, "slug": c.slug} for c in items]
    return success_response(data)
