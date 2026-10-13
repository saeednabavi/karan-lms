from flask import Blueprint, request
from . import courses, categories, articles, teachers, exams, about

legacy_bp = Blueprint("legacy", __name__)


@legacy_bp.route("/courses", methods=["GET"])
def legacy_courses():
    return courses.list_courses()


@legacy_bp.route("/courses/popular", methods=["GET"])
def legacy_courses_popular():
    return courses.popular_courses()


@legacy_bp.route("/categories", methods=["GET"])
def legacy_categories():
    return categories.list_categories()


@legacy_bp.route("/articles", methods=["GET"])
def legacy_articles():
    return articles.list_articles()


@legacy_bp.route("/teachers", methods=["GET"])
def legacy_teachers():
    return teachers.list_teachers()


@legacy_bp.route("/exams", methods=["GET"])
def legacy_exams():
    return exams.list_exams()


@legacy_bp.route("/about", methods=["GET"])
def legacy_about():
    return about.get_about()
