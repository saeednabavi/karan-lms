import random
import uuid as uuid_lib
from datetime import datetime, timedelta
from flask import request, current_app
from flask.views import MethodView
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_jwt_identity,
    get_jwt,
    jwt_required,
)
from ...extensions import db, limiter
from ...models import User, Role, RefreshToken
from ...utils.response import success_response, error_response
from ...utils.auth_utils import hash_password, check_password

# In-memory stores (use Redis in production)
_captcha_store = {}
_pending_registrations = {}

DEFAULT_SMS_CODE = "0"


def _token_hash(token: str) -> str:
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()


def _normalize_phone(phone: str) -> str:
    if not phone:
        return ""
    return "".join(c for c in str(phone).strip() if c.isdigit())


# --- Captcha ---
def _generate_captcha():
    op = random.choice(["+", "-", "×"])
    if op == "+":
        a, b = random.randint(1, 12), random.randint(1, 12)
        text = f"{a} + {b} = ?"
        answer = a + b
    elif op == "-":
        a, b = random.randint(2, 15), random.randint(1, 12)
        if a < b:
            a, b = b, a
        text = f"{a} - {b} = ?"
        answer = a - b
    else:  # ×
        a, b = random.randint(2, 9), random.randint(2, 9)
        text = f"{a} × {b} = ?"
        answer = a * b
    return text, str(answer)


class CaptchaView(MethodView):
    def get(self):
        text, answer = _generate_captcha()
        captcha_id = str(uuid_lib.uuid4())
        _captcha_store[captcha_id] = {
            "answer": answer,
            "expires": datetime.utcnow() + timedelta(minutes=5),
        }
        return success_response({
            "id": captcha_id,
            "text": text,
        })


def _verify_captcha(captcha_id: str, captcha_value: str) -> bool:
    if not captcha_id or not captcha_value:
        return False
    entry = _captcha_store.get(captcha_id)
    if not entry or entry["expires"] < datetime.utcnow():
        return False
    ok = entry["answer"] == str(captcha_value).strip()
    del _captcha_store[captcha_id]
    return ok


# --- List roles for registration ---
class RolesListView(MethodView):
    def get(self):
        roles = Role.query.filter(
            Role.name.in_(("Admin", "Technical", "Teacher", "Pupil", "Student", "Parent"))
        ).order_by(Role.id).all()
        return success_response([
            {"id": r.id, "name": r.name}
            for r in roles
        ])


# --- Check phone (already registered?) ---
class CheckPhoneView(MethodView):
    decorators = [limiter.limit("10 per minute")]

    def post(self):
        data = request.get_json() or {}
        phone = _normalize_phone(data.get("phone") or "")
        if not phone:
            return error_response("VALIDATION_ERROR", "Phone number required"), 400
        user = User.query.filter_by(phone=phone, deleted_at=None).first()
        return success_response({"registered": user is not None})


