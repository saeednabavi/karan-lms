import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCaptcha } from '../api';

export default function Login() {
  const { login } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState({ id: '', text: '' });
  const [captchaValue, setCaptchaValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadCaptcha = useCallback(async () => {
    try {
      const data = await getCaptcha();
      setCaptcha({ id: data.id, text: data.text });
      setCaptchaValue('');
    } catch {
      setCaptcha({ id: '', text: '' });
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginId, password, captcha.id, captchaValue);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'خطا در ورود');
      loadCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container py-5" style={{ maxWidth: 400 }}>
      <h1 className="fw-bold mb-4">ورود</h1>
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="mb-3">
          <label className="form-label">ایمیل، نام کاربری یا شماره تماس</label>
          <input
            type="text"
            className="form-control"
            placeholder="admin"
            autoComplete="username"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">رمز عبور</label>
          <input
            type="password"
            className="form-control"
            placeholder="admin"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
                value={captchaValue}
                onChange={(e) => setCaptchaValue(e.target.value)}
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
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'در حال ورود...' : 'ورود'}
        </button>
        <p className="mt-3 text-center">
          <Link to="/register">ثبت‌نام کنید</Link>
        </p>
      </form>
    </main>
  );
}
