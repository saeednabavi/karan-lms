import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { enrollInCourse, getCourse } from '../api';
import CourseThumbnail from '../components/CourseThumbnail';
import { useAuth } from '../context/AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState('');
  const [enrollError, setEnrollError] = useState('');

  useEffect(() => {
    getCourse(id)
      .then(setCourse)
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="container py-5"><div className="text-center">در حال بارگذاری...</div></main>;
  if (!course) return <main className="container py-5"><div className="alert alert-warning">دوره یافت نشد.</div></main>;

  const price = course.is_free
    ? 'رایگان'
    : course.price
    ? `${(course.price || 0).toLocaleString('fa-IR')} تومان`
    : '-';

  const handleEnroll = async () => {
    setEnrollError('');
    setEnrollMessage('');

    if (!isAuthenticated) {
      setEnrollError('برای ثبت نام ابتدا وارد حساب کاربری شوید.');
      return;
    }

    setEnrolling(true);
    try {
      await enrollInCourse(course.id);
      setEnrollMessage('ثبت نام با موفقیت انجام شد.');
      setCourse((c) => ({ ...c, enrolled: true }));
    } catch (err) {
      setEnrollError(err.message || 'خطا در ثبت نام');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <main className="container py-5" style={{ minHeight: '60vh' }}>
      <div className="row">
        <div className="col-lg-8">
          <CourseThumbnail course={course} className="img-fluid rounded-3 mb-4 w-100" style={{ minHeight: 280 }} />
          <h1 className="fw-bold mb-3">{course.title}</h1>
          <p className="text-muted">{course.description}</p>
          {course.lessons && course.lessons.length > 0 && (
            <div className="mt-4">
              <h5 className="fw-bold mb-3">سرفصل ها</h5>
              <ul className="list-group">
                {course.lessons.map((l) => (
                  <li key={l.id} className="list-group-item d-flex justify-content-between">
                    <span>{l.title}</span>
                    <span className="text-muted">{Math.floor(l.duration_sec / 60)} دقیقه</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm p-4">
            <h5 className="fw-bold">اطلاعات دوره</h5>
            <p><strong>استاد:</strong> {course.teacher || '-'}</p>
            <p><strong>تعداد دانشجو:</strong> {course.students || 0}</p>
            <p><strong>امتیاز:</strong> {course.rating || 0} ★</p>
            <p className="fw-bold text-success">{price}</p>
            <button className="btn btn-primary w-100" onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? 'در حال ثبت نام...' : 'ثبت نام در دوره'}
            </button>
            {course.enrolled && (
              <Link to={`/courses/${course.id}/learn`} className="btn btn-success w-100 mt-2">
                ادامه یادگیری
              </Link>
            )}
            {enrollMessage ? <div className="alert alert-success mt-3 mb-0">{enrollMessage}</div> : null}
            {enrollError ? <div className="alert alert-danger mt-3 mb-0">{enrollError}</div> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
