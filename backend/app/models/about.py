from ..extensions import db


class AboutInfo(db.Model):
    __tablename__ = "about_info"
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(128), unique=True, nullable=False)
    value = db.Column(db.Text)
    updated_at = db.Column(db.DateTime, default=__import__("datetime").datetime.utcnow)
