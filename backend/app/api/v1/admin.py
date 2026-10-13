import csv
import io
import os
import uuid
from datetime import datetime, timedelta

from flask import Blueprint, request, Response
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from ...extensions import db
from ...models import (
    User, Role, Article, Course, Teacher, Exam, Question,
    Enrollment, Lesson, Category, AboutInfo,
)
from ...utils.response import success_response, error_response
from ...seed.placeholders import course_image, COURSE_IMAGES
from ...utils.auth_utils import hash_password
from ...utils.audit_utils import log_audit
from ...policies.rbac import MANAGER_ROLES, get_user_role_name, has_permission

admin_bp = Blueprint("admin", __name__)

ADMIN_ROLES = {"Admin"}
STAFF_ROLES = {"Admin", "Technical"}


def _get_current_user():
    user_id = get_jwt_identity()
    return User.query.filter_by(id=user_id, deleted_at=None).first()


def _ensure_staff():
    user = _get_current_user()
    role = get_user_role_name(user)
    if not user or role not in STAFF_ROLES:
        return None, (error_response("FORBIDDEN", "Staff access required"), 403)
    return user, None


def _ensure_admin():
    user = _get_current_user()
    role = get_user_role_name(user)
    if not user or role not in ADMIN_ROLES:
        return None, (error_response("FORBIDDEN", "Admin access required"), 403)
    return user, None


@admin_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    _, err = _ensure_staff()
    if err:
        return err
    return success_response({
        "articles": Article.query.filter(Article.deleted_at.is_(None)).count(),
        "courses": Course.query.filter(Course.deleted_at.is_(None)).count(),
        "teachers": Teacher.query.count(),
        "exams": Exam.query.filter(Exam.deleted_at.is_(None)).count(),
        "users": User.query.filter(User.deleted_at.is_(None)).count(),
        "enrollments": Enrollment.query.filter_by(status="active").count(),
    })


# --- Reports (Admin only) ---

@admin_bp.route("/reports/overview", methods=["GET"])
@jwt_required()
def reports_overview():
    _, err = _ensure_admin()
    if err:
        return err
    since = datetime.utcnow() - timedelta(days=30)
    recent = Enrollment.query.filter(Enrollment.enrolled_at >= since).count()
    return success_response({
        "users": User.query.filter(User.deleted_at.is_(None)).count(),
        "courses": Course.query.filter(Course.deleted_at.is_(None)).count(),
        "enrollments": Enrollment.query.filter_by(status="active").count(),
        "enrollments_30d": recent,
        "articles": Article.query.filter(Article.deleted_at.is_(None)).count(),
        "exams": Exam.query.filter(Exam.deleted_at.is_(None)).count(),
    })


@admin_bp.route("/reports/enrollments", methods=["GET"])
@jwt_required()
def reports_enrollments():
    _, err = _ensure_admin()
    if err:
        return err
    from_date = request.args.get("from")
    to_date = request.args.get("to")
    q = Enrollment.query.filter_by(status="active")
    if from_date:
        try:
            q = q.filter(Enrollment.enrolled_at >= datetime.fromisoformat(from_date))
        except ValueError:
            pass
    if to_date:
        try:
            q = q.filter(Enrollment.enrolled_at <= datetime.fromisoformat(to_date))
        except ValueError:
            pass
    items = q.order_by(Enrollment.enrolled_at.desc()).limit(200).all()
    data = [{
        "id": e.id,
        "user": e.user.full_name or e.user.email,
        "user_email": e.user.email,
        "course": e.course.title,
        "course_id": e.course_id,
        "enrolled_at": e.enrolled_at.isoformat() if e.enrolled_at else None,
    } for e in items]
    return success_response(data, {"total": len(data)})


@admin_bp.route("/reports/courses", methods=["GET"])
@jwt_required()
def reports_courses():
    _, err = _ensure_admin()
    if err:
        return err
    items = (
        Course.query.filter(Course.deleted_at.is_(None))
        .order_by(Course.student_count.desc())
        .limit(50)
        .all()
    )
    data = [{
        "id": c.id,
        "title": c.title,
        "students": c.student_count,
        "rating": c.rating,
        "audience_type": c.audience_type,
        "enrollments": Enrollment.query.filter_by(course_id=c.id, status="active").count(),
    } for c in items]
    return success_response(data)