# --- Register step 1: request SMS (store pending, "send" code 0) ---
class RegisterRequestView(MethodView):
    decorators = [limiter.limit("5 per minute")]

    def post(self):
        data = request.get_json() or {}
        first_name = (data.get("first_name") or "").strip()
        last_name = (data.get("last_name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        phone = _normalize_phone(data.get("phone") or "")
        role_id = data.get("role_id")
        password = data.get("password")
        captcha_id = (data.get("captcha_id") or "").strip()
        captcha_value = (data.get("captcha_value") or "").strip()

        if not first_name or not last_name or not email or not phone:
            return error_response("VALIDATION_ERROR", "First name, last name, email and phone required"), 400
        if not password or len(password) < 8:
            return error_response("VALIDATION_ERROR", "Password must be at least 8 characters"), 400
        if not _verify_captcha(captcha_id, captcha_value):
            return error_response("VALIDATION_ERROR", "Invalid or expired captcha"), 400

        if User.query.filter_by(phone=phone, deleted_at=None).first():
            return error_response("CONFLICT", "Phone already registered"), 409
        if User.query.filter_by(email=email, deleted_at=None).first():
            return error_response("CONFLICT", "Email already registered"), 409

        role = Role.query.get(role_id) if role_id else None
        if not role:
            role = Role.query.filter_by(name="Student").first()
        rid = role.id if role else None
        if not rid:
            return error_response("VALIDATION_ERROR", "Invalid role"), 400

        _pending_registrations[phone] = {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password_hash": hash_password(password),
            "role_id": rid,
            "created_at": datetime.utcnow(),
        }
        # "Send" SMS - default code 0 (no real SMS)
        return success_response({
            "sent": True,
            "message": "SMS code sent (use 0 for testing)",
        })


# --- Register step 2: verify SMS code and create user ---
class RegisterVerifyView(MethodView):
    decorators = [limiter.limit("10 per minute")]

    def post(self):
        data = request.get_json() or {}
        phone = _normalize_phone(data.get("phone") or "")
        code = (data.get("code") or "").strip()

        if not phone:
            return error_response("VALIDATION_ERROR", "Phone required"), 400
        pending = _pending_registrations.get(phone)
        if not pending:
            return error_response("VALIDATION_ERROR", "No pending registration for this phone"), 400
        if pending["created_at"] < datetime.utcnow() - timedelta(minutes=15):
            del _pending_registrations[phone]
            return error_response("VALIDATION_ERROR", "Registration expired, please start again"), 400
        if code != DEFAULT_SMS_CODE:
            return error_response("VALIDATION_ERROR", "Invalid SMS code"), 400

        # Create user
        user = User(
            email=pending["email"],
            password_hash=pending["password_hash"],
            first_name=pending["first_name"],
            last_name=pending["last_name"],
            full_name=f"{pending['first_name']} {pending['last_name']}".strip(),
            phone=phone,
            role_id=pending["role_id"],
        )
        db.session.add(user)
        db.session.commit()
        del _pending_registrations[phone]

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        refresh_jti = decode_token(refresh_token).get("jti")
        token_hash_val = _token_hash(refresh_jti or refresh_token)
        expires = datetime.utcnow() + timedelta(
            seconds=int(current_app.config.get("JWT_REFRESH_TOKEN_EXPIRES", 604800))
        )
        rt = RefreshToken(
            user_id=user.id,
            token_hash=token_hash_val,
            expires_at=expires,
        )
        db.session.add(rt)
        db.session.commit()

        return success_response({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": 900,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "role": user.role.name if user.role else None,
            },
        }), 201


class RegisterView(MethodView):
    """Legacy: simple register (no phone/SMS) - keep for backward compat or remove."""
    decorators = [limiter.limit("5 per minute")]

    def post(self):
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password")
        full_name = (data.get("full_name") or "").strip()
        if not email or not password:
            return error_response("VALIDATION_ERROR", "Email and password required"), 400
        if len(password) < 8:
            return error_response("VALIDATION_ERROR", "Password must be at least 8 characters"), 400
        if User.query.filter_by(email=email).first():
            return error_response("CONFLICT", "Email already registered"), 409
        student_role = Role.query.filter_by(name="Student").first()
        role_id = student_role.id if student_role else 3
        user = User(
            email=email,
            password_hash=hash_password(password),
            full_name=full_name or None,
            role_id=role_id,
        )
        db.session.add(user)
        db.session.commit()
        return success_response({"id": user.id, "email": user.email}), 201


class LoginView(MethodView):
    decorators = [limiter.limit("5 per minute")]

    def post(self):
        try:
            data = request.get_json(silent=True) or {}
        except Exception:
            return error_response("VALIDATION_ERROR", "Invalid JSON body"), 400
        login_id = (data.get("email") or data.get("username") or data.get("phone") or "").strip()
        password = data.get("password")
        captcha_id = (data.get("captcha_id") or "").strip()
        captcha_value = (data.get("captcha_value") or "").strip()
        if not login_id or not password:
            return error_response("VALIDATION_ERROR", "Email/username/phone and password required"), 400
        if not _verify_captcha(captcha_id, captcha_value):
            return error_response("VALIDATION_ERROR", "Invalid or expired captcha"), 400

        try:
            phone_norm = _normalize_phone(login_id) if login_id else ""
            conditions = [User.email == login_id, User.username == login_id]
            if phone_norm:
                conditions.extend([User.phone == login_id, User.phone == phone_norm])
            user = User.query.filter(
                db.or_(*conditions),
                User.deleted_at.is_(None),
            ).first()
        except Exception as e:
            current_app.logger.exception("Login user lookup failed: %s", e)
            return error_response(
                "INTERNAL_ERROR",
                "Database error. Make sure migrations are run: python -m alembic upgrade head",
            ), 500
        if not user or not check_password(password, user.password_hash):
            return error_response("UNAUTHORIZED", "نام کاربری یا رمز عبور اشتباه است. لطفاً دوباره وارد کنید."), 401

        try:
            access_token = create_access_token(identity=user.id)
            refresh_token = create_refresh_token(identity=user.id)
            refresh_jti = decode_token(refresh_token).get("jti")
            token_hash_val = _token_hash(refresh_jti or refresh_token)
            expires = datetime.utcnow() + timedelta(
                seconds=int(current_app.config.get("JWT_REFRESH_TOKEN_EXPIRES", 604800))
            )
            rt = RefreshToken(
                user_id=user.id,
                token_hash=token_hash_val,
                expires_at=expires,
            )
            db.session.add(rt)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception("Login token creation failed: %s", e)
            return error_response("INTERNAL_ERROR", "Login failed. Try again."), 500
        return success_response({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": 900,
        })


class RefreshView(MethodView):
    decorators = [limiter.limit("10 per minute")]

    @jwt_required(refresh=True)
    def post(self):
        identity = get_jwt_identity()
        token = get_jwt()
        jti = token.get("jti")
        user = User.query.filter_by(id=identity, deleted_at=None).first()
        if not user or user.deleted_at:
            return error_response("UNAUTHORIZED", "User not found"), 401

        current_token_hash = _token_hash(jti or "")
        current_refresh = RefreshToken.query.filter_by(
            user_id=user.id,
            token_hash=current_token_hash,
            revoked_at=None,
        ).first()
        if not current_refresh:
            return error_response("UNAUTHORIZED", "Refresh token invalid"), 401
        if current_refresh.expires_at <= datetime.utcnow():
            return error_response("UNAUTHORIZED", "Refresh token expired"), 401

        current_refresh.revoked_at = datetime.utcnow()

        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        refresh_jti = decode_token(refresh_token).get("jti")
        token_hash_val = _token_hash(refresh_jti or refresh_token)
        expires = datetime.utcnow() + timedelta(
            seconds=int(current_app.config.get("JWT_REFRESH_TOKEN_EXPIRES", 604800))
        )
        rt = RefreshToken(
            user_id=user.id,
            token_hash=token_hash_val,
            expires_at=expires,
        )
        db.session.add(rt)
        db.session.commit()
        return success_response({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": 900,
        })


class LogoutView(MethodView):
    @jwt_required(refresh=True)
    def post(self):
        jti = get_jwt().get("jti")
        user_id = get_jwt_identity()
        token_hash = _token_hash(jti or "")
        token = RefreshToken.query.filter_by(
            user_id=user_id,
            token_hash=token_hash,
            revoked_at=None,
        ).first()
        if token:
            token.revoked_at = datetime.utcnow()
        db.session.commit()
        return success_response({"message": "Logged out"})


class MeView(MethodView):
    @jwt_required()
    def get(self):
        identity = get_jwt_identity()
        user = User.query.filter_by(id=identity, deleted_at=None).first()
        if not user:
            return error_response("UNAUTHORIZED", "User not found"), 401
        return success_response({
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "role": user.role.name if user.role else None,
        })


from flask import Blueprint
auth_bp = Blueprint("auth", __name__)
auth_bp.add_url_rule("/captcha", view_func=CaptchaView.as_view("captcha"))
auth_bp.add_url_rule("/roles", view_func=RolesListView.as_view("roles"))
auth_bp.add_url_rule("/check-phone", view_func=CheckPhoneView.as_view("check_phone"))
auth_bp.add_url_rule("/register/request", view_func=RegisterRequestView.as_view("register_request"))
auth_bp.add_url_rule("/register/verify", view_func=RegisterVerifyView.as_view("register_verify"))
auth_bp.add_url_rule("/register", view_func=RegisterView.as_view("register"))
auth_bp.add_url_rule("/login", view_func=LoginView.as_view("login"))
auth_bp.add_url_rule("/refresh", view_func=RefreshView.as_view("refresh"))
auth_bp.add_url_rule("/logout", view_func=LogoutView.as_view("logout"))
auth_bp.add_url_rule("/me", view_func=MeView.as_view("me"))
