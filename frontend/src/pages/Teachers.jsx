import { useState, useEffect } from 'react';
import { getTeachers } from '../api';

const FALLBACK_AVATAR = '/images/seed/teacher-1.svg';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeachers()
      .then(setTeachers)
      .catch(() => setTeachers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container py-4">
      <h1 className="fw-bold mb-4">اساتید کران بالا</h1>
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">در حال بارگذاری...</div>
        ) : (
          (teachers || []).map((t) => (
            <div key={t.id} className="col-md-4">
              <div className="card p-4 shadow-sm text-center">
                <img
                  src={t.avatar_url || FALLBACK_AVATAR}
                  alt={t.full_name}
                  className="mx-auto mb-3 rounded-circle"
                  style={{ width: 90, height: 90, objectFit: 'cover' }}
                />
                <h5 className="fw-bold">{t.full_name}</h5>
                <p className="text-muted">{t.title}</p>
                <p className="text-muted small">{t.bio}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
