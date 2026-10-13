import { Link } from 'react-router-dom';
import CourseThumbnail from './CourseThumbnail';

export default function CourseCard({ course }) {
  const price = course.is_free
    ? 'رایگان'
    : course.price
    ? `${(course.price || 0).toLocaleString('fa-IR')} تومان`
    : '-';
  return (
    <div className="col-md-3">
      <Link to={`/courses/${course.id}`} className="text-decoration-none text-dark">
        <div className="card h-100 shadow-sm">
          <CourseThumbnail course={course} />
          <div className="card-body">
            <h5 className="card-title fw-bold">{course.title}</h5>
            <p className="card-text text-muted">{course.description || ''}</p>
          </div>
          <div className="card-footer border-0 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold">{course.teacher || 'نام استاد'}</span>
              <span className="text-warning">{course.rating || '0'} ★</span>
            </div>
            <hr className="my-2" />
            <div className="d-flex justify-content-between align-items-center">
              <span className="text-muted">{course.students || 0} دانشجو</span>
              <span className={`fw-bold ${course.is_free ? 'text-success' : 'text-success'}`}>{price}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
