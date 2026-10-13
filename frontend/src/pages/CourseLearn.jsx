import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseLearn, updateLessonProgress } from '../api';
import VideoPlayer from '../components/VideoPlayer';
import PdfViewer from '../components/PdfViewer';

export default function CourseLearn() {
  const { id, lessonId } = useParams();
  const [data, setData] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfAsset, setPdfAsset] = useState(null);

  useEffect(() => {
    getCourseLearn(id)
      .then((d) => {
        setData(d);
        const lessons = d?.lessons || [];
        const initial = lessonId
          ? lessons.find((l) => l.id === lessonId)
          : lessons[0];
        setActiveLesson(initial || null);
      })
      .catch((err) => setError(err.message || 'دسترسی به دوره ممکن نیست'))
      .finally(() => setLoading(false));
  }, [id, lessonId]);

  useEffect(() => {
    if (!activeLesson) return;
    const pdf = (activeLesson.assets || []).find((a) => a.is_pdf);
    setPdfAsset(pdf || null);
  }, [activeLesson]);

  const markComplete = async () => {
    if (!activeLesson) return;
    await updateLessonProgress(id, activeLesson.id, { completed: true });
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lessons: prev.lessons.map((l) =>
          l.id === activeLesson.id ? { ...l, completed: true } : l
        ),
      };
    });
    setActiveLesson((l) => (l ? { ...l, completed: true } : l));
  };

  if (loading) return <main className="container py-5"><div className="text-center">در حال بارگذاری...</div></main>;
  if (error) return <main className="container py-5"><div className="alert alert-danger">{error}</div></main>;
  if (!data) return null;

  return (
    <main className="container-fluid py-4" style={{ minHeight: '75vh' }}>
      <div className="row g-3">
        <div className="col-lg-3">
          <div className="card shadow-sm">
            <div className="card-header fw-bold">{data.title}</div>
            <div className="list-group list-group-flush">
              {(data.lessons || []).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={`list-group-item list-group-item-action d-flex justify-content-between ${activeLesson?.id === l.id ? 'active' : ''}`}
                  onClick={() => setActiveLesson(l)}
                >
                  <span>{l.title}</span>
                  {l.completed && <span>✓</span>}
                </button>
              ))}
            </div>
            <div className="card-footer">
              <Link to={`/courses/${id}`} className="btn btn-sm btn-outline-secondary w-100">بازگشت</Link>
            </div>
          </div>
        </div>
        <div className="col-lg-9">
          {activeLesson ? (
            <>
              <h4 className="fw-bold mb-3">{activeLesson.title}</h4>
              <VideoPlayer url={activeLesson.video_url} title={activeLesson.title} />
              <div className="mt-3 d-flex gap-2">
                <button type="button" className="btn btn-success btn-sm" onClick={markComplete}>
                  {activeLesson.completed ? 'تکمیل شده' : 'علامت به‌عنوان تکمیل‌شده'}
                </button>
              </div>
              {(activeLesson.assets || []).length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold">فایل‌های پیوست</h6>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {activeLesson.assets.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className={`btn btn-sm ${pdfAsset?.id === a.id ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setPdfAsset(a)}
                      >
                        {a.title}
                      </button>
                    ))}
                  </div>
                  {pdfAsset && (
                    <PdfViewer
                      assetId={pdfAsset.id}
                      externalUrl={pdfAsset.external_url}
                      title={pdfAsset.title}
                    />
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="alert alert-info">درسی برای نمایش وجود ندارد.</div>
          )}
        </div>
      </div>
    </main>
  );
}
