import { useEffect, useState } from 'react';
import {
  getTeacherCourses,
  getTeacherLessons,
  createTeacherLesson,
  uploadTeacherAsset,
  addTeacherAssetLink,
  deleteTeacherAsset,
} from '../../api';

export default function TeacherPanel() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lessonForm, setLessonForm] = useState({ title: '', video_url: '' });
  const [linkForm, setLinkForm] = useState({ lesson_id: '', url: '', title: '', mime_type: 'application/pdf' });
  const [uploadLessonId, setUploadLessonId] = useState('');

  useEffect(() => {
    getTeacherCourses()
      .then((rows) => {
        setCourses(rows || []);
        if (rows?.length) setSelectedCourse(rows[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    getTeacherLessons(selectedCourse).then(setLessons).catch(() => setLessons([]));
  }, [selectedCourse, message]);

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      await createTeacherLesson(selectedCourse, lessonForm);
      setMessage('درس اضافه شد');
      setLessonForm({ title: '', video_url: '' });
      setLessons(await getTeacherLessons(selectedCourse));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = e.target.file.files[0];
    if (!file || !uploadLessonId) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', file.name);
    try {
      await uploadTeacherAsset(uploadLessonId, fd);
      setMessage('فایل آپلود شد');
      setLessons(await getTeacherLessons(selectedCourse));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    try {
      await addTeacherAssetLink(linkForm.lesson_id, {
        url: linkForm.url,
        title: linkForm.title,
        mime_type: linkForm.mime_type,
      });
      setMessage('لینک ثبت شد');
      setLessons(await getTeacherLessons(selectedCourse));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="container py-4" style={{ minHeight: '75vh' }}>
      <h1 className="fw-bold mb-4">پنل استاد</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {loading ? (
        <div className="card p-4 text-center">در حال بارگذاری...</div>
      ) : !courses.length ? (
        <div className="alert alert-info">دوره‌ای به نام شما ثبت نشده است.</div>
      ) : (
        <>
          <div className="mb-3">
            <label className="form-label">دوره من</label>
            <select className="form-select" value={selectedCourse || ''} onChange={(e) => setSelectedCourse(e.target.value)}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>

          <div className="card p-4 shadow-sm mb-4">
            <h6 className="fw-bold">افزودن درس</h6>
            <form onSubmit={handleCreateLesson} className="row g-2">
              <div className="col-md-5"><input className="form-control" placeholder="عنوان درس" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} required /></div>
              <div className="col-md-5"><input className="form-control" placeholder="لینک ویدیو" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} /></div>
              <div className="col-md-2"><button type="submit" className="btn btn-primary w-100">افزودن</button></div>
            </form>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <div className="card p-3 shadow-sm">
                <h6 className="fw-bold">آپلود فایل</h6>
                <form onSubmit={handleUpload}>
                  <select className="form-select mb-2" value={uploadLessonId} onChange={(e) => setUploadLessonId(e.target.value)} required>
                    <option value="">انتخاب درس</option>
                    {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                  <input type="file" name="file" className="form-control mb-2" accept=".pdf,.mp4,.doc,.docx" required />
                  <button type="submit" className="btn btn-outline-primary btn-sm">آپلود</button>
                </form>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card p-3 shadow-sm">
                <h6 className="fw-bold">لینک خارجی (PDF/ویدیو)</h6>
                <form onSubmit={handleAddLink}>
                  <select className="form-select mb-2" value={linkForm.lesson_id} onChange={(e) => setLinkForm({ ...linkForm, lesson_id: e.target.value })} required>
                    <option value="">انتخاب درس</option>
                    {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
                  </select>
                  <input className="form-control mb-2" placeholder="عنوان" value={linkForm.title} onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })} />
                  <input className="form-control mb-2" placeholder="URL" value={linkForm.url} onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })} required />
                  <button type="submit" className="btn btn-outline-secondary btn-sm">ثبت لینک</button>
                </form>
              </div>
            </div>
          </div>

          <div className="card p-4 shadow-sm">
            <h6 className="fw-bold mb-3">درس‌ها و فایل‌ها</h6>
            {lessons.map((l) => (
              <div key={l.id} className="border-bottom py-3">
                <strong>{l.title}</strong>
                {l.video_url && <div className="small text-muted">ویدیو: {l.video_url}</div>}
                <ul className="list-unstyled mt-2 mb-0">
                  {(l.assets || []).map((a) => (
                    <li key={a.id} className="d-flex justify-content-between align-items-center small py-1">
                      <span>{a.title} ({a.source_type})</span>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={async () => {
                        await deleteTeacherAsset(a.id);
                        setLessons(await getTeacherLessons(selectedCourse));
                      }}>حذف</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
