from datetime import datetime

from sqlalchemy import or_

from ..extensions import db
from ..models import (
    User, Role, Category, Course, Lesson, Asset, Enrollment,
    Article, Teacher, Exam, Question, AboutInfo, ParentPupil,
    ExamAttempt, LessonProgress,
)
from ..utils.auth_utils import hash_password
from . import data as D
from .placeholders import course_image, teacher_avatar, article_image, COURSE_IMAGES


def print_credentials():
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    print("")
    print("=" * 60)
    print("  حساب‌های تست — ورود با email، username یا phone")
    print("=" * 60)
    for u in D.TEST_USERS:
        print(f"  [{u['role']}] {u['full_name']}")
        print(f"    email:    {u['email']}")
        print(f"    username: {u['username']}")
        print(f"    phone:    {u['phone']}")
        print(f"    password: {u['password']}")
        print(f"    panel:    {u['panel']}")
        print("")
    print("=" * 60)


def _ensure_roles():
    role_map = {}
    for name in D.CANONICAL_ROLES:
        role = Role.query.filter_by(name=name).first()
        if not role:
            role = Role(name=name)
            db.session.add(role)
        role_map[name] = role
    db.session.commit()
    return {name: Role.query.filter_by(name=name).first() for name in D.CANONICAL_ROLES}


def _find_existing_user(spec):
    """Match by email, username, or phone (handles legacy migration users)."""
    conditions = []
    if spec.get("email"):
        conditions.append(User.email == spec["email"])
    if spec.get("username"):
        conditions.append(User.username == spec["username"])
    if spec.get("phone"):
        conditions.append(User.phone == spec["phone"])
    if not conditions:
        return None
    return (
        User.query.filter(User.deleted_at.is_(None))
        .filter(or_(*conditions))
        .first()
    )


def _ensure_user(spec, role_map):
    u = _find_existing_user(spec)
    if not u:
        u = User(
            email=spec["email"],
            password_hash=hash_password(spec["password"]),
            full_name=spec["full_name"],
            first_name=spec["first_name"],
            last_name=spec["last_name"],
            role_id=role_map[spec["role"]].id,
            phone=spec["phone"],
            username=spec["username"],
        )
        db.session.add(u)
        db.session.flush()
    else:
        u.email = spec["email"]
        u.username = spec["username"]
        u.phone = spec["phone"]
        u.full_name = spec["full_name"]
        u.first_name = spec["first_name"]
        u.last_name = spec["last_name"]
        u.role_id = role_map[spec["role"]].id
        u.password_hash = hash_password(spec["password"])
    # Clear same unique fields on other rows to avoid conflicts
    for field in ("email", "username", "phone"):
        val = getattr(u, field)
        if not val:
            continue
        others = User.query.filter(
            getattr(User, field) == val,
            User.id != u.id,
            User.deleted_at.is_(None),
        ).all()
        for other in others:
            setattr(other, field, None)
    db.session.commit()
    return u


def _reset_demo_data():
    ExamAttempt.query.delete()
    LessonProgress.query.delete()
    Asset.query.delete()
    Lesson.query.delete()
    Enrollment.query.delete()
    Question.query.delete()
    for e in Exam.query.filter(Exam.deleted_at.is_(None)).all():
        e.deleted_at = datetime.utcnow()
    ParentPupil.query.delete()
    Teacher.query.delete()
    for a in Article.query.filter(Article.deleted_at.is_(None)).all():
        a.deleted_at = datetime.utcnow()
    for c in Course.query.filter(Course.deleted_at.is_(None)).all():
        c.deleted_at = datetime.utcnow()
    db.session.commit()


def _refresh_images():
    for c in Course.query.filter(Course.deleted_at.is_(None)).all():
        cat_slug = c.category.slug if c.category else "default"
        if cat_slug not in COURSE_IMAGES:
            cat_slug = "default"
        c.image_url = course_image(cat_slug)
    for i, a in enumerate(Article.query.filter(Article.deleted_at.is_(None)).all(), 1):
        a.image_url = article_image(i)
    for i, t in enumerate(Teacher.query.all(), 1):
        t.avatar_url = teacher_avatar(i)
    db.session.commit()


def _seed_categories():
    for name_fa, slug in D.CATEGORIES:
        if not Category.query.filter_by(slug=slug).first():
            db.session.add(Category(name_fa=name_fa, slug=slug))
    db.session.commit()
    return {c.slug: c for c in Category.query.all()}


def _seed_courses(cat_map, users_by_username):
    created = []
    for title, slug, cat_slug, teacher_key, price, rating, students, audience in D.COURSES:
        existing = Course.query.filter_by(slug=slug).first()
        tid = users_by_username[teacher_key].id
        if existing:
            if existing.deleted_at:
                existing.deleted_at = None
            existing.title = title
            existing.image_url = course_image(cat_slug)
            existing.teacher_id = tid
            existing.audience_type = audience
            created.append(existing)
            continue
        course = Course(
            title=title,
            slug=slug,
            description=f"{title} — دوره کامل با تمرین، آزمون و برنامه مطالعاتی گام‌به‌گام.",
            category_id=cat_map[cat_slug].id,
            teacher_id=tid,
            price=price,
            is_free=(price == 0),
            image_url=course_image(cat_slug),
            rating=rating,
            student_count=students,
            audience_type=audience,
        )
        db.session.add(course)
        created.append(course)
    db.session.commit()
    return created


