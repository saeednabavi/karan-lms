from flask import Blueprint
from .auth import auth_bp
from .courses import courses_bp
from .categories import categories_bp
from .articles import articles_bp
from .teachers import teachers_bp
from .exams import exams_bp
from .about import about_bp
from .assets import assets_bp
from .admin import admin_bp
from .teacher import teacher_bp
from .technical import technical_bp
from .parent import parent_bp

v1_bp = Blueprint("v1", __name__)

v1_bp.register_blueprint(auth_bp, url_prefix="/auth")
v1_bp.register_blueprint(courses_bp, url_prefix="/courses")
v1_bp.register_blueprint(categories_bp, url_prefix="/categories")
v1_bp.register_blueprint(articles_bp, url_prefix="/articles")
v1_bp.register_blueprint(teachers_bp, url_prefix="/teachers")
v1_bp.register_blueprint(exams_bp, url_prefix="/exams")
v1_bp.register_blueprint(about_bp, url_prefix="/about")
v1_bp.register_blueprint(assets_bp, url_prefix="/assets")
v1_bp.register_blueprint(admin_bp, url_prefix="/admin")
v1_bp.register_blueprint(teacher_bp, url_prefix="/teacher")
v1_bp.register_blueprint(technical_bp, url_prefix="/technical")
v1_bp.register_blueprint(parent_bp, url_prefix="/parent")
