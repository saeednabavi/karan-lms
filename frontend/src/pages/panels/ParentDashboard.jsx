import { useEffect, useState } from 'react';
import { getParentChildren, getParentChildProgress } from '../../api';

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getParentChildren()
      .then((rows) => {
        setChildren(rows || []);
        if (rows?.length) setSelected(rows[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    getParentChildProgress(selected).then(setProgress).catch(() => setProgress(null));
  }, [selected]);

  return (
    <main className="container py-5" style={{ minHeight: '60vh' }}>
      <h1 className="fw-bold mb-4">پنل والدین</h1>
      {loading ? (
        <div className="card p-4 text-center">در حال بارگذاری...</div>
      ) : !children.length ? (
        <div className="alert alert-info">فرزندی به حساب شما متصل نشده است.</div>
      ) : (
        <>
          <div className="mb-3">
            <label className="form-label">انتخاب فرزند</label>
            <select className="form-select" value={selected || ''} onChange={(e) => setSelected(e.target.value)}>
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
              ))}
            </select>
          </div>
          {progress?.courses?.length ? (
            <div className="row g-3">
              {progress.courses.map((c) => (
                <div key={c.course_id} className="col-md-6">
                  <div className="card p-3 shadow-sm">
                    <h6 className="fw-bold">{c.course_title}</h6>
                    <div className="progress mb-2" style={{ height: 8 }}>
                      <div className="progress-bar" style={{ width: `${c.percent}%` }} />
                    </div>
                    <small className="text-muted">
                      {c.completed_lessons} از {c.total_lessons} درس ({c.percent}%)
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted">پیشرفتی ثبت نشده است.</div>
          )}
        </>
      )}
    </main>
  );
}
