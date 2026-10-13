import { useEffect, useState } from 'react';

const API_BASE = '/api/v1';

export default function PdfViewer({ assetId, externalUrl, title }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (externalUrl) {
      setBlobUrl(externalUrl);
      return undefined;
    }
    const token = localStorage.getItem('access_token');
    fetch(`${API_BASE}/assets/${assetId}/view`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('خطا در بارگذاری PDF');
        return r.blob();
      })
      .then((blob) => setBlobUrl(URL.createObjectURL(blob)))
      .catch((err) => setError(err.message));
    return () => {
      if (blobUrl && !externalUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [assetId, externalUrl]);

  if (error) return <div className="alert alert-warning">{error}</div>;
  if (!blobUrl) return <div className="text-center py-4">در حال بارگذاری PDF...</div>;

  return (
    <div className="card shadow-sm">
      <div className="card-header fw-bold">{title || 'مشاهده PDF'}</div>
      <div className="card-body p-0">
        <iframe title={title || 'PDF'} src={blobUrl} style={{ width: '100%', height: '70vh', border: 'none' }} />
      </div>
    </div>
  );
}