@admin_bp.route("/reports/users", methods=["GET"])
@jwt_required()
def reports_users():
    _, err = _ensure_admin()
    if err:
        return err
    role_filter = request.args.get("role")
    q = User.query.filter(User.deleted_at.is_(None))
    if role_filter:
        role = Role.query.filter_by(name=role_filter).first()
        if role:
            q = q.filter(User.role_id == role.id)
    items = q.order_by(User.created_at.desc()).limit(200).all()
    data = [{
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role.name if u.role else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    } for u in items]
    return success_response(data, {"total": len(data)})


@admin_bp.route("/reports/export/enrollments.csv", methods=["GET"])
@jwt_required()
def export_enrollments_csv():
    _, err = _ensure_admin()
    if err:
        return err
    items = Enrollment.query.filter_by(status="active").order_by(Enrollment.enrolled_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "user", "email", "course", "enrolled_at"])
    for e in items:
        writer.writerow([
            e.id,
            e.user.full_name or "",
            e.user.email or "",
            e.course.title,
            e.enrolled_at.isoformat() if e.enrolled_at else "",
        ])
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=enrollments.csv"},
    )


# --- Articles CRUD ---

@admin_bp.route("/articles", methods=["GET"])
@jwt_required()
def list_articles_admin():
    _, err = _ensure_staff()
    if err:
        return err
    items = Article.query.filter(Article.deleted_at.is_(None)).order_by(Article.created_at.desc()).all()
    return success_response([{
        "id": a.id, "title": a.title, "slug": a.slug, "excerpt": a.excerpt,
        "body": a.body, "image_url": a.image_url,
        "published_at": a.published_at.isoformat() if a.published_at else None,
    } for a in items], {"total": len(items)})


@admin_bp.route("/articles", methods=["POST"])
@jwt_required()
def create_article_admin():
    user, err = _ensure_staff()
    if err:
        return err
    payload = request.get_json() or {}
    title = (payload.get("title") or "").strip()
    slug = (payload.get("slug") or "").strip()
    body = (payload.get("body") or "").strip()
    if not title or not slug or not body:
        return error_response("VALIDATION_ERROR", "title, slug and body required"), 400
    if Article.query.filter_by(slug=slug).first():
        return error_response("CONFLICT", "slug exists"), 409
    article = Article(
        title=title, slug=slug,
        excerpt=(payload.get("excerpt") or "").strip() or None,
        body=body,
        image_url=(payload.get("image_url") or "").strip() or None,
        author_id=user.id,
        published_at=datetime.utcnow(),
    )
    db.session.add(article)
    db.session.commit()
    log_audit(user.id, "create", "article", article.id)
    return success_response({"id": article.id}), 201


@admin_bp.route("/articles/<id>", methods=["PUT"])
@jwt_required()
def update_article_admin(id):
    user, err = _ensure_staff()
    if err:
        return err
    article = Article.query.filter_by(id=id, deleted_at=None).first()
    if not article:
        return error_response("NOT_FOUND", "Not found"), 404
    payload = request.get_json() or {}
    for field in ("title", "slug", "excerpt", "body", "image_url"):
        if field in payload and isinstance(payload[field], str):
            setattr(article, field, payload[field].strip() or None)
    db.session.commit()
    log_audit(user.id, "update", "article", article.id)
    return success_response({"id": article.id})


@admin_bp.route("/articles/<id>", methods=["DELETE"])
@jwt_required()
def delete_article_admin(id):
    user, err = _ensure_staff()
    if err:
        return err
    article = Article.query.filter_by(id=id, deleted_at=None).first()
    if not article:
        return error_response("NOT_FOUND", "Not found"), 404
    article.deleted_at = datetime.utcnow()
    db.session.commit()
    log_audit(user.id, "delete", "article", article.id)
    return success_response({"id": article.id, "deleted": True})


# --- Users CRUD ---

@admin_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users_admin():
    _, err = _ensure_staff()
    if err:
        return err
    items = User.query.filter(User.deleted_at.is_(None)).order_by(User.created_at.desc()).all()
    return success_response([{
        "id": u.id, "username": u.username, "email": u.email,
        "first_name": u.first_name, "last_name": u.last_name,
        "full_name": u.full_name, "phone": u.phone,
        "role_id": u.role_id, "role": u.role.name if u.role else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    } for u in items], {"total": len(items)})


