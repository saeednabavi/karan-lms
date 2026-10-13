"""Local placeholder image paths served by the frontend (no external CDN)."""

SEED_BASE = "/images/seed"

COURSE_IMAGES = {
    "math": f"{SEED_BASE}/course-math.svg",
    "science": f"{SEED_BASE}/course-science.svg",
    "english": f"{SEED_BASE}/course-english.svg",
    "programming": f"{SEED_BASE}/course-programming.svg",
    "default": f"{SEED_BASE}/course-default.svg",
}

TEACHER_AVATARS = {
    1: f"{SEED_BASE}/teacher-1.svg",
    2: f"{SEED_BASE}/teacher-2.svg",
    3: f"{SEED_BASE}/teacher-3.svg",
}


def course_image(cat_slug: str) -> str:
    return COURSE_IMAGES.get(cat_slug, COURSE_IMAGES["default"])


def teacher_avatar(idx: int) -> str:
    return TEACHER_AVATARS.get(idx, TEACHER_AVATARS[1])


def article_image(idx: int) -> str:
    n = ((idx - 1) % 10) + 1
    return f"{SEED_BASE}/article-{n}.svg"
