import uuid
from datetime import datetime
from ..extensions import db


def gen_uuid():
    return str(uuid.uuid4())


class Teacher(db.Model):
    __tablename__ = "teachers"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    full_name = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255))
    bio = db.Column(db.Text)
    avatar_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
