import uuid
from datetime import datetime
from ..extensions import db


def gen_uuid():
    return str(uuid.uuid4())


class Exam(db.Model):
    __tablename__ = "exams"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    level = db.Column(db.String(128))
    question_count = db.Column(db.Integer, default=0)
    duration_minutes = db.Column(db.Integer, default=0)
    status = db.Column(db.String(32), default="active")
    tag = db.Column(db.String(64))
    teacher_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

    teacher = db.relationship("User", backref="exams")
    questions = db.relationship("Question", backref="exam", order_by="Question.order_num")


class Question(db.Model):
    __tablename__ = "questions"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    exam_id = db.Column(db.String(36), db.ForeignKey("exams.id"), nullable=False)
    text = db.Column(db.Text, nullable=False)
    options = db.Column(db.JSON, nullable=False)  # ["A", "B", "C", "D"]
    correct_index = db.Column(db.Integer, nullable=False, default=0)
    order_num = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class ExamAttempt(db.Model):
    __tablename__ = "exam_attempts"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    exam_id = db.Column(db.String(36), db.ForeignKey("exams.id"), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    score = db.Column(db.Float, default=0)
    total = db.Column(db.Integer, default=0)
    answers = db.Column(db.JSON)  # {question_id: selected_index}
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

    exam = db.relationship("Exam", backref="attempts")
    user = db.relationship("User", backref="exam_attempts")
