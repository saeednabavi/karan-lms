import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticle } from '../api';

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticle(slug)
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <main className="container py-5"><div className="text-center">در حال بارگذاری...</div></main>;
  if (!article) return <main className="container py-5"><div className="alert alert-warning">مقاله یافت نشد.</div></main>;

  return (
    <main className="container py-5" style={{ minHeight: '60vh' }}>
      <Link to="/articles" className="btn btn-sm btn-outline-secondary mb-3">بازگشت</Link>
      {article.image_url && (
        <img src={article.image_url} alt={article.title} className="img-fluid rounded-3 mb-4 w-100" style={{ maxHeight: 400, objectFit: 'cover' }} />
      )}
      <h1 className="fw-bold mb-3">{article.title}</h1>
      {article.excerpt && <p className="lead text-muted">{article.excerpt}</p>}
      <div className="article-body" style={{ lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{article.body}</div>
    </main>
  );
}
