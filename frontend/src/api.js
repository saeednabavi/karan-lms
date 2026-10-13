import { MOCK_COURSES, MOCK_TEACHERS, MOCK_ARTICLES, MOCK_EXAMS, MOCK_ABOUT } from './mockData';

const API_BASE = '/api/v1';
const USE_MOCK = import.meta.env.DEV;

let refreshPromise = null;

function withAuthHeaders(headers = {}, skipContentType = false) {
  const token = localStorage.getItem('access_token');
  const h = { ...headers };
  if (!skipContentType && !h['Content-Type']) {
    h['Content-Type'] = 'application/json';
  }
  return token ? { ...h, Authorization: `Bearer ${token}` } : h;
}

async function tryRefreshToken() {
  if (refreshPromise) return refreshPromise;
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshToken}` },
  })
    .then(async (res) => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return false;
      if (json.data?.access_token) {
        localStorage.setItem('access_token', json.data.access_token);
        if (json.data.refresh_token) {
          localStorage.setItem('refresh_token', json.data.refresh_token);
        }
        return true;
      }
      return false;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

async function fetchApi(path, options = {}, retried = false) {
  const headers = withAuthHeaders(options.headers || {}, options.body instanceof FormData);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (res.status === 401 && !retried && localStorage.getItem('refresh_token')) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return fetchApi(path, options, true);
  }

  if (!res.ok) {
    throw new Error(json?.error?.message || res.statusText || 'Request failed');
  }
  return json;
}

export async function getCourses(params = {}) {
  const query = new URLSearchParams({
    limit: String(params.limit ?? 20),
    offset: String(params.offset ?? 0),
  });
  if (params.q) query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (typeof params.is_free === 'boolean') query.set('is_free', String(params.is_free));
  if (params.sort) query.set('sort', params.sort);
  if (params.audience_type) query.set('audience_type', params.audience_type);

  try {
    const r = await fetchApi(`/courses?${query.toString()}`);
    return { items: r.data?.length ? r.data : MOCK_COURSES, meta: r.meta || {} };
  } catch {
    return { items: MOCK_COURSES, meta: { total: MOCK_COURSES.length } };
  }
}

export async function getPopularCourses() {
  try {
    const r = await fetchApi('/courses/popular');
    return r.data?.length ? r.data : MOCK_COURSES;
  } catch {
    return MOCK_COURSES;
  }
}

export async function getCourse(id) {
  try {
    const r = await fetchApi(`/courses/${id}`);
    return r.data;
  } catch {
    return MOCK_COURSES.find((c) => c.id === id) || null;
  }
}

export async function getCourseLearn(id) {
  const r = await fetchApi(`/courses/${id}/learn`);
  return r.data;
}

export async function updateLessonProgress(courseId, lessonId, payload) {
  const r = await fetchApi(`/courses/${courseId}/lessons/${lessonId}/progress`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return r.data;
}

export async function enrollInCourse(courseId) {
  const r = await fetchApi(`/courses/${courseId}/enroll`, { method: 'POST' });
  return r.data;
}

export async function getMyEnrollments(audienceType = null) {
  let path = '/courses/me/enrollments';
  if (audienceType) path += `?audience_type=${audienceType}`;
  const r = await fetchApi(path);
  return r.data || [];
}

export async function getCategories() {
  try {
    const r = await fetchApi('/categories');
    return r.data || [];
  } catch {
    return [];
  }
}

export async function getArticles(limit = 20, offset = 0) {
  try {
    const r = await fetchApi(`/articles?limit=${limit}&offset=${offset}`);
    return r.data?.length ? r.data : MOCK_ARTICLES;
  } catch {
    return MOCK_ARTICLES;
  }
}

export async function getArticle(idOrSlug) {
  const r = await fetchApi(`/articles/${idOrSlug}`);
  return r.data;
}

export async function getTeachers(limit = 20, offset = 0) {
  try {
    const r = await fetchApi(`/teachers?limit=${limit}&offset=${offset}`);
    return r.data?.length ? r.data : MOCK_TEACHERS;
  } catch {
    return MOCK_TEACHERS;
  }
}

export async function getExams(limit = 50, offset = 0, tag = null) {
  try {
    let path = `/exams?limit=${limit}&offset=${offset}`;
    if (tag && tag !== 'all') path += `&tag=${tag}`;
    const r = await fetchApi(path);
    return r.data?.length ? r.data : MOCK_EXAMS;
  } catch {
    return MOCK_EXAMS;
  }
}

export async function getExam(id) {
  const r = await fetchApi(`/exams/${id}`);
  return r.data;
}

export async function getExamQuestions(id) {
  const r = await fetchApi(`/exams/${id}/questions`);
  return r.data || [];
}

export async function submitExam(id, answers) {
  const r = await fetchApi(`/exams/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
  return r.data;
}

export async function getAbout() {
  try {
    const r = await fetchApi('/about');
    return r.data && Object.keys(r.data).length ? r.data : MOCK_ABOUT;
  } catch {
    return MOCK_ABOUT;
  }
}

export async function getMe() {
  const r = await fetchApi('/auth/me');
  return r.data;
}

export async function login(loginId, password, captchaId, captchaValue) {
  const r = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: loginId,
      password,
      captcha_id: captchaId,
      captcha_value: captchaValue,
    }),
  });
  return r.data;
}

export async function getAuthRoles() {
  const r = await fetchApi('/auth/roles');
  return r.data || [];
}

