from datetime import datetime

from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ...extensions import db
from ...models import Exam, Question, ExamAttempt
from ...utils.response import success_response, error_response

exams_bp = Blueprint("exams", __name__)


@exams_bp.route("", methods=["GET"])
def list_exams():
    q = Exam.query.filter(Exam.deleted_at.is_(None))
    tag = request.args.get("tag")
    if tag:
        q = q.filter(Exam.tag == tag)
    limit = min(int(request.args.get("limit", 50)), 100)
    offset = int(request.args.get("offset", 0))
    items = q.order_by(Exam.created_at.desc()).offset(offset).limit(limit).all()
    total = q.count()
    data = [{
        "id": e.id, "title": e.title, "slug": e.slug,
        "level": e.level, "question_count": e.question_count or len(e.questions),
        "duration_minutes": e.duration_minutes, "status": e.status, "tag": e.tag,
    } for e in items]
    return success_response(data, {"total": total})


@exams_bp.route("/<id>", methods=["GET"])
def get_exam(id):
    e = Exam.query.filter_by(id=id, deleted_at=None).first()
    if not e:
        return error_response("NOT_FOUND", "Exam not found"), 404
    return success_response({
        "id": e.id, "title": e.title, "slug": e.slug,
        "level": e.level,
        "question_count": e.question_count or len(e.questions),
        "duration_minutes": e.duration_minutes,
        "status": e.status, "tag": e.tag,
    })


@exams_bp.route("/<id>/questions", methods=["GET"])
@jwt_required()
def get_exam_questions(id):
    e = Exam.query.filter_by(id=id, deleted_at=None).first()
    if not e:
        return error_response("NOT_FOUND", "Exam not found"), 404
    questions = Question.query.filter_by(exam_id=id).order_by(Question.order_num).all()
    return success_response([{
        "id": q.id,
        "text": q.text,
        "options": q.options,
        "order_num": q.order_num,
    } for q in questions])


@exams_bp.route("/<id>/submit", methods=["POST"])
@jwt_required()
def submit_exam(id):
    user_id = get_jwt_identity()
    e = Exam.query.filter_by(id=id, deleted_at=None).first()
    if not e:
        return error_response("NOT_FOUND", "Exam not found"), 404
    payload = request.get_json() or {}
    answers = payload.get("answers") or {}
    questions = Question.query.filter_by(exam_id=id).all()
    score = 0
    total = len(questions)
    for q in questions:
        selected = answers.get(q.id)
        if selected is not None and int(selected) == q.correct_index:
            score += 1
    attempt = ExamAttempt(
        exam_id=id,
        user_id=user_id,
        score=score,
        total=total,
        answers=answers,
        completed_at=datetime.utcnow(),
    )
    db.session.add(attempt)
    db.session.commit()
    return success_response({
        "attempt_id": attempt.id,
        "score": score,
        "total": total,
        "percent": round(score / total * 100) if total else 0,
    })
