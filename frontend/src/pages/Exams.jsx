import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExams } from '../api';

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExams(50, 0, filter === 'all' ? null : filter)
      .then(setExams)
      .catch(() => setExams([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const filters = [
    { key: 'all', label: 'همه' },
    { key: 'school', label: 'مدرسه' },
    { key: 'entrance', label: 'ورودی/تیزهوشان' },
    { key: 'skills', label: 'مهارت' },
  ];

  return (
    <main className="container py-4" style={{ minHeight: '80vh' }}>
      <section className="page-hero bg-white shadow-sm mb-4 rounded-4 p-4">
        <h1 className="fw-bold mb-2">آزمون‌ها</h1>
        <p className="text-muted">آزمون‌های دوره‌ها را شرکت کن، نتیجه را همان لحظه ببین.</p>
        <div className="d-flex gap-2 mt-3 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`btn ${filter === f.key ? 'btn-primary' : 'btn-outline-primary'} btn-sm`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-4 p-4 shadow-sm">
        <h5 className="fw-bold mb-3">لیست آزمون‌ها</h5>
        {loading ? (
          <div className="text-center py-4">در حال بارگذاری...</div>
        ) : (
          <div className="row g-3">
            {(exams || []).map((e) => (
              <div key={e.id} className="col-12 col-md-6 col-lg-3">
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <span className="badge bg-primary me-2">{e.level}</span>
                    <span className="badge bg-success">{e.status}</span>
                    <h6 className="mt-2 fw-bold">{e.title}</h6>
                    <p className="text-muted small mb-2">{e.question_count} سؤال • {e.duration_minutes} دقیقه</p>
                    <Link to={`/exams/${e.id}/take`} className="btn btn-outline-primary btn-sm w-100">شروع</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
