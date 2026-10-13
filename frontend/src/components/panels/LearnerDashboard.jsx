import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyEnrollments } from '../../api';
import CourseThumbnail from '../CourseThumbnail';

export default function LearnerDashboard({ audienceType, title, subtitle }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyEnrollments(audienceType)
      .then((rows) => setEnrollments(rows || []))
      .catch((err) => setError(err.message || 'خطا'))
      .finally(() => setLoading(false));
  }, [audienceType]);

  return (
    <main className="container py-5" style={{ minHeight: '60vh' }}>
      <h1 className="fw-bold mb-1">{title}</h1>
      <p className="text-muted mb-4">{subtitle}</p>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="card p-4 text-center">در حال بارگذاری...</div>
      ) : !enrollments.length ? (
        <div className="card p-4 shadow-sm text-center text-muted">
          هنوز در دوره‌ای ثبت‌نام نکرده‌اید.
          <div className="mt-3">
            <Link to="/courses" className="btn btn-primary">مشاهده دوره‌ها</Link>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {enrollments.map((item) => (
            <div key={item.enrollment_id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <CourseThumbnail course={item.course} />
                <div className="card-body">
                  <h6 className="fw-bold">{item.course.title}</h6>
                  <p className="text-muted small mb-2">{item.course.teacher || 'بدون استاد'}</p>
                  <Link className="btn btn-primary btn-sm w-100" to={`/courses/${item.course.id}/learn`}>
                    ادامه یادگیری
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
