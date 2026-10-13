import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getArticles } from '../api';

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticles()
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="container py-4">
      <h1 className="fw-bold mb-4">مقالات آموزشی</h1>
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">در حال بارگذاری...</div>
        ) : (
          (articles || []).map((a) => (
            <div key={a.id} className="col-md-4">
              <Link to={`/articles/${a.slug || a.id}`} className="text-decoration-none text-dark">
                <div className="card p-4 shadow-sm h-100">
                  {a.image_url ? (
                    <img src={a.image_url} className="card-img-top mb-3" alt={a.title} />
                  ) : (
                    <img src={`/images/seed/article-${(a.id || '1').toString().slice(-1) || '1'}.svg`} className="card-img-top mb-3" alt={a.title} />
                  )}
                  <h5 className="fw-bold">{a.title}</h5>
                  <p className="text-muted small">{a.excerpt}</p>
                  <span className="text-primary small">ادامه مطلب ←</span>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
