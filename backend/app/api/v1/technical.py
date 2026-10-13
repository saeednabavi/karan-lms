import os

from flask import Blueprint, request, current_app
from flask_jwt_extended import get_jwt_identity, jwt_required

from ...extensions import db
from ...models import User, AboutInfo, Asset, Course
from ...utils.response import success_response, error_response
from ...utils.audit_utils import log_audit
from ...policies.rbac import get_user_role_name

technical_bp = Blueprint("technical", __name__)

STAFF = {"Admin", "Technical"}


def _ensure_technical():
    uid = get_jwt_identity()
    user = User.query.filter_by(id=uid, deleted_at=None).first()
    role = get_user_role_name(user)
    if not user or role not in STAFF:
        return None, (error_response("FORBIDDEN", "Technical access required"), 403)
    return user, None


@technical_bp.route("/settings", methods=["GET"])
@jwt_required()
def get_settings():
    _, err = _ensure_technical()
    if err:
        return err
    rows = AboutInfo.query.all()
    return success_response({r.key: r.value for r in rows})


@technical_bp.route("/settings", methods=["PUT"])
@jwt_required()
def update_settings():
    user, err = _ensure_technical()
    if err:
        return err
    payload = request.get_json() or {}
    for key, value in payload.items():
        row = AboutInfo.query.filter_by(key=key).first()
        if row:
            row.value = str(value)
        else:
            db.session.add(AboutInfo(key=key, value=str(value)))
    db.session.commit()
    log_audit(user.id, "update", "settings", None)
    return success_response({"updated": True})


@technical_bp.route("/files", methods=["GET"])
@jwt_required()
def list_files():
    _, err = _ensure_technical()
    if err:
        return err
    assets = Asset.query.order_by(Asset.created_at.desc()).limit(200).all()
    data = []
    for a in assets:
        course_title = None
        if a.lesson and a.lesson.course:
            course_title = a.lesson.course.title
        data.append({
            "id": a.id,
            "title": a.title,
            "source_type": a.source_type,
            "external_url": a.external_url,
            "mime_type": a.mime_type,
            "size_bytes": a.size_bytes,
            "course": course_title,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        })
    return success_response(data, {"total": len(data)})


@technical_bp.route("/upload-info", methods=["GET"])
@jwt_required()
def upload_info():
    _, err = _ensure_technical()
    if err:
        return err
    upload_dir = current_app.config.get("UPLOAD_FOLDER", "uploads")
    total_size = 0
    file_count = 0
    if os.path.isdir(upload_dir):
        for root, _dirs, files in os.walk(upload_dir):
            for f in files:
                file_count += 1
                total_size += os.path.getsize(os.path.join(root, f))
    return success_response({
        "upload_folder": upload_dir,
        "file_count": file_count,
        "total_size_bytes": total_size,
        "courses": Course.query.filter(Course.deleted_at.is_(None)).count(),
    })
