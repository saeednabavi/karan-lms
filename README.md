# کران بالا - پلتفرم آموزش آنلاین (LMS)

## ساختار پروژه

- `main/backend` - Flask API (Postgres, Alembic, JWT, RBAC)
- `main/frontend` - React + Vite
- `home/`, `pages/` - صفحات استاتیک اولیه (منبع ظاهر فعلی)

## راه‌اندازی (Windows)

### پیش‌نیاز

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (محلی)

### مراحل

1. PostgreSQL را نصب و سرویس را start کنید
2. دیتابیس بسازید: `psql -U postgres -c "CREATE DATABASE lms;"`
3. `install.bat` — نصب پکیج‌ها و ساخت `.env`
4. `backend\.env` — پسورد Postgres را در `DATABASE_URL` بگذارید
5. `Seed.bat` — migrate + seed داده‌های غنی
6. `run.bat` — اجرای backend و frontend

### Backend (دستی)

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env
flask db upgrade
flask seed --refresh
python run.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

سرور Vite به صورت پیش‌فرض درخواست‌های `/api` را به `http://localhost:5000` پراکسی می‌کند.

## API

- `POST /api/v1/auth/register` - ثبت‌نام
- `POST /api/v1/auth/login` - ورود
- `POST /api/v1/auth/refresh` - تمدید توکن
- `GET /api/v1/courses` - لیست دوره‌ها
- `GET /api/v1/courses/popular` - دوره‌های پرطرفدار
- `GET /api/v1/categories` - دسته‌بندی‌ها
- `GET /api/v1/articles` - مقالات
- `GET /api/v1/teachers` - اساتید
- `GET /api/v1/exams` - آزمون‌ها
- `GET /api/v1/about` - درباره ما

## M1 تکمیل شده

- Infra: Postgres, Alembic, Docker Compose
- Auth: JWT + refresh token rotation, bcrypt
- RBAC: نقش‌ها، policy layer
- Courses, Lessons, Assets, Enrollment
- Protected asset downloads
- API versioning: /api/v1 + aliases
- Response envelope یکسان
- Frontend: Home, CourseDetail, Dashboard, Exams, Teachers, Articles, About, Login, Register

## Added In This Upgrade

- `GET /api/v1/auth/me` returns current authenticated user profile
- `POST /api/v1/courses/<id>/enroll` enrolls current user in a course
- `GET /api/v1/courses/me/enrollments` returns current user's active enrollments
- Course list now supports filters:
  - `q` for text search in title/description
  - `category` by category slug
  - `is_free=true|false`
  - `sort=latest|popular|rating|price_asc|price_desc`
- Frontend now includes:
  - auth context (login state across app)
  - protected dashboard route
  - real enrolled-courses dashboard
  - course search/filter/sort UI
  - enroll action from course detail
- not-found route (`*`)

## Manager Panel

- Route: `/manager`
- Allowed roles: `SuperAdmin`, `ContentManager`
- Features:
  - dashboard summary counts
  - create article
  - edit article
  - soft-delete article
- New APIs:
  - `GET /api/v1/admin/summary`
  - `GET /api/v1/admin/articles`
  - `POST /api/v1/admin/articles`
  - `PUT /api/v1/admin/articles/<id>`
  - `DELETE /api/v1/admin/articles/<id>`

## Seed Default Accounts

- `admin@karanbala.ir / admin123!` (SuperAdmin)
- `manager@karanbala.ir / manager123!` (ContentManager)
- `student@karanbala.ir / student123!` (Student)
