import uuid
from datetime import datetime
from ..extensions import db


def gen_uuid():
    return str(uuid.uuid4())


class Article(db.Model):
    __tablename__ = "articles"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    excerpt = db.Column(db.Text)
    body = db.Column(db.Text)
    author_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    image_url = db.Column(db.String(500))
    published_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)
