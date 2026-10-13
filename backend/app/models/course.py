import uuid
from datetime import datetime
from ..extensions import db


def gen_uuid():
    return str(uuid.uuid4())


class Category(db.Model):
    __tablename__ = "categories"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    name_fa = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    parent_id = db.Column(db.String(36), db.ForeignKey("categories.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

    parent = db.relationship("Category", remote_side=[id], backref="children")


class Course(db.Model):
    __tablename__ = "courses"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    title = db.Column(db.String(255), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    teacher_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    category_id = db.Column(db.String(36), db.ForeignKey("categories.id"), nullable=True)
    price = db.Column(db.Integer, default=0)
    is_free = db.Column(db.Boolean, default=False)
    image_url = db.Column(db.String(500))
    rating = db.Column(db.Float, default=0)
    student_count = db.Column(db.Integer, default=0)
    audience_type = db.Column(db.String(32), default="all")  # pupil | student | all
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

    teacher = db.relationship("User", backref="courses_taught")
    category = db.relationship("Category", backref="courses")
    lessons = db.relationship("Lesson", backref="course", order_by="Lesson.order_num")


class Lesson(db.Model):
    __tablename__ = "lessons"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    course_id = db.Column(db.String(36), db.ForeignKey("courses.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    order_num = db.Column(db.Integer, default=0)
    video_url = db.Column(db.String(500))
    duration_sec = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

    assets = db.relationship("Asset", back_populates="lesson")


class Asset(db.Model):
    __tablename__ = "assets"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    lesson_id = db.Column(db.String(36), db.ForeignKey("lessons.id"), nullable=False)
    title = db.Column(db.String(255))
    file_path = db.Column(db.String(500))
    source_type = db.Column(db.String(32), default="upload")  # upload | url
    external_url = db.Column(db.String(500))
    mime_type = db.Column(db.String(128))
    size_bytes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    lesson = db.relationship("Lesson", back_populates="assets")


class Enrollment(db.Model):
    __tablename__ = "enrollments"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    course_id = db.Column(db.String(36), db.ForeignKey("courses.id"), nullable=False)
    status = db.Column(db.String(32), default="active")
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship("User", backref="enrollments")
    course = db.relationship("Course", backref="enrollments")

    __table_args__ = (db.UniqueConstraint("user_id", "course_id", name="uq_enrollment_user_course"),)


class LessonProgress(db.Model):
    __tablename__ = "lesson_progress"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    lesson_id = db.Column(db.String(36), db.ForeignKey("lessons.id"), nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    last_position_sec = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship("User", backref="lesson_progress")
    lesson = db.relationship("Lesson", backref="progress_records")

    __table_args__ = (db.UniqueConstraint("user_id", "lesson_id", name="uq_progress_user_lesson"),)
