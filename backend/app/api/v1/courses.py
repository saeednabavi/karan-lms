from datetime import datetime

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ...extensions import db
from ...models import Course, User, Enrollment, Category, Lesson, Asset, LessonProgress
from ...utils.response import success_response, error_response
from ...policies.rbac import is_enrolled, get_user_role_name
from ...seed.placeholders import course_image, COURSE_IMAGES

courses_bp = Blueprint("courses", __name__)


def _parse_int(value, default=0, min_value=0, max_value=100):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return max(min_value, min(parsed, max_value))


def _local_course_image(c):
    url = (c.image_url or "").strip()
    if url.startswith("/images/"):
        return url
    cat_slug = c.category.slug if c.category else "default"
    if cat_slug not in COURSE_IMAGES:
        cat_slug = "default"
    return course_image(cat_slug)


def _course_list_item(c):
    return {
        "id": c.id,
        "title": c.title,
        "slug": c.slug,
        "description": (c.description or "")[:200],
        "teacher": c.teacher.full_name if c.teacher else None,
        "rating": c.rating,
        "students": c.student_count,
        "price": c.price,
        "is_free": c.is_free,
        "image_url": _local_course_image(c),
        "category_slug": c.category.slug if c.category else None,
        "audience_type": c.audience_type or "all",
    }


@courses_bp.route("", methods=["GET"])
def list_courses():
    q = Course.query.filter(Course.deleted_at.is_(None))

    search_q = (request.args.get("q") or "").strip()
    category_slug = (request.args.get("category") or "").strip()
    is_free_param = (request.args.get("is_free") or "").strip().lower()
    audience_type = (request.args.get("audience_type") or "").strip().lower()
    sort = (request.args.get("sort") or "latest").strip().lower()
    limit = _parse_int(request.args.get("limit", 20), default=20, min_value=1, max_value=100)
    offset = _parse_int(request.args.get("offset", 0), default=0, min_value=0, max_value=100000)

    if search_q:
        like_expr = f"%{search_q}%"
        q = q.filter((Course.title.ilike(like_expr)) | (Course.description.ilike(like_expr)))
    if category_slug:
        category = Category.query.filter_by(slug=category_slug, deleted_at=None).first()
        if not category:
            return success_response([], {"total": 0, "limit": limit, "offset": offset})
        q = q.filter(Course.category_id == category.id)
    if is_free_param in ("true", "1", "yes"):
        q = q.filter(Course.is_free.is_(True))
    elif is_free_param in ("false", "0", "no"):
        q = q.filter(Course.is_free.is_(False))
    if audience_type in ("pupil", "student"):
        q = q.filter((Course.audience_type == audience_type) | (Course.audience_type == "all"))

    if sort == "popular":
        q = q.order_by(Course.student_count.desc(), Course.created_at.desc())
    elif sort == "rating":
        q = q.order_by(Course.rating.desc(), Course.created_at.desc())
    elif sort == "price_asc":
        q = q.order_by(Course.price.asc(), Course.created_at.desc())
    elif sort == "price_desc":
        q = q.order_by(Course.price.desc(), Course.created_at.desc())
    else:
        q = q.order_by(Course.created_at.desc())

    total = q.count()
    items = q.offset(offset).limit(limit).all()
    return success_response([_course_list_item(c) for c in items], {"total": total, "limit": limit, "offset": offset})


@courses_bp.route("/popular", methods=["GET"])
def popular_courses():
    items = (
        Course.query.filter(Course.deleted_at.is_(None))
        .order_by(Course.student_count.desc())
        .limit(8)
        .all()
    )
    return success_response([_course_list_item(c) for c in items])


@courses_bp.route("/<id>", methods=["GET"])
def get_course(id):
    c = Course.query.filter_by(id=id, deleted_at=None).first()
    if not c:
        return error_response("NOT_FOUND", "Course not found"), 404
    enrolled = False
    try:
        from flask_jwt_extended import verify_jwt_in_request
        verify_jwt_in_request(optional=True)
        uid = get_jwt_identity()
        if uid:
            enrolled = is_enrolled(uid, c.id)
    except Exception:
        pass
    return success_response({
        "id": c.id,
        "title": c.title,
        "slug": c.slug,
        "description": c.description,
        "teacher": c.teacher.full_name if c.teacher else None,
        "teacher_id": c.teacher_id,
        "category_id": c.category_id,
        "rating": c.rating,
        "students": c.student_count,
        "price": c.price,
        "is_free": c.is_free,
        "image_url": _local_course_image(c),
        "category_slug": c.category.slug if c.category else None,
        "audience_type": c.audience_type or "all",
        "enrolled": enrolled,
        "lessons": [
            {"id": l.id, "title": l.title, "order_num": l.order_num, "duration_sec": l.duration_sec}
            for l in c.lessons if not l.deleted_at
        ],
    })


