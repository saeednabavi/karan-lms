"""Rich demo seed data definitions."""

CANONICAL_ROLES = ["Admin", "Technical", "Teacher", "Pupil", "Student", "Parent"]

TEST_USERS = [
    {
        "email": "admin@karanbala.ir",
        "username": "admin",
        "phone": "09120000001",
        "password": "admin123!",
        "full_name": "مدیر سیستم",
        "first_name": "مدیر",
        "last_name": "سیستم",
        "role": "Admin",
        "panel": "/panel/admin",
    },
    {
        "email": "tech@karanbala.ir",
        "username": "tech",
        "phone": "09120000002",
        "password": "tech123!",
        "full_name": "مسئول فنی",
        "first_name": "مسئول",
        "last_name": "فنی",
        "role": "Technical",
        "panel": "/panel/technical",
    },
    {
        "email": "teacher@karanbala.ir",
        "username": "teacher",
        "phone": "09120000003",
        "password": "teacher123!",
        "full_name": "پریسا خزایی",
        "first_name": "پریسا",
        "last_name": "خزایی",
        "role": "Teacher",
        "panel": "/panel/teacher",
    },
    {
        "email": "teacher2@karanbala.ir",
        "username": "teacher2",
        "phone": "09120000004",
        "password": "teacher123!",
        "full_name": "محمد رضایی",
        "first_name": "محمد",
        "last_name": "رضایی",
        "role": "Teacher",
        "panel": "/panel/teacher",
    },
    {
        "email": "pupil@karanbala.ir",
        "username": "pupil",
        "phone": "09120000005",
        "password": "pupil123!",
        "full_name": "علی دانش‌آموز",
        "first_name": "علی",
        "last_name": "دانش‌آموز",
        "role": "Pupil",
        "panel": "/panel/pupil",
    },
    {
        "email": "student@karanbala.ir",
        "username": "student",
        "phone": "09120000006",
        "password": "student123!",
        "full_name": "رضا دانشجو",
        "first_name": "رضا",
        "last_name": "دانشجو",
        "role": "Student",
        "panel": "/panel/student",
    },
    {
        "email": "parent@karanbala.ir",
        "username": "parent",
        "phone": "09120000007",
        "password": "parent123!",
        "full_name": "والد نمونه",
        "first_name": "والد",
        "last_name": "نمونه",
        "role": "Parent",
        "panel": "/panel/parent",
    },
]

CATEGORIES = [
    ("ریاضی", "math"),
    ("علوم", "science"),
    ("زبان انگلیسی", "english"),
    ("برنامه‌نویسی", "programming"),
]

# title, slug, cat_slug, teacher_key, price, rating, students, audience
COURSES = [
    ("ریاضی پنجم جامع", "math-grade-5", "math", "teacher", 1200000, 4.7, 320, "pupil"),
    ("ریاضی ششم پیشرفته", "math-grade-6", "math", "teacher", 1350000, 4.8, 290, "pupil"),
    ("علوم پنجم تصویری", "science-grade-5", "science", "teacher", 980000, 4.6, 210, "pupil"),
    ("علوم ششم مفهومی", "science-grade-6", "science", "teacher2", 1100000, 4.5, 260, "pupil"),
    ("واژگان انگلیسی پایه", "english-vocab-basic", "english", "teacher2", 650000, 4.4, 180, "pupil"),
    ("جاوااسکریپت مقدماتی", "js-basic", "programming", "teacher", 950000, 4.7, 430, "student"),
    ("پایتون برای نوجوانان", "python-for-teens", "programming", "teacher", 0, 4.9, 520, "student"),
    ("آمار و احتمال", "statistics-101", "math", "teacher2", 1500000, 4.5, 180, "student"),
    ("گرامر انگلیسی کاربردی", "english-grammar", "english", "teacher2", 780000, 4.3, 170, "student"),
    ("مبانی برنامه‌نویسی", "programming-intro", "programming", "teacher", 0, 4.6, 350, "all"),
]

TEACHERS = [
    ("teacher", "پریسا خزایی", "مدرس ریاضی و برنامه‌نویسی", "۸ سال سابقه تدریس و طراحی آزمون.", 1),
    ("teacher2", "محمد رضایی", "مدرس علوم و زبان", "تخصص در آموزش مفهومی با مثال‌های کاربردی.", 2),
    ("teacher", "سارا احمدی", "مدرس زبان انگلیسی", "مدرک TESOL و ۵ سال تجربه تدریس آنلاین.", 3),
]

ARTICLE_TOPICS = [
    "چطور برنامه مطالعاتی حرفه‌ای بچینیم",
    "۱۰ تکنیک افزایش تمرکز در مطالعه",
    "اشتباهات رایج دانش‌آموزان قبل از آزمون",
    "راهنمای حل مسئله در ریاضی",
    "چطور در علوم مفهومی یاد بگیریم",
    "روش‌های یادگیری لغات انگلیسی",
    "مرور سریع قبل امتحان نهایی",
    "مدیریت زمان در آزمون",
    "بهترین روش یادداشت‌برداری",
    "راهنمای انتخاب دوره مناسب",
]

EXAMS = [
    ("ریاضی پنجم - فصل ۱", "exam-math-5-1", "پنجم", 25, "school"),
    ("ریاضی پنجم - فصل ۲", "exam-math-5-2", "پنجم", 25, "school"),
    ("علوم پنجم - فصل ۱", "exam-science-5-1", "پنجم", 20, "school"),
    ("علوم ششم - فصل ۳", "exam-science-6-3", "ششم", 30, "school"),
    ("انگلیسی واژگان - سطح ۱", "exam-eng-1", "مهارت", 30, "skills"),
    ("انگلیسی گرامر - سطح ۲", "exam-eng-2", "مهارت", 30, "skills"),
    ("نمونه آزمون تیزهوشان ۱", "exam-entrance-1", "ورودی", 40, "entrance"),
    ("نمونه آزمون دانشگاهی", "exam-uni-1", "ورودی", 40, "university"),
]

EXAM_QUESTIONS = [
    "۲ + ۲ چند می‌شود؟",
    "پایتخت ایران کجاست؟",
    "کدام گزینه عدد اول است؟",
    "حاصل ۳ × ۴ چقدر است؟",
    "کدام سیاره به خورشید نزدیک‌تر است؟",
]

ABOUT_ROWS = [
    ("title", "کران بالا"),
    ("mission", "ارائه آموزش ساختاریافته با کیفیت و قابل اندازه‌گیری برای دانش‌آموزان و دانشجویان."),
    ("vision", "مرجع آموزش آنلاین فارسی با پنل حرفه‌ای محتوا و آزمون."),
    ("phone", "021-12345678"),
    ("email", "info@karanbala.ir"),
    ("address", "تهران، ایران"),
]

PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4"
