import os
import uuid

from flask import Blueprint, request, current_app
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from ...extensions import db
from ...models import User, Course, Lesson, Asset
from ...utils.response import success_response, error_response
from ...utils.audit_utils import log_audit
from ...policies.rbac import get_user_role_name, can_manage_course

teacher_bp = Blueprint("teacher", __name__)

ALLOWED_EXTENSIONS = {"pdf", "mp4", "webm", "png", "jpg", "jpeg", "doc", "docx", "ppt", "pptx"}


def _get_user():
    uid = get_jwt_identity()
    return User.query.filter_by(id=uid, deleted_at=None).first()


def _ensure_teacher():
    user = _get_user()
    role = get_user_role_name(user)
    if not user or role not in ("Teacher", "Admin", "Technical"):
        return None, (error_response("FORBIDDEN", "Teacher access required"), 403)
    return user, None


def _allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _asset_dict(a):
    return {
        "id": a.id,
        "title": a.title or os.path.basename(a.file_path or a.external_url or ""),
        "source_type": a.source_type,
        "external_url": a.external_url,
        "mime_type": a.mime_type,
        "size_bytes": a.size_bytes,
        "is_pdf": (a.mime_type or "").startswith("application/pdf"),
    }


@teacher_bp.route("/courses", methods=["GET"])
@jwt_required()
def my_courses():
    user, err = _ensure_teacher()
    if err:
        return err
    role = get_user_role_name(user)
    q = Course.query.filter(Course.deleted_at.is_(None))
    if role == "Teacher":
        q = q.filter(Course.teacher_id == user.id)
    items = q.order_by(Course.created_at.desc()).all()
    return success_response([{
        "id": c.id, "title": c.title, "slug": c.slug,
        "audience_type": c.audience_type,
        "lesson_count": len([l for l in c.lessons if not l.deleted_at]),
    } for c in items])


@teacher_bp.route("/courses/<course_id>/lessons", methods=["GET"])
@jwt_required()
def list_lessons(course_id):
    user, err = _ensure_teacher()
    if err:
        return err
    course = Course.query.filter_by(id=course_id, deleted_at=None).first()
    if not course or not can_manage_course(user, course):
        return error_response("FORBIDDEN", "No access"), 403
    lessons = Lesson.query.filter_by(course_id=course_id).filter(Lesson.deleted_at.is_(None)).order_by(Lesson.order_num).all()
    return success_response([{
        "id": l.id, "title": l.title, "order_num": l.order_num,
        "video_url": l.video_url, "duration_sec": l.duration_sec,
        "assets": [_asset_dict(a) for a in l.assets],
    } for l in lessons])


@teacher_bp.route("/courses/<course_id>/lessons", methods=["POST"])
@jwt_required()
def create_lesson(course_id):
    user, err = _ensure_teacher()
    if err:
        return err
    course = Course.query.filter_by(id=course_id, deleted_at=None).first()
    if not course or not can_manage_course(user, course):
        return error_response("FORBIDDEN", "No access"), 403
    payload = request.get_json() or {}
    title = (payload.get("title") or "").strip()
    if not title:
        return error_response("VALIDATION_ERROR", "title required"), 400
    max_order = db.session.query(db.func.max(Lesson.order_num)).filter_by(course_id=course_id).scalar() or 0
    lesson = Lesson(
        course_id=course_id,
        title=title,
        order_num=int(payload.get("order_num") or max_order + 1),
        video_url=(payload.get("video_url") or "").strip() or None,
        duration_sec=int(payload.get("duration_sec") or 0),
    )
    db.session.add(lesson)
    db.session.commit()
    log_audit(user.id, "create", "lesson", lesson.id)
    return success_response({"id": lesson.id, "title": lesson.title}), 201


@teacher_bp.route("/lessons/<lesson_id>", methods=["PUT"])
@jwt_required()
def update_lesson(lesson_id):
    user, err = _ensure_teacher()
    if err:
        return err
    lesson = Lesson.query.filter_by(id=lesson_id, deleted_at=None).first()
    if not lesson or not can_manage_course(user, lesson.course):
        return error_response("FORBIDDEN", "No access"), 403
    payload = request.get_json() or {}
    for field in ("title", "video_url", "order_num", "duration_sec"):
        if field in payload:
            setattr(lesson, field, payload[field])
    db.session.commit()
    log_audit(user.id, "update", "lesson", lesson.id)
    return success_response({"id": lesson.id})


@teacher_bp.route("/lessons/<lesson_id>/assets", methods=["POST"])
@jwt_required()
def upload_asset(lesson_id):
    user, err = _ensure_teacher()
    if err:
        return err
    lesson = Lesson.query.filter_by(id=lesson_id, deleted_at=None).first()
    if not lesson or not can_manage_course(user, lesson.course):
        return error_response("FORBIDDEN", "No access"), 403

    if "file" not in request.files:
        return error_response("VALIDATION_ERROR", "No file"), 400
    file = request.files["file"]
    if not file.filename or not _allowed_file(file.filename):
        return error_response("VALIDATION_ERROR", "Invalid file type"), 400

    upload_dir = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)

    asset = Asset(
        lesson_id=lesson_id,
        title=(request.form.get("title") or file.filename).strip(),
        file_path=filepath,
        source_type="upload",
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=os.path.getsize(filepath),
    )
    db.session.add(asset)
    db.session.commit()
    log_audit(user.id, "upload", "asset", asset.id)
    return success_response(_asset_dict(asset)), 201


@teacher_bp.route("/lessons/<lesson_id>/assets/link", methods=["POST"])
@jwt_required()
def add_asset_link(lesson_id):
    user, err = _ensure_teacher()
    if err:
        return err
    lesson = Lesson.query.filter_by(id=lesson_id, deleted_at=None).first()
    if not lesson or not can_manage_course(user, lesson.course):
        return error_response("FORBIDDEN", "No access"), 403
    payload = request.get_json() or {}
    url = (payload.get("url") or "").strip()
    title = (payload.get("title") or "فایل خارجی").strip()
    mime = (payload.get("mime_type") or "application/pdf").strip()
    if not url:
        return error_response("VALIDATION_ERROR", "url required"), 400
    asset = Asset(
        lesson_id=lesson_id,
        title=title,
        source_type="url",
        external_url=url,
        mime_type=mime,
    )
    db.session.add(asset)
    db.session.commit()
    log_audit(user.id, "create", "asset_link", asset.id)
    return success_response(_asset_dict(asset)), 201


@teacher_bp.route("/assets/<asset_id>", methods=["DELETE"])
@jwt_required()
def delete_asset(asset_id):
    user, err = _ensure_teacher()
    if err:
        return err
    asset = Asset.query.get(asset_id)
    if not asset or not asset.lesson or not can_manage_course(user, asset.lesson.course):
        return error_response("FORBIDDEN", "No access"), 403
    if asset.file_path and os.path.isfile(asset.file_path):
        os.remove(asset.file_path)
    db.session.delete(asset)
    db.session.commit()
    log_audit(user.id, "delete", "asset", asset_id)
    return success_response({"deleted": True})
