from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ...models import User, ParentPupil, Enrollment, LessonProgress, Lesson, Course
from ...utils.response import success_response, error_response
from ...policies.rbac import get_user_role_name

parent_bp = Blueprint("parent", __name__)


@parent_bp.route("/children", methods=["GET"])
@jwt_required()
def list_children():
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user or get_user_role_name(user) != "Parent":
        return error_response("FORBIDDEN", "Parent access required"), 403
    links = ParentPupil.query.filter_by(parent_id=uid).all()
    data = [{
        "id": l.pupil.id,
        "full_name": l.pupil.full_name,
        "email": l.pupil.email,
    } for l in links]
    return success_response(data)


@parent_bp.route("/children/<pupil_id>/progress", methods=["GET"])
@jwt_required()
def child_progress(pupil_id):
    uid = get_jwt_identity()
    user = User.query.get(uid)
    if not user or get_user_role_name(user) != "Parent":
        return error_response("FORBIDDEN", "Parent access required"), 403
    link = ParentPupil.query.filter_by(parent_id=uid, pupil_id=pupil_id).first()
    if not link:
        return error_response("FORBIDDEN", "Not your child"), 403
    enrollments = Enrollment.query.filter_by(user_id=pupil_id, status="active").all()
    courses_data = []
    for e in enrollments:
        lessons = Lesson.query.filter_by(course_id=e.course_id).filter(Lesson.deleted_at.is_(None)).all()
        total = len(lessons)
        completed = LessonProgress.query.filter(
            LessonProgress.user_id == pupil_id,
            LessonProgress.lesson_id.in_([l.id for l in lessons]),
            LessonProgress.completed_at.isnot(None),
        ).count()
        courses_data.append({
            "course_id": e.course_id,
            "course_title": e.course.title,
            "total_lessons": total,
            "completed_lessons": completed,
            "percent": round(completed / total * 100) if total else 0,
        })
    return success_response({"pupil_id": pupil_id, "courses": courses_data})
