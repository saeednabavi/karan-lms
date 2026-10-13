"""Role-based access control policies."""

from functools import wraps

from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from ..models import User, Enrollment, Asset

CANONICAL_ROLES = frozenset({
    "Admin", "Technical", "Teacher", "Pupil", "Student", "Parent",
})

ROLE_ALIASES = {
    "SuperAdmin": "Admin",
    "ContentManager": "Technical",
    "Instructor": "Teacher",
}

PERMISSIONS = {
    "Admin": {"reports", "users", "courses", "exams", "articles", "settings", "upload"},
    "Technical": {"users", "courses", "exams", "articles", "settings", "upload"},
    "Teacher": {"own_courses", "upload", "own_exams"},
    "Pupil": {"enroll", "view_lessons", "download_assets"},
    "Student": {"enroll", "view_lessons", "download_assets"},
    "Parent": {"view_child_progress"},
}

MANAGER_ROLES = frozenset({"Admin", "Technical"})
STAFF_ROLES = frozenset({"Admin", "Technical", "Teacher"})


def normalize_role(role_name: str) -> str:
    if not role_name:
        return ""
    return ROLE_ALIASES.get(role_name, role_name)


def get_user_role_name(user: User) -> str:
    if not user or not user.role:
        return ""
    return normalize_role(user.role.name)


def has_permission(user: User, permission: str) -> bool:
    role = get_user_role_name(user)
    if role == "Admin":
        return True
    return permission in PERMISSIONS.get(role, set())


def require_role(*allowed_roles):
    normalized = {normalize_role(r) for r in allowed_roles}
    normalized.add("Admin")

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()
            user = User.query.get(identity) if identity else None
            if not user or not user.role:
                return {"error": {"code": "FORBIDDEN", "message": "Access denied"}}, 403
            role_name = get_user_role_name(user)
            if role_name not in normalized:
                return {"error": {"code": "FORBIDDEN", "message": "Insufficient role"}}, 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def can_access_asset(user_id: str, asset: Asset) -> bool:
    if not user_id or not asset:
        return False
    user = User.query.get(user_id)
    if not user or not user.role:
        return False
    role = get_user_role_name(user)
    if role in ("Admin", "Technical", "Teacher"):
        if role == "Teacher":
            lesson = asset.lesson
            if lesson and lesson.course and lesson.course.teacher_id == user_id:
                return True
            return False
        return True
    lesson = asset.lesson
    if not lesson or not lesson.course:
        return False
    enrollment = Enrollment.query.filter_by(
        user_id=user_id, course_id=lesson.course_id, status="active"
    ).first()
    return enrollment is not None


def can_manage_course(user: User, course) -> bool:
    if not user or not course:
        return False
    role = get_user_role_name(user)
    if role in MANAGER_ROLES:
        return True
    if role == "Teacher" and course.teacher_id == user.id:
        return True
    return False


def is_enrolled(user_id: str, course_id: str) -> bool:
    return Enrollment.query.filter_by(
        user_id=user_id, course_id=course_id, status="active"
    ).first() is not None
