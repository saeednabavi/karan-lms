import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, getPopularCourses } from '../api';
import CourseCard from '../components/CourseCard';

function IconSearch() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconEducation() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M22 10l-10-5L2 10l10 5 10-5z" />
      <path d="M6 12v5c0 2 12 3 12 0v-5" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    Promise.all([getCourses({ limit: 8 }), getPopularCourses()])
      .then(([c, p]) => {
        setCourses(c?.items || []);
        setPopular(p || []);
      })
      .catch(() => {
        setCourses([]);
        setPopular([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQ.trim();
    navigate(q ? `/courses?q=${encodeURIComponent(q)}` : '/courses');
  };

  const totalStudents = [...courses, ...popular].reduce((sum, c) => sum + (c.students || 0), 0);
  const courseCount = Math.max(courses.length, popular.length, 10);

  return (
    <main style={{ minHeight: '70vh' }}>
      <section className="hero-section container-fluid">
        <div className="container-fluid text-center text-white">
          <h1 className="hero-title">
            <span className="highlight">کران بالا</span>، آکادمی برای یادگیری شما
          </h1>
          <p className="hero-subtitle">
            با کران بالا درس‌هاتو با خیال راحت یاد بگیر و پیشرفت کن
          </p>
          <form className="hero-search mx-auto" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="جست‌وجو بین دوره‌ها..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
            <button type="submit" aria-label="جستجو">
              <IconSearch />
            </button>
          </form>
          <div className="row hero-stats justify-content-center align-items-center mt-5">
            <div className="col-md-2">
              <div className="stat-item">
                <div className="stat-icon"><IconClock /></div>
                <strong>{loading ? '...' : courseCount * 45}</strong>
                <span className="fw-bold">ساعت آموزش</span>
              </div>
            </div>
            <div className="col-md-2">
              <div className="stat-item">
                <div className="stat-icon"><IconBook /></div>
                <strong>{loading ? '...' : courseCount}</strong>
                <span className="fw-bold">دوره آموزشی</span>
              </div>
            </div>
            <div className="col-md-2">
              <div className="stat-item">
                <div className="stat-icon"><IconEducation /></div>
                <strong>{loading ? '...' : totalStudents || 1200}</strong>
                <span className="fw-bold">دانشجو</span>
              </div>
            </div>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1420 220">
          <path fill="#fff" fillOpacity="1" d="M0,32L80,48C160,64,320,96,480,128C640,160,800,192,960,181.3C1120,171,1280,117,1360,90.7L1440,64L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z" />
        </svg>
      </section>

      <section className="container my-5">
        <h3 className="marker">آخرین دوره‌های ما</h3>
        <div className="row g-4 mt-2">
          {loading ? (
            <div className="col-12 text-center py-5">در حال بارگذاری...</div>
          ) : (
            (courses || []).map((c) => <CourseCard key={c.id} course={c} />)
          )}
        </div>
      </section>

      <section className="container my-5">
        <h3 className="marker">پرطرفدارترین دوره‌های ما</h3>
        <div className="row g-4 mt-2">
          {loading ? null : (popular || []).map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </section>
    </main>
  );
}
