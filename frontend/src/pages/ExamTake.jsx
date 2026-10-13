import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExam, getExamQuestions, submitExam } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ExamTake() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getExam(id).then(setExam).catch(() => setExam(null));
    if (isAuthenticated) {
      getExamQuestions(id)
        .then(setQuestions)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id, isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await submitExam(id, answers);
      setResult(res);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <main className="container py-5"><div className="text-center">در حال بارگذاری...</div></main>;
  if (!isAuthenticated) {
    return (
      <main className="container py-5">
        <div className="alert alert-warning">برای شرکت در آزمون <Link to="/login">وارد شوید</Link>.</div>
      </main>
    );
  }
  if (!exam) return <main className="container py-5"><div className="alert alert-warning">آزمون یافت نشد.</div></main>;

  if (result) {
    return (
      <main className="container py-5">
        <div className="card p-4 shadow-sm text-center">
          <h4 className="fw-bold">نتیجه آزمون</h4>
          <p className="fs-3 text-primary">{result.score} از {result.total}</p>
          <p>{result.percent}%</p>
          <Link to="/exams" className="btn btn-primary">بازگشت به آزمون‌ها</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-5" style={{ minHeight: '60vh' }}>
      <h1 className="fw-bold mb-2">{exam.title}</h1>
      <p className="text-muted mb-4">{exam.duration_minutes} دقیقه — {questions.length} سؤال</p>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        {questions.map((q, idx) => (
          <div key={q.id} className="card p-3 mb-3 shadow-sm">
            <p className="fw-bold mb-2">{idx + 1}. {q.text}</p>
            {(q.options || []).map((opt, oi) => (
              <label key={oi} className="d-block mb-1">
                <input
                  type="radio"
                  name={q.id}
                  value={oi}
                  checked={answers[q.id] === oi}
                  onChange={() => setAnswers({ ...answers, [q.id]: oi })}
                  required
                />
                {' '}{opt}
              </label>
            ))}
          </div>
        ))}
        {questions.length > 0 && (
          <button type="submit" className="btn btn-primary">ارسال پاسخ‌ها</button>
        )}
      </form>
    </main>
  );
}