def _seed_lessons(courses):
    for course in courses:
        if course.deleted_at:
            continue
        existing = Lesson.query.filter_by(course_id=course.id).filter(Lesson.deleted_at.is_(None)).count()
        if existing >= 5:
            continue
        for idx in range(existing + 1, 6):
            db.session.add(Lesson(
                course_id=course.id,
                title=f"درس {idx} — {course.title}",
                order_num=idx,
                duration_sec=900 + idx * 120,
                video_url=D.VIDEO_URL,
            ))
    db.session.commit()
    for lesson in Lesson.query.filter(Lesson.deleted_at.is_(None)).all():
        if not Asset.query.filter_by(lesson_id=lesson.id).first():
            db.session.add(Asset(
                lesson_id=lesson.id,
                title=f"جزوه PDF — {lesson.title}",
                source_type="url",
                file_path="",
                external_url=D.PDF_URL,
                mime_type="application/pdf",
            ))
    db.session.commit()


def _seed_teachers(users_by_username):
    for user_key, full_name, title, bio, avatar_idx in D.TEACHERS:
        user = users_by_username[user_key]
        t = Teacher.query.filter_by(full_name=full_name).first()
        if not t:
            t = Teacher(
                user_id=user.id,
                full_name=full_name,
                title=title,
                bio=bio,
                avatar_url=teacher_avatar(avatar_idx),
            )
            db.session.add(t)
        else:
            t.avatar_url = teacher_avatar(avatar_idx)
            t.title = title
            t.bio = bio
    db.session.commit()


def _seed_articles(admin_id):
    for i, topic in enumerate(D.ARTICLE_TOPICS, 1):
        slug = f"article-{i}"
        a = Article.query.filter_by(slug=slug).first()
        if not a:
            db.session.add(Article(
                title=topic,
                slug=slug,
                excerpt=f"خلاصه: {topic}",
                body=f"متن کامل مقاله «{topic}». این محتوا برای نمایش و تست پلتفرم کران بالا آماده شده است.",
                author_id=admin_id,
                image_url=article_image(i),
                published_at=datetime.utcnow(),
            ))
        elif a.deleted_at:
            a.deleted_at = None
            a.image_url = article_image(i)
    db.session.commit()


def _seed_exams(users_by_username):
    teacher = users_by_username["teacher"]
    for title, slug, level, duration, tag in D.EXAMS:
        exam = Exam.query.filter_by(slug=slug).first()
        if not exam:
            exam = Exam(
                title=title,
                slug=slug,
                level=level,
                question_count=len(D.EXAM_QUESTIONS),
                duration_minutes=duration,
                status="فعال",
                tag=tag,
                teacher_id=teacher.id,
            )
            db.session.add(exam)
            db.session.flush()
            for qi, qtext in enumerate(D.EXAM_QUESTIONS, 1):
                db.session.add(Question(
                    exam_id=exam.id,
                    text=qtext,
                    options=["گزینه الف", "گزینه ب", "گزینه ج", "گزینه د"],
                    correct_index=0,
                    order_num=qi,
                ))
        elif exam.deleted_at:
            exam.deleted_at = None
    db.session.commit()


def _seed_about():
    for key, value in D.ABOUT_ROWS:
        row = AboutInfo.query.filter_by(key=key).first()
        if row:
            row.value = value
        else:
            db.session.add(AboutInfo(key=key, value=value))
    db.session.commit()


def _seed_enrollments(users_by_username):
    pupil = users_by_username["pupil"]
    student = users_by_username["student"]
    parent = users_by_username["parent"]

    if not ParentPupil.query.filter_by(parent_id=parent.id, pupil_id=pupil.id).first():
        db.session.add(ParentPupil(parent_id=parent.id, pupil_id=pupil.id))
    db.session.commit()

    for course in Course.query.filter(Course.deleted_at.is_(None)).all():
        aud = course.audience_type or "all"
        targets = []
        if aud in ("pupil", "all"):
            targets.append(pupil.id)
        if aud in ("student", "all"):
            targets.append(student.id)
        for uid in targets:
            if not Enrollment.query.filter_by(user_id=uid, course_id=course.id).first():
                db.session.add(Enrollment(user_id=uid, course_id=course.id, status="active"))
    db.session.commit()


def run_seed(refresh=False, reset=False):
    if reset:
        _reset_demo_data()

    role_map = _ensure_roles()
    users_by_username = {}
    for spec in D.TEST_USERS:
        users_by_username[spec["username"]] = _ensure_user(spec, role_map)

    cat_map = _seed_categories()
    courses = _seed_courses(cat_map, users_by_username)
    _seed_lessons(courses if courses else Course.query.filter(Course.deleted_at.is_(None)).all())
    _seed_teachers(users_by_username)
    _seed_articles(users_by_username["admin"].id)
    _seed_exams(users_by_username)
    _seed_about()
    _seed_enrollments(users_by_username)

    # Always fix image URLs (replace old CDN links with local paths)
    _refresh_images()

    print("Seed completed successfully.")
    print_credentials()
