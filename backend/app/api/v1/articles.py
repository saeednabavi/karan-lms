from flask import Blueprint, request
from ...models import Article
from ...utils.response import success_response, error_response

articles_bp = Blueprint("articles", __name__)


@articles_bp.route("", methods=["GET"])
def list_articles():
    q = Article.query.filter(Article.deleted_at.is_(None))
    limit = min(int(request.args.get("limit", 20)), 100)
    offset = int(request.args.get("offset", 0))
    items = q.order_by(Article.created_at.desc()).offset(offset).limit(limit).all()
    total = q.count()
    data = [
        {
            "id": a.id,
            "title": a.title,
            "slug": a.slug,
            "excerpt": a.excerpt,
            "image_url": a.image_url,
            "published_at": a.published_at.isoformat() if a.published_at else None,
        }
        for a in items
    ]
    return success_response(data, {"total": total})


@articles_bp.route("/<id>", methods=["GET"])
def get_article(id):
    a = Article.query.filter_by(id=id, deleted_at=None).first()
    if not a:
        a = Article.query.filter_by(slug=id, deleted_at=None).first()
    if not a:
        return error_response("NOT_FOUND", "Article not found"), 404
    return success_response({
        "id": a.id,
        "title": a.title,
        "slug": a.slug,
        "excerpt": a.excerpt,
        "body": a.body,
        "image_url": a.image_url,
        "published_at": a.published_at.isoformat() if a.published_at else None,
    })
