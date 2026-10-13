import uuid
from datetime import datetime
from ..extensions import db


def gen_uuid():
    return str(uuid.uuid4())


class Role(db.Model):
    __tablename__ = "roles"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    username = db.Column(db.String(64), unique=True, nullable=True, index=True)
    email = db.Column(db.String(255), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255))
    first_name = db.Column(db.String(128))
    last_name = db.Column(db.String(128))
    phone = db.Column(db.String(20), unique=True, nullable=True, index=True)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), default=3)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

    role = db.relationship("Role", backref="users")

    def is_authenticated(self):
        return True

    def get_id(self):
        return self.id


class RefreshToken(db.Model):
    __tablename__ = "refresh_tokens"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    token_hash = db.Column(db.String(255), nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    revoked_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="refresh_tokens")


class ParentPupil(db.Model):
    __tablename__ = "parent_pupils"
    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    pupil_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    parent = db.relationship("User", foreign_keys=[parent_id], backref="children_links")
    pupil = db.relationship("User", foreign_keys=[pupil_id], backref="parent_links")

    __table_args__ = (db.UniqueConstraint("parent_id", "pupil_id", name="uq_parent_pupil"),)
