import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="container py-5" style={{ minHeight: '60vh' }}>
      <div className="card p-4 shadow-sm text-center">
        <h1 className="fw-bold mb-3">Page not found</h1>
        <p className="text-muted mb-4">The page you are looking for does not exist.</p>
        <Link className="btn btn-primary mx-auto" style={{ maxWidth: 220 }} to="/">
          Back to home
        </Link>
      </div>
    </main>
  );
}