@courses_bp.route("/<id>/learn", methods=["GET"])
@jwt_required()
def learn_course(id):
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id, deleted_at=None).first()
    if not user:
        return error_response("UNAUTHORIZED", "User not found"), 401
    role = get_user_role_name(user)
    c = Course.query.filter_by(id=id, deleted_at=None).first()
    if not c:
        return error_response("NOT_FOUND", "Course not found"), 404
    if role not in ("Admin", "Technical", "Teacher") and not is_enrolled(user_id, id):
        if role == "Teacher" and c.teacher_id == user_id:
            pass
        else:
            return error_response("FORBIDDEN", "Enroll first"), 403

    progress_map = {
        p.lesson_id: p
        for p in LessonProgress.query.filter_by(user_id=user_id).all()
    }
    lessons_data = []
    for l in c.lessons:
        if l.deleted_at:
            continue
        prog = progress_map.get(l.id)
        assets = []
        for a in l.assets:
            assets.append({
                "id": a.id,
                "title": a.title or "فایل",
                "mime_type": a.mime_type,
                "source_type": a.source_type,
                "external_url": a.external_url if a.source_type == "url" else None,
                "is_pdf": (a.mime_type or "").startswith("application/pdf"),
            })
        lessons_data.append({
            "id": l.id,
            "title": l.title,
            "order_num": l.order_num,
            "video_url": l.video_url,
            "duration_sec": l.duration_sec,
            "assets": assets,
            "completed": prog.completed_at is not None if prog else False,
            "last_position_sec": prog.last_position_sec if prog else 0,
        })

    return success_response({
        "id": c.id,
        "title": c.title,
        "lessons": lessons_data,
    })


@courses_bp.route("/<id>/lessons/<lesson_id>/progress", methods=["POST"])
@jwt_required()
def update_lesson_progress(id, lesson_id):
    user_id = get_jwt_identity()
    if not is_enrolled(user_id, id):
        return error_response("FORBIDDEN", "Not enrolled"), 403
    lesson = Lesson.query.filter_by(id=lesson_id, course_id=id, deleted_at=None).first()
    if not lesson:
        return error_response("NOT_FOUND", "Lesson not found"), 404
    payload = request.get_json() or {}
    prog = LessonProgress.query.filter_by(user_id=user_id, lesson_id=lesson_id).first()
    if not prog:
        prog = LessonProgress(user_id=user_id, lesson_id=lesson_id)
        db.session.add(prog)
    if "last_position_sec" in payload:
        prog.last_position_sec = int(payload["last_position_sec"] or 0)
    if payload.get("completed"):
        prog.completed_at = datetime.utcnow()
    prog.updated_at = datetime.utcnow()
    db.session.commit()
    return success_response({"lesson_id": lesson_id, "completed": prog.completed_at is not None})


@courses_bp.route("/<id>/enroll", methods=["POST"])
@jwt_required()
def enroll_course(id):
    user_id = get_jwt_identity()
    user = User.query.filter_by(id=user_id, deleted_at=None).first()
    if not user:
        return error_response("UNAUTHORIZED", "User not found"), 401

    course = Course.query.filter_by(id=id, deleted_at=None).first()
    if not course:
        return error_response("NOT_FOUND", "Course not found"), 404

    existing = Enrollment.query.filter_by(user_id=user.id, course_id=course.id).first()
    if existing and existing.status == "active":
        return error_response("CONFLICT", "Already enrolled"), 409
    if existing:
        existing.status = "active"
        db.session.commit()
        return success_response({"course_id": course.id, "status": "active"})

    enrollment = Enrollment(user_id=user.id, course_id=course.id, status="active")
    db.session.add(enrollment)
    course.student_count = (course.student_count or 0) + 1
    db.session.commit()
    return success_response({"course_id": course.id, "status": "active"}, {"created": True}), 201


@courses_bp.route("/me/enrollments", methods=["GET"])
@jwt_required()
def my_enrollments():
    user_id = get_jwt_identity()
    audience = request.args.get("audience_type")
    items = (
        Enrollment.query.filter_by(user_id=user_id, status="active")
        .join(Course, Enrollment.course_id == Course.id)
        .filter(Course.deleted_at.is_(None))
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )
    data = []
    for e in items:
        at = e.course.audience_type or "all"
        if audience and audience not in (at, "all") and at != "all":
            if audience != at:
                continue
        data.append({
            "enrollment_id": e.id,
            "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
            "course": _course_list_item(e.course),
        })
    return success_response(data, {"total": len(data)})