export async function getCaptcha() {
  const r = await fetch(`${API_BASE}/auth/captcha`);
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json?.error?.message || 'Captcha failed');
  return json.data;
}

export async function checkPhone(phone) {
  const r = await fetchApi('/auth/check-phone', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
  return r.data;
}

export async function registerRequest(payload) {
  const r = await fetchApi('/auth/register/request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return r.data;
}

export async function registerVerify(phone, code) {
  const r = await fetch(`${API_BASE}/auth/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(json?.error?.message || 'Verification failed');
  return json.data;
}

export async function register(email, password, full_name) {
  const r = await fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name }),
  });
  return r.data;
}

export async function logout() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${refreshToken}`,
    },
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

export function getAssetViewUrl(assetId) {
  const token = localStorage.getItem('access_token');
  return `${API_BASE}/assets/${assetId}/view?token=${token}`;
}

export async function getAdminSummary() {
  const r = await fetchApi('/admin/summary');
  return r.data;
}

export async function getAdminReportsOverview() {
  const r = await fetchApi('/admin/reports/overview');
  return r.data;
}

export async function getAdminReportsEnrollments(params = {}) {
  const q = new URLSearchParams(params);
  const r = await fetchApi(`/admin/reports/enrollments?${q}`);
  return r.data || [];
}

export async function getAdminReportsCourses() {
  const r = await fetchApi('/admin/reports/courses');
  return r.data || [];
}

export async function getAdminReportsUsers(role = '') {
  const q = role ? `?role=${role}` : '';
  const r = await fetchApi(`/admin/reports/users${q}`);
  return r.data || [];
}

export function getEnrollmentsCsvUrl() {
  return `${API_BASE}/admin/reports/export/enrollments.csv`;
}

export async function getAdminArticles() {
  const r = await fetchApi('/admin/articles');
  return r.data || [];
}

export async function createAdminArticle(payload) {
  const r = await fetchApi('/admin/articles', { method: 'POST', body: JSON.stringify(payload) });
  return r.data;
}

export async function updateAdminArticle(id, payload) {
  const r = await fetchApi(`/admin/articles/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return r.data;
}

export async function deleteAdminArticle(id) {
  const r = await fetchApi(`/admin/articles/${id}`, { method: 'DELETE' });
  return r.data;
}

export async function getAdminUsers() {
  const r = await fetchApi('/admin/users');
  return r.data || [];
}

export async function createAdminUser(payload) {
  const r = await fetchApi('/admin/users', { method: 'POST', body: JSON.stringify(payload) });
  return r.data;
}

export async function updateAdminUser(id, payload) {
  const r = await fetchApi(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return r.data;
}

export async function getAdminCourses() {
  const r = await fetchApi('/admin/courses');
  return r.data || [];
}

export async function createAdminCourse(payload) {
  const r = await fetchApi('/admin/courses', { method: 'POST', body: JSON.stringify(payload) });
  return r.data;
}

export async function updateAdminCourse(id, payload) {
  const r = await fetchApi(`/admin/courses/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return r.data;
}

export async function deleteAdminCourse(id) {
  const r = await fetchApi(`/admin/courses/${id}`, { method: 'DELETE' });
  return r.data;
}

export async function getAdminTeachers() {
  const r = await fetchApi('/admin/teachers');
  return r.data || [];
}

export async function createAdminTeacher(payload) {
  const r = await fetchApi('/admin/teachers', { method: 'POST', body: JSON.stringify(payload) });
  return r.data;
}

export async function getAdminExams() {
  const r = await fetchApi('/admin/exams');
  return r.data || [];
}

export async function createAdminExam(payload) {
  const r = await fetchApi('/admin/exams', { method: 'POST', body: JSON.stringify(payload) });
  return r.data;
}

export async function getTeacherCourses() {
  const r = await fetchApi('/teacher/courses');
  return r.data || [];
}

export async function getTeacherLessons(courseId) {
  const r = await fetchApi(`/teacher/courses/${courseId}/lessons`);
  return r.data || [];
}

export async function createTeacherLesson(courseId, payload) {
  const r = await fetchApi(`/teacher/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return r.data;
}

export async function uploadTeacherAsset(lessonId, formData) {
  const headers = withAuthHeaders({}, true);
  const res = await fetch(`${API_BASE}/teacher/lessons/${lessonId}/assets`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || 'Upload failed');
  return json.data;
}

export async function addTeacherAssetLink(lessonId, payload) {
  const r = await fetchApi(`/teacher/lessons/${lessonId}/assets/link`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return r.data;
}

export async function deleteTeacherAsset(assetId) {
  const r = await fetchApi(`/teacher/assets/${assetId}`, { method: 'DELETE' });
  return r.data;
}

export async function getTechnicalSettings() {
  const r = await fetchApi('/technical/settings');
  return r.data || {};
}

export async function updateTechnicalSettings(payload) {
  const r = await fetchApi('/technical/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return r.data;
}

export async function getTechnicalFiles() {
  const r = await fetchApi('/technical/files');
  return r.data || [];
}

export async function getTechnicalUploadInfo() {
  const r = await fetchApi('/technical/upload-info');
  return r.data;
}

export async function getParentChildren() {
  const r = await fetchApi('/parent/children');
  return r.data || [];
}

export async function getParentChildProgress(pupilId) {
  const r = await fetchApi(`/parent/children/${pupilId}/progress`);
  return r.data;
}