@admin_bp.route("/users", methods=["POST"])
@jwt_required()
def create_user_admin():
    user, err = _ensure_staff()
    if err:
        return err
    payload = request.get_json() or {}
    first_name = (payload.get("first_name") or "").strip()
    last_name = (payload.get("last_name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password")
    if not first_name or not last_name or not email or not password or len(password) < 8:
        return error_response("VALIDATION_ERROR", "Invalid input"), 400
    role = Role.query.get(payload.get("role_id")) or Role.query.filter_by(name="Student").first()
    u = User(
        first_name=first_name, last_name=last_name,
        full_name=f"{first_name} {last_name}",
        email=email, password_hash=hash_password(password),
        role_id=role.id,
    )
    db.session.add(u)
    db.session.commit()
    log_audit(user.id, "create", "user", u.id)
    return success_response({"id": u.id, "role": role.name}), 201


@admin_bp.route("/users/<id>", methods=["PUT"])
@jwt_required()
def update_user_admin(id):
    current = _get_current_user()
    is_self = current and str(current.id) == str(id)
    if not is_self:
        _, err = _ensure_staff()
        if err:
            return err
    target = User.query.filter_by(id=id, deleted_at=None).first()
    if not target:
        return error_response("NOT_FOUND", "Not found"), 404
    payload = request.get_json() or {}
    for field in ("first_name", "last_name", "email", "phone", "username"):
        if field in payload:
            setattr(target, field, (payload[field] or "").strip() or None)
    if target.first_name or target.last_name:
        target.full_name = f"{target.first_name or ''} {target.last_name or ''}".strip()
    if payload.get("role_id") and not is_self:
        role = Role.query.get(payload["role_id"])
        if role:
            target.role_id = role.id
    if isinstance(payload.get("password"), str) and len(payload["password"]) >= 8:
        target.password_hash = hash_password(payload["password"])
    db.session.commit()
    if current:
        log_audit(current.id, "update", "user", target.id)
    return success_response({"id": target.id})


# --- Courses CRUD ---

@admin_bp.route("/courses", methods=["GET"])
@jwt_required()
def list_courses_admin():
    _, err = _ensure_staff()
    if err:
        return err
    items = Course.query.filter(Course.deleted_at.is_(None)).order_by(Course.created_at.desc()).all()
    return success_response([_course_dict(c) for c in items])


@admin_bp.route("/courses", methods=["POST"])
@jwt_required()
def create_course_admin():
    user, err = _ensure_staff()
    if err:
        return err
    payload = request.get_json() or {}
    title = (payload.get("title") or "").strip()
    slug = (payload.get("slug") or "").strip()
    if not title or not slug:
        return error_response("VALIDATION_ERROR", "title and slug required"), 400
    course = Course(
        title=title, slug=slug,
        description=(payload.get("description") or "").strip(),
        teacher_id=payload.get("teacher_id"),
        category_id=payload.get("category_id"),
        price=int(payload.get("price") or 0),
        is_free=bool(payload.get("is_free")),
        image_url=(payload.get("image_url") or "").strip() or None,
        audience_type=(payload.get("audience_type") or "all").strip(),
    )
    db.session.add(course)
    db.session.commit()
    log_audit(user.id, "create", "course", course.id)
    return success_response(_course_dict(course)), 201


@admin_bp.route("/courses/<id>", methods=["PUT"])
@jwt_required()
def update_course_admin(id):
    user, err = _ensure_staff()
    if err:
        return err
    course = Course.query.filter_by(id=id, deleted_at=None).first()
    if not course:
        return error_response("NOT_FOUND", "Not found"), 404
    payload = request.get_json() or {}
    for field in ("title", "slug", "description", "teacher_id", "category_id", "image_url", "audience_type"):
        if field in payload:
            setattr(course, field, payload[field])
    if "price" in payload:
        course.price = int(payload["price"] or 0)
    if "is_free" in payload:
        course.is_free = bool(payload["is_free"])
    db.session.commit()
    log_audit(user.id, "update", "course", course.id)
    return success_response(_course_dict(course))


@admin_bp.route("/courses/<id>", methods=["DELETE"])
@jwt_required()
def delete_course_admin(id):
    user, err = _ensure_staff()
    if err:
        return err
    course = Course.query.filter_by(id=id, deleted_at=None).first()
    if not course:
        return error_response("NOT_FOUND", "Not found"), 404
    course.deleted_at = datetime.utcnow()
    db.session.commit()
    log_audit(user.id, "delete", "course", course.id)
    return success_response({"deleted": True})


def _local_course_image(c):
    url = (c.image_url or "").strip()
    if url.startswith("/images/"):
        return url
    cat_slug = c.category.slug if c.category else "default"
    if cat_slug not in COURSE_IMAGES:
        cat_slug = "default"
    return course_image(cat_slug)


def _course_dict(c):
    return {
        "id": c.id, "title": c.title, "slug": c.slug,
        "description": c.description, "teacher_id": c.teacher_id,
        "teacher": c.teacher.full_name if c.teacher else None,
        "category_id": c.category_id, "price": c.price,
        "is_free": c.is_free, "image_url": _local_course_image(c),
        "category_slug": c.category.slug if c.category else None,
        "audience_type": c.audience_type, "rating": c.rating,
        "students": c.student_count,
    }


# --- Teachers CRUD ---

@admin_bp.route("/teachers", methods=["GET"])
@jwt_required()
def list_teachers_admin():
    _, err = _ensure_staff()
    if err:
        return err
    items = Teacher.query.all()
    return success_response([{
        "id": t.id, "user_id": t.user_id, "full_name": t.full_name,
        "title": t.title, "bio": t.bio, "avatar_url": t.avatar_url,
    } for t in items])


@admin_bp.route("/teachers", methods=["POST"])
@jwt_required()
def create_teacher_admin():
    user, err = _ensure_staff()
    if err:
        return err
    payload = request.get_json() or {}
    t = Teacher(
        user_id=payload.get("user_id"),
        full_name=(payload.get("full_name") or "").strip(),
        title=(payload.get("title") or "").strip(),
        bio=(payload.get("bio") or "").strip(),
        avatar_url=(payload.get("avatar_url") or "").strip() or None,
    )
    db.session.add(t)
    db.session.commit()
    log_audit(user.id, "create", "teacher", t.id)
    return success_response({"id": t.id}), 201


@admin_bp.route("/teachers/<id>", methods=["PUT"])
@jwt_required()
def update_teacher_admin(id):
    user, err = _ensure_staff()
    if err:
        return err
    t = Teacher.query.get(id)
    if not t:
        return error_response("NOT_FOUND", "Not found"), 404
    payload = request.get_json() or {}
    for field in ("full_name", "title", "bio", "avatar_url", "user_id"):
        if field in payload:
            setattr(t, field, payload[field])
    db.session.commit()
    log_audit(user.id, "update", "teacher", t.id)
    return success_response({"id": t.id})


# --- Exams CRUD ---

@admin_bp.route("/exams", methods=["GET"])
@jwt_required()
def list_exams_admin():
    _, err = _ensure_staff()
    if err:
        return err
    items = Exam.query.filter(Exam.deleted_at.is_(None)).all()
    return success_response([_exam_dict(e) for e in items])


@admin_bp.route("/exams", methods=["POST"])
@jwt_required()
def create_exam_admin():
    user, err = _ensure_staff()
    if err:
        return err
    payload = request.get_json() or {}
    title = (payload.get("title") or "").strip()
    slug = (payload.get("slug") or "").strip()
    if not title or not slug:
        return error_response("VALIDATION_ERROR", "title and slug required"), 400
    exam = Exam(
        title=title, slug=slug,
        level=(payload.get("level") or "").strip(),
        duration_minutes=int(payload.get("duration_minutes") or 30),
        tag=(payload.get("tag") or "").strip(),
        status=(payload.get("status") or "فعال").strip(),
        teacher_id=payload.get("teacher_id"),
    )
    db.session.add(exam)
    db.session.commit()
    log_audit(user.id, "create", "exam", exam.id)
    return success_response(_exam_dict(exam)), 201


@admin_bp.route("/exams/<id>", methods=["PUT"])
@jwt_required()
def update_exam_admin(id):
    user, err = _ensure_staff()
    if err:
        return err
    exam = Exam.query.filter_by(id=id, deleted_at=None).first()
    if not exam:
        return error_response("NOT_FOUND", "Not found"), 404
    payload = request.get_json() or {}
    for field in ("title", "slug", "level", "tag", "status", "teacher_id"):
        if field in payload:
            setattr(exam, field, payload[field])
    if "duration_minutes" in payload:
        exam.duration_minutes = int(payload["duration_minutes"])
    db.session.commit()
    log_audit(user.id, "update", "exam", exam.id)
    return success_response(_exam_dict(exam))


@admin_bp.route("/exams/<id>", methods=["DELETE"])
@jwt_required()
def delete_exam_admin(id):
    user, err = _ensure_staff()
    if err:
        return err
    exam = Exam.query.filter_by(id=id, deleted_at=None).first()
    if not exam:
        return error_response("NOT_FOUND", "Not found"), 404
    exam.deleted_at = datetime.utcnow()
    db.session.commit()
    log_audit(user.id, "delete", "exam", exam.id)
    return success_response({"deleted": True})


def _exam_dict(e):
    return {
        "id": e.id, "title": e.title, "slug": e.slug,
        "level": e.level, "question_count": e.question_count,
        "duration_minutes": e.duration_minutes, "status": e.status,
        "tag": e.tag, "teacher_id": e.teacher_id,
    }
