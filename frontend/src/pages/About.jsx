import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAbout } from '../api';

export default function About() {
  const [about, setAbout] = useState({});

  useEffect(() => {
    getAbout()
      .then(setAbout)
      .catch(() => setAbout({}));
  }, []);

  const title = about.title || 'کران بالا';
  const mission = about.mission || 'فراهم‌کردن آموزش باکیفیت، قابل فهم و کاربردی';
  const vision = about.vision || 'تبدیل‌شدن به یکی از معتبرترین پلتفرم‌های آموزش آنلاین فارسی';

  return (
    <main className="container py-4" style={{ minHeight: '80vh' }}>
      <section className="about-hero shadow-sm mb-5 rounded-4 p-4" style={{ background: 'linear-gradient(135deg, rgba(13,110,253,.12), rgba(25,135,84,.10))' }}>
        <h1 className="fw-bold mb-3">درباره {title}</h1>
        <p className="text-muted fs-5 mb-0">
          {title} یک آکادمی آموزشی آنلاین است که با هدف
          <strong> یادگیری عمیق، اصولی و قابل اعتماد</strong>
          برای دانش‌آموزان و داوطلبان طراحی شده است.
        </p>
      </section>

      <section className="row g-4 mb-5">
        <div className="col-md-6">
          <div className="card p-4 shadow-sm h-100">
            <h3 className="fw-bold mb-2">ماموریت ما</h3>
            <p className="text-muted">{mission}</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-4 shadow-sm h-100">
            <h3 className="fw-bold mb-2">چشم‌انداز ما</h3>
            <p className="text-muted">{vision}</p>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="fw-bold mb-4">ارزش‌های ما</h2>
        <div className="row g-4">
          <div className="col-md-3"><div className="card p-3 text-center shadow-sm"><h6 className="fw-bold">کیفیت</h6></div></div>
          <div className="col-md-3"><div className="card p-3 text-center shadow-sm"><h6 className="fw-bold">صداقت</h6></div></div>
          <div className="col-md-3"><div className="card p-3 text-center shadow-sm"><h6 className="fw-bold">تحلیل</h6></div></div>
          <div className="col-md-3"><div className="card p-3 text-center shadow-sm"><h6 className="fw-bold">پشتیبانی</h6></div></div>
        </div>
      </section>

      <section className="text-center mb-4">
        <Link to="/" className="btn btn-primary px-4">بازگشت به صفحه اصلی</Link>
      </section>
    </main>
  );
}
