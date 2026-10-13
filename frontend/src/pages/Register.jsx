import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCaptcha,
  checkPhone,
  registerRequest,
  registerVerify,
  getAuthRoles,
} from '../api';

const ROLE_NAMES = {
  Admin: 'مدیر',
  Technical: 'مسئول فنی',
  Teacher: 'استاد',
  Pupil: 'دانش‌آموز',
  Student: 'دانشجو',
  Parent: 'والدین',
};

export default function Register() {
  const { loginWithTokens } = useAuth();
  const [step, setStep] = useState(1);
  const [roles, setRoles] = useState([]);
  const [captcha, setCaptcha] = useState({ id: '', text: '' });
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role_id: '',
    password: '',
    captcha_value: '',
  });
  const [smsCode, setSmsCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadRoles = useCallback(async () => {
    try {
      const list = await getAuthRoles();
      setRoles(list);
      if (list.length && !form.role_id) setForm((f) => ({ ...f, role_id: String(list[0].id) }));
    } catch {
      setRoles([]);
    }
  }, []);

  const loadCaptcha = useCallback(async () => {
    try {
      const data = await getCaptcha();
      setCaptcha({ id: data.id, text: data.text });
      setForm((f) => ({ ...f, captcha_value: '' }));
    } catch {
      setCaptcha({ id: '', text: '' });
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (step === 1) loadCaptcha();
  }, [step, loadCaptcha]);

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const phone = form.phone.replace(/\D/g, '');
      const { registered } = await checkPhone(phone);
      if (registered) {
        setError('این شماره قبلاً ثبت‌نام کرده است. به صفحه ورود بروید.');
        setLoading(false);
        navigate('/login');
        return;
      }
      await registerRequest({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone,
        role_id: form.role_id ? Number(form.role_id) : roles[0]?.id,
        password: form.password,
        captcha_id: captcha.id,
        captcha_value: form.captcha_value.trim(),
      });
      setStep(2);
    } catch (err) {
      setError(err.message || 'خطا در ثبت‌نام');
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const phone = form.phone.replace(/\D/g, '');
      const data = await registerVerify(phone, smsCode.trim());
      await loginWithTokens(data.access_token, data.refresh_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'کد نامعتبر است');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-5" style={{ maxWidth: 420 }}>
      <h1 className="fw-bold mb-4">ثبت‌نام</h1>
      {step === 1 && (
        <form onSubmit={handleStep1} className="card p-4 shadow-sm">
          {error && <div className="alert alert-danger">{error}</div>}
          <div className="mb-3">
            <label className="form-label">نام</label>
            <input
              type="text"
              className="form-control"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">نام خانوادگی</label>
            <input
              type="text"
              className="form-control"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">ایمیل</label>
            <input
              type="email"
              className="form-control"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">شماره تماس</label>
            <input
              type="tel"
              className="form-control"
              placeholder="09xxxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">نوع نقش</label>
            <select
              className="form-select"
              value={form.role_id}
              onChange={(e) => setForm((f) => ({ ...f, role_id: e.target.value }))}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {ROLE_NAMES[r.name] || r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">رمز عبور</label>
            <input
              type="password"
              className="form-control"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
            />
          </div>
          <div className="mb-3">
            <div className="captcha-block">
              <span className="captcha-label">برای امنیت، عملیات زیر را حل کنید</span>
              <div className="captcha-equation" dir="ltr" aria-hidden="true">
                {captcha.text ? (
                  <span className="captcha-equation-inner">
                    {captcha.text.replace(/\s*=\s*\?\s*$/, ' =').split('').map((char, i) => {
                      const angles = [-7, 5, -5, 4, 6, -4, 3, 5, -6, 4];
                      const angle = angles[i % angles.length];
                      const yShift = i % 3 === 1 ? 1 : i % 3 === 2 ? -1 : 0;
                      return (
                        <span
                          key={i}
                          className="captcha-char"
                          style={{
                            transform: `rotate(${angle}deg) translateY(${yShift}px)`,
                          }}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </span>
                ) : (
                  <span>...</span>
                )}
              </div>
              <div className="captcha-input-wrap">
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="پاسخ"
                  value={form.captcha_value}
                  onChange={(e) => setForm((f) => ({ ...f, captcha_value: e.target.value }))}
                  required
                  aria-label="پاسخ کپچا"
                />
                <button
                  type="button"
                  className="captcha-refresh"
                  onClick={loadCaptcha}
                  title="کپچای جدید"
                  aria-label="دریافت کپچای جدید"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6M1 20v-6h6" />
                    <path d="M3.51 9a9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'در حال بررسی...' : 'ادامه و ارسال کد'}
          </button>
          <p className="mt-3 text-center">
            <Link to="/login">قبلاً ثبت‌نام کردید؟ ورود</Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep2} className="card p-4 shadow-sm">
          {error && <div className="alert alert-danger">{error}</div>}
          <p className="text-muted small">کد پیامک ارسال‌شده به {form.phone} را وارد کنید. (برای تست عدد 0 را بزنید)</p>
          <div className="mb-3">
            <label className="form-label">کد پیامک</label>
            <input
              type="text"
              className="form-control"
              placeholder="0"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'در حال ورود...' : 'تأیید و ورود'}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary w-100 mt-2"
            onClick={() => setStep(1)}
          >
            بازگشت
          </button>
        </form>
      )}
    </main>
  );
}
